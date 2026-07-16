// app/checkout/page.tsx
"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { divisions, getDistricts, getThanas, resolveZone } from "@/lib/bd-address";

const methods = ["bKash", "Nagad", "Rocket", "Cash on Delivery"];

export default function CheckoutPage() {
  const params = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const productId = params.get("product");
  const qty = Number(params.get("qty") ?? 1);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [division, setDivision] = useState("");
  const [district, setDistrict] = useState("");
  const [thana, setThana] = useState("");
  const [addressDetails, setAddressDetails] = useState("");
  const [couponCode, setCouponCode] = useState("");

  const [method, setMethod] = useState("bKash");
  const [number, setNumber] = useState("");
  const [trxId, setTrxId] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ orderCode: string } | null>(null);

  const phoneValid = /^01[3-9]\d{8}$/.test(phone);
  const requiresTrx = method !== "Cash on Delivery";

  const submit = async () => {
    if (!name || !phoneValid || !division || !district || !thana || !addressDetails) {
      setError("সব ঘর সঠিকভাবে পূরণ করুন (ফোন নম্বর: 01XXXXXXXXX)");
      return;
    }
    if (requiresTrx && (!number || !trxId)) {
      setError("পেমেন্ট তথ্য পূরণ করুন");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      let screenshotUrl: string | null = null;
      if (screenshot) {
        const fileName = `payment-proof/${Date.now()}-${screenshot.name}`;
        const { error: uploadErr } = await supabase.storage.from("uploads").upload(fileName, screenshot);
        if (uploadErr) throw new Error("স্ক্রিনশট আপলোড ব্যর্থ হয়েছে");
        const { data: pub } = supabase.storage.from("uploads").getPublicUrl(fileName);
        screenshotUrl = pub.publicUrl;
      }

      const zone = resolveZone(division, district);

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          qty,
          customerName: name,
          customerPhone: phone,
          division,
          district,
          thana,
          addressDetails,
          zone,
          couponCode: couponCode || null,
          payment: requiresTrx
            ? { method, number, trx_id: trxId, screenshot: screenshotUrl }
            : { method: "Cash on Delivery" },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "অর্ডার তৈরি ব্যর্থ হয়েছে");

      setDone({ orderCode: data.orderCode });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    const waMessage = encodeURIComponent(
      `আমার অর্ডার কনফার্ম করুন। অর্ডার আইডি: ${done.orderCode}`
    );
    return (
      <main className="max-w-md mx-auto min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--accent-soft)] flex items-center justify-center mb-4">
          <span className="text-2xl">✓</span>
        </div>
        <h1 className="text-lg font-semibold">অর্ডার সফল হয়েছে!</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">অর্ডার আইডি</p>
        <p className="text-xl font-bold text-[var(--accent)] mt-1">{done.orderCode}</p>
        <p className="text-sm text-[var(--text-muted)] mt-3">
          পেমেন্ট যাচাই হলে অর্ডার কনফার্ম করা হবে। আনুমানিক ডেলিভারি ২-৫ দিন।
        </p>

        <div className="flex gap-3 mt-6 w-full">
          <a
            href={`https://wa.me/8801XXXXXXXXX?text=${waMessage}`}
            target="_blank"
            className="flex-1 bg-[#25D366] text-white text-sm font-medium py-3 rounded-lg text-center"
          >
            WhatsApp কনফার্ম
          </a>
          <a
            href="tel:+8801900123456"
            className="flex-1 btn-cta text-sm font-medium py-3 rounded-lg text-center"
          >
            কল করুন
          </a>
        </div>

        <button onClick={() => router.push("/")} className="text-sm text-[var(--text-muted)] mt-5 underline">
          হোমে ফিরুন
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto pb-10 bg-white min-h-screen px-4 pt-6">
      <h1 className="text-lg font-bold mb-4">চেকআউট</h1>

      <div className="space-y-3">
        <input placeholder="আপনার নাম" value={name} onChange={(e) => setName(e.target.value)}
          className="w-full border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm" />
        <input placeholder="মোবাইল নম্বর (01XXXXXXXXX)" value={phone} onChange={(e) => setPhone(e.target.value)}
          className="w-full border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm" />
        {phone && !phoneValid && (
          <p className="text-xs text-red-600">সঠিক বাংলাদেশি মোবাইল নম্বর দিন</p>
        )}

        <div className="grid grid-cols-3 gap-2">
          <select value={division} onChange={(e) => { setDivision(e.target.value); setDistrict(""); setThana(""); }}
            className="border border-[var(--border)] rounded-lg px-2 py-2.5 text-xs">
            <option value="">বিভাগ</option>
            {divisions.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={district} onChange={(e) => { setDistrict(e.target.value); setThana(""); }} disabled={!division}
            className="border border-[var(--border)] rounded-lg px-2 py-2.5 text-xs disabled:opacity-50">
            <option value="">জেলা</option>
            {getDistricts(division).map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={thana} onChange={(e) => setThana(e.target.value)} disabled={!district}
            className="border border-[var(--border)] rounded-lg px-2 py-2.5 text-xs disabled:opacity-50">
            <option value="">থানা</option>
            {getThanas(division, district).map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <textarea placeholder="সম্পূর্ণ ঠিকানা (বাড়ি/রোড নম্বর সহ)" value={addressDetails}
          onChange={(e) => setAddressDetails(e.target.value)}
          className="w-full border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm" rows={2} />

        <input placeholder="কুপন কোড (থাকলে)" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          className="w-full border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm" />

        <div className="border-t border-[var(--border)] pt-4">
          <p className="text-sm font-medium mb-2">পেমেন্ট পদ্ধতি</p>
          <div className="grid grid-cols-2 gap-2">
            {methods.map((m) => (
              <button key={m} onClick={() => setMethod(m)}
                className={`py-2 rounded-lg text-xs border ${
                  method === m ? "bg-[var(--accent)] text-white border-[var(--accent)]" : "border-[var(--border)]"
                }`}>
                {m}
              </button>
            ))}
          </div>
        </div>

        {requiresTrx && (
          <>
            <p className="text-xs text-[var(--text-muted)] bg-[var(--surface)] rounded-lg p-3">
              {method} নম্বর <b>01XXXXXXXXX</b>-এ টাকা পাঠিয়ে নিচে তথ্য দিন
            </p>
            <input placeholder="আপনার নম্বর" value={number} onChange={(e) => setNumber(e.target.value)}
              className="w-full border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm" />
            <input placeholder="Transaction ID" value={trxId} onChange={(e) => setTrxId(e.target.value)}
              className="w-full border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm" />
            <div>
              <label className="text-sm font-medium block mb-1">পেমেন্ট স্ক্রিনশট</label>
              <input type="file" accept="image/*" onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)} className="text-sm" />
            </div>
          </>
        )}

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button onClick={submit} disabled={loading}
          className="btn-cta w-full py-3 text-sm font-medium mt-2 disabled:opacity-50">
          {loading ? "সাবমিট হচ্ছে..." : "অর্ডার সম্পন্ন করুন"}
        </button>
      </div>
    </main>
  );
}
