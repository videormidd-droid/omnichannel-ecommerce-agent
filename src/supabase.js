// Shared data layer used by BOTH channels. All product/order/social-link
// queries live here. Uses the Supabase JS client with the service role key.
import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';

// Only create the client if SUPABASE_URL is a VALID http(s) URL — otherwise stay
// null so a missing OR malformed Supabase setting can't crash the app at boot.
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

// ---------------- PRODUCTS ----------------
export async function searchProducts(query, limit = 5) {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, description, price, category, stock, image1')
    .ilike('name', `%${query}%`)
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function getProductByName(name) {
  const { data, error } = await supabase
    .from('products').select('*')
    .ilike('name', `%${name}%`).limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

export async function checkStock(productName) {
  const product = await getProductByName(productName);
  if (!product) return { found: false, product_name: productName };
  return {
    found: true, name: product.name, price: product.price,
    stock: product.stock, in_stock: product.stock > 0
  };
}

export async function getProductsByCategory(category, limit = 10) {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, price, stock, category')
    .ilike('category', `%${category}%`)
    .limit(limit);
  if (error) throw error;
  return data;
}

// ---------------- ORDERS ----------------
export async function getOrderById(orderId) {
  const { data: order, error } = await supabase
    .from('orders').select('*').eq('id', orderId).maybeSingle();
  if (error) throw error;
  if (!order) return null;

  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('quantity, price, product:products(name)')
    .eq('order_id', orderId);
  if (itemsError) throw itemsError;

  return {
    ...order,
    items: (items || []).map((i) => ({
      name: i.product?.name ?? 'Unknown product',
      quantity: i.quantity, price: i.price
    }))
  };
}

// WhatsApp gives "8801712345678"; your DB may store "01712345678" — match either.
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
  const { data, error } = await supabase
    .from('orders')
    .select('id, customer_name, total, created_at, phone')
    .in('phone', phoneVariants(phone))
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

// ---------------- SOCIAL LINKS ----------------
export async function getSocialLinks() {
  const { data, error } = await supabase.from('social_links').select('name, url');
  if (error) throw error;
  return data;
}

// ---------------- CATEGORIES ----------------
export async function getCategories() {
  const { data, error } = await supabase.from('products').select('category');
  if (error) throw error;
  return [...new Set((data || []).map((r) => r.category).filter(Boolean))];
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
    const { count: orderCount } = await supabase
      .from('orders').select('*', { count: 'exact', head: true });
    info.orderCount = orderCount ?? 0;
  } catch (e) {
    info.connected = false;
    info.error = String(e?.message || e).slice(0, 200);
  }
  return info;
}
