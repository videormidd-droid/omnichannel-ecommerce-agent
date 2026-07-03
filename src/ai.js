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
  { name: 'check_stock', description: 'Check if a product is in stock and get its price.',
    parameters: { type: 'object', properties: { product_name: { type: 'string' } }, required: ['product_name'] } },
  { name: 'get_order', description: 'Look up one order + its items by numeric order ID.',
    parameters: { type: 'object', properties: { order_id: { type: 'number' } }, required: ['order_id'] } },
  { name: 'get_my_orders', description: "Get the chatting customer's recent orders (WhatsApp only — uses their phone automatically).",
    parameters: { type: 'object', properties: {} } },
  { name: 'get_social_links', description: 'Get store website / social links.',
    parameters: { type: 'object', properties: {} } },
  { name: 'handoff_to_human', description: 'Escalate to a human agent when needed.',
    parameters: { type: 'object', properties: { reason: { type: 'string' } }, required: ['reason'] } }
];

async function runTool(name, input, ctx) {
  switch (name) {
    case 'search_products': return await db.searchProducts(input.query);
    case 'check_stock':     return await db.checkStock(input.product_name);
    case 'get_order':       return (await db.getOrderById(input.order_id)) ?? { found: false, order_id: input.order_id };
    case 'get_my_orders':
      if (!ctx.phone) return { need_phone: true, note: 'No phone on this channel. Ask for the phone used at checkout, or an order ID.' };
      return await db.getOrdersByPhone(ctx.phone);
    case 'get_social_links':return await db.getSocialLinks();
    case 'handoff_to_human':ctx.handoff = { requested: true, reason: input.reason }; return { ok: true };
    default: return { error: `Unknown tool: ${name}` };
  }
}

const systemPrompt = (storeName) => `তুমি "${storeName}"-এর ২৪/৭ কাস্টমার সাপোর্ট এজেন্ট। তুমি Website, WhatsApp, Messenger ও Telegram-এ গ্রাহকদের সেবা দাও।

## ভাষা
- ডিফল্ট বাংলায় ভদ্র ও আন্তরিকভাবে কথা বলো (স্যার/ম্যাডাম ব্যবহার করতে পারো)।
- গ্রাহক ইংরেজিতে লিখলে ইংরেজিতে উত্তর দাও।
- আঞ্চলিক ভাষা বা কথা বুঝতে না পারলে বলো: "স্যার, আপনার আঞ্চলিক ভাষা পুরোপুরি বুঝতে পারছি না, দয়া করে একটু পরিষ্কারভাবে বলবেন।"
- ছোট, স্পষ্ট বার্তা দাও; দরকারে ১–২টি ইমোজি।

## আসল তথ্যই বলবে (কখনো বানাবে না)
- পণ্যের নাম, দাম, স্টক বা অর্ডারের তথ্য সবসময় tool দিয়ে বের করবে:
  - পণ্য / দাম / স্টক: search_products, check_stock
  - অর্ডার ট্র্যাক (অর্ডার নম্বর): get_order
  - গ্রাহকের অর্ডার (ফোন — WhatsApp): get_my_orders
  - দোকানের লিংক / সোশ্যাল: get_social_links
- কোনো তথ্য না পেলে বলো: "আন্তরিকভাবে দুঃখিত স্যার, এই তথ্যটি আমার কাছে নেই। আমাদের টিম দ্রুত আপনার সাথে যোগাযোগ করবে।"

## দাম সংক্রান্ত নিয়ম
- সবসময় tool থেকে পাওয়া আসল দাম দেখাবে; দাম বানাবে না।
- কখনো বেস প্রাইসের নিচে যাবে না; দর-কষাকষিতে দাম কমাবে না।
- চাইলে উচ্চতর অপশন/বান্ডেল সাজেস্ট করতে পারো (উদাহরণ: ৳৪৫০, ৳৫০০, ৳৬৫০ — আসল দাম tool থেকেই নেবে)।
- দাম সবসময় ৳ চিহ্ন দিয়ে দেখাবে।

## পণ্য খোঁজা
- গ্রাহক কী চায় স্পষ্ট না হলে জিজ্ঞেস করো: "আমাদের কাছে অনেক ক্যাটাগরি আছে। আপনি কোন ক্যাটাগরির প্রোডাক্ট চান?"
- এরপর search_products দিয়ে মিলিয়ে নাম, দাম ও স্টক দেখাও।

## অর্ডার নেওয়া — সব তথ্য নেবে
নতুন অর্ডারের জন্য বিনয়ের সাথে একে একে নেবে:
1) পণ্য ও পরিমাণ  2) গ্রাহকের নাম  3) ফোন নম্বর  4) সম্পূর্ণ ঠিকানা  5) বিভাগ (Division)  6) পছন্দের যোগাযোগ মাধ্যম: WhatsApp / Messenger / Telegram।
সব পেলে অর্ডারটি সংক্ষেপে দেখিয়ে নিশ্চিত করতে বলো। (পেমেন্ট/চূড়ান্ত কনফার্ম টিম করবে।)

## বিশ্বাস ও নিরাপত্তা
- তথ্য নেওয়ার সময় আশ্বস্ত করো: "আপনার তথ্য নিরাপদে সংরক্ষণ করা হচ্ছে।"
- সৎ, ভদ্র ও সহায়ক থাকো; কোনো তথ্য বিকৃত করবে না।

## হ্যান্ডওভার
- গ্রাহক অসন্তুষ্ট/অভিযোগ করছে, মানুষ চাইছে, বা তুমি সমাধান করতে পারছ না — handoff_to_human ডাকো এবং জানাও একজন প্রতিনিধি শীঘ্রই যোগাযোগ করবেন।

## সীমা
- শুধু দোকান, পণ্য ও অর্ডার সংক্রান্ত সাহায্য করো; অন্য প্রসঙ্গে ভদ্রভাবে ফিরিয়ে আনো।
- নিজে থেকে ছাড়/অফার বানাবে না।`;

// ================= Provider: Google Gemini (default) =================
let geminiModel;
function getGeminiModel() {
  if (!geminiModel) {
    const genAI = new GoogleGenerativeAI(config.geminiApiKey);
    geminiModel = genAI.getGenerativeModel({
      model: config.geminiModel, // e.g. gemini-2.0-flash (use a current model from AI Studio)
      systemInstruction: systemPrompt(config.storeName),
      // Gemini rejects empty `parameters` — omit it for parameterless tools.
      tools: [{ functionDeclarations: toolDefs.map((t) =>
        (t.parameters && Object.keys(t.parameters.properties || {}).length > 0)
          ? { name: t.name, description: t.description, parameters: t.parameters }
          : { name: t.name, description: t.description }
      ) }]
    });
  }
  return geminiModel;
}

async function generateWithGemini(userText, ctx) {
  const chat = getGeminiModel().startChat();
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
      const genAI = new GoogleGenerativeAI(config.geminiApiKey);
      const m = genAI.getGenerativeModel({ model: config.geminiModel });
      const r = await m.generateContent('say hi in one word');
      info.test = { ok: true, sample: (r.response.text() || '').trim().slice(0, 40) };
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
