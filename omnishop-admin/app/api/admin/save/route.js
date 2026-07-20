import { NextResponse } from "next/server";
import { saveCollection } from "../../../../lib/adminStore";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { collection, value } = await req.json();
    if (!collection) return NextResponse.json({ ok: false, error: "collection required" }, { status: 400 });
    const result = await saveCollection(collection, value);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
