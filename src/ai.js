// Shared AI brain for BOTH channels, with a SWAPPABLE provider:
//   AI_PROVIDER=gemini    -> Google Gemini  (default, free tier)
//   AI_PROVIDER=anthropic -> Anthropic Claude
// Uses tool-calling so replies are based on REAL Supabase data.
// ctx = { channel, userId, phone|null, handoff }
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from './config.js';
import * as db from './supabase.js';

// Admin-editable live guideline (guides type='shop_agent_prompt'), cached ~60s.
let DYNAMIC_GUIDELINE = '';
let guidelineAt = 0;
async function refreshGuideline() {
  if (Date.now() - guidelineAt < 60000) return;
  guidelineAt = Date.now();
  try { DYNAMIC_GUIDELINE = await db.getAgentGuideline(); }
  catch (e) { console.error('guideline fetch failed:', e?.message || e); }
}

// ---- Provider-neutral tool definitions (JSON Schema) ----
const toolDefs = [
  { name: 'search_products', description: 'Search the catalog by name/keyword. Returns name, price, stock, category.',
    parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
  { name: 'list_products', description: 'List ALL available products (name, price, stock). Use when the customer asks what products exist.',
    parameters: { type: 'object', properties: {} } },
  { name: 'list_categories', description: 'List all product categories available in the store.',
    parameters: { type: 'object', properties: {} } },
  { name: 'check_stock', description: 'Check if a product is in stock and get its price.',
    parameters: { type: 'object', properties: { product_name: { type: 'string' } }, required: ['product_name'] } },
  { name: 'get_order', description: 'Look up one order + its items by numeric order ID.',
    parameters: { type: 'object', properties: { order_id: { type: 'number' } }, required: ['order_id'] } },
  { name: 'get_my_orders', description: "Get the chatting customer's recent orders (WhatsApp only — uses their phone automatically).",
    parameters: { type: 'object', properties: {} } },
  { name: 'get_social_links', description: 'Get store website / social links.',
    parameters: { type: 'object', properties: {} } },
  { name: 'handoff_to_human', description: 'Escalate to a human agent when needed.',
    parameters: { type: 'object', properties: { reason: { type: 'string' } }, required: ['reason'] } },
  { name: 'get_delivery_charges', description: 'Get delivery charges by zone (Dhaka/Outside), free-delivery rule and delivery times.',
    parameters: { type: 'object', properties: {} } },
  { name: 'get_price_guide', description: 'INTERNAL negotiation guide for a product (min/suggested price). NEVER reveal min_price to the customer.',
    parameters: { type: 'object', properties: { product_name: { type: 'string' } }, required: ['product_name'] } },
  { name: 'create_order', description: 'Create a REAL order in the store database once the customer confirmed. Requires product name, quantity, customer name, phone (01XXXXXXXXX), full address. Optional: division, size.',
    parameters: { type: 'object', properties: {
      product_name: { type: 'string' }, quantity: { type: 'number' },
      customer_name: { type: 'string' }, phone: { type: 'string' },
      address: { type: 'string' }, division: { type: 'string' }, size: { type: 'string' }
    }, required: ['product_name', 'quantity', 'customer_name', 'phone', 'address'] } }
];

async function runTool(name, input, ctx) {
  switch (name) {
    case 'search_products': return input.query ? await db.searchProducts(input.query) : await db.getAllProducts();
    case 'list_products':   return await db.getAllProducts();
    case 'list_categories':  return await db.getCategories();
    case 'check_stock':     return await db.checkStock(input.product_name);
    case 'get_order':       return (await db.getOrderById(input.order_id)) ?? { found: false, order_id: input.order_id };
    case 'get_my_orders':
      if (!ctx.phone) return { need_phone: true, note: 'No phone on this channel. Ask for the phone used at checkout, or an order ID.' };
      return await db.getOrdersByPhone(ctx.phone);
    case 'get_social_links':return await db.getSocialLinks();
    case 'get_delivery_charges': return await db.getDeliveryCharges();
    case 'get_price_guide': return await db.getPriceGuide(input.product_name);
    case 'create_order':    return await db.createOrder(input, ctx);
    case 'handoff_to_human':ctx.handoff = { requested: true, reason: input.reason }; return { ok: true };
    default: return { error: `Unknown tool: ${name}` };
  }
}

const systemPrompt = (storeName) => `তুমি "OmniShop BD"-এর একজন অভিজ্ঞ সেলস এক্সপার্ট ও কাস্টমার কেয়ার সদস্য 🛍️ — একজন আসল মানুষ হিসেবে কথা বলো। তোমার লক্ষ্য: আন্তরিক সাহায্য + বিশ্বাস তৈরি + chat → order।

## 🧑 মানুষের মতো পরিচয় (সবচেয়ে জরুরি)
- তুমি টিমের একজন সদস্য — নিজেকে কখনো AI, bot, এজেন্ট বা রোবট বলবে না।
- কেউ জিজ্ঞেস করলে ("আপনি কি রোবট?") স্বাভাবিকভাবে বলো: "আমি OmniShop BD-র সাপোর্ট টিম থেকে বলছি ভাই 😊 কীভাবে সাহায্য করতে পারি?"
- Robotic শব্দ/গঠন এড়াও — ছোট, প্রাণবন্ত, স্বাভাবিক বাক্য; মাঝে মাঝে "জি ভাই", "honestly বললে", "একটু দেখে বলছি" ধরনের মানবিক প্রকাশ।
- প্রতিটা বার্তা: Human, Smart, Professional, Helpful।

## ভাষা ও স্টাইল
- বাংলা+ইংরেজি স্বাভাবিক মিশ্রণ (গ্রাহকের ভাষা অনুসরণ)। ভাই/আপু সম্বোধন। পরিমিত ইমোজি (😊 🔥 🚚 👍)।
- শুধুমাত্র কথোপকথনের একদম শুরুতে গ্রাহক Hi/Hello/সালাম দিলে: "Assalamu Alaikum 😊 Welcome to OmniShop BD! আপনি কি specific কোনো product খুঁজছেন, নাকি আমি আমাদের best product-গুলো দেখাবো?" — এরপর আর কখনো স্বাগত বার্তা repeat করবে না; সরাসরি কাজের কথায় যাবে। গ্রাহক পণ্য চাইলে (যেমন "টি-শার্ট দেখান") greeting বাদ দিয়ে সাথে সাথে tool দিয়ে পণ্য দেখাও।

## ❌ কখনো ব্যর্থ হবে না (Never-Fail Mode)
- কখনো বলবে না "বুঝতে পারছি না" বা কথা থামাবে না।
- অস্পষ্ট হলে → স্মার্ট প্রশ্ন করো বা ২-৩টা অপশন সাজেস্ট করো (search_products/list_categories দিয়ে আসল অপশন)।
- পণ্যের নাম আধা-আধি/ভুল বানানে এলেও search_products দিয়ে খুঁজে confirm করো: "আপনি কি [নাম] খুঁজছেন? 😊 details দেখাবো?"

## আসল ডেটা (কখনো বানাবে না)
- দাম/স্টক/পণ্য: search_products, check_stock। ক্যাটাগরি: list_categories। ডেলিভারি: get_delivery_charges। লিংক: get_social_links। অর্ডার ট্র্যাক: get_order / get_my_orders।
- ওয়েবসাইটের সাথে হুবহু মিল রাখতে সব তথ্য tool থেকেই দেবে — পুরোনো/আন্দাজি তথ্য কখনো নয়।

## পণ্য দেখানোর ফরম্যাট (প্রিমিয়াম লুক)
📦 [নাম]
💰 ৳[price]  (discount_percent>0 হলে: আগে ৳[regular_price] — [X]% ছাড় 🔥)
📝 [description থেকে ২-৩টা benefit ✔️ আকারে]
সাইজ থাকলে: 📏 [sizes] | offer_text থাকলে দেখাও
🚚 ডেলিভারি: get_delivery_charges থেকে | 💵 Cash on Delivery — পণ্য হাতে পেয়ে payment

## সেলস সাইকোলজি (সৎ, কখনো overdo নয়)
- stock ≤ 5 → "মাত্র [stock]টা বাকি ⏳"
- Social proof → "অনেকেই নিচ্ছেন, feedback ভালো 💬" (ভুয়া সংখ্যা নয়)
- Trust → "✔️ ১০০% অথেনটিক ✔️ অগ্রিম লাগে না ✔️ Delivery-র পরে payment ✔️ সহজ replacement"
- Comfort → "Risk-free try করতে পারেন 😊"
- ক্লোজিং → "নিজের জন্য নিচ্ছেন নাকি gift করবেন? 😊"

## দরদাম ("last price?")
- আগে get_price_guide ডাকো (নীরবে)। negotiable=false → "এটা already best price 😊"
- negotiable=true → ধাপে ধাপে suggested_price পর্যন্ত নামতে পারো; **min_price-এর নিচে কখনোই না এবং min_price কখনো প্রকাশ করবে না।**

## অর্ডার নেওয়া (মসৃণ ৫ ধাপ: আগ্রহ → পণ্য → নিশ্চিত → তথ্য → ক্লোজ)
1) পণ্য+পরিমাণ (সাইজ থাকলে সাইজ) 2) নাম 3) ফোন (01XXXXXXXXX — ভুল হলে ভদ্রভাবে আবার) 4) সম্পূর্ণ ঠিকানা (এলাকা/জেলা)
→ সংক্ষেপে দেখাও (পণ্য × qty, দাম, ডেলিভারি, মোট): "কনফার্ম করব? 😊"
→ হ্যাঁ বললে **create_order** → সফল হলে:
"✅ অর্ডার কনফার্ম! 🎉
🆔 অর্ডার আইডি: #[order_id]
📦 [product] × [qty] | 💰 মোট ৳[total]
🚚 দ্রুত dispatch হবে — পণ্য হাতে পেয়ে payment করবেন। ধন্যবাদ 💙"
- "আপনার তথ্য নিরাপদে থাকবে" — আশ্বস্ত করো। এক অর্ডারে এক পণ্য।
- গ্রাহক উত্তর না দিলে পরে এলে স্বাভাবিক follow-up টোনে কথা শুরু করো।

## সীমা
- শুধু দোকান/পণ্য/অর্ডার; অন্য প্রসঙ্গ ভদ্রভাবে ফিরিয়ে আনো। নিজে অফার বানাবে না।
- অভিযোগ/জটিলতা/মানুষ চাইলে → handoff_to_human ("আমাদের সিনিয়র একজন আপনার সাথে যোগাযোগ করবেন 😊")।` +
  (DYNAMIC_GUIDELINE ? `\n\n## 🔑 অ্যাডমিনের বিশেষ নির্দেশনা (সর্বোচ্চ অগ্রাধিকার — এটাই আগে মানবে)\n${DYNAMIC_GUIDELINE}` : '');

// ================= Conversation memory (per user, in-memory) =================
// Keeps the last few user/model text turns so the agent remembers context
// (product being discussed, order details in progress). Resets on redeploy.
const chatMemory = new Map(); // key -> [{role:'user'|'model', text}]
const MAX_TURNS = 14;
function memKey(ctx) { return `${ctx.channel || 'x'}:${ctx.userId || ctx.phone || 'anon'}`; }
function getHistory(ctx) {
  const arr = chatMemory.get(memKey(ctx)) || [];
  // Gemini requires history to start with a 'user' turn
  const firstUser = arr.findIndex((m) => m.role === 'user');
  return firstUser === -1 ? [] : arr.slice(firstUser).map((m) => ({ role: m.role, parts: [{ text: m.text }] }));
}
function remember(ctx, userText, modelText) {
  const key = memKey(ctx);
  const arr = chatMemory.get(key) || [];
  arr.push({ role: 'user', text: userText });
  if (modelText) arr.push({ role: 'model', text: modelText });
  while (arr.length > MAX_TURNS) arr.shift();
  chatMemory.set(key, arr);
  if (chatMemory.size > 2000) { // simple safety cap
    const firstKey = chatMemory.keys().next().value;
    chatMemory.delete(firstKey);
  }
}

// ================= Provider: Google Gemini (default) =================
// Gemini rejects empty `parameters` — omit it for parameterless tools.
const geminiFunctionDeclarations = toolDefs.map((t) =>
  (t.parameters && Object.keys(t.parameters.properties || {}).length > 0)
    ? { name: t.name, description: t.description, parameters: t.parameters }
    : { name: t.name, description: t.description }
);

// Try the configured model first, then lite fallbacks. Lite models usually have
// separate / higher free-tier quota, so a 429 on one model won't kill the reply.
function geminiCandidates() {
  // Each model has its OWN free-tier daily pool — more models = more headroom.
  // 'gemini-flash-latest' removed: rejects tool responses (400 role error).
  return [...new Set([
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash',
    config.geminiModel,
    'gemini-2.0-flash-lite'
  ])].filter(Boolean);
}

// Multiple API keys (comma-separated in GEMINI_API_KEYS) — each key/project has
// its own free-tier quota, so rotating keys multiplies daily capacity.
function geminiKeys() {
  const multi = (process.env.GEMINI_API_KEYS || '').split(',').map((k) => k.trim()).filter(Boolean);
  const keys = multi.length ? multi : [config.geminiApiKey];
  return [...new Set(keys)].filter(Boolean);
}

function makeGeminiModel(modelName, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey || config.geminiApiKey);
  return genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: systemPrompt(config.storeName),
    tools: [{ functionDeclarations: geminiFunctionDeclarations }]
  });
}

