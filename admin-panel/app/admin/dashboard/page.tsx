// app/admin/dashboard/page.tsx
import { createAdminClient } from "@/lib/supabase/admin";
import { ShoppingCart, Receipt, Wallet, AlertTriangle } from "lucide-react";

export default async function DashboardPage() {
  const admin = createAdminClient();

  const [{ data: orders }, { data: pendingSubs }, { data: pendingWithdraws }, { data: lowStock }] =
    await Promise.all([
      admin.from("orders").select("total_amount, status, created_at"),
      admin.from("submissions").select("id").eq("status", "pending"),
      admin.from("withdraws").select("amount").eq("status", "pending"),
      admin.from("products").select("id, name, stock").lt("stock", 5).eq("active", true),
    ]);

  const totalSales = (orders ?? [])
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + Number(o.total_amount ?? 0), 0);

  const todayOrders = (orders ?? []).filter(
    (o) => new Date(o.created_at).toDateString() === new Date().toDateString()
  ).length;

  const pendingWithdrawTotal = (pendingWithdraws ?? []).reduce((s, w) => s + Number(w.amount), 0);

  const cards = [
    { label: "মোট বিক্রি", value: `৳${totalSales.toLocaleString("bn-BD")}`, icon: ShoppingCart },
    { label: "আজকের অর্ডার", value: todayOrders, icon: ShoppingCart },
    { label: "পেন্ডিং পেমেন্ট", value: (pendingSubs ?? []).length, icon: Receipt },
    { label: "পেন্ডিং উত্তোলন", value: `৳${pendingWithdrawTotal.toLocaleString("bn-BD")}`, icon: Wallet },
  ];

  return (
    <main className="p-6">
      <h1 className="text-xl font-bold mb-5">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="border border-[var(--border)] rounded-[var(--radius)] p-4">
            <Icon size={18} className="text-[var(--accent)] mb-2" />
            <p className="text-xs text-[var(--text-muted)]">{label}</p>
            <p className="text-lg font-bold mt-1">{value}</p>
          </div>
        ))}
      </div>

      {(lowStock ?? []).length > 0 && (
        <div className="mt-6 border border-orange-200 bg-orange-50 rounded-[var(--radius)] p-4">
          <div className="flex items-center gap-2 text-orange-700 font-medium text-sm mb-2">
            <AlertTriangle size={16} />
            লো স্টক এলার্ট
          </div>
          <ul className="text-sm space-y-1">
            {(lowStock ?? []).map((p) => (
              <li key={p.id} className="flex justify-between">
                <span>{p.name}</span>
                <span className="text-orange-700 font-medium">{p.stock} বাকি</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
