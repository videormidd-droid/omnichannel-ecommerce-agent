// Shared data layer used by BOTH channels. All product/order/social-link
// queries live here. Uses the Supabase JS client with the service role key.
import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';

export const supabase = createClient(
  config.supabaseUrl,
  config.supabaseServiceRoleKey,
  { auth: { persistSession: false } }
);

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
