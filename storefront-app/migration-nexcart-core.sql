-- migration-nexcart-core.sql
-- আগের স্কিমার উপর এই migration চালান (Supabase SQL Editor)

-- =========================================================
-- 1. ORDERS টেবিল সম্প্রসারণ (BD address + delivery + status)
-- =========================================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_code TEXT UNIQUE;   -- BD-2026-XXXX
ALTER TABLE orders ADD COLUMN IF NOT EXISTS division TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS thana TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS address_details TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_charge NUMERIC DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_note TEXT;

-- status ভ্যালু: pending | confirmed | shipped | delivered | cancelled
ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'pending';

-- =========================================================
-- 2. DELIVERY ZONES (ঢাকা/ঢাকার বাইরে/জেলাভিত্তিক অটো চার্জ)
-- =========================================================
CREATE TABLE IF NOT EXISTS delivery_zones (
  id SERIAL PRIMARY KEY,
  zone_name TEXT,              -- 'Dhaka' | 'Outside Dhaka' | নির্দিষ্ট জেলার নাম
  charge NUMERIC DEFAULT 0,
  estimated_days TEXT,
  active BOOLEAN DEFAULT true
);

INSERT INTO delivery_zones (zone_name, charge, estimated_days) VALUES
('Dhaka', 70, '১-২ দিন'),
('Outside Dhaka', 130, '৩-৫ দিন')
ON CONFLICT DO NOTHING;

-- =========================================================
-- 3. COUPONS
-- =========================================================
CREATE TABLE IF NOT EXISTS coupons (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE,
  discount_type TEXT DEFAULT 'percent',   -- 'percent' | 'flat'
  discount_value NUMERIC,
  min_order_amount NUMERIC DEFAULT 0,
  expires_at TIMESTAMP,
  active BOOLEAN DEFAULT true
);

-- =========================================================
-- 4. SITE SETTINGS (Control Center — এক row-এর টেবিল)
-- =========================================================
CREATE TABLE IF NOT EXISTS site_settings (
  id INT PRIMARY KEY DEFAULT 1,
  site_name TEXT DEFAULT 'NexCart BD',
  logo_url TEXT,
  notice_text TEXT,
  currency TEXT DEFAULT 'BDT',
  free_delivery BOOLEAN DEFAULT false,
  maintenance_mode BOOLEAN DEFAULT false,
  live_mode BOOLEAN DEFAULT true,
  whatsapp_number TEXT,
  CHECK (id = 1)
);
INSERT INTO site_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- =========================================================
-- 5. PRODUCTS টেবিল সম্প্রসারণ
-- =========================================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS sub_category TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sold_count INT DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT[];       -- একাধিক ছবি
ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_slug TEXT;

-- =========================================================
-- 6. AUTO ORDER ID GENERATOR (BD-2026-XXXX ফরম্যাট)
-- =========================================================
CREATE SEQUENCE IF NOT EXISTS order_seq START 1;

CREATE OR REPLACE FUNCTION generate_order_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_code := 'BD-' || to_char(now(), 'YYYY') || '-' ||
                     lpad(nextval('order_seq')::text, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_order_code ON orders;
CREATE TRIGGER trg_order_code
BEFORE INSERT ON orders
FOR EACH ROW
WHEN (NEW.order_code IS NULL)
EXECUTE FUNCTION generate_order_code();

-- =========================================================
-- 7. RLS — Public read (active প্রোডাক্ট/সেটিংস), Admin-only write
-- =========================================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read active products" ON products
  FOR SELECT USING (active = true);

CREATE POLICY "public read delivery zones" ON delivery_zones
  FOR SELECT USING (active = true);

CREATE POLICY "public read settings" ON site_settings
  FOR SELECT USING (true);

CREATE POLICY "public read active coupons" ON coupons
  FOR SELECT USING (active = true);

-- লেখা (INSERT/UPDATE/DELETE) শুধু service_role key দিয়ে (admin panel থেকে),
-- তাই এখানে কোনো public write policy রাখা হয়নি — ডিফল্টে ব্লকড থাকবে।
