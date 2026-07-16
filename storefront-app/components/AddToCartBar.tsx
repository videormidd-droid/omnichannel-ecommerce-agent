// components/AddToCartBar.tsx
"use client";

import { useRouter } from "next/navigation";
import { Plus, ShoppingBag } from "lucide-react";

export default function AddToCartBar({
  productId,
  price,
}: {
  productId: number;
  price: number;
}) {
  const router = useRouter();

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-[var(--border)] px-4 py-3 flex items-center gap-3">
      <button
        className="flex items-center gap-2 border border-[var(--accent)] text-[var(--accent)] rounded-lg px-4 py-3 text-sm font-medium"
      >
        <Plus size={15} />
        Add To Cart
      </button>

      <button
        onClick={() => router.push(`/checkout?product=${productId}&qty=1`)}
        className="btn-cta flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold"
      >
        <ShoppingBag size={15} />
        Buy Now
      </button>
    </div>
  );
}
