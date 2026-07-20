import { NextResponse } from "next/server";
import { authPasswordLogin } from "../../../../lib/db";

export const dynamic = "force-dynamic";
const MOBILE_REGEX = /^01[3-9]\d{8}$/;

export async function POST(req) {
  try {
    const { mobile, password } = await req.json();
    if (!MOBILE_REGEX.test(mobile || ""))
      return NextResponse.json({ ok: false, error: "সঠিক মোবাইল নম্বর দিন" });
    const result = await authPasswordLogin({ email: `${mobile}@omnishop.bd`, password });
    if (!result.ok || !result.data?.access_token)
      return NextResponse.json({ ok: false, error: "মোবাইল নম্বর অথবা পাসওয়ার্ড ভুল" });
    const u = result.data.user || {};
    const meta = u.user_metadata || {};
    return NextResponse.json({
      ok: true,
      data: { id: u.id, name: meta.name || "গ্রাহক", mobile: meta.mobile || mobile },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "সার্ভার সমস্যা — আবার চেষ্টা করুন" }, { status: 500 });
  }
}
