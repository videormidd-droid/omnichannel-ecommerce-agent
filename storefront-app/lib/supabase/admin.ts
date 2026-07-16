// lib/supabase/admin.ts
// ⚠️ এই ফাইল শুধু server-side (API routes) থেকে import করা যাবে।
// service_role key কখনো client component/browser-এ পাঠানো যাবে না।
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
