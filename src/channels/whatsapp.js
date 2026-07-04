// WhatsApp channel: send via Cloud API + webhook router (GET verify, POST receive).
import express from 'express';
import { config } from '../config.js';
import { generateReply } from '../ai.js';

const BASE_URL = `https://graph.facebook.com/${config.whatsapp.apiVersion}/${config.whatsapp.phoneNumberId}`;
const processed = new Set();

async function callGraph(payload) {
  const res = await fetch(`${BASE_URL}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.whatsapp.accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) { console.error('[whatsapp] API error:', res.status, await res.text()); throw new Error(`WhatsApp API ${res.status}`); }
  return res.json();
}

export function sendMessage(to, text) {
  return callGraph({ messaging_product: 'whatsapp', recipient_type: 'individual', to, type: 'text', text: { preview_url: false, body: text } });
}
function markAsRead(id) {
  return callGraph({ messaging_product: 'whatsapp', status: 'read', message_id: id });
}

// In-memory status so /debug can show whether inbound arrives + replies send.
export const whatsappStatus = {
  lastInboundAt: null, lastEvent: null, lastFrom: null,
  lastText: null, lastReplyOk: null, lastError: null
};

export const router = express.Router();

// GET = Meta verification handshake (echo hub.challenge back)
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === config.whatsapp.verifyToken) {
    console.log('✅ [whatsapp] webhook verified');
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// POST = incoming messages
router.post('/', async (req, res) => {
  res.sendStatus(200); // ack fast so Meta doesn't retry
  whatsappStatus.lastInboundAt = new Date().toISOString();
  try {
    const value = req.body?.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];
    if (!message) { whatsappStatus.lastEvent = value?.statuses ? 'status-update' : 'no-message'; return; }

    whatsappStatus.lastEvent = 'message';
    whatsappStatus.lastFrom = message.from;
    whatsappStatus.lastText = message.type === 'text' ? String(message.text.body).slice(0, 60) : `[${message.type}]`;

    if (processed.has(message.id)) return;
    processed.add(message.id);
    if (processed.size > 2000) processed.clear();

    const from = message.from;
    if (message.type !== 'text') {
      await sendMessage(from, 'এই মুহূর্তে আমি শুধু টেক্সট মেসেজ বুঝতে পারি। 🙏');
      return;
    }
    await markAsRead(message.id).catch(() => {});

    const ctx = { channel: 'whatsapp', userId: from, phone: from, handoff: null };
    let reply;
    try {
      reply = await generateReply(message.text.body, ctx);
    } catch (aiErr) {
      console.error('[whatsapp] AI error:', aiErr);
      reply = 'দুঃখিত, এই মুহূর্তে একটু সমস্যা হচ্ছে। একটু পরে আবার চেষ্টা করুন। 🙏';
    }
    try {
      await sendMessage(from, reply);
      whatsappStatus.lastReplyOk = true;
      whatsappStatus.lastError = null;
    } catch (sendErr) {
      whatsappStatus.lastReplyOk = false;
      whatsappStatus.lastError = String(sendErr?.message || sendErr).slice(0, 160);
      console.error('[whatsapp] send failed:', sendErr);
    }

    if (ctx.handoff?.requested) console.log(`🔔 [whatsapp] HANDOFF ${from}: ${ctx.handoff.reason}`);
  } catch (err) {
    console.error('[whatsapp] handler error:', err);
    whatsappStatus.lastError = String(err?.message || err).slice(0, 160);
  }
});
