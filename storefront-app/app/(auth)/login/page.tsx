// app/(auth)/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---- Google Login ----
  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  };

  // ---- Facebook Login ----
  const loginWithFacebook = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  };

  // ---- Phone OTP: Send code ----
  const sendOtp = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      if (!res.ok) throw new Error("OTP পাঠাতে ব্যর্থ হয়েছে");
      router.push(`/otp-verify?phone=${encodeURIComponent(phone)}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-16 space-y-4">
      <h1 className="text-xl font-semibold">লগইন করুন</h1>

      <button
        onClick={loginWithGoogle}
        className="w-full border rounded-md py-2"
      >
        Google দিয়ে লগইন
      </button>

      <button
        onClick={loginWithFacebook}
        className="w-full border rounded-md py-2"
      >
        Facebook দিয়ে লগইন
      </button>

      <div className="border-t pt-4 space-y-2">
        <input
          type="tel"
          placeholder="মোবাইল নম্বর (01XXXXXXXXX)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full border rounded-md px-3 py-2"
        />
        <button
          onClick={sendOtp}
          disabled={loading || phone.length < 11}
          className="w-full bg-green-600 text-white rounded-md py-2 disabled:opacity-50"
        >
          {loading ? "পাঠানো হচ্ছে..." : "OTP পাঠান"}
        </button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}
