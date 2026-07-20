// Server-side Supabase REST helper (service_role) — keys never reach the browser.
const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function headers(extra = {}) {
  return {
    apikey: SERVICE,
    Authorization: `Bearer ${SERVICE}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

export async function dbSelect(table, query = "select=*") {
  const res = await fetch(`${URL_BASE}/rest/v1/${table}?${query}`, {
    headers: headers(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${table} select failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function dbInsert(table, rows, returning = true) {
  const res = await fetch(`${URL_BASE}/rest/v1/${table}`, {
    method: "POST",
    headers: headers(returning ? { Prefer: "return=representation" } : {}),
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`${table} insert failed: ${res.status} ${await res.text()}`);
  return returning ? res.json() : null;
}

export async function dbUpdate(table, filter, patch) {
  const res = await fetch(`${URL_BASE}/rest/v1/${table}?${filter}`, {
    method: "PATCH",
    headers: headers({ Prefer: "return=representation" }),
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`${table} update failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function dbDelete(table, filter) {
  const res = await fetch(`${URL_BASE}/rest/v1/${table}?${filter}`, {
    method: "DELETE",
    headers: headers(),
  });
  if (!res.ok) throw new Error(`${table} delete failed: ${res.status} ${await res.text()}`);
  return true;
}

// ---- Supabase Auth (GoTrue) helpers ----
export async function authAdminCreateUser({ email, password, user_metadata }) {
  const res = await fetch(`${URL_BASE}/auth/v1/admin/users`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata }),
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

export async function authPasswordLogin({ email, password }) {
  const res = await fetch(`${URL_BASE}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}
