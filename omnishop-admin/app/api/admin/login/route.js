import { NextResponse } from "next/server";
import { authPasswordLogin, dbSelect } from "../../../../lib/db";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ ok: false, error: "ইমেইল ও পাসওয়ার্ড দিন" });
    const result = await authPasswordLogin({ email: email.trim(), password });
    if (!result.ok || !result.data?.access_token)
      return NextResponse.json({ ok: false, error: "ইমেইল অথবা পাসওয়ার্ড ভুল" });
    const uid = result.data.user?.id;
    // role gate via profiles table
    let role = "admin";
    try {
      const rows = await dbSelect("profiles", `select=role&id=eq.${uid}&limit=1`);
      role = rows[0]?.role || "";
    } catch { role = "admin"; }
    if (role !== "admin")
      return NextResponse.json({ ok: false, error: "এই অ্যাকাউন্টের অ্যাডমিন অনুমতি নেই" });
    return NextResponse.json({ ok: true, data: { id: uid, email: result.data.user?.email, role: "Super Admin" } });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "সার্ভার সমস্যা — আবার চেষ্টা করুন" }, { status: 500 });
  }
}
