// lib/supabase/admin.ts
// Admin Panel অ্যাপের জন্য — service_role key দিয়ে সব টেবিল অ্যাক্সেস (RLS bypass)
// ⚠️ শুধু server-side কোডে ব্যবহার করুন, কখনো client component-এ import নয়
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
