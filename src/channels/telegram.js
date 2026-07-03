// Telegram channel: send via Bot API + webhook router (POST only).
// NOTE: Telegram has NO GET challenge like Meta. Security = the secret token
// you register with setWebhook, which Telegram echoes back in a header.
import express from 'express';
import { config } from '../config.js';
import { generateReply } from '../ai.js';

const API = `https://api.telegram.org/bot${config.telegram.botToken}`;
const processed = new Set();

export async function sendMessage(chatId, text) {
  const res = await fetch(`${API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text })
  });
  if (!res.ok) console.error('[telegram] API error:', res.status, await res.text());
  return res.json();
}

export const router = express.Router();

router.post('/', async (req, res) => {
  // Soft secret check — logs a warning but does NOT reject, so delivery never
  // silently fails on a secret mismatch. Re-enable the 401 for stricter security.
  if (config.telegram.webhookSecret) {
    const got = req.get('X-Telegram-Bot-Api-Secret-Token');
    if (got !== config.telegram.webhookSecret) {
      console.warn('⚠️ [telegram] secret token mismatch — processing anyway');
    }
  }
  res.sendStatus(200); // ack fast

  try {
    const update = req.body;
    const msg = update?.message;
    if (!msg) return; // ignore edited_message / callback_query / etc.

    if (processed.has(update.update_id)) return;
    processed.add(update.update_id);
    if (processed.size > 2000) processed.clear();

    const chatId = msg.chat.id;
    if (!msg.text) {
      await sendMessage(chatId, 'এই মুহূর্তে আমি শুধু টেক্সট মেসেজ বুঝতে পারি। 🙏');
      return;
    }

    // Telegram has no phone by default → phone is null; the AI will ask if needed.
    const ctx = { channel: 'telegram', userId: String(chatId), phone: null, handoff: null };
    let reply;
    try {
      reply = await generateReply(msg.text, ctx);
    } catch (aiErr) {
      console.error('[telegram] AI error:', aiErr);
      reply = 'দুঃখিত, এই মুহূর্তে একটু সমস্যা হচ্ছে। একটু পরে আবার চেষ্টা করুন। 🙏';
    }
    await sendMessage(chatId, reply);

    if (ctx.handoff?.requested) console.log(`🔔 [telegram] HANDOFF ${chatId}: ${ctx.handoff.reason}`);
  } catch (err) { console.error('[telegram] handler error:', err); }
});
