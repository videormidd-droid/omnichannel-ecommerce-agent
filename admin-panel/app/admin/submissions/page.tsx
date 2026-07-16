// app/admin/submissions/page.tsx
import { createAdminClient } from "@/lib/supabase/admin";
import SubmissionCard from "@/components/SubmissionCard";

export default async function SubmissionsPage() {
  const admin = createAdminClient();
  const { data: submissions } = await admin
    .from("submissions")
    .select("id, order_id, reseller_id, user_data, status, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  // সংশ্লিষ্ট order গুলো একসাথে নিয়ে আসা (amount/commission হিসাবের জন্য)
  const orderIds = (submissions ?? []).map((s) => s.order_id).filter(Boolean);
  const { data: orders } = orderIds.length
    ? await admin.from("orders").select("id, order_code, total_amount, product_id").in("id", orderIds)
    : { data: [] };

  return (
    <main className="p-6">
      <h1 className="text-xl font-bold mb-5">Payment Verification (Finance Control)</h1>

      <div className="space-y-3">
        {(submissions ?? []).map((s) => {
          const order = (orders ?? []).find((o) => o.id === s.order_id);
          return (
            <SubmissionCard
              key={s.id}
              submission={s}
              order={order}
            />
          );
        })}
        {(!submissions || submissions.length === 0) && (
          <p className="text-sm text-[var(--text-muted)] py-10 text-center">
            যাচাই করার মতো কোনো পেন্ডিং পেমেন্ট নেই
          </p>
        )}
      </div>
    </main>
  );
}
