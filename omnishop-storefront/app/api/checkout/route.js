import { NextResponse } from "next/server";
import { dbInsert } from "../../../lib/db";
import { getMergedProducts, getCollection, getDeliveryZones } from "../../../lib/store";

export const dynamic = "force-dynamic";
const MOBILE_REGEX = /^01[3-9]\d{8}$/;

export async function POST(req) {
  try {
    const body = await req.json();
    const { cart, form, area, payment, coupon } = body || {};
    if (!Array.isArray(cart) || cart.length === 0)
      return NextResponse.json({ ok: false, error: "কার্ট খালি" });
    if (!form?.name || !MOBILE_REGEX.test(form?.phone || "") || !form?.address)
      return NextResponse.json({ ok: false, error: "নাম, সঠিক মোবাইল ও ঠিকানা পূরণ করুন" });

    // Server-side price authority: never trust client prices.
    const products = await getMergedProducts({ includeInactive: true });
    const byId = Object.fromEntries(products.map((p) => [String(p.id), p]));
    let subtotal = 0;
    const items = [];
    for (const item of cart) {
      const p = byId[String(item.id)];
      if (!p) return NextResponse.json({ ok: false, error: "একটি পণ্য আর পাওয়া যাচ্ছে না — কার্ট রিফ্রেশ করুন" });
      const qty = Math.max(1, Math.min(99, Number(item.qty) || 1));
      subtotal += p.discount * qty;
      items.push({ product_id: p.id, quantity: qty, price: p.discount });
    }

    const zones = await getDeliveryZones();
    let deliveryFee = area === "inside" ? zones.inside.fee : zones.outside.fee;

    let couponDiscount = 0;
    let couponCode = "";
    if (coupon && coupon.trim()) {
      const coupons = await getCollection("coupons");
      const c = coupons.find(
        (x) => x.enabled !== false && String(x.code).toUpperCase() === coupon.trim().toUpperCase()
      );
      if (c) {
        couponCode = c.code;
        couponDiscount =
          c.type === "percentage" ? Math.round((subtotal * Number(c.value)) / 100) : Math.min(subtotal, Number(c.value));
      }
    }

    const total = subtotal - couponDiscount + deliveryFee;
    const paymentLabel = payment === "bank" ? "Bank Transfer" : payment === "cod" ? "Cash on Delivery" : String(payment || "COD");

    const fullAddress = [form.address, form.thana, form.district, form.city].filter(Boolean).join(", ");
    const orderRows = await dbInsert("orders", [{
      customer_name: form.name,
      phone: form.phone,
      address: fullAddress + (couponCode ? ` [কুপন: ${couponCode} -৳${couponDiscount}]` : ""),
      division: form.city || "",
      district: form.district || "",
      thana: form.thana || "",
      payment_method: paymentLabel,
      transaction_id: body.trxId || "",
      delivery_charge: deliveryFee,
      total,
      order_status: "pending",
    }]);
    const order = orderRows[0];

    try {
      await dbInsert("order_items", items.map((it) => ({ ...it, order_id: order.id })), false);
    } catch (e) {
      // order exists even if item rows fail; log server-side only
      console.error("order_items insert failed", e);
    }

    return NextResponse.json({ ok: true, data: { orderId: order.id, total, deliveryFee, couponDiscount } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "অর্ডার তৈরি ব্যর্থ — আবার চেষ্টা করুন" }, { status: 500 });
  }
}