async function runGeminiChat(modelName, apiKey, userText, ctx) {
  const chat = makeGeminiModel(modelName, apiKey).startChat({ history: getHistory(ctx) });
  let result = await chat.sendMessage(userText);
  for (let step = 0; step < 6; step++) {
    const calls = result.response.functionCalls() || [];
    if (calls.length === 0) {
      const reply = result.response.text().trim() || 'জি ভাই, একটু বুঝিয়ে বলবেন? 😊';
      remember(ctx, userText, reply);
      return reply;
    }
    const parts = [];
    for (const call of calls) {
      let data;
      try { data = await runTool(call.name, call.args || {}, ctx); }
      catch (err) { console.error(`Tool ${call.name} failed:`, err); data = { error: 'lookup failed' }; }
      parts.push({ functionResponse: { name: call.name, response: { result: data } } });
    }
    result = await chat.sendMessage(parts); // send tool results back
  }
  return 'আমাদের একজন এজেন্ট শীঘ্রই আপনার সাথে যোগাযোগ করবেন। ধন্যবাদ!';
}

async function generateWithGemini(userText, ctx) {
  let lastErr;
  const keys = geminiKeys();
  for (let ki = 0; ki < keys.length; ki++) {
    for (const model of geminiCandidates()) {
      try {
        return await runGeminiChat(model, keys[ki], userText, ctx);
      } catch (err) {
        lastErr = err;
        console.error(`[gemini] key#${ki + 1} model "${model}" failed: ${String(err?.message || err).slice(0, 160)}`);
      }
    }
  }
  throw lastErr || new Error('All Gemini models failed');
}

