// lib/supabase/client.ts
// Admin-এর নিজের লগইন সেশনের জন্য (email+password, role='admin' যাচাই করা হবে)
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
