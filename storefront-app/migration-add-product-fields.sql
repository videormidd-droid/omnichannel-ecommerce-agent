-- migration-add-product-fields.sql
-- আগের products টেবিলে এই কলামগুলো না থাকলে যোগ করুন (Supabase SQL Editor-এ রান করুন)

ALTER TABLE products ADD COLUMN IF NOT EXISTS compare_at_price NUMERIC;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT;

-- উদাহরণ: একটা প্রোডাক্ট discount সহ যোগ করা
-- INSERT INTO products (name, slug, price, compare_at_price, description, category, image, active)
-- VALUES ('Boy Cotton Soytar', 'boy-cotton-soytar', 1224, 2040, 'গরম, আরামদায়ক নিটেড সোয়েটার', 'Man', 'https://.../image.jpg', true);
