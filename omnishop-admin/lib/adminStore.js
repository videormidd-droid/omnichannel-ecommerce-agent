// Admin data layer — assembles the full `db` shape the UI expects from the
// EXISTING tables, and persists each collection back to the right place.
// Guides JSON collections use the SAME keys the storefront reads.
import { dbSelect, dbInsert, dbUpdate, dbDelete } from "./db";

const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

/* ---------- guides JSON collection store ---------- */
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
  locations: [
    { id: "loc_1", division: "Dhaka", districts: [{ name: "Dhaka", thanas: ["Dhanmondi", "Mirpur", "Gulshan", "Uttara"] }, { name: "Gazipur", thanas: ["Tongi", "Sreepur"] }] },
    { id: "loc_2", division: "Chattogram", districts: [{ name: "Chattogram", thanas: ["Panchlaish", "Kotwali"] }] },
  ],
  support_agents: [{ id: "ag_1", name: "Nusrat (Support)", role: "Customer Support", contact: "01700000010" }],
  content: {
    homepageText: "বাংলাদেশের বিশ্বস্ত অনলাইন শপ। ক্যাশ অন ডেলিভারি সুবিধা।",
    descriptionTemplate: "প্রিমিয়াম মানের উপকরণে তৈরি এই পণ্যটি দৈনন্দিন ব্যবহারের জন্য উপযুক্ত।",
    privacy: "আপনার তথ্য সুরক্ষিত রাখা আমাদের অগ্রাধিকার।",
    returnPolicy: "পণ্য হাতে পাওয়ার ৭ দিনের মধ্যে রিটার্ন করা যাবে শর্তসাপেক্ষে।",
    terms: "ওয়েবসাইট ব্যবহারের শর্তাবলী।",
  },
};

async function getGuide(name) {
  const rows = await dbSelect("guides", `select=id,content&type=eq.shop_collection&title=eq.${encodeURIComponent(name)}&limit=1`);
  if (rows.length) {
    try { return JSON.parse(rows[0].content); } catch { return SEEDS[name]; }
  }
  const seed = SEEDS[name] ?? [];
  try { await dbInsert("guides", [{ title: name, content: JSON.stringify(seed), type: "shop_collection", active: true }], false); } catch {}
  return seed;
}

async function setGuide(name, value) {
  const rows = await dbSelect("guides", `select=id&type=eq.shop_collection&title=eq.${encodeURIComponent(name)}&limit=1`);
  if (rows.length) await dbUpdate("guides", `id=eq.${rows[0].id}`, { content: JSON.stringify(value) });
  else await dbInsert("guides", [{ title: name, content: JSON.stringify(value), type: "shop_collection", active: true }], false);
}

/* ---------- product meta (guides type=shop_meta, title=product:<id>) ---------- */
const META_FIELDS = ["discount", "stock", "sold", "category", "subcategory", "tags", "video", "description", "featured", "active", "section", "agentType", "whatsapp", "facebook", "messenger", "telegram", "whatsappNumber", "messengerUsername", "telegramUsername", "messageTemplate", "minPrice", "maxPrice", "suggestedPrice"];

async function getAllMeta() {
  const rows = await dbSelect("guides", "select=title,content&type=eq.shop_meta&title=like.product:*");
  const map = {};
  for (const r of rows) {
    try { map[r.title.slice(8)] = JSON.parse(r.content); } catch {}
  }
  return map;
}
async function setMeta(pid, obj) {
  const title = `product:${pid}`;
  const clean = {};
  for (const k of META_FIELDS) if (obj[k] !== undefined) clean[k] = obj[k];
  const rows = await dbSelect("guides", `select=id&type=eq.shop_meta&title=eq.${encodeURIComponent(title)}&limit=1`);
  if (rows.length) await dbUpdate("guides", `id=eq.${rows[0].id}`, { content: JSON.stringify(clean) });
  else await dbInsert("guides", [{ title, content: JSON.stringify(clean), type: "shop_meta", active: true }], false);
}
async function delMeta(pid) {
  await dbDelete("guides", `type=eq.shop_meta&title=eq.${encodeURIComponent("product:" + pid)}`).catch(() => {});
}

