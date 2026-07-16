// app/api/withdraw/request/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const { method, account, amount } = await req.json();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "লগইন প্রয়োজন" }, { status: 401 });
  }

  const admin = createAdminClient();

  // reseller-এর মোট earned commission যাচাই (উত্তোলনযোগ্য ব্যালেন্স চেক)
  const { data: commissions } = await admin
    .from("commissions")
    .select("amount, status")
    .eq("reseller_id", user.id)
    .eq("status", "earned");

  const available = (commissions ?? []).reduce((s, c) => s + Number(c.amount), 0);

  if (Number(amount) > available) {
    return NextResponse.json({ error: "উত্তোলনযোগ্য ব্যালেন্সের বেশি চাওয়া হয়েছে" }, { status: 400 });
  }

  const { error } = await admin.from("withdraws").insert({
    reseller_id: user.id,
    amount,
    method,
    account_number: account,
    status: "pending",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
