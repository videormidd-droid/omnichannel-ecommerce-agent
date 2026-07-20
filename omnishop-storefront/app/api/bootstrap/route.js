import { NextResponse } from "next/server";
import { getCollection, getMergedProducts, getSiteSettings, getDeliveryZones } from "../../../lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [categories, sections, agentTypes, heroSlides, products, settings, delivery, coupons] = await Promise.all([
      getCollection("categories"),
      getCollection("sections"),
      getCollection("agent_types"),
      getCollection("hero_slides"),
      getMergedProducts(),
      getSiteSettings(),
      getDeliveryZones(),
      getCollection("coupons"),
    ]);
    // Extract the store WhatsApp number from settings contact (wa.me link or raw number)
    const wa = settings.contact.whatsapp || "";
    const waNumber = (wa.match(/(?:wa\.me\/|\+?)(\d{10,15})/) || [])[1] || "8801700000000";
    return NextResponse.json({
      ok: true,
      categories,
      sections,
      agentTypes,
      heroSlides,
      products,
      settings,
      delivery: { inside: delivery.inside, outside: delivery.outside },
      coupons: (coupons || []).filter((c) => c.enabled !== false).map(({ code, type, value }) => ({ code, type, value, enabled: true })),
      whatsappNumber: waNumber,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