/* ---------- FULL STATE (GET) ---------- */
export async function getFullState() {
  const [products, meta, media, cats, secs, agents, heroes, coupons, locations, supportAgents, content, pay, deliv, settingsRows, contactRows] =
    await Promise.all([
      dbSelect("products", "select=*&order=created_at.desc").catch(() => []),
      getAllMeta(),
      dbSelect("media", "select=*&order=id.asc").catch(() => []),
      getGuide("categories"), getGuide("sections"), getGuide("agent_types"), getGuide("hero_slides"),
      getGuide("coupons"), getGuide("locations"), getGuide("support_agents"), getGuide("content"),
      dbSelect("payment_settings", "select=*").catch(() => []),
      dbSelect("delivery_zones", "select=*").catch(() => []),
      dbSelect("settings", "select=*&limit=1").catch(() => []),
      dbSelect("contact_settings", "select=*&limit=1").catch(() => []),
    ]);

  const mediaByP = {};
  for (const m of media) { (mediaByP[String(m.product_id)] = mediaByP[String(m.product_id)] || []).push(m); }

  const mergedProducts = products.map((p) => {
    const m = meta[String(p.id)] || {};
    const extra = mediaByP[String(p.id)] || [];
    const imgs = [p.image, ...extra.filter((x) => x.type === "image").map((x) => x.url)].filter(Boolean);
    return {
      id: p.id, name: p.name, price: Number(p.price) || 0,
      discount: m.discount != null ? Number(m.discount) : Number(p.price) || 0,
      stock: m.stock != null ? Number(m.stock) : 0, sold: Number(m.sold) || 0,
      category: m.category || "", subcategory: m.subcategory || "", tags: m.tags || "",
      images: imgs.length ? imgs : [], video: m.video || "",
      description: m.description || "", featured: !!m.featured, active: m.active !== false,
      section: m.section || "", agentType: m.agentType || "normal",
      whatsapp: m.whatsapp || "", facebook: m.facebook || "", messenger: m.messenger || "", telegram: m.telegram || "",
      whatsappNumber: m.whatsappNumber || "", messengerUsername: m.messengerUsername || "", telegramUsername: m.telegramUsername || "",
      messageTemplate: m.messageTemplate || "", minPrice: m.minPrice ?? "", maxPrice: m.maxPrice ?? "", suggestedPrice: m.suggestedPrice ?? "",
    };
  });

  // orders + items
  const orders = await dbSelect("orders", "select=*&order=created_at.desc&limit=200").catch(() => []);
  let itemsByOrder = {};
  try {
    const oitems = await dbSelect("order_items", "select=*");
    const prodName = Object.fromEntries(products.map((p) => [String(p.id), p.name]));
    for (const it of oitems) {
      (itemsByOrder[String(it.order_id)] = itemsByOrder[String(it.order_id)] || []).push({ name: prodName[String(it.product_id)] || "পণ্য", qty: it.quantity });
    }
  } catch {}
  const mappedOrders = orders.map((o) => ({
    id: o.id, customer: o.customer_name, phone: o.phone, address: o.address,
    items: itemsByOrder[String(o.id)] || [],
    total: Number(o.total) || 0, payment: o.payment_method || "", txnId: o.transaction_id || "",
    status: o.order_status || "pending",
    paymentStatus: /paid|verified/i.test(o.order_status || "") ? "paid" : "unpaid",
    deliveryStatus: o.order_status || "processing",
    createdAt: o.created_at,
  }));

  // users from Supabase auth
  let users = [];
  try {
    const res = await fetch(`${URL_BASE}/auth/v1/admin/users?per_page=200`, { headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` }, cache: "no-store" });
    const data = await res.json();
    const list = data.users || [];
    const orderCount = {};
    for (const o of orders) orderCount[o.phone] = (orderCount[o.phone] || 0) + 1;
    users = list
      .filter((u) => (u.user_metadata?.mobile) || (u.email || "").endsWith("@omnishop.bd"))
      .map((u) => {
        const mobile = u.user_metadata?.mobile || (u.email || "").replace("@omnishop.bd", "");
        return { id: u.id, name: u.user_metadata?.name || "গ্রাহক", mobile, orders: orderCount[mobile] || 0 };
      });
  } catch {}

  const seenPm = new Set();
  const payMethods = pay.filter((r) => {
    const key = `${r.method}|${r.number}`;
    if (seenPm.has(key)) return false;
    seenPm.add(key);
    return true;
  }).slice(0, 20).map((r) => ({ id: r.id, name: r.method, account: r.number, instructions: r.instruction, enabled: r.active !== false, txnRequired: !/cash|cod|delivery|ক্যাশ/i.test(r.method || "") }));
  const deliveryZones = deliv.map((r) => ({ id: r.id, name: r.zone_name, charge: Number(r.charge) || 0, eta: "", freeAbove: null }));

  const s = settingsRows[0] || {};
  const c = contactRows[0] || {};

  return {
    admins: [],
    products: mergedProducts,
    categories: cats,
    sections: secs,
    agentTypes: agents,
    heroSlides: heroes,
    orders: mappedOrders,
    users,
    paymentMethods: payMethods.length ? payMethods : [
      { id: "pm_cod", name: "Cash on Delivery", account: "—", instructions: "পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন", enabled: true, txnRequired: false },
    ],
    deliveryZones: deliveryZones.length ? deliveryZones : [
      { id: "dz_in", name: "Inside Dhaka", charge: 60, eta: "1-2 days", freeAbove: null },
      { id: "dz_out", name: "Outside Dhaka", charge: 120, eta: "3-5 days", freeAbove: null },
    ],
    coupons,
    content,
    contact: { whatsapp: c.whatsapp || "", messenger: c.messenger || "", telegram: c.telegram || "", phone: c.imo || "" },
    locations,
    agents: supportAgents,
    settings: { siteName: s.site_name || "OmniShop BD", logo: "", currency: "BDT (৳)", maintenance: false, noticeText: s.notice_text || "" },
  };
}

/* ---------- SAVE (POST) ---------- */
const GUIDE_MAP = { categories: "categories", sections: "sections", agentTypes: "agent_types", heroSlides: "hero_slides", coupons: "coupons", locations: "locations", agents: "support_agents", content: "content" };

async function upsertSingleRow(table, patch) {
  const rows = await dbSelect(table, "select=id&limit=1").catch(() => []);
  if (rows.length) await dbUpdate(table, `id=eq.${rows[0].id}`, patch);
  else await dbInsert(table, [patch], false);
}

async function replaceAll(table, rows) {
  const existing = await dbSelect(table, "select=id").catch(() => []);
  for (const r of existing) await dbDelete(table, `id=eq.${r.id}`).catch(() => {});
  if (rows.length) await dbInsert(table, rows, false).catch((e) => { throw e; });
}

export async function saveCollection(collection, value) {
  // 1) guides-backed JSON collections
  if (GUIDE_MAP[collection]) { await setGuide(GUIDE_MAP[collection], value); return { ok: true }; }

  // 2) products — reconcile against real products table + meta
  if (collection === "products") {
    // de-dupe incoming list by id (protects against double-submitted state)
    const seen = new Set();
    value = (value || []).filter((p) => {
      const key = String(p.id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const dbProducts = await dbSelect("products", "select=id").catch(() => []);
    const dbIds = new Set(dbProducts.map((p) => String(p.id)));
    const keepIds = new Set();
    for (const p of value) {
      const isExisting = /^\d+$/.test(String(p.id)) && dbIds.has(String(p.id));
      const core = { name: p.name || "পণ্য", price: Number(p.price) || 0, image: (p.images && p.images[0]) || "" };
      if (isExisting) {
        await dbUpdate("products", `id=eq.${p.id}`, core);
        await setMeta(p.id, p);
        keepIds.add(String(p.id));
        await syncExtraMedia(p.id, p.images, p.video);
        await syncHiddenPricing(p.id, p);
      } else {
        const inserted = await dbInsert("products", [core]);
        const newId = inserted[0].id;
        await setMeta(newId, p);
        keepIds.add(String(newId));
        await syncExtraMedia(newId, p.images, p.video);
        await syncHiddenPricing(newId, p);
      }
    }
    for (const id of dbIds) if (!keepIds.has(id)) {
      await dbDelete("products", `id=eq.${id}`).catch(() => {});
      await delMeta(id);
      await dbDelete("media", `product_id=eq.${id}`).catch(() => {});
    }
    return { ok: true, reload: true };
  }

  // 3) orders — status update by id
  if (collection === "orders") {
    for (const o of value) {
      if (o.id != null) await dbUpdate("orders", `id=eq.${o.id}`, { order_status: o.status }).catch(() => {});
    }
    return { ok: true };
  }

  // 4) real config tables
  if (collection === "paymentMethods") {
    await replaceAll("payment_settings", value.map((m) => ({ method: m.name || "", number: m.account || "", instruction: m.instructions || "", active: m.enabled !== false })));
    return { ok: true, reload: true };
  }
  if (collection === "deliveryZones") {
    await replaceAll("delivery_zones", value.map((z) => ({ zone_name: z.name || "", charge: Number(z.charge) || 0, active: true })));
    return { ok: true, reload: true };
  }
  if (collection === "settings") {
    await upsertSingleRow("settings", { site_name: value.siteName || "OmniShop BD", notice_text: value.noticeText ?? undefined });
    return { ok: true };
  }
  if (collection === "contact") {
    await upsertSingleRow("contact_settings", { whatsapp: value.whatsapp || "", messenger: value.messenger || "", telegram: value.telegram || "", imo: value.phone || "" });
    return { ok: true };
  }
  // users / admins — read-only from here
  return { ok: true };
}

// Smart Control prices → the existing hidden_pricing table (bot/agent-ready)
async function syncHiddenPricing(pid, p) {
  const min = Number(p.minPrice), max = Number(p.maxPrice), sug = Number(p.suggestedPrice);
  await dbDelete("hidden_pricing", `product_id=eq.${pid}`).catch(() => {});
  if (min > 0 || max > 0 || sug > 0) {
    await dbInsert("hidden_pricing", [{
      product_id: pid,
      min_price: min > 0 ? min : null,
      max_price: max > 0 ? max : null,
      agent_price: sug > 0 ? sug : null,
    }], false).catch(() => {});
  }
}

async function syncExtraMedia(pid, images, video) {
  // images[0] lives in products.image; images[1..] + video go to media table.
  await dbDelete("media", `product_id=eq.${pid}`).catch(() => {});
  const rows = [];
  (images || []).slice(1).forEach((url) => { if (url) rows.push({ product_id: pid, type: "image", url, active: true }); });
  if (video) rows.push({ product_id: pid, type: "video", url: video, active: true });
  if (rows.length) await dbInsert("media", rows, false).catch(() => {});
}
