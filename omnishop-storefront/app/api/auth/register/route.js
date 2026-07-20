import { NextResponse } from "next/server";
import { authAdminCreateUser } from "../../../../lib/db";

export const dynamic = "force-dynamic";
const MOBILE_REGEX = /^01[3-9]\d{8}$/;

export async function POST(req) {
  try {
    const { name, mobile, password } = await req.json();
    if (!name || name.trim().length < 2)
      return NextResponse.json({ ok: false, error: "সঠিক নাম লিখুন" });
    if (!MOBILE_REGEX.test(mobile || ""))
      return NextResponse.json({ ok: false, error: "সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)" });
    if (!password || password.length < 6)
      return NextResponse.json({ ok: false, error: "পাসওয়ার্ড কমপক্ষে ৬ ক্যারেক্টার হতে হবে" });

    // Phone-as-identity: a synthetic email keeps Supabase Auth happy while the
    // customer only ever sees their mobile number.
    const email = `${mobile}@omnishop.bd`;
    const result = await authAdminCreateUser({
      email,
      password,
      user_metadata: { name: name.trim(), mobile },
    });
    if (!result.ok) {
      const msg = JSON.stringify(result.data || {});
      if (result.status === 422 || /already|exists|registered/i.test(msg))
        return NextResponse.json({ ok: false, error: "এই মোবাইল নম্বর দিয়ে ইতিমধ্যে অ্যাকাউন্ট আছে" });
      return NextResponse.json({ ok: false, error: "রেজিস্ট্রেশন ব্যর্থ — একটু পরে আবার চেষ্টা করুন" });
    }
    const u = result.data;
    return NextResponse.json({ ok: true, data: { id: u.id, name: name.trim(), mobile } });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "সার্ভার সমস্যা — আবার চেষ্টা করুন" }, { status: 500 });
  }
}
