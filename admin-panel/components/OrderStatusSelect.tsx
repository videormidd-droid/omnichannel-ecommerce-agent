// components/OrderStatusSelect.tsx
"use client";

import { useState } from "react";

const statuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

export default function OrderStatusSelect({ orderId, current }: { orderId: number; current: string }) {
  const [status, setStatus] = useState(current);
  const [saving, setSaving] = useState(false);

  const update = async (newStatus: string) => {
    setStatus(newStatus);
    setSaving(true);
    await fetch("/api/orders/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status: newStatus }),
    });
    setSaving(false);
  };

  return (
    <select
      value={status}
      onChange={(e) => update(e.target.value)}
      disabled={saving}
      className="text-xs border border-[var(--border)] rounded-lg px-2 py-1.5"
    >
      {statuses.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
}
