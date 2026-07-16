// app/(auth)/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const login = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("লগইন ব্যর্থ হয়েছে");
      return;
    }
    router.push("/admin/products");
  };

  return (
    <div className="max-w-sm mx-auto mt-24 space-y-4">
      <h1 className="text-xl font-semibold">Admin Panel লগইন</h1>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full border rounded-md px-3 py-2"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full border rounded-md px-3 py-2"
      />
      <button
        onClick={login}
        disabled={loading}
        className="w-full bg-black text-white rounded-md py-2 disabled:opacity-50"
      >
        {loading ? "..." : "লগইন করুন"}
      </button>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}
