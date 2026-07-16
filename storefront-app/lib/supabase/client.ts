// lib/supabase/client.ts
// ব্রাউজার/ক্লায়েন্ট সাইডে ব্যবহারের জন্য (anon key, RLS দ্বারা নিয়ন্ত্রিত)
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
