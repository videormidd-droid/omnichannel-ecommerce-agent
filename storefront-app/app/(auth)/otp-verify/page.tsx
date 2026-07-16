// app/(auth)/otp-verify/page.tsx
"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function OtpVerifyInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") || "";
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verify = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "OTP ভুল হয়েছে");
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-16 space-y-4">
      <h1 className="text-xl font-semibold">OTP যাচাই করুন</h1>
      <p className="text-sm text-gray-600">{phone} নম্বরে পাঠানো কোড দিন</p>

      <input
        type="text"
        placeholder="6 সংখ্যার কোড"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="w-full border rounded-md px-3 py-2 tracking-widest text-center"
        maxLength={6}
      />

      <button
        onClick={verify}
        disabled={loading || code.length !== 6}
        className="w-full bg-green-600 text-white rounded-md py-2 disabled:opacity-50"
      >
        {loading ? "যাচাই হচ্ছে..." : "যাচাই করুন"}
      </button>

      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}

// useSearchParams() must be inside a Suspense boundary for Next.js prerender
export default function OtpVerifyPage() {
  return (
    <Suspense fallback={null}>
      <OtpVerifyInner />
    </Suspense>
  );
}
