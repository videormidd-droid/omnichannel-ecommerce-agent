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
