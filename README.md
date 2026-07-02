# Omnichannel E-commerce AI Agent (WhatsApp + Telegram)

One Node.js/Express middleware that answers customers on **WhatsApp AND Telegram**,
sharing the same **Supabase (PostgreSQL)** data and the same **AI brain** (tool-calling).

```
                ┌─────────────────────────────────────┐
WhatsApp ──────▶│  /webhook/whatsapp                   │
                │                  Express server      │──▶ AI brain (ai.js)
Telegram ──────▶│  /webhook/telegram                   │       │
                └─────────────────────────────────────┘       ▼
                                                          Supabase (products,
                                                          orders, order_items,
                                                          social_links)
```

## Folder structure
```
omnichannel-ecommerce-agent/
├── package.json
├── .env.example          # copy to .env
├── .gitignore
├── scripts/
│   └── set-telegram-webhook.js   # one-time Telegram webhook registration
└── src/
    ├── server.js         # Express app, mounts both channels
    ├── config.js         # env + enables channels by presence
    ├── supabase.js       # shared DB queries
    ├── ai.js             # shared AI brain (tool-calling)
    └── channels/
        ├── whatsapp.js   # Cloud API send + GET verify / POST receive
        └── telegram.js   # Bot API send + POST receive (secret-token check)
```

## Setup
```bash
npm install
cp .env.example .env       # then fill in real values
npm run dev
```
You can run with WhatsApp only, Telegram only, or both — a channel with no
credentials is skipped. Without `ANTHROPIC_API_KEY` the bot runs in echo/test
mode so you can verify the plumbing first.

### Expose a public HTTPS URL (for testing)
```bash
ngrok http 3000           # copy the https URL into PUBLIC_BASE_URL in .env
```

### WhatsApp webhook (Meta Dashboard → WhatsApp → Configuration)
- Callback URL: `https://YOUR-URL/webhook/whatsapp`
- Verify Token: same as `WHATSAPP_VERIFY_TOKEN` in `.env`
- Verify and Save → Subscribe to the `messages` field.

### Telegram webhook (one command)
```bash
npm run set-telegram-webhook
```
This calls Telegram's `setWebhook` with `https://YOUR-URL/webhook/telegram` and
your `TELEGRAM_WEBHOOK_SECRET`. (Telegram has no GET handshake; it secures the
endpoint by echoing that secret in the `X-Telegram-Bot-Api-Secret-Token` header.)

## Production (24/7)
- WhatsApp: use a **permanent System User token** (temporary tokens expire ~24h).
- Deploy to an always-on HTTPS host (Railway, Render, Fly.io, VPS + pm2).
- Replace the in-memory dedupe Sets with Redis/DB if you run multiple instances.
- WhatsApp: verify `X-Hub-Signature-256` using your Meta App Secret.

## Security
- Never commit `.env`. Never paste tokens into chat.
- Supabase **service_role** key bypasses RLS — server-side only. When you build
  the front-end later, use the **anon** key + RLS in the browser.
