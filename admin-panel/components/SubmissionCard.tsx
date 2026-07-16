// components/SubmissionCard.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SubmissionCard({ submission, order }: { submission: any; order: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const payment = submission.user_data ?? {};

  const act = async (action: "approve" | "reject") => {
    setLoading(true);
    await fetch("/api/submissions/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        submissionId: submission.id,
        orderId: submission.order_id,
        resellerId: submission.reseller_id,
        totalAmount: order?.total_amount ?? 0,
        action,
      }),
    });
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="border border-[var(--border)] rounded-[var(--radius)] p-4 flex gap-4">
      {payment.screenshot && (
        <img src={payment.screenshot} alt="proof" className="w-20 h-20 object-cover rounded-lg border border-[var(--border)]" />
      )}
      <div className="flex-1 text-sm space-y-0.5">
        <p className="font-medium">অর্ডার: {order?.order_code ?? submission.order_id}</p>
        <p className="text-[var(--text-muted)]">পদ্ধতি: {payment.method}</p>
        <p className="text-[var(--text-muted)]">নম্বর: {payment.number}</p>
        <p className="text-[var(--text-muted)]">Trx ID: {payment.trx_id}</p>
        <p className="font-medium">মোট: ৳{Number(order?.total_amount ?? 0).toLocaleString("bn-BD")}</p>
      </div>
      <div className="flex flex-col gap-2 shrink-0">
        <button
          onClick={() => act("approve")}
          disabled={loading}
          className="bg-[var(--accent)] text-white text-xs font-medium px-4 py-2 rounded-lg disabled:opacity-50"
        >
          Approve
        </button>
        <button
          onClick={() => act("reject")}
          disabled={loading}
          className="border border-red-300 text-red-600 text-xs font-medium px-4 py-2 rounded-lg disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
