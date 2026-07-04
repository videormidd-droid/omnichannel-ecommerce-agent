// Central env loader. Channels enable based on which credentials are present.
// IMPORTANT: this NEVER calls process.exit — a missing/wrong setting only
// disables that one feature (with a warning), so a single bad value can never
// crash the whole bot. The server always boots so /debug stays reachable.
import dotenv from 'dotenv';
dotenv.config();

const isSet = (v) => Boolean(v && !v.startsWith('your_'));

function want(name) {
  const v = process.env[name];
  if (!isSet(v)) console.warn(`⚠️  Missing/placeholder env var: ${name} — related features will be limited.`);
  return isSet(v) ? v : '';
}

const whatsappEnabled = isSet(process.env.WHATSAPP_ACCESS_TOKEN) && isSet(process.env.WHATSAPP_PHONE_NUMBER_ID);
const telegramEnabled = isSet(process.env.TELEGRAM_BOT_TOKEN);

if (!whatsappEnabled && !telegramEnabled) {
  console.warn('⚠️  No chat channel configured (WhatsApp/Telegram) — server still boots for /debug.');
}
if (whatsappEnabled && !isSet(process.env.WHATSAPP_VERIFY_TOKEN)) {
  console.warn('⚠️  WhatsApp enabled but WHATSAPP_VERIFY_TOKEN missing — webhook verification will fail.');
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

  // Shared backend — optional. If missing, DB features degrade but the app boots.
  supabaseUrl: want('SUPABASE_URL'),
  supabaseServiceRoleKey: want('SUPABASE_SERVICE_ROLE_KEY'),

  // AI brain
  aiEnabled,
  aiProvider, // 'gemini' (default) | 'anthropic'
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  aiModel: process.env.AI_MODEL || 'claude-3-5-sonnet-latest',

  storeName: process.env.STORE_NAME || 'our store',
  handoffContact: process.env.SUPPORT_HANDOFF_CONTACT || ''
};
