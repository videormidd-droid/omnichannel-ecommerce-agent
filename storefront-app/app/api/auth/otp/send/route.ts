// app/api/auth/otp/send/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// TODO: আপনার SMS provider (BulkSMSBD / Alpha SMS ইত্যাদি) দিয়ে বদলে দিন
async function sendSms(phone: string, message: string) {
  const res = await fetch(process.env.SMS_API_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: process.env.SMS_API_KEY,
      number: phone,
      message,
    }),
  });
  if (!res.ok) throw new Error("SMS পাঠানো ব্যর্থ হয়েছে");
}

export async function POST(req: Request) {
  const { phone } = await req.json();

  if (!phone || phone.length < 11) {
    return NextResponse.json({ error: "সঠিক ফোন নম্বর দিন" }, { status: 400 });
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // ৫ মিনিট

  const supabase = createAdminClient();
  const { error } = await supabase.from("otp_verifications").insert({
    phone,
    otp_code: otp,
    expires_at: expiresAt,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  try {
    await sendSms(phone, `আপনার যাচাইকরণ কোড: ${otp} (৫ মিনিটের মধ্যে ব্যবহার করুন)`);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
