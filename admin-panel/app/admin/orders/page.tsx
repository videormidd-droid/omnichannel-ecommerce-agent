// app/admin/orders/page.tsx
import { createAdminClient } from "@/lib/supabase/admin";
import OrderStatusSelect from "@/components/OrderStatusSelect";

export default async function OrdersPage() {
  const admin = createAdminClient();
  const { data: orders } = await admin
    .from("orders")
    .select("id, order_code, customer_name, customer_phone, total_amount, payment_status, status, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <main className="p-6">
      <h1 className="text-xl font-bold mb-5">Orders</h1>

      <div className="border border-[var(--border)] rounded-[var(--radius)] overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[var(--surface)] text-left text-xs text-[var(--text-muted)]">
            <tr>
              <th className="px-4 py-2.5">অর্ডার আইডি</th>
              <th className="px-4 py-2.5">কাস্টমার</th>
              <th className="px-4 py-2.5">মূল্য</th>
              <th className="px-4 py-2.5">পেমেন্ট</th>
              <th className="px-4 py-2.5">স্ট্যাটাস</th>
            </tr>
          </thead>
          <tbody>
            {(orders ?? []).map((o) => (
              <tr key={o.id} className="border-t border-[var(--border)]">
                <td className="px-4 py-2.5 font-medium">{o.order_code ?? o.id}</td>
                <td className="px-4 py-2.5">
                  {o.customer_name}
                  <p className="text-xs text-[var(--text-muted)]">{o.customer_phone}</p>
                </td>
                <td className="px-4 py-2.5">৳{Number(o.total_amount).toLocaleString("bn-BD")}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    o.payment_status === "verified" ? "badge-approved" : "badge-pending"
                  }`}>
                    {o.payment_status}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <OrderStatusSelect orderId={o.id} current={o.status} />
                </td>
              </tr>
            ))}
            {(!orders || orders.length === 0) && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--text-muted)]">কোনো অর্ডার নেই</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
