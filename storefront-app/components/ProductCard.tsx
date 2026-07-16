// components/ProductCard.tsx
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Heart } from "lucide-react";

type Product = {
  id: number;
  name: string;
  slug: string;
  price: number;
  compare_at_price?: number | null;
  image: string;
};

function discountPercent(price: number, oldPrice?: number | null) {
  if (!oldPrice || oldPrice <= price) return null;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

export default function ProductCard({ product }: { product: Product }) {
  const discount = discountPercent(product.price, product.compare_at_price);

  return (
    <Link
      href={`/product/${product.slug}`}
      className="block bg-white border border-[var(--border)] rounded-[var(--radius)] overflow-hidden"
    >
      <div className="relative aspect-square bg-[var(--surface)]">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, 200px"
        />
        <button
          aria-label="পছন্দে যোগ করুন"
          onClick={(e) => e.preventDefault()}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white shadow flex items-center justify-center"
        >
          <Heart size={13} className="text-[var(--text-muted)]" />
        </button>
      </div>

      <div className="p-2.5 space-y-1">
        <h3 className="text-sm font-medium leading-snug line-clamp-2">
          {product.name}
        </h3>

        <div className="flex items-center gap-1.5">
          {product.compare_at_price && (
            <span className="price-old">
              ৳{product.compare_at_price.toLocaleString("bn-BD")}
            </span>
          )}
          {discount && <span className="discount-badge">-{discount}%</span>}
        </div>

        <div className="flex items-center justify-between">
          <p className="price text-sm">৳{product.price.toLocaleString("bn-BD")}</p>
          <button
            onClick={(e) => e.preventDefault()}
            className="w-6 h-6 rounded-full bg-[var(--accent)] flex items-center justify-center"
          >
            <ShoppingBag size={12} className="text-white" />
          </button>
        </div>
      </div>
    </Link>
  );
}
