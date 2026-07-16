# সেটআপ নির্দেশনা

## ১. প্যাকেজ ইনস্টল (দুটো অ্যাপেই)

```bash
npm install @supabase/ssr @supabase/supabase-js
```

## ২. Supabase Dashboard-এ যা করতে হবে

1. **supabase.com** এ নতুন project তৈরি করুন
2. SQL Editor-এ `final-schema.sql` রান করুন
3. **Authentication → Providers**:
   - Google enable করুন, Client ID/Secret বসান (Google Cloud Console থেকে)
   - Facebook enable করুন, App ID/Secret বসান (Facebook Developer Console থেকে)
   - OAuth Redirect URL: `https://xxxx.supabase.co/auth/v1/callback` — এটা Google/Facebook console-এও যোগ করতে হবে
4. **Authentication → URL Configuration**-এ storefront-এর domain (`https://yoursite.com/auth/callback`) redirect URL হিসেবে যোগ করুন
5. Admin panel-এর জন্য একটা admin user ম্যানুয়ালি তৈরি করুন:
   - Authentication → Users → Add User (email/password দিয়ে)
   - তারপর SQL Editor-এ: `insert into profiles (id, role) values ('<user-id>', 'admin');`

## ৩. দুটো Vercel প্রজেক্ট আলাদাভাবে ডিপ্লয়

- `storefront-app` → `yoursite.com`
- `admin-panel` → `admin-yoursite.com` (আলাদা subdomain, দুটোতেই একই `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY`, কিন্তু `SUPABASE_SERVICE_ROLE_KEY` শুধু environment variable হিসেবে, কখনো কোডে হার্ডকোড না)

## ৪. IP address প্রসঙ্গে

কোনো IP whitelisting লাগবে না — Supabase পাবলিক API (URL + key ভিত্তিক), এবং manual payment হওয়ায় কোনো bank/gateway সার্ভারের সাথে সরাসরি সংযোগ নেই। নিরাপত্তা আসছে RLS পলিসি ও `service_role key` গোপন রাখা থেকে।

## ৫. পরের ধাপ

- Storefront: প্রোডাক্ট লিস্টিং, checkout, dynamic payment form রেন্ডার
- Admin Panel: submissions approve/reject UI, product/category CRUD, withdraw approve UI
