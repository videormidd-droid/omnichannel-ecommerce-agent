// app/page.tsx
import { Search, ShoppingBag, Bell } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/ProductCard";
import BottomNav from "@/components/BottomNav";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "শুভ সকাল!";
  if (hour < 17) return "শুভ দুপুর!";
  return "শুভ সন্ধ্যা!";
}

export default async function HomePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  let firstName = "অতিথি";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles").select("full_name").eq("id", user.id).single();
    firstName = profile?.full_name?.split(" ")[0] ?? "ব্যবহারকারী";
  }

  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, price, compare_at_price, image")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(8);

  return (
    <main className="max-w-md mx-auto pb-20 bg-white min-h-screen">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 pt-4">
        <div className="w-9 h-9 rounded-full bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)] font-bold text-sm">
          {firstName[0]}
        </div>
        <div>
          <p className="text-xs text-[var(--text-muted)]">হ্যালো, {firstName}</p>
          <p className="text-sm font-semibold">{greeting()}</p>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button className="w-9 h-9 rounded-full bg-[var(--surface)] flex items-center justify-center">
            <Bell size={16} />
          </button>
          <Link href="/cart" className="w-9 h-9 rounded-full bg-[var(--surface)] flex items-center justify-center">
            <ShoppingBag size={16} />
          </Link>
        </div>
      </div>

      <div className="px-4 mt-3">
        <div className="flex items-center gap-2 bg-[var(--surface)] rounded-full px-3 py-2.5">
          <Search size={16} className="text-[var(--text-muted)]" />
          <input
            placeholder="প্রোডাক্ট খুঁজুন..."
            className="bg-transparent text-sm outline-none flex-1 placeholder:text-[var(--text-muted)]"
          />
        </div>
      </div>

      <div className="px-4 mt-4">
        <h1 className="text-xl font-extrabold text-[var(--accent)]">HTShop</h1>
      </div>

      <div className="flex items-center justify-between px-4 mt-3">
        <h2 className="font-bold text-base">Categories</h2>
        <Link href="/shop" className="text-xs text-[var(--accent)] font-medium">See All</Link>
      </div>
      <div className="flex gap-2 px-4 mt-2 overflow-x-auto">
        {["All", "Man", "Woman", "Girls"].map((t, i) => (
          <span key={t}
            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
              i === 0 ? "bg-[var(--accent)] text-white" : "bg-[var(--surface)] text-[var(--text)]"
            }`}>
            {t}
          </span>
        ))}
      </div>

      <div className="mx-4 mt-4 rounded-[var(--radius)] bg-gradient-to-br from-[var(--accent)] to-[#ff9248] p-5 text-white text-center">
        <p className="text-xs font-medium opacity-90">BIGGEST SALE OF THE YEAR</p>
        <h1 className="text-3xl font-extrabold mt-1">৪০% ছাড়</h1>
        <p className="text-xs mt-1 opacity-90">আপনার পছন্দের সব প্রোডাক্টে বিশেষ অফার</p>
        <Link href="/shop" className="inline-block mt-3 bg-white text-[var(--accent)] text-xs font-semibold px-5 py-2 rounded-full">
          এখনই দেখুন
        </Link>
      </div>

      <div className="flex items-center justify-between px-4 mt-5">
        <h2 className="font-bold text-base">Popular Product</h2>
        <Link href="/shop" className="text-xs text-[var(--accent)] font-medium">See All</Link>
      </div>

      <div className="grid grid-cols-2 gap-3 px-4 mt-3">
        {(products ?? []).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
        {(!products || products.length === 0) && (
          <p className="col-span-2 text-sm text-[var(--text-muted)] py-8 text-center">
            এখনো কোনো প্রোডাক্ট যোগ করা হয়নি
          </p>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
