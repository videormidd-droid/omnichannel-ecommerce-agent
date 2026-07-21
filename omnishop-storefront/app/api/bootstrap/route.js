import { NextResponse } from "next/server";
import { getCollection, getMergedProducts, getSiteSettings, getDeliveryZones, getPaymentMethods } from "../../../lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [categories, sections, agentTypes, heroSlides, products, settings, delivery, coupons, paymentMethods, content] = await Promise.all([
      getCollection("categories"),
      getCollection("sections"),
      getCollection("agent_types"),
      getCollection("hero_slides"),
      getMergedProducts(),
      getSiteSettings(),
      getDeliveryZones(),
      getCollection("coupons"),
      getPaymentMethods(),
      getCollection("content"),
    ]);
    // Extract the store WhatsApp number safely:
    // 1) wa.me/<digits> link  2) raw digits in the whatsapp field
    // 3) fallback: digits from the phone/imo field  4) default placeholder
    const wa = settings.contact.whatsapp || "";
    const phoneRaw = (settings.contact.phone || settings.contact.imo || "").replace(/\D/g, "");
    let waNumber =
      (wa.match(/wa\.me\/(\d{10,15})/) || [])[1] ||
      ((/^[+\d\s-]{10,18}$/.test(wa.trim()) && wa.replace(/\D/g, "").length >= 10) ? wa.replace(/\D/g, "") : "") ||
      (phoneRaw.length >= 10 ? phoneRaw : "") ||
      "8801700000000";
    if (/^01[3-9]\d{8}$/.test(waNumber)) waNumber = "88" + waNumber;
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
      paymentMethods,
      content,
      whatsappNumber: waNumber,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
