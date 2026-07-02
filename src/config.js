// Central env loader + validation. Enables channels based on which
// credentials are present, so you can run WhatsApp only, Telegram only, or both.
import dotenv from 'dotenv';
dotenv.config();

const isSet = (v) => Boolean(v && !v.startsWith('your_'));

function required(name) {
  const v = process.env[name];
  if (!isSet(v)) {
    console.error(`❌ Missing or placeholder env var: ${name}. Check your .env file.`);
    process.exit(1);
  }
  return v;
}

const whatsappEnabled = isSet(process.env.WHATSAPP_ACCESS_TOKEN) && isSet(process.env.WHATSAPP_PHONE_NUMBER_ID);
const telegramEnabled = isSet(process.env.TELEGRAM_BOT_TOKEN);

if (!whatsappEnabled && !telegramEnabled) {
  console.error('❌ No channel configured. Add WhatsApp and/or Telegram credentials to .env.');
  process.exit(1);
}
if (whatsappEnabled && !isSet(process.env.WHATSAPP_VERIFY_TOKEN)) {
  console.warn('⚠️  WhatsApp is enabled but WHATSAPP_VERIFY_TOKEN is missing — webhook verification will fail.');
}

const aiProvider = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
const aiEnabled =
  (aiProvider === 'anthropic' && isSet(process.env.ANTHROPIC_API_KEY)) ||
  (aiProvider === 'gemini' && isSet(process.env.GEMINI_API_KEY));

export const config = {
  port: process.env.PORT || 3000,

  whatsapp: {
    enabled: whatsappEnabled,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
    apiVersion: process.env.WHATSAPP_API_VERSION || 'v21.0',
    appSecret: process.env.META_APP_SECRET || ''
  },

  telegram: {
    enabled: telegramEnabled,
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || ''
  },

  // Shared backend (required for real answers)
  supabaseUrl: required('SUPABASE_URL'),
  supabaseServiceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),

  // AI brain (optional — without a key for the chosen provider, the bot echoes messages)
  aiEnabled,
  aiProvider, // 'gemini' (default) | 'anthropic'
  // Google Gemini — free tier, easy
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  // Anthropic Claude — used only if AI_PROVIDER=anthropic
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  aiModel: process.env.AI_MODEL || 'claude-3-5-sonnet-latest',

  storeName: process.env.STORE_NAME || 'our store',
  handoffContact: process.env.SUPPORT_HANDOFF_CONTACT || ''
};
