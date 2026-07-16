// app/admin/withdraws/page.tsx
import { createAdminClient } from "@/lib/supabase/admin";
import WithdrawActionRow from "@/components/WithdrawActionRow";

export default async function WithdrawsPage() {
  const admin = createAdminClient();
  const { data: withdraws } = await admin
    .from("withdraws")
    .select("id, reseller_id, amount, method, account_number, status, requested_at")
    .eq("status", "pending")
    .order("requested_at", { ascending: false });

  return (
    <main className="p-6">
      <h1 className="text-xl font-bold mb-5">Withdraw Requests (Finance Control)</h1>

      <div className="border border-[var(--border)] rounded-[var(--radius)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--surface)] text-left text-xs text-[var(--text-muted)]">
            <tr>
              <th className="px-4 py-2.5">পরিমাণ</th>
              <th className="px-4 py-2.5">পদ্ধতি</th>
              <th className="px-4 py-2.5">নম্বর</th>
              <th className="px-4 py-2.5">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody>
            {(withdraws ?? []).map((w) => (
              <tr key={w.id} className="border-t border-[var(--border)]">
                <td className="px-4 py-2.5 font-medium">৳{Number(w.amount).toLocaleString("bn-BD")}</td>
                <td className="px-4 py-2.5">{w.method}</td>
                <td className="px-4 py-2.5">{w.account_number}</td>
                <td className="px-4 py-2.5">
                  <WithdrawActionRow withdrawId={w.id} />
                </td>
              </tr>
            ))}
            {(!withdraws || withdraws.length === 0) && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-[var(--text-muted)]">কোনো পেন্ডিং উত্তোলন অনুরোধ নেই</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
