// app/api/submissions/action/route.ts
// Approve করলে: order verified + স্টক অনুযায়ী কমিশন এন্ট্রি তৈরি (reseller থাকলে)
// Reject করলে: submission ও order rejected মার্ক হবে
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const { submissionId, orderId, resellerId, totalAmount, action } = await req.json();
  const admin = createAdminClient();

  if (action === "reject") {
    await admin.from("submissions").update({ status: "rejected" }).eq("id", submissionId);
    await admin.from("orders").update({ payment_status: "rejected", status: "cancelled" }).eq("id", orderId);
    return NextResponse.json({ success: true });
  }

  // approve
  await admin.from("submissions").update({ status: "approved" }).eq("id", submissionId);
  await admin.from("orders").update({ payment_status: "verified", status: "confirmed" }).eq("id", orderId);

  // reseller থাকলে কমিশন তৈরি (product-এর commission_rate অনুযায়ী)
  if (resellerId) {
    const { data: order } = await admin.from("orders").select("product_id").eq("id", orderId).single();
    const { data: product } = order
      ? await admin.from("products").select("commission_rate").eq("id", order.product_id).single()
      : { data: null };

    const rate = product?.commission_rate ?? 0;
    const commissionAmount = Math.round((totalAmount * rate) / 100);

    if (commissionAmount > 0) {
      await admin.from("commissions").insert({
        reseller_id: resellerId,
        order_id: orderId,
        amount: commissionAmount,
        status: "earned",
      });
    }
  }

  return NextResponse.json({ success: true });
}
