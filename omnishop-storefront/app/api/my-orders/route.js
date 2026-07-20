import { NextResponse } from "next/server";
import { dbSelect } from "../../../lib/db";

export const dynamic = "force-dynamic";
const MOBILE_REGEX = /^01[3-9]\d{8}$/;

export async function POST(req) {
  try {
    const { mobile } = await req.json();
    if (!MOBILE_REGEX.test(mobile || ""))
      return NextResponse.json({ ok: false, error: "সঠিক মোবাইল নম্বর দিন" });
    const orders = await dbSelect(
      "orders",
      `select=id,total,order_status,payment_method,delivery_charge,created_at&phone=eq.${encodeURIComponent(mobile)}&order=created_at.desc&limit=30`
    );
    return NextResponse.json({ ok: true, data: orders });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "লোড করা যায়নি" }, { status: 500 });
  }
}
