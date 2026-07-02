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
  try {
    const value = req.body?.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];
    if (!message) return; // status update (delivered/read)

    if (processed.has(message.id)) return;
    processed.add(message.id);
    if (processed.size > 2000) processed.clear();

    const from = message.from; // "8801712345678"
    if (message.type !== 'text') {
      await sendMessage(from, 'এই মুহূর্তে আমি শুধু টেক্সট মেসেজ বুঝতে পারি। 🙏');
      return;
    }
    await markAsRead(message.id).catch(() => {});

    const ctx = { channel: 'whatsapp', userId: from, phone: from, handoff: null };
    const reply = await generateReply(message.text.body, ctx);
    await sendMessage(from, reply);

    if (ctx.handoff?.requested) console.log(`🔔 [whatsapp] HANDOFF ${from}: ${ctx.handoff.reason}`);
  } catch (err) { console.error('[whatsapp] handler error:', err); }
});
