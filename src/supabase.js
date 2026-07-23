// Shared data layer used by BOTH channels — now wired to the SAME database
// the OmniShopBD website + admin panel use:
//   products (id, name, price, image)          -> core product
//   guides   (type='shop_meta')                -> product extras (discount/stock/description/category/sizes/offer)
//   guides   (type='shop_collection')          -> categories list
//   guides   (type='shop_order_meta')          -> rich order snapshots (admin panel reads these)
//   hidden_pricing                             -> agent-only negotiation guide (min/max/agent price)
//   orders + order_items                       -> real orders (visible in admin instantly)
//   delivery_zones / settings / contact_settings / social_links -> store config
import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';

function isValidHttpUrl(u) {
  if (!u) return false;
  try {
    const x = new URL(u);
    return x.protocol === 'http:' || x.protocol === 'https:';
  } catch {
    return false;
  }
}

export const supabaseConfigured = isValidHttpUrl(config.supabaseUrl) && Boolean(config.supabaseServiceRoleKey);

export const supabase = supabaseConfigured
  ? createClient(config.supabaseUrl, config.supabaseServiceRoleKey, { auth: { persistSession: false } })
  : null;

function db() {
  if (!supabase) throw new Error('Supabase not configured, or SUPABASE_URL is not a valid https URL');
  return supabase;
}

// ---------------- PRODUCT META (guides JSON store) ----------------
async function getMetaMap() {
  const { data, error } = await db()
    .from('guides')
    .select('title, content')
    .eq('type', 'shop_meta')
    .like('title', 'product:%');
  if (error) throw error;
  const map = {};
  for (const r of data || []) {
    try { map[r.title.slice(8)] = JSON.parse(r.content); } catch { /* skip */ }
  }
  return map;
}

function mergeProduct(p, m = {}) {
  const price = Number(p.price) || 0;
  const discount = m.discount != null && Number(m.discount) > 0 ? Number(m.discount) : price;
  const sizes = typeof m.sizes === 'string'
    ? m.sizes.split(',').map((x) => x.trim()).filter(Boolean)
    : (Array.isArray(m.sizes) ? m.sizes : []);
  return {
    id: p.id,
    name: p.name,
    regular_price: price,
    price: discount,                 // selling price customers pay
    discount_percent: price > discount ? Math.round(((price - discount) / price) * 100) : 0,
    stock: m.stock != null ? Number(m.stock) : 100,
    in_stock: (m.stock != null ? Number(m.stock) : 100) > 0,
    category: m.category || '',
    description: m.description || '',
    sizes,
    offer_text: m.messageTemplate || '',
    active: m.active !== false,
    image: p.image || ''
  };
}

// ---------------- PRODUCTS ----------------
export async function searchProducts(query, limit = 5) {
  const { data, error } = await db()
    .from('products')
    .select('id, name, price, image')
    .ilike('name', `%${query}%`)
    .limit(limit);
  if (error) throw error;
  const meta = await getMetaMap();
  return (data || [])
    .map((p) => mergeProduct(p, meta[String(p.id)]))
    .filter((p) => p.active);
}

export async function getAllProducts(limit = 20) {
  const { data, error } = await db()
    .from('products')
    .select('id, name, price, image')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  const meta = await getMetaMap();
  return (data || [])
    .map((p) => mergeProduct(p, meta[String(p.id)]))
    .filter((p) => p.active);
}

export async function getProductByName(name) {
  const results = await searchProducts(name, 1);
  return results[0] || null;
}

export async function checkStock(productName) {
  const product = await getProductByName(productName);
  if (!product) return { found: false, product_name: productName };
  return {
    found: true,
    name: product.name,
    price: product.price,
    regular_price: product.regular_price,
    stock: product.stock,
    in_stock: product.in_stock,
    sizes: product.sizes,
    low_stock: product.stock > 0 && product.stock <= 5
  };
}

// ---------------- CATEGORIES ----------------
export async function getCategories() {
  const { data, error } = await db()
    .from('guides')
    .select('content')
    .eq('type', 'shop_collection')
    .eq('title', 'categories')
    .limit(1);
  if (error) throw error;
  try {
    const cats = JSON.parse(data?.[0]?.content || '[]');
    return cats.map((c) => c.name).filter(Boolean);
  } catch {
    return [];
  }
}

// ---------------- DELIVERY ----------------
export async function getDeliveryCharges() {
  const [zonesRes, settingsRes] = await Promise.all([
    db().from('delivery_zones').select('zone_name, charge, active'),
    db().from('settings').select('free_delivery, notice_text').limit(1)
  ]);
  if (zonesRes.error) throw zonesRes.error;
  const zones = (zonesRes.data || []).filter((z) => z.active !== false);
  const s = settingsRes.data?.[0] || {};
  return {
    zones: zones.map((z) => ({ zone: z.zone_name, charge: Number(z.charge) || 0 })),
    free_delivery: s.free_delivery === true,
    notice: s.notice_text || '',
    delivery_time: { dhaka: '১-২ দিন', outside: '৩-৫ দিন' }
  };
}

// ---------------- HIDDEN PRICING (agent-only negotiation guide) ----------------
export async function getPriceGuide(productName) {
  const product = await getProductByName(productName);
  if (!product) return { found: false };
  const { data, error } = await db()
    .from('hidden_pricing')
    .select('min_price, max_price, agent_price')
    .eq('product_id', product.id)
    .limit(1);
  if (error) throw error;
  const hp = data?.[0];
  return {
    found: true,
    product: product.name,
    listed_price: product.price,
    negotiable: Boolean(hp),
    // INTERNAL guide — the agent must never reveal min_price to customers.
    min_price: hp?.min_price ?? null,
    suggested_price: hp?.agent_price ?? null,
    max_price: hp?.max_price ?? null
  };
}

