// app/(dashboard)/dashboard/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("wallet_balance, full_name")
    .eq("id", user.id)
    .single();

  const { data: commissions } = await supabase
    .from("commissions")
    .select("id, amount, status, created_at")
    .eq("reseller_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const totalEarned = (commissions ?? [])
    .filter((c) => c.status === "earned")
    .reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <main className="max-w-md mx-auto pb-20 bg-white min-h-screen px-4 pt-6">
      <h1 className="text-lg font-bold">
        হ্যালো, {profile?.full_name ?? "রিসেলার"}
      </h1>

      <div className="mt-4 rounded-[var(--radius)] bg-[var(--cta)] text-white p-5">
        <p className="text-xs opacity-70">মোট আয়যোগ্য কমিশন</p>
        <p className="text-2xl font-bold mt-1">
          ৳{totalEarned.toLocaleString("bn-BD")}
        </p>
        <Link
          href="/withdraw"
          className="inline-block mt-3 bg-white text-[var(--cta)] text-xs font-medium px-4 py-2 rounded-lg"
        >
          উত্তোলনের অনুরোধ করুন
        </Link>
      </div>

      <h2 className="font-semibold text-sm mt-6 mb-2">সাম্প্রতিক কমিশন</h2>
      <div className="space-y-2">
        {(commissions ?? []).map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between border border-[var(--border)] rounded-lg px-3 py-2.5"
          >
            <div>
              <p className="text-sm">অর্ডার কমিশন</p>
              <p className="text-[11px] text-[var(--text-muted)]">
                {new Date(c.created_at).toLocaleDateString("bn-BD")}
              </p>
            </div>
            <div className="text-right">
              <p className="price text-sm">৳{Number(c.amount).toLocaleString("bn-BD")}</p>
              <p className="text-[10px] text-[var(--text-muted)]">
                {c.status === "earned" ? "উত্তোলনযোগ্য" : "উত্তোলিত"}
              </p>
            </div>
          </div>
        ))}
        {(!commissions || commissions.length === 0) && (
          <p className="text-sm text-[var(--text-muted)] text-center py-8">
            এখনো কোনো কমিশন নেই
          </p>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
