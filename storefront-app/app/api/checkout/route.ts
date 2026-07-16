// app/api/checkout/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const {
    productId, qty, customerName, customerPhone,
    division, district, thana, addressDetails, zone,
    couponCode, payment,
  } = await req.json();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createAdminClient();

  // ১. প্রোডাক্ট
  const { data: product, error: productErr } = await admin
    .from("products").select("price, stock").eq("id", productId).single();
  if (productErr || !product) {
    return NextResponse.json({ error: "প্রোডাক্ট পাওয়া যায়নি" }, { status: 400 });
  }
  if (product.stock !== null && product.stock < qty) {
    return NextResponse.json({ error: "পর্যাপ্ত স্টক নেই" }, { status: 400 });
  }

  const subtotal = product.price * qty;

  // ২. ডেলিভারি চার্জ (zone অনুযায়ী)
  const { data: zoneData } = await admin
    .from("delivery_zones").select("charge").eq("zone_name", zone).eq("active", true).single();
  const deliveryCharge = zoneData?.charge ?? 0;

  // ৩. কুপন
  let discountAmount = 0;
  if (couponCode) {
    const { data: coupon } = await admin
      .from("coupons").select("*").eq("code", couponCode).eq("active", true).single();
    if (coupon && subtotal >= (coupon.min_order_amount ?? 0)) {
      discountAmount = coupon.discount_type === "percent"
        ? Math.round((subtotal * coupon.discount_value) / 100)
        : coupon.discount_value;
    }
  }

  const totalAmount = subtotal + deliveryCharge - discountAmount;

  // ৪. অর্ডার তৈরি (order_code trigger দিয়ে অটো জেনারেট হবে)
  const { data: order, error: orderErr } = await admin
    .from("orders")
    .insert({
      reseller_id: user?.id ?? null,
      customer_name: customerName,
      customer_phone: customerPhone,
      product_id: productId,
      quantity: qty,
      division, district, thana,
      address_details: addressDetails,
      subtotal,
      delivery_charge: deliveryCharge,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      payment_status: payment.method === "Cash on Delivery" ? "cod" : "pending",
      status: "pending",
    })
    .select()
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: "অর্ডার তৈরি ব্যর্থ হয়েছে" }, { status: 500 });
  }

  // ৫. স্টক কমানো
  await admin.from("products").update({ stock: (product.stock ?? 0) - qty }).eq("id", productId);

  // ৬. ম্যানুয়াল পেমেন্ট হলে submission এন্ট্রি
  if (payment.method !== "Cash on Delivery") {
    await admin.from("submissions").insert({
      order_id: order.id,
      reseller_id: user?.id ?? null,
      user_data: payment,
      status: "pending",
    });
  }

  return NextResponse.json({ success: true, orderCode: order.order_code, orderId: order.id });
}
