import { NextResponse } from "next/server";
import { getFullState } from "../../../../lib/adminStore";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const state = await getFullState();
    return NextResponse.json({ ok: true, state });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
