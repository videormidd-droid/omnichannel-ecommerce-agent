// Catalog layer — maps OmniShop UI shapes onto the EXISTING database tables:
//   products (id, name, price, image)            -> core product
//   guides   (title, content, type, active)      -> JSON store:
//        type='shop_meta',       title='product:<id>'  -> extra product fields
//        type='shop_collection', title='<name>'        -> categories/sections/agent_types/hero_slides/coupons
//   media    (product_id, type, url, title)      -> extra images / video
//   delivery_zones, payment_settings, settings, contact_settings, social_links -> as-is
import { dbSelect, dbInsert, dbUpdate } from "./db";

const SEEDS = {
  categories: [
    { id: "electronics", name: "Electronics", image: "https://loremflickr.com/220/220/electronics,gadget", hasSize: false },
    { id: "fashion", name: "Fashion", image: "https://loremflickr.com/220/220/clothing,fashion", hasSize: true },
    { id: "gadgets", name: "Gadgets", image: "https://loremflickr.com/220/220/smartwatch,tech", hasSize: false },
    { id: "accessories", name: "Accessories", image: "https://loremflickr.com/220/220/jewelry,accessory", hasSize: false },
    { id: "beauty", name: "Beauty", image: "https://loremflickr.com/220/220/cosmetics,skincare", hasSize: false },
    { id: "home", name: "Home & Living", image: "https://loremflickr.com/220/220/homedecor,furniture", hasSize: false },
  ],
  sections: [
    { id: "sec_1", key: "homepage_top", label: "আজকের সেরা পছন্দ" },
    { id: "sec_2", key: "homepage_middle", label: "জনপ্রিয় পণ্য" },
    { id: "sec_3", key: "homepage_bottom", label: "আরও দেখুন" },
  ],
  agent_types: [
    { id: "agt_1", key: "normal", label: "Normal", badge: "সাধারণ প্রদর্শন", tone: "neutral" },
    { id: "agt_2", key: "railway", label: "ফাস্ট", badge: "⚡ ফাস্ট / বাল্ক অর্ডার", tone: "info" },
    { id: "agt_3", key: "hyper", label: "প্রিমিয়াম", badge: "👑 প্রিমিয়াম / অটো-প্রসেসিং", tone: "brand" },
  ],
  hero_slides: [
    { id: "hero_1", tag: "নতুন কালেকশন", title: "শরতের সেরা ফ্যাশন", sub: "ট্রেন্ডি জ্যাকেট ও কোট — ৪০% পর্যন্ত ছাড়", cta: "কালেকশন দেখুন", link: "fashion", image: "https://loremflickr.com/480/300/fashion,coat,model" },
    { id: "hero_2", tag: "টেক সেল", title: "ইলেকট্রনিক্স মেগা সেল", sub: "ফোন, ল্যাপটপ ও গ্যাজেটে বিশেষ অফার", cta: "অফার দেখুন", link: "electronics", image: "https://loremflickr.com/480/300/electronics,gadgets" },
  ],
  coupons: [
    { id: "cp_1", code: "OMNI10", type: "percentage", value: 10, enabled: true },
    { id: "cp_2", code: "FLAT200", type: "fixed", value: 200, enabled: true },
  ],
};

export async function getCollection(name) {
  const rows = await dbSelect(
    "guides",
    `select=id,title,content&type=eq.shop_collection&title=eq.${encodeURIComponent(name)}&limit=1`
  );
  if (rows.length) {
    try { return JSON.parse(rows[0].content); } catch { return SEEDS[name] || []; }
  }
  const seed = SEEDS[name] || [];
  try {
    await dbInsert("guides", [{ title: name, content: JSON.stringify(seed), type: "shop_collection", active: true }], false);
  } catch (e) { /* ignore seed races */ }
  return seed;
}

