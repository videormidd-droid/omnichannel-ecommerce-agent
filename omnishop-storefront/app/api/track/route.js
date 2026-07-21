import { NextResponse } from "next/server";
import { dbSelect } from "../../../lib/db";

export const dynamic = "force-dynamic";
const MOBILE_REGEX = /^01[3-9]\d{8}$/;

export async function POST(req) {
  try {
    const { mobile, orderId } = await req.json();
    if (!MOBILE_REGEX.test(mobile || ""))
      return NextResponse.json({ ok: false, error: "সঠিক মোবাইল নম্বর দিন" });
    if (!orderId)
      return NextResponse.json({ ok: false, error: "অর্ডার আইডি দিন" });
    const rows = await dbSelect(
      "orders",
      `select=id,total,order_status,payment_method,delivery_charge,created_at&id=eq.${encodeURIComponent(orderId)}&phone=eq.${encodeURIComponent(mobile)}&limit=1`
    );
    if (!rows.length)
      return NextResponse.json({ ok: false, error: "এই নম্বর ও আইডিতে কোনো অর্ডার পাওয়া যায়নি" });
    return NextResponse.json({ ok: true, data: rows[0] });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "সার্ভার সমস্যা — আবার চেষ্টা করুন" }, { status: 500 });
  }
}
