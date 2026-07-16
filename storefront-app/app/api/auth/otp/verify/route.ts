// app/api/auth/otp/verify/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const { phone, code } = await req.json();
  const admin = createAdminClient();

  // ১. সর্বশেষ OTP এন্ট্রি যাচাই
  const { data: record, error } = await admin
    .from("otp_verifications")
    .select("*")
    .eq("phone", phone)
    .eq("otp_code", code)
    .eq("verified", false)
    .gte("expires_at", new Date().toISOString())
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !record) {
    return NextResponse.json({ error: "কোড ভুল অথবা মেয়াদোত্তীর্ণ" }, { status: 400 });
  }

  await admin
    .from("otp_verifications")
    .update({ verified: true })
    .eq("id", record.id);

  // ২. ফোন নম্বরের ভিত্তিতে ইউজার খুঁজি / তৈরি করি
  const pseudoEmail = `${phone}@phone.local`; // internal identifier, কখনো দেখানো হবে না
  let userId: string;

  const { data: existing } = await admin.auth.admin.listUsers();
  const found = existing.users.find((u) => u.phone === phone);

  if (found) {
    userId = found.id;
  } else {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      phone,
      email: pseudoEmail,
      phone_confirm: true,
      email_confirm: true,
    });
    if (createErr || !created.user) {
      return NextResponse.json({ error: "ইউজার তৈরি করা যায়নি" }, { status: 500 });
    }
    userId = created.user.id;

    // profiles টেবিলে entry
    await admin.from("profiles").insert({ id: userId, phone, role: "reseller" });
  }

  // ৩. magiclink token জেনারেট করে সরাসরি verifyOtp দিয়ে সেশন তৈরি (SMS/email না পাঠিয়েই)
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: pseudoEmail,
  });
  if (linkErr || !linkData) {
    return NextResponse.json({ error: "সেশন তৈরি করা যায়নি" }, { status: 500 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) =>
          list.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          ),
      },
    }
  );

  const { error: verifyErr } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: linkData.properties.hashed_token,
  });

  if (verifyErr) {
    return NextResponse.json({ error: verifyErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
