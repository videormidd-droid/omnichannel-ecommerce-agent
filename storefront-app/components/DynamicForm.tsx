// components/DynamicForm.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Field = {
  name: string;
  type: "text" | "number" | "select" | "file";
  options?: string[];
};

type FormConfig = {
  id: number;
  title: string;
  description: string;
  fields: Field[];
  design?: { columns?: number };
};

export default function DynamicForm({
  formType,
  orderId,
  onSuccess,
}: {
  formType: string;
  orderId?: number;
  onSuccess?: () => void;
}) {
  const supabase = createClient();
  const [config, setConfig] = useState<FormConfig | null>(null);
  const [values, setValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("master_forms")
        .select("id, title, description, fields, design")
        .eq("form_type", formType)
        .eq("active", true)
        .single();
      if (data) setConfig(data as FormConfig);
    })();
  }, [formType]);

  if (!config) return <p className="text-sm text-[var(--text-muted)]">ফর্ম লোড হচ্ছে...</p>;

  const setValue = (name: string, val: any) => setValues((v) => ({ ...v, [name]: val }));

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload: Record<string, any> = { ...values };

      // যেকোনো file field আলাদাভাবে আপলোড করে URL বসানো
      for (const field of config.fields) {
        if (field.type === "file" && values[field.name] instanceof File) {
          const file: File = values[field.name];
          const path = `${formType}/${Date.now()}-${file.name}`;
          const { error: uploadErr } = await supabase.storage.from("uploads").upload(path, file);
          if (uploadErr) throw new Error(`${field.name} আপলোড ব্যর্থ হয়েছে`);
          const { data: pub } = supabase.storage.from("uploads").getPublicUrl(path);
          payload[field.name] = pub.publicUrl;
        }
      }

      const res = await fetch("/api/forms/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formId: config.id, orderId, data: payload }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "সাবমিট ব্যর্থ হয়েছে");

      setDone(true);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return <p className="text-sm text-[var(--accent)] font-medium">✓ সাবমিট সম্পন্ন হয়েছে</p>;
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-semibold text-sm">{config.title}</h3>
        {config.description && (
          <p className="text-xs text-[var(--text-muted)]">{config.description}</p>
        )}
      </div>

      {config.fields.map((field) => (
        <div key={field.name}>
          {field.type === "select" ? (
            <select
              onChange={(e) => setValue(field.name, e.target.value)}
              className="w-full border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm"
            >
              <option value="">{field.name} বেছে নিন</option>
              {(field.options ?? []).map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : field.type === "file" ? (
            <div>
              <label className="text-sm font-medium block mb-1">{field.name}</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setValue(field.name, e.target.files?.[0] ?? null)}
                className="text-sm"
              />
            </div>
          ) : (
            <input
              type={field.type}
              placeholder={field.name}
              onChange={(e) => setValue(field.name, e.target.value)}
              className="w-full border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm"
            />
          )}
        </div>
      ))}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        onClick={submit}
        disabled={loading}
        className="btn-cta w-full py-3 text-sm font-medium disabled:opacity-50"
      >
        {loading ? "সাবমিট হচ্ছে..." : "সাবমিট করুন"}
      </button>
    </div>
  );
}
