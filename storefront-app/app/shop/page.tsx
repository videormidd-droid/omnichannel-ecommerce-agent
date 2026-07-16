// app/shop/page.tsx
import { Search, SlidersHorizontal } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/ProductCard";
import BottomNav from "@/components/BottomNav";

const tabs = ["All", "Man", "Woman", "Girls"];

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, price, image")
    .eq("active", true);

  return (
    <main className="max-w-md mx-auto pb-20 bg-white min-h-screen">
      <div className="flex items-center gap-2 px-4 pt-4">
        <div className="flex-1 flex items-center gap-2 bg-[var(--surface)] rounded-full px-3 py-2.5">
          <Search size={16} className="text-[var(--text-muted)]" />
          <input
            placeholder="প্রোডাক্ট খুঁজুন..."
            className="bg-transparent text-sm outline-none flex-1 placeholder:text-[var(--text-muted)]"
          />
        </div>
        <button className="w-9 h-9 rounded-full bg-[var(--surface)] flex items-center justify-center">
          <SlidersHorizontal size={16} />
        </button>
      </div>

      <div className="flex items-center justify-between px-4 mt-4">
        <h2 className="font-bold text-base">Categories</h2>
        <span className="text-xs text-[var(--accent)] font-medium">See All</span>
      </div>
      <div className="flex gap-2 px-4 mt-2 overflow-x-auto">
        {tabs.map((t) => (
          <span
            key={t}
            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
              t === (category ?? "All")
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--surface)] text-[var(--text)]"
            }`}
          >
            {t}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between px-4 mt-4">
        <h2 className="font-bold text-base">Popular Product</h2>
        <span className="text-xs text-[var(--accent)] font-medium">See All</span>
      </div>

      <div className="grid grid-cols-2 gap-3 px-4 mt-3">
        {(products ?? []).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
        {(!products || products.length === 0) && (
          <p className="col-span-2 text-sm text-[var(--text-muted)] py-8 text-center">
            এই ক্যাটাগরিতে কোনো প্রোডাক্ট নেই
          </p>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