// ---------------- CREATE ORDER (writes the SAME tables the website uses) ----------------
export async function createOrder({ product_name, quantity = 1, customer_name, phone, address, division = '', size = '' }, ctx = {}) {
  const product = await getProductByName(product_name);
  if (!product) return { ok: false, error: 'product_not_found', product_name };
  if (!product.in_stock) return { ok: false, error: 'out_of_stock', name: product.name };

  const qty = Math.max(1, Math.min(99, Number(quantity) || 1));
  const delivery = await getDeliveryCharges().catch(() => ({ zones: [], free_delivery: false }));
  const isDhaka = /dhaka|ঢাকা/i.test(division || address || '');
  const zone = delivery.zones.find((z) => (isDhaka ? !/out|বাইরে/i.test(z.zone) : /out|বাইরে/i.test(z.zone))) || delivery.zones[0];
  const deliveryCharge = delivery.free_delivery ? 0 : Number(zone?.charge || 0);
  const total = product.price * qty + deliveryCharge;

  const channelNote = ctx.channel ? ` [এজেন্ট: ${ctx.channel}]` : ' [এজেন্ট]';
  const { data: orderRows, error } = await db()
    .from('orders')
    .insert({
      customer_name,
      phone,
      address: (address || '') + (size ? ` [সাইজ: ${size}]` : '') + channelNote,
      division: division || (isDhaka ? 'Dhaka' : ''),
      district: '',
      thana: '',
      payment_method: 'Cash on Delivery',
      transaction_id: '',
      delivery_charge: deliveryCharge,
      total,
      order_status: 'pending'
    })
    .select();
  if (error) throw error;
  const order = orderRows[0];

  await db().from('order_items')
    .insert({ order_id: order.id, product_id: product.id, quantity: qty, price: product.price })
    .then(() => {}, (e) => console.error('order_items insert failed', e));

  await db().from('guides')
    .insert({
      title: `order:${order.id}`,
      content: JSON.stringify({ items: [{ name: product.name, qty, price: product.price, size: size || '' }] }),
      type: 'shop_order_meta',
      active: true
    })
    .then(() => {}, (e) => console.error('order meta insert failed', e));

  return {
    ok: true,
    order_id: order.id,
    product: product.name,
    quantity: qty,
    unit_price: product.price,
    delivery_charge: deliveryCharge,
    total,
    payment: 'Cash on Delivery'
  };
}

// ---------------- ORDERS (lookup) ----------------
export async function getOrderById(orderId) {
  const { data: order, error } = await db()
    .from('orders').select('*').eq('id', orderId).maybeSingle();
  if (error) throw error;
  if (!order) return null;

  const { data: items, error: itemsError } = await db()
    .from('order_items')
    .select('quantity, price, product:products(name)')
    .eq('order_id', orderId);
  if (itemsError) throw itemsError;

  return {
    id: order.id,
    customer_name: order.customer_name,
    phone: order.phone,
    address: order.address,
    status: order.order_status,
    payment_method: order.payment_method,
    delivery_charge: order.delivery_charge,
    total: order.total,
    created_at: order.created_at,
    items: (items || []).map((i) => ({
      name: i.product?.name ?? 'Unknown product',
      quantity: i.quantity, price: i.price
    }))
  };
}

export function phoneVariants(waPhone) {
  const variants = new Set([waPhone]);
  if (waPhone.startsWith('880')) {
    variants.add('0' + waPhone.slice(3));
    variants.add(waPhone.slice(3));
    variants.add('+' + waPhone);
  }
  return [...variants];
}

export async function getOrdersByPhone(phone, limit = 5) {
  const { data, error } = await db()
    .from('orders')
    .select('id, customer_name, total, order_status, created_at, phone')
    .in('phone', phoneVariants(phone))
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

// ---------------- CONTACT / SOCIAL LINKS ----------------
export async function getSocialLinks() {
  const [social, contact] = await Promise.all([
    db().from('social_links').select('name, url'),
    db().from('contact_settings').select('whatsapp, messenger, telegram, imo').limit(1)
  ]);
  const links = [...(social.data || [])];
  const c = contact.data?.[0];
  if (c?.whatsapp) links.push({ name: 'WhatsApp', url: c.whatsapp });
  if (c?.messenger) links.push({ name: 'Messenger', url: c.messenger });
  if (c?.telegram) links.push({ name: 'Telegram', url: c.telegram });
  if (c?.imo) links.push({ name: 'Phone/imo', url: c.imo });
  links.push({ name: 'Website', url: 'https://nexcart-storefront-production.up.railway.app' });
  return links;
}

// ---------------- HEALTH CHECK (for /debug) ----------------
export async function dbHealthCheck() {
  const info = {};
  try {
    const client = db();
    const { count: productCount, error: pErr } = await client
      .from('products').select('*', { count: 'exact', head: true });
    if (pErr) throw pErr;
    info.connected = true;
    info.productCount = productCount ?? 0;
    info.categories = (await getCategories()).slice(0, 15);
    const { count: orderCount } = await client
      .from('orders').select('*', { count: 'exact', head: true });
    info.orderCount = orderCount ?? 0;
    info.schema = 'omnishop-unified';
  } catch (e) {
    info.connected = false;
    info.error = String(e?.message || e).slice(0, 200);
  }
  return info;
}
