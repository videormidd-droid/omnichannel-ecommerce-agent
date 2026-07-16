-- migration-master-forms.sql
-- আগের admin_forms-এর জায়গায় এই একীভূত master_forms টেবিল ব্যবহার হবে

CREATE TABLE IF NOT EXISTS master_forms (
  id SERIAL PRIMARY KEY,
  form_name TEXT,
  form_type TEXT,          -- 'product' | 'payment' | 'order' | 'withdraw' | custom
  title TEXT,
  description TEXT,
  fields JSONB,
  design JSONB,
  settings JSONB,
  image TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- আগের admin_forms-এ ডেটা থাকলে migrate করে নিন (থাকলে uncomment করুন):
-- INSERT INTO master_forms (form_name, form_type, title, description, fields, design, settings, image, active, created_at)
-- SELECT form_name, form_type, title, description, fields, design, settings, image, active, created_at FROM admin_forms;
-- DROP TABLE IF EXISTS admin_forms;

INSERT INTO master_forms (form_name, form_type, title, description, fields, design, settings, image) VALUES
('Product Upload','product','Add Product','Admin only',
 '[
   {"name":"name","type":"text"},
   {"name":"price","type":"number"},
   {"name":"reseller_price","type":"number"},
   {"name":"category","type":"select"},
   {"name":"image","type":"file"}
 ]',
 '{"mobile":true,"columns":1}',
 '{"auto_commission":true}',
 'product.png'
),
('Payment Form','payment','Submit Payment','Fill correctly',
 '[
   {"name":"method","type":"select","options":["bKash","Nagad","Rocket","COD"]},
   {"name":"sender_number","type":"text"},
   {"name":"trx_id","type":"text"},
   {"name":"amount","type":"number"},
   {"name":"screenshot","type":"file"}
 ]',
 '{"mobile":true,"columns":1}',
 '{"admin_approval":true}',
 'payment.png'
)
ON CONFLICT DO NOTHING;

-- Public শুধু active ফর্ম পড়তে পারবে, লেখা শুধু service_role দিয়ে (admin panel)
ALTER TABLE master_forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active forms" ON master_forms FOR SELECT USING (active = true);

-- submissions.form_id-এর reference admin_forms থেকে master_forms-এ সরানো
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_form_id_fkey;
ALTER TABLE submissions ADD CONSTRAINT submissions_form_id_fkey
  FOREIGN KEY (form_id) REFERENCES master_forms(id);