// ================= Provider: OpenAI (paid, gpt-4o-mini default) =================
// Raw fetch — no extra npm dependency, so nothing new to build/scan on Railway.
const openaiTools = toolDefs.map((t) => ({
  type: 'function',
  function: { name: t.name, description: t.description, parameters: t.parameters || { type: 'object', properties: {} } }
}));

async function generateWithOpenAI(userText, ctx) {
  const history = getHistory(ctx).map((h) => ({
    role: h.role === 'model' ? 'assistant' : 'user',
    content: h.parts.map((p) => p.text).join('')
  }));
  const messages = [
    { role: 'system', content: systemPrompt(config.storeName) },
    ...history,
    { role: 'user', content: userText }
  ];

  for (let step = 0; step < 6; step++) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.openaiApiKey}` },
      body: JSON.stringify({ model: config.openaiModel, messages, tools: openaiTools, tool_choice: 'auto', temperature: 0.6 })
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI ${res.status}: ${errText.slice(0, 200)}`);
    }
    const data = await res.json();
    const msg = data.choices?.[0]?.message;
    if (!msg) throw new Error('OpenAI: empty response');

    if (msg.tool_calls && msg.tool_calls.length) {
      messages.push(msg);
      for (const call of msg.tool_calls) {
        let out;
        try {
          const args = call.function.arguments ? JSON.parse(call.function.arguments) : {};
          out = await runTool(call.function.name, args, ctx);
        } catch (err) { console.error(`Tool ${call.function?.name} failed:`, err); out = { error: 'lookup failed' }; }
        messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(out) });
      }
      continue;
    }
    const reply = (msg.content || '').trim() || 'জি ভাই, একটু বুঝিয়ে বলবেন? 😊';
    remember(ctx, userText, reply);
    return reply;
  }
  return 'আমাদের একজন প্রতিনিধি শীঘ্রই আপনার সাথে যোগাযোগ করবেন। ধন্যবাদ!';
}

