// app/api/withdraws/action/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const { withdrawId, status } = await req.json();
  const admin = createAdminClient();

  const { data: withdraw, error: fetchErr } = await admin
    .from("withdraws")
    .select("reseller_id, amount")
    .eq("id", withdrawId)
    .single();

  if (fetchErr || !withdraw) {
    return NextResponse.json({ error: "উত্তোলন অনুরোধ পাওয়া যায়নি" }, { status: 400 });
  }

  await admin
    .from("withdraws")
    .update({ status, processed_at: new Date().toISOString() })
    .eq("id", withdrawId);

  if (status === "paid") {
    // reseller-এর earned commission থেকে withdraw amount-এর সমপরিমাণ withdrawn মার্ক করা
    // (সহজ approach: সবচেয়ে পুরোনো earned commission গুলো ধারাবাহিকভাবে withdrawn করা, amount শেষ না হওয়া পর্যন্ত)
    const { data: earned } = await admin
      .from("commissions")
      .select("id, amount")
      .eq("reseller_id", withdraw.reseller_id)
      .eq("status", "earned")
      .order("created_at", { ascending: true });

    let remaining = Number(withdraw.amount);
    for (const c of earned ?? []) {
      if (remaining <= 0) break;
      await admin.from("commissions").update({ status: "withdrawn" }).eq("id", c.id);
      remaining -= Number(c.amount);
    }
  }

  return NextResponse.json({ success: true });
}
