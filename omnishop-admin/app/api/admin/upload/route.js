import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file) return NextResponse.json({ ok: false, error: "no file" }, { status: 400 });
    const ext = (file.name?.split(".").pop() || "bin").toLowerCase();
    const path = `shop/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());
    const up = await fetch(`${URL_BASE}/storage/v1/object/uploads/${path}`, {
      method: "POST",
      headers: {
        apikey: SERVICE,
        Authorization: `Bearer ${SERVICE}`,
        "Content-Type": file.type || "application/octet-stream",
        "x-upsert": "true",
      },
      body: buf,
    });
    if (!up.ok) {
      const t = await up.text();
      return NextResponse.json({ ok: false, error: `upload failed: ${t}` }, { status: 500 });
    }
    const url = `${URL_BASE}/storage/v1/object/public/uploads/${path}`;
    return NextResponse.json({ ok: true, url });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
