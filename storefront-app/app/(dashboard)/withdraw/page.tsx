// app/(dashboard)/withdraw/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const methods = ["bKash", "Nagad", "Rocket"];

export default function WithdrawPage() {
  const router = useRouter();
  const [method, setMethod] = useState("bKash");
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!account || !amount) {
      setError("সব ঘর পূরণ করুন");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/withdraw/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, account, amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "অনুরোধ ব্যর্থ হয়েছে");
      setDone(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <main className="max-w-md mx-auto min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-lg font-semibold">উত্তোলনের অনুরোধ পাঠানো হয়েছে</h1>
        <p className="text-sm text-[var(--text-muted)] mt-2">
          Admin অনুমোদন করলে {method}-এ টাকা পাঠানো হবে।
        </p>
        <button onClick={() => router.push("/dashboard")} className="btn-cta mt-6 px-6 py-2.5 text-sm font-medium">
          ড্যাশবোর্ডে ফিরুন
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto bg-white min-h-screen px-4 pt-6">
      <div className="flex items-center gap-3 mb-5">
        <Link href="/dashboard" className="w-9 h-9 rounded-full bg-[var(--surface)] flex items-center justify-center">
          <ArrowLeft size={16} />
        </Link>
        <h1 className="text-lg font-bold">উত্তোলনের অনুরোধ</h1>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium mb-2">পদ্ধতি বেছে নিন</p>
          <div className="flex gap-2">
            {methods.map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={`flex-1 py-2 rounded-lg text-sm border ${
                  method === m
                    ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                    : "border-[var(--border)]"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <input
          placeholder={`${method} নম্বর`}
          value={account}
          onChange={(e) => setAccount(e.target.value)}
          className="w-full border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm"
        />
        <input
          type="number"
          placeholder="উত্তোলনের পরিমাণ"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm"
        />

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          onClick={submit}
          disabled={loading}
          className="btn-cta w-full py-3 text-sm font-medium mt-2 disabled:opacity-50"
        >
          {loading ? "পাঠানো হচ্ছে..." : "অনুরোধ পাঠান"}
        </button>
      </div>
    </main>
  );
}
