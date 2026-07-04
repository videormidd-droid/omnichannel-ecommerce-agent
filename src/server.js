// Main server: one Express app that serves BOTH channels simultaneously.
//   WhatsApp → GET/POST /webhook/whatsapp
//   Telegram → POST     /webhook/telegram
import express from 'express';
import { config } from './config.js';
import { router as whatsappRouter, whatsappStatus } from './channels/whatsapp.js';
import { router as telegramRouter } from './channels/telegram.js';
import { aiHealthCheck } from './ai.js';
import { dbHealthCheck } from './supabase.js';

const app = express();
app.use(express.json());

// Health check
app.get('/', (_req, res) => res.send('Omnichannel e-commerce agent is running ✅'));

// Safe diagnostics page — reports health WITHOUT exposing any tokens/secrets.
// Open /debug in a browser to see exactly what is (or isn't) working.
app.get('/debug', async (_req, res) => {
  const out = {
    server: 'ok',
    ai: { provider: config.aiProvider, enabled: config.aiEnabled },
    telegram: { enabled: config.telegram.enabled, hasSecret: Boolean(config.telegram.webhookSecret) },
    whatsapp: {
      enabled: config.whatsapp.enabled,
      hasAccessToken: Boolean(config.whatsapp.accessToken && !String(config.whatsapp.accessToken).startsWith('your_')),
      hasPhoneNumberId: Boolean(config.whatsapp.phoneNumberId && !String(config.whatsapp.phoneNumberId).startsWith('your_')),
      hasVerifyToken: Boolean(config.whatsapp.verifyToken)
    }
  };
  try { out.ai = await aiHealthCheck(); } catch (e) { out.ai.error = String(e); }
  try { out.database = await dbHealthCheck(); } catch (e) { out.database = { error: String(e) }; }

  if (config.telegram.enabled) {
    try {
      const me = await fetch(`https://api.telegram.org/bot${config.telegram.botToken}/getMe`).then((r) => r.json());
      out.telegram.tokenValid = Boolean(me.ok);
      if (me.ok) out.telegram.botUsername = me.result.username;
      else out.telegram.tokenError = `${me.error_code} ${me.description}`;

      const wh = await fetch(`https://api.telegram.org/bot${config.telegram.botToken}/getWebhookInfo`).then((r) => r.json());
      if (wh.ok) {
        out.telegram.webhookUrl = wh.result.url || '(none set)';
        out.telegram.pendingUpdates = wh.result.pending_update_count;
        out.telegram.lastError = wh.result.last_error_message || null;
      }
    } catch (e) {
      out.telegram.checkError = String(e);
    }
  }

  // Validate the WhatsApp token against Meta (only when credentials are set).
  if (config.whatsapp.enabled) {
    try {
      const r = await fetch(
        `https://graph.facebook.com/${config.whatsapp.apiVersion}/${config.whatsapp.phoneNumberId}?fields=display_phone_number,verified_name`,
        { headers: { Authorization: `Bearer ${config.whatsapp.accessToken}` } }
      ).then((x) => x.json());
      if (r.error) {
        out.whatsapp.tokenValid = false;
        out.whatsapp.error = `${r.error.code}: ${r.error.message}`.slice(0, 160);
      } else {
        out.whatsapp.tokenValid = true;
        out.whatsapp.phone = r.display_phone_number;
        out.whatsapp.verifiedName = r.verified_name;
      }
    } catch (e) {
      out.whatsapp.checkError = String(e).slice(0, 160);
    }
  }

  Object.assign(out.whatsapp, {
    lastInboundAt: whatsappStatus.lastInboundAt,
    lastEvent: whatsappStatus.lastEvent,
    lastReplyOk: whatsappStatus.lastReplyOk,
    lastSendError: whatsappStatus.lastError
  });

  res.json(out);
});

// One-tap Telegram webhook registration using the server's OWN token + secret.
// Open /setup-telegram once — no token typing, and the secret always matches.
app.get('/setup-telegram', async (req, res) => {
  if (!config.telegram.enabled) return res.json({ ok: false, error: 'Telegram not enabled' });
  const base = (process.env.PUBLIC_BASE_URL || `https://${req.get('host')}`).replace(/\/$/, '');
  const url = `${base}/webhook/telegram`;
  const body = { url, allowed_updates: ['message'] };
  if (config.telegram.webhookSecret) body.secret_token = config.telegram.webhookSecret;
  try {
    const result = await fetch(`https://api.telegram.org/bot${config.telegram.botToken}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then((r) => r.json());
    res.json({ registeredUrl: url, telegramResponse: result });
  } catch (e) {
    res.json({ ok: false, error: String(e) });
  }
});

// One-tap fix: subscribe the app to the WhatsApp Business Account's webhooks.
// This is the step the Configuration UI often misses, which blocks inbound messages.
app.get('/setup-whatsapp', async (req, res) => {
  if (!config.whatsapp.enabled) return res.json({ ok: false, error: 'WhatsApp not enabled' });
  const token = config.whatsapp.accessToken;
  const v = config.whatsapp.apiVersion;
  try {
    let waba = req.query.waba;
    if (!waba) {
      // Discover the WABA id from the token's granular scopes.
      const dbg = await fetch(`https://graph.facebook.com/${v}/debug_token?input_token=${token}&access_token=${token}`).then((r) => r.json());
      for (const s of (dbg?.data?.granular_scopes || [])) {
        if (String(s.scope || '').includes('whatsapp') && Array.isArray(s.target_ids) && s.target_ids.length) {
          waba = s.target_ids[0];
          break;
        }
      }
    }
    if (!waba) return res.json({ ok: false, error: 'Could not find WABA id from token; open /setup-whatsapp?waba=YOUR_WABA_ID' });

    const subscribe = await fetch(`https://graph.facebook.com/${v}/${waba}/subscribed_apps`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }
    }).then((r) => r.json());
    const subscribedApps = await fetch(`https://graph.facebook.com/${v}/${waba}/subscribed_apps`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then((r) => r.json());

    res.json({ waba, subscribe, subscribedApps });
  } catch (e) {
    res.json({ ok: false, error: String(e) });
  }
});

// Mount each channel only if its credentials are present
if (config.whatsapp.enabled) {
  app.use('/webhook/whatsapp', whatsappRouter);
  console.log('🟢 WhatsApp enabled  → GET/POST /webhook/whatsapp');
} else {
  console.log('⚪ WhatsApp disabled (no credentials in .env)');
}

if (config.telegram.enabled) {
  app.use('/webhook/telegram', telegramRouter);
  console.log('🟢 Telegram enabled  → POST /webhook/telegram');
} else {
  console.log('⚪ Telegram disabled (no token in .env)');
}

if (!config.aiEnabled) {
  console.log('⚠️  AI TEST MODE (no ANTHROPIC_API_KEY) — the bot will echo messages.');
}

app.listen(config.port, () => {
  console.log(`🚀 Server listening on port ${config.port}`);
});
