// app/admin/products/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NewProductPage() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [comparePrice, setComparePrice] = useState("");
  const [resellerPrice, setResellerPrice] = useState("");
  const [commissionRate, setCommissionRate] = useState("10");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slugify = (s: string) =>
    s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const submit = async () => {
    if (!name || !price) {
      setError("নাম ও দাম অবশ্যই দিতে হবে");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      let imageUrl = "";
      if (imageFile) {
        const fileName = `products/${Date.now()}-${imageFile.name}`;
        const { error: uploadErr } = await supabase.storage.from("uploads").upload(fileName, imageFile);
        if (uploadErr) throw new Error("ছবি আপলোড ব্যর্থ হয়েছে");
        const { data: pub } = supabase.storage.from("uploads").getPublicUrl(fileName);
        imageUrl = pub.publicUrl;
      }

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug: slugify(name) + "-" + Date.now().toString().slice(-4),
          price: Number(price),
          compare_at_price: comparePrice ? Number(comparePrice) : null,
          reseller_price: resellerPrice ? Number(resellerPrice) : null,
          commission_rate: Number(commissionRate),
          stock: Number(stock || 0),
          category,
          description,
          image: imageUrl,
          active: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "প্রোডাক্ট তৈরি ব্যর্থ হয়েছে");

      router.push("/admin/products");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-6 max-w-lg">
      <h1 className="text-xl font-bold mb-5">নতুন প্রোডাক্ট যোগ করুন</h1>

      <div className="space-y-3">
        <input placeholder="প্রোডাক্টের নাম" value={name} onChange={(e) => setName(e.target.value)}
          className="w-full border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm" />

        <div className="grid grid-cols-2 gap-3">
          <input type="number" placeholder="বিক্রয় মূল্য" value={price} onChange={(e) => setPrice(e.target.value)}
            className="border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm" />
          <input type="number" placeholder="আগের দাম (discount দেখাতে)" value={comparePrice} onChange={(e) => setComparePrice(e.target.value)}
            className="border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input type="number" placeholder="রিসেলার মূল্য" value={resellerPrice} onChange={(e) => setResellerPrice(e.target.value)}
            className="border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm" />
          <input type="number" placeholder="কমিশন %" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)}
            className="border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input type="number" placeholder="স্টক পরিমাণ" value={stock} onChange={(e) => setStock(e.target.value)}
            className="border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm" />
          <input placeholder="ক্যাটাগরি" value={category} onChange={(e) => setCategory(e.target.value)}
            className="border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm" />
        </div>

        <textarea placeholder="বিবরণ" value={description} onChange={(e) => setDescription(e.target.value)}
          className="w-full border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm" rows={3} />

        <div>
          <label className="text-sm font-medium block mb-1">প্রোডাক্ট ছবি</label>
          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} className="text-sm" />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button onClick={submit} disabled={loading}
          className="btn-cta w-full py-3 text-sm font-medium mt-2 disabled:opacity-50">
          {loading ? "যোগ হচ্ছে..." : "প্রোডাক্ট যোগ করুন"}
        </button>
      </div>
    </main>
  );
}
