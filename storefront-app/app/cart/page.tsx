// app/cart/page.tsx
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { Heart } from "lucide-react";

export default function CartPage() {
  return (
    <main className="max-w-md mx-auto pb-20 bg-white min-h-screen px-4 pt-10 flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-full bg-[var(--surface)] flex items-center justify-center mb-4">
        <Heart size={24} className="text-[var(--text-muted)]" />
      </div>
      <h1 className="font-semibold text-base">আপনার পছন্দের তালিকা খালি</h1>
      <p className="text-sm text-[var(--text-muted)] mt-1">
        প্রোডাক্ট দেখে পছন্দে যোগ করুন
      </p>
      <Link href="/shop" className="btn-cta mt-5 px-6 py-2.5 text-sm font-medium">
        কেনাকাটা করুন
      </Link>
      <BottomNav />
    </main>
  );
}
