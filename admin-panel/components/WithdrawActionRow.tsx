// components/WithdrawActionRow.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function WithdrawActionRow({ withdrawId }: { withdrawId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const act = async (action: "paid" | "rejected") => {
    setLoading(true);
    await fetch("/api/withdraws/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ withdrawId, status: action }),
    });
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => act("paid")}
        disabled={loading}
        className="bg-[var(--accent)] text-white text-xs font-medium px-3 py-1.5 rounded-lg disabled:opacity-50"
      >
        পরিশোধিত মার্ক করুন
      </button>
      <button
        onClick={() => act("rejected")}
        disabled={loading}
        className="border border-red-300 text-red-600 text-xs font-medium px-3 py-1.5 rounded-lg disabled:opacity-50"
      >
        বাতিল
      </button>
    </div>
  );
}
