// One-time helper: registers your public URL as the Telegram webhook.
// Run AFTER your server is reachable on a public HTTPS URL.
//   npm run set-telegram-webhook
import dotenv from 'dotenv';
dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const base = process.env.PUBLIC_BASE_URL;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET || undefined;

if (!token || token.startsWith('your_') || !base || base.startsWith('https://your-')) {
  console.error('❌ Set TELEGRAM_BOT_TOKEN and PUBLIC_BASE_URL in .env first.');
  process.exit(1);
}

const url = `${base.replace(/\/$/, '')}/webhook/telegram`;

const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url, secret_token: secret, allowed_updates: ['message'] })
});

const data = await res.json();
console.log('setWebhook →', JSON.stringify(data, null, 2));
console.log('Registered webhook URL:', url);