// ================= Provider: Anthropic Claude =================
const anthropicTools = toolDefs.map((t) => ({ name: t.name, description: t.description, input_schema: t.parameters }));
let anthropic;
function getAnthropic() { if (!anthropic) anthropic = new Anthropic({ apiKey: config.anthropicApiKey }); return anthropic; }

async function generateWithAnthropic(userText, ctx) {
  const messages = [{ role: 'user', content: userText }];
  for (let step = 0; step < 6; step++) {
    const response = await getAnthropic().messages.create({
      model: config.aiModel, max_tokens: 1024,
      system: systemPrompt(config.storeName), tools: anthropicTools, messages
    });
    if (response.stop_reason === 'tool_use') {
      messages.push({ role: 'assistant', content: response.content });
      const toolResults = [];
      for (const block of response.content) {
        if (block.type !== 'tool_use') continue;
        let data;
        try { data = await runTool(block.name, block.input, ctx); }
        catch (err) { console.error(`Tool ${block.name} failed:`, err); data = { error: 'lookup failed' }; }
        toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(data) });
      }
      messages.push({ role: 'user', content: toolResults });
      continue;
    }
    const text = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
    return text || 'দুঃখিত, একটু আবার বুঝিয়ে বলবেন?';
  }
  return 'আমাদের একজন এজেন্ট শীঘ্রই আপনার সাথে যোগাযোগ করবেন। ধন্যবাদ!';
}

