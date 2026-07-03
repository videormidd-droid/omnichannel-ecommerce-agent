// Main server: one Express app that serves BOTH channels simultaneously.
//   WhatsApp → GET/POST /webhook/whatsapp
//   Telegram → POST     /webhook/telegram
import express from 'express';
import { config } from './config.js';
import { router as whatsappRouter } from './channels/whatsapp.js';
import { router as telegramRouter } from './channels/telegram.js';

const app = express();
app.use(express.json());

// Health check
app.get('/', (_req, res) => res.send('Omnichannel e-commerce agent is running ✅'));

// Safe diagnostics page — reports health WITHOUT exposing any tokens/secrets.
// Open /debug in a browser to see exactly what is (or isn't) working.
app.get('/debug', async (_req, res) => {
  const out = {
    server: 'ok',
    ai: {
      provider: config.aiProvider,
      enabled: config.aiEnabled,
      model: config.aiProvider === 'anthropic' ? config.aiModel : config.geminiModel
    },
    telegram: { enabled: config.telegram.enabled, hasSecret: Boolean(config.telegram.webhookSecret) },
    whatsapp: { enabled: config.whatsapp.enabled }
  };

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
