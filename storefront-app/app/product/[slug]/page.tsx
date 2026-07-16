// app/product/[slug]/page.tsx
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Heart, Share2 } from "lucide-react";
import AddToCartBar from "@/components/AddToCartBar";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!product) notFound();

  const discount =
    product.compare_at_price && product.compare_at_price > product.price
      ? Math.round(
          ((product.compare_at_price - product.price) / product.compare_at_price) * 100
        )
      : null;

  return (
    <main className="max-w-md mx-auto pb-28 bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4">
        <Link href="/shop" className="w-9 h-9 rounded-full bg-[var(--surface)] flex items-center justify-center">
          <ArrowLeft size={16} />
        </Link>
        <h1 className="font-bold text-base">Details</h1>
        <button className="w-9 h-9 rounded-full bg-[var(--surface)] flex items-center justify-center">
          <Share2 size={15} />
        </button>
      </div>

      {/* Main image */}
      <div className="relative aspect-square mx-4 mt-4 rounded-[var(--radius)] overflow-hidden bg-[var(--accent-soft)]">
        <Image src={product.image} alt={product.name} fill className="object-contain p-6" />
        <button className="absolute top-3 right-3 w-9 h-9 rounded-full border border-[var(--accent)] bg-white flex items-center justify-center">
          <Heart size={15} className="text-[var(--accent)]" />
        </button>
      </div>

      {/* Info */}
      <div className="px-4 mt-4 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold leading-snug">{product.name}</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {product.category ?? "Outerwear"}
            </p>
          </div>
          <div className="text-right shrink-0">
            {product.compare_at_price && (
              <p className="price-old">৳{product.compare_at_price.toLocaleString("bn-BD")}</p>
            )}
            <p className="price text-base">৳{product.price.toLocaleString("bn-BD")}</p>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold mb-2">Select Size</p>
          <div className="flex gap-2">
            {["S", "M", "L", "XL"].map((size, i) => (
              <button
                key={size}
                className={`w-10 h-10 rounded-lg border text-sm flex items-center justify-center ${
                  i === 2
                    ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                    : "border-[var(--border)]"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold mb-1">About This Product</p>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            {product.description ?? "এই প্রোডাক্টের বিস্তারিত বিবরণ এখনো যোগ করা হয়নি।"}{" "}
            <span className="text-[var(--accent)] font-medium">Learn More</span>
          </p>
        </div>
      </div>

      <AddToCartBar productId={product.id} price={product.price} />
    </main>
  );
}