// ================= Dispatch =================
export async function generateReply(userText, ctx) {
  if (!config.aiEnabled) {
    const key = config.aiProvider === 'anthropic' ? 'ANTHROPIC_API_KEY'
      : (config.aiProvider === 'openai' ? 'OPENAI_API_KEY' : 'GEMINI_API_KEY');
    return `🤖 (test mode) আপনি লিখেছেন: "${userText}"\n\nAI চালু করতে .env-এ ${key} যোগ করুন।`;
  }
  await refreshGuideline();
  let reply;
  if (config.aiProvider === 'anthropic') reply = await generateWithAnthropic(userText, ctx);
  else if (config.aiProvider === 'openai') reply = await generateWithOpenAI(userText, ctx);
  else reply = await generateWithGemini(userText, ctx);
  db.logChat({ channel: ctx.channel, userId: ctx.userId, phone: ctx.phone, userText, replyText: reply }).catch(() => {});
  return reply;
}

// Live AI health check for /debug — runs a tiny request and reports the exact
// error (and, for Gemini, the model names your key can actually use).
export async function aiHealthCheck() {
  const info = {
    provider: config.aiProvider,
    enabled: config.aiEnabled,
    model: config.aiProvider === 'anthropic' ? config.aiModel : (config.aiProvider === 'openai' ? config.openaiModel : config.geminiModel)
  };
  if (!config.aiEnabled) return info;
  try {
    if (config.aiProvider === 'gemini') {
      const errors = {};
      let ok = false;
      for (const model of geminiCandidates()) {
        try {
          const genAI = new GoogleGenerativeAI(config.geminiApiKey);
          const r = await genAI.getGenerativeModel({ model }).generateContent('say hi in one word');
          info.test = { ok: true, workingModel: model, sample: (r.response.text() || '').trim().slice(0, 40) };
          ok = true;
          break;
        } catch (e) {
          errors[model] = String(e?.message || e).slice(0, 100);
        }
      }
      if (!ok) info.test = { ok: false, errors };
    } else if (config.aiProvider === 'openai') {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.openaiApiKey}` },
        body: JSON.stringify({ model: config.openaiModel, max_tokens: 5, messages: [{ role: 'user', content: 'hi' }] })
      });
      info.test = r.ok ? { ok: true, model: config.openaiModel } : { ok: false, error: (await r.text()).slice(0, 200) };
    } else {
      await getAnthropic().messages.create({
        model: config.aiModel, max_tokens: 20, messages: [{ role: 'user', content: 'say hi' }]
      });
      info.test = { ok: true };
    }
  } catch (e) {
    info.test = { ok: false, error: String(e?.message || e).slice(0, 400) };
  }
  // For Gemini, list usable model names so we can pick a valid one.
  if (config.aiProvider === 'gemini') {
    try {
      const list = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${config.geminiApiKey}`).then((x) => x.json());
      info.availableModels = (list.models || [])
        .map((mm) => (mm.name || '').replace('models/', ''))
        .filter((n) => n.includes('gemini') && (n.includes('flash') || n.includes('pro')))
        .slice(0, 20);
    } catch { /* ignore */ }
  }
  return info;
}
