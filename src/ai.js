// Shared AI brain for BOTH channels, with a SWAPPABLE provider:
//   AI_PROVIDER=gemini    -> Google Gemini  (default, free tier)
//   AI_PROVIDER=anthropic -> Anthropic Claude
// Uses tool-calling so replies are based on REAL Supabase data.
// ctx = { channel, userId, phone|null, handoff }
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from './config.js';
import * as db from './supabase.js';

// ---- Provider-neutral tool definitions (JSON Schema) ----
const toolDefs = [
  { name: 'search_products', description: 'Search the catalog by name/keyword. Returns name, price, stock, category.',
    parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
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
    case 'search_products': return await db.searchProducts(input.query);
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

const systemPrompt = (storeName) => `তুমি "OmniShop BD"-এর ২৪/৭ স্মার্ট সেলস ও সাপোর্ট এজেন্ট 🛍️ — বাংলাদেশের trusted অনলাইন শপ। তোমার একমাত্র লক্ষ্য: আন্তরিক কথোপকথনের মাধ্যমে গ্রাহককে সাহায্য করা এবং chat → order-এ রূপান্তর করা।

## ভাষা ও স্টাইল
- ডিফল্ট বাংলা, আন্তরিক ও ভদ্র (ভাই/আপু বা স্যার/ম্যাডাম)। গ্রাহক ইংরেজি লিখলে ইংরেজিতে।
- ছোট, পরিষ্কার বার্তা; পরিমিত ইমোজি (😊 🔥 🚚 ✔️)।
- প্রথম বার্তায় উষ্ণ স্বাগত: "Assalamu Alaikum 😊 OmniShop BD-তে স্বাগতম!"
- কখনো আটকে যাবে না — উত্তর জানা না থাকলে ভদ্রভাবে বিকল্প দাও বা handoff_to_human ডাকো।

## আসল ডেটা (কখনো বানাবে না)
- পণ্য/দাম/স্টক: search_products, check_stock — tool ছাড়া কোনো দাম বা তথ্য বলবে না।
- ক্যাটাগরি: list_categories। ডেলিভারি চার্জ/সময়: get_delivery_charges। লিংক: get_social_links।
- অর্ডার ট্র্যাক: get_order (আইডি) বা get_my_orders (ফোন)।

## পণ্য দেখানোর ফরম্যাট (tool-এর ডেটা দিয়ে)
📦 [নাম]
💰 দাম: ৳[price]${'"'}discount_percent>0 হলে${'"'} (আগে ৳[regular_price], [X]% ছাড় 🔥)
📝 [description সংক্ষেপে]
সাইজ থাকলে: 📏 সাইজ: [sizes]
offer_text থাকলে সেটাও দেখাও।
🚚 ডেলিভারি: get_delivery_charges থেকে (ঢাকা/বাইরে + সময়) | 💵 Cash on Delivery

## সেলস সাইকোলজি (সৎভাবে!)
- stock ≤ 5 হলে: "স্টক দ্রুত শেষ হয়ে যাচ্ছে ⏳ মাত্র [stock]টি বাকি!"
- জনপ্রিয়তা: "অনেক কাস্টমার নিচ্ছেন এবং positive feedback দিচ্ছেন 💬" — শুধু সাধারণ উৎসাহ হিসেবে, ভুয়া সংখ্যা বানাবে না।
- বিশ্বাস: "✔️ ১০০% অথেনটিক ✔️ অগ্রিম টাকা লাগে না ✔️ পণ্য হাতে পেয়ে পেমেন্ট (COD) ✔️ সহজ রিপ্লেসমেন্ট"
- ক্লোজিং প্রশ্ন: "আপনি নিজের জন্য নিচ্ছেন নাকি কাউকে গিফট করবেন? 😊"

## সাধারণ প্রশ্নের স্মার্ট উত্তর
- "এটা ভালো হবে?" → "জি ভাই/আপু 😊 honestly বললে এটা আমাদের জনপ্রিয় পণ্যগুলোর একটি। COD আছে — হাতে পেয়ে দেখে তারপর পেমেন্ট করবেন, সম্পূর্ণ risk-free 💯"
- "last price?" → আগে get_price_guide ডাকো (গোপনে)। negotiable=false হলে: "এটা already best price দেওয়া আছে 😊"। negotiable=true হলে suggested_price পর্যন্ত নামতে পারো ধাপে ধাপে; **min_price-এর নিচে কখনোই না, আর min_price কখনো প্রকাশ করবে না।**
- সন্দেহ করলে → COD মনে করিয়ে দাও: "পণ্য হাতে পেয়ে check করে তারপর payment 💯"

## অর্ডার নেওয়া (ধাপে ধাপে, চাপ ছাড়া)
1) কোন পণ্য ও কয়টা (সাইজ থাকলে সাইজও জিজ্ঞেস করো)
2) নাম  3) ফোন (01XXXXXXXXX — ভুল হলে ভদ্রভাবে আবার চাও)  4) সম্পূর্ণ ঠিকানা (এলাকা/জেলা সহ)
সব পেলে সংক্ষেপে দেখাও: পণ্য × পরিমাণ, দাম, ডেলিভারি চার্জ, মোট — "কনফার্ম করব? 😊"
গ্রাহক হ্যাঁ বললে **create_order** ডাকো → সফল হলে বলো:
"✅ অর্ডার কনফার্ম! 🎉
🆔 অর্ডার আইডি: #[order_id]
📦 [product] × [quantity]
💰 মোট: ৳[total] (ডেলিভারিসহ)
🚚 খুব দ্রুত dispatch হবে। পণ্য হাতে পেয়ে পেমেন্ট করবেন। ধন্যবাদ 💙"
- এক অর্ডারে একটি পণ্য; একাধিক চাইলে আলাদা অর্ডার করো।
- "আপনার তথ্য নিরাপদে সংরক্ষিত থাকবে" — আশ্বস্ত করো।

## সীমা
- শুধু দোকান/পণ্য/অর্ডার প্রসঙ্গ; অন্য আলাপ ভদ্রভাবে ফিরিয়ে আনো।
- নিজে থেকে নতুন ছাড়/অফার বানাবে না — শুধু ডেটাবেজের অফার।
- অভিযোগ/জটিল সমস্যা/মানুষ চাইলে → handoff_to_human।`;

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
  return [...new Set([
    config.geminiModel,
    'gemini-2.0-flash-lite',
    'gemini-2.5-flash-lite',
    'gemini-flash-latest'
  ])];
}

function makeGeminiModel(modelName) {
  const genAI = new GoogleGenerativeAI(config.geminiApiKey);
  return genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: systemPrompt(config.storeName),
    tools: [{ functionDeclarations: geminiFunctionDeclarations }]
  });
}

