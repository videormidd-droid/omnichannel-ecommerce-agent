// app/admin/products/page.tsx
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function ProductsPage() {
  const admin = createAdminClient();
  const { data: products } = await admin
    .from("products")
    .select("id, name, price, stock, active, image")
    .order("id", { ascending: false });

  return (
    <main className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold">Products</h1>
        <Link href="/admin/products/new" className="btn-cta flex items-center gap-2 px-4 py-2 text-sm font-medium">
          <Plus size={15} /> নতুন প্রোডাক্ট
        </Link>
      </div>

      <div className="border border-[var(--border)] rounded-[var(--radius)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--surface)] text-left text-xs text-[var(--text-muted)]">
            <tr>
              <th className="px-4 py-2.5">প্রোডাক্ট</th>
              <th className="px-4 py-2.5">দাম</th>
              <th className="px-4 py-2.5">স্টক</th>
              <th className="px-4 py-2.5">স্ট্যাটাস</th>
            </tr>
          </thead>
          <tbody>
            {(products ?? []).map((p) => (
              <tr key={p.id} className="border-t border-[var(--border)]">
                <td className="px-4 py-2.5">{p.name}</td>
                <td className="px-4 py-2.5">৳{Number(p.price).toLocaleString("bn-BD")}</td>
                <td className="px-4 py-2.5">
                  <span className={p.stock < 5 ? "text-orange-600 font-medium" : ""}>{p.stock}</span>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-2 py-1 rounded-full ${p.active ? "badge-approved" : "badge-rejected"}`}>
                    {p.active ? "সক্রিয়" : "নিষ্ক্রিয়"}
                  </span>
                </td>
              </tr>
            ))}
            {(!products || products.length === 0) && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-[var(--text-muted)]">কোনো প্রোডাক্ট নেই</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