export async function setCollection(name, value) {
  const rows = await dbSelect(
    "guides",
    `select=id&type=eq.shop_collection&title=eq.${encodeURIComponent(name)}&limit=1`
  );
  if (rows.length) {
    await dbUpdate("guides", `id=eq.${rows[0].id}`, { content: JSON.stringify(value) });
  } else {
    await dbInsert("guides", [{ title: name, content: JSON.stringify(value), type: "shop_collection", active: true }], false);
  }
  return value;
}

export async function getProductMeta() {
  const rows = await dbSelect("guides", `select=title,content&type=eq.shop_meta&title=like.product:*`);
  const map = {};
  for (const r of rows) {
    const pid = r.title.slice("product:".length);
    try { map[pid] = JSON.parse(r.content); } catch { /* skip */ }
  }
  return map;
}

const DEFAULT_META = {
  category: "", subcategory: "", tags: "", discount: null, stock: 100, sold: 0,
  video: "", description: "", featured: false, active: true,
  section: "homepage_top", agentType: "normal", whatsapp: "",
};

export async function getMergedProducts({ includeInactive = false } = {}) {
  const [products, meta, media] = await Promise.all([
    dbSelect("products", "select=*&order=created_at.desc"),
    getProductMeta(),
    dbSelect("media", "select=product_id,type,url,title,active&order=id.asc").catch(() => []),
  ]);
  const mediaByProduct = {};
  for (const m of media) {
    if (m.active === false) continue;
    const key = String(m.product_id);
    (mediaByProduct[key] = mediaByProduct[key] || []).push(m);
  }
  const merged = products.map((p) => {
    const m = { ...DEFAULT_META, ...(meta[String(p.id)] || {}) };
    const extra = mediaByProduct[String(p.id)] || [];
    const images = [p.image, ...extra.filter((x) => x.type === "image").map((x) => x.url)].filter(Boolean);
    const video = m.video || extra.find((x) => x.type === "video")?.url || "";
    return {
      id: p.id,
      name: p.name,
      price: Number(p.price) || 0,
      discount: m.discount != null && Number(m.discount) > 0 ? Number(m.discount) : Number(p.price) || 0,
      stock: Number(m.stock),
      sold: Number(m.sold) || 0,
      category: m.category,
      subcategory: m.subcategory,
      tags: m.tags,
      images: images.length ? images : ["https://placehold.co/400x400/FFF8F3/425066?text=No+Image"],
      video,
      description: m.description,
      featured: !!m.featured,
      active: m.active !== false,
      section: m.section || "homepage_top",
      agentType: m.agentType || "normal",
      whatsapp: m.whatsapp || "",
    };
  });
  return includeInactive ? merged : merged.filter((p) => p.active);
}

export async function getSiteSettings() {
  const [settingsRows, contactRows, socialRows] = await Promise.all([
    dbSelect("settings", "select=*&limit=1").catch(() => []),
    dbSelect("contact_settings", "select=*&limit=1").catch(() => []),
    dbSelect("social_links", "select=*").catch(() => []),
  ]);
  const s = settingsRows[0] || {};
  const c = contactRows[0] || {};
  return {
    siteName: s.site_name || "OmniShop BD",
    noticeText: s.notice_text || "",
    freeDelivery: s.free_delivery ?? null,
    contact: {
      whatsapp: c.whatsapp || "",
      messenger: c.messenger || "",
      telegram: c.telegram || "",
      imo: c.imo || "",
    },
    socialLinks: socialRows,
  };
}

export async function getDeliveryZones() {
  const rows = await dbSelect("delivery_zones", "select=*").catch(() => []);
  const active = rows.filter((r) => r.active !== false);
  const isOutside = (r) => /out|বাইরে|বাহির/i.test(r.zone_name || "");
  const outside = active.find(isOutside) || active[1] || active[0];
  const inside = active.find((r) => !isOutside(r)) || active[0];
  return {
    inside: { label: inside?.zone_name || "ঢাকার ভিতরে", fee: Number(inside?.charge ?? 60), time: "১-২ দিন" },
    outside: { label: outside?.zone_name || "ঢাকার বাইরে", fee: Number(outside?.charge ?? 120), time: "৩-৫ দিন" },
    raw: active,
  };
}