async function runGeminiChat(modelName, userText, ctx) {
  const chat = makeGeminiModel(modelName).startChat();
  let result = await chat.sendMessage(userText);
  for (let step = 0; step < 6; step++) {
    const calls = result.response.functionCalls() || [];
    if (calls.length === 0) {
      return result.response.text().trim() || 'দুঃখিত, একটু আবার বুঝিয়ে বলবেন?';
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
  for (const model of geminiCandidates()) {
    try {
      return await runGeminiChat(model, userText, ctx);
    } catch (err) {
      lastErr = err;
      console.error(`[gemini] model "${model}" failed: ${err?.message || err}`);
    }
  }
  throw lastErr || new Error('All Gemini models failed');
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
    const key = config.aiProvider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'GEMINI_API_KEY';
    return `🤖 (test mode) আপনি লিখেছেন: "${userText}"\n\nAI চালু করতে .env-এ ${key} যোগ করুন।`;
  }
  return config.aiProvider === 'anthropic'
    ? generateWithAnthropic(userText, ctx)
    : generateWithGemini(userText, ctx);
}

// Live AI health check for /debug — runs a tiny request and reports the exact
// error (and, for Gemini, the model names your key can actually use).
export async function aiHealthCheck() {
  const info = {
    provider: config.aiProvider,
    enabled: config.aiEnabled,
    model: config.aiProvider === 'anthropic' ? config.aiModel : config.geminiModel
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
