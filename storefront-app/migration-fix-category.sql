-- migration-fix-category.sql
-- products টেবিলে category (text) কলাম নিশ্চিত করা — কোডে এই নামেই ব্যবহার হয়েছে
ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT;

-- Storage bucket তৈরি (প্রোডাক্ট ছবি, পেমেন্ট স্ক্রিনশট রাখার জন্য)
-- এটা SQL Editor দিয়ে হয় না — নিচের ধাপ ৪-এ ড্যাশবোর্ড থেকে করতে হবে
