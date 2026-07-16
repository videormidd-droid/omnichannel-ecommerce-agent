# NexCart BD — সম্পূর্ণ সেটআপ ও ডিপ্লয়মেন্ট গাইড

## প্রজেক্ট কী কী নিয়ে গঠিত

| অংশ | কী | কোথায় |
|---|---|---|
| Storefront | কাস্টমার-facing ওয়েবসাইট (Home, Shop, Product, Checkout) | `storefront-app` ফোল্ডার |
| Admin Panel | আলাদা ওয়েবসাইট — প্রোডাক্ট/অর্ডার/পেমেন্ট ম্যানেজমেন্ট | `admin-panel` ফোল্ডার |
| Database | Supabase (Postgres) | supabase.com |
| Hosting | Railway (আপনার পছন্দ অনুযায়ী) | railway.com |

দুটো ওয়েবসাইটই আলাদা GitHub repository ও আলাদা Railway সার্ভিস হিসেবে ডিপ্লয় হবে, কিন্তু একই Supabase ডাটাবেজ শেয়ার করবে।

---

## ধাপ ১ — প্রয়োজনীয় সফটওয়্যার ইনস্টল

- **Node.js** (LTS ভার্সন) — nodejs.org থেকে ডাউনলোড করে ইনস্টল করুন
- **GitHub Desktop** — desktop.github.com থেকে (কোড GitHub-এ তোলার জন্য, টার্মিনাল লাগবে না)
- একটা **GitHub** একাউন্ট (ফ্রি) — github.com
- একটা **Railway** একাউন্ট (আগে থেকেই আছে বলে মনে হচ্ছে)

---

## ধাপ ২ — Supabase ডাটাবেজ সেটআপ

`storefront-app` ফোল্ডারে এই SQL ফাইলগুলো আছে। Supabase Dashboard → **SQL Editor**-এ গিয়ে **এই ক্রমে** একটার পর একটা রান করুন:

1. `final-schema.sql`
2. `migration-add-product-fields.sql`
3. `migration-nexcart-core.sql`
4. `migration-master-forms.sql`
5. `migration-fix-category.sql`

তারপর Supabase Dashboard → **Storage** → **New bucket** → নাম দিন ঠিক `uploads` → **Public bucket** টিক দিয়ে Create করুন (প্রোডাক্ট ছবি ও পেমেন্ট স্ক্রিনশট রাখার জন্য)

---

## ধাপ ৩ — Supabase থেকে প্রয়োজনীয় তিনটা Key সংগ্রহ

Supabase Dashboard → **Project Settings → API**:

| Key | কোথায় পাবেন |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | "Project URL" |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | "anon / public" key |
| `SUPABASE_SERVICE_ROLE_KEY` | "service_role" key (গোপনীয়) |

এই তিনটা `storefront-app/.env.local` ও `admin-panel/.env.local` — দুই জায়গাতেই একই ভ্যালু বসানো আছে (আগেই বসিয়ে দিয়েছি)। শুধু Railway-তে আবার বসাতে হবে (ধাপ ৫-এ)।

---

## ধাপ ৪ — কোড GitHub-এ তোলা (GitHub Desktop দিয়ে)

### Storefront-এর জন্য:
1. GitHub Desktop খুলুন, GitHub একাউন্ট দিয়ে সাইন ইন করুন
2. **File → Add Local Repository** → extract করা `storefront-app` ফোল্ডার সিলেক্ট করুন
3. "This directory does not appear to be a Git repository" মেসেজ এলে **"create a repository"** ক্লিক করুন
4. উপরে ডানে **"Publish repository"** → নাম দিন `nexcart-storefront` → **Publish repository**

### Admin Panel-এর জন্য:
একই কাজ আবার করুন — **File → Add Local Repository** → `admin-panel` ফোল্ডার → **Publish repository** → নাম দিন `nexcart-admin`

⚠️ **লক্ষ্য রাখবেন:** repository নাম যেন এই দুটোই হয় (বা কাছাকাছি কিছু), আগের ভুল "omnichannel-ecommerce-agent" রিপো এখানে সিলেক্ট করবেন না।

---

## ধাপ ৫ — Railway-তে ডিপ্লয়

### Storefront ডিপ্লয়:
1. Railway dashboard-এ যান
2. **New → GitHub Repo** → লিস্ট থেকে **`nexcart-storefront`** সিলেক্ট করুন (আগের ভুল রিপো না)
3. সার্ভিস তৈরি হলে **Variables** ট্যাবে যান
4. এই তিনটা Variable যোগ করুন (Supabase থেকে পাওয়া আসল ভ্যালু দিয়ে):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://sqobkwulmbyfdwfklmeb.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=আপনার anon key
   SUPABASE_SERVICE_ROLE_KEY=আপনার service_role key
   ```
5. Railway অটোমেটিক Build ও Deploy শুরু করবে
6. **Settings → Networking → Generate Domain** চেপে একটা পাবলিক URL নিন

### Admin Panel ডিপ্লয়:
একই প্রজেক্টে **New → GitHub Repo** → এবার **`nexcart-admin`** সিলেক্ট করুন → একই তিনটা Variable বসান → Deploy → আলাদা Domain জেনারেট করুন

---

## ধাপ ৬ — প্রথম Admin ইউজার তৈরি

Supabase Dashboard → **Authentication → Users → Add User** → email/password দিয়ে তৈরি করুন

তারপর সেই ইউজারের ID কপি করে **SQL Editor**-এ রান করুন:
```sql
insert into profiles (id, role) values ('এখানে-user-id-বসান', 'admin');
```

---

## ধাপ ৭ — টেস্ট করুন

1. Admin panel-এর লিংকে গিয়ে লগইন করুন
2. একটা প্রোডাক্ট যোগ করুন (Products → নতুন প্রোডাক্ট)
3. Storefront-এর লিংকে গিয়ে প্রোডাক্টটা দেখাচ্ছে কিনা চেক করুন
4. একটা টেস্ট অর্ডার করুন (checkout ফ্লো)
5. Admin panel-এ ফিরে Payments সেকশনে গিয়ে সেই পেমেন্ট Approve করুন
6. Orders সেকশনে অর্ডার স্ট্যাটাস আপডেট করে দেখুন

---

## এখনো যা বাকি (পরবর্তী ধাপে বানানো হবে)

- Product Detail page-এ multiple images/video/zoom
- Coupon/Flash Sale UI, Policy Pages
- Form Builder UI (কোড ছাড়াই নতুন ফর্ম বানানো)
- Google/Facebook OAuth-এর জন্য আপনাকে নিজে Client ID বানিয়ে Supabase-এ বসাতে হবে

---

## সমস্যায় পড়লে

কোনো ধাপে আটকে গেলে বা error message পেলে, সেই ধাপের **স্ক্রিনশট** পাঠান — সরাসরি সমাধান বলে দেব।
