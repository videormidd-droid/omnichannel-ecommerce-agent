"use client";
import React, { useState, useEffect } from "react";
import {
  Search, ShoppingCart, Home as HomeIcon, LayoutGrid, User, Heart, Star,
  Play, MessageCircle, Phone, ChevronRight, Plus, Minus, X, Check,
  MapPin, Truck, ShieldCheck, Zap, ChevronDown, ArrowLeft, Facebook,
  Instagram, Send, Tag, Landmark, CheckCircle2, Eye, EyeOff, LogOut,
  Package, AlertCircle, Loader2, Clock3
} from "lucide-react";
import { BD_UPAZILAS } from "../lib/bd-locations";

/* ===========================================================
   DESIGN TOKENS — unchanged from the approved theme
=========================================================== */
const C = {
  brand: "#FF4713",
  brandDark: "#D93A0C",
  navy: "#0F1B33",
  navySoft: "#425066",
  teal: "#0E9E93",
  cream: "#FFF8F3",
  line: "#EFEAE3",
  gold: "#E8A33D",
  danger: "#DC2626",
  success: "#16A34A",
};
const FONT_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&family=Hind+Siliguri:wght@400;500;600;700&display=swap');";

/* ===========================================================
   MOCK "DATABASE" — admin-controlled content.
   Every block below is written so a Supabase table of the same
   shape can replace it later with zero UI changes:
     categories -> table "categories"
     products   -> table "products"
     users      -> table "users" (see AUTH section)
=========================================================== */
let CATEGORIES = [];

// Same 3 default sections the admin's "সেকশন" manager seeds — admin can add
// more later (e.g. a "flash_sale" section); the homepage just loops whatever
// exists here in order, so a new admin-added section appears automatically.
let SECTIONS = [];

// Same 3 default agent types the admin's "এজেন্ট টাইপ" manager seeds.
let AGENT_TYPES = { normal: null };

let PRODUCTS = [];

let HERO_SLIDES = [];

// Every product's WhatsApp order link is generated the same way the admin
// panel generates it (name + price + a shareable note) — see buildWhatsappLink
// in the admin file. Kept here so a product with no admin-set link still works.
let STORE_WHATSAPP_NUMBER = "8801700000000";
let DELIVERY = { inside: { label: "Inside Dhaka", fee: 60, time: "1-2 days" }, outside: { label: "Outside Dhaka", fee: 120, time: "3-5 days" } };
let COUPONS = [];
let PAYMENTS = [];
let SITE = {};
function renderTemplate(tpl, p) {
  let out = String(tpl)
    .split("{name}").join(p.name || "")
    .split("{price}").join("৳" + (p.price ?? ""))
    .split("{discount}").join("৳" + (p.discount ?? ""))
    .split("{stock}").join(String(p.stock ?? ""))
    .split("{description}").join(p.description || "")
    .split("{image}").join((p.images && p.images[0]) || "")
    .split("{id}").join(String(p.id ?? ""));
  if (!String(tpl).includes("{id}")) out = `ID: ${p.id}\n\n` + out;
  return out;
}

function buildWhatsappLink(product) {
  let msg;
  if (product.messageTemplate && product.messageTemplate.trim()) {
    // Dynamic template mode — clean, professional, no auto emojis.
    msg = renderTemplate(product.messageTemplate, product);
  } else {
    const lines = [];
    lines.push("আসসালামুয়ালাইকুম, আমি এই প্রোডাক্টটি সম্পর্কে জানতে চাই:");
    lines.push(`📦 ${product.name}`);
    lines.push(`💰 মূল্য: ৳${product.discount}`);
    lines.push(`🆔 Product ID: ${product.id}`);
    lines.push("এটা কি স্টকে আছে?");
    msg = lines.join("\n");
  }
  if (product.whatsapp) {
    const joiner = product.whatsapp.includes("?") ? "&" : "?";
    return product.whatsapp.includes("text=") ? product.whatsapp : `${product.whatsapp}${joiner}text=${encodeURIComponent(msg)}`;
  }
  return `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

const fmt = (n) => "৳" + n.toLocaleString("en-BD");

// Bangladesh's 8 divisions and all 64 districts — verified against
// official administrative records (division counts: Dhaka 13, Chattogram 11,
// Khulna 10, Rajshahi 8, Rangpur 8, Barishal 6, Mymensingh 4, Sylhet 4 = 64).
const BD_DISTRICTS = {
  Dhaka: ["Dhaka", "Faridpur", "Gazipur", "Gopalganj", "Kishoreganj", "Madaripur", "Manikganj", "Munshiganj", "Narayanganj", "Narsingdi", "Rajbari", "Shariatpur", "Tangail"],
  Chattogram: ["Bandarban", "Brahmanbaria", "Chandpur", "Chattogram", "Cumilla", "Cox's Bazar", "Feni", "Khagrachhari", "Lakshmipur", "Noakhali", "Rangamati"],
  Khulna: ["Bagerhat", "Chuadanga", "Jashore", "Jhenaidah", "Khulna", "Kushtia", "Magura", "Meherpur", "Narail", "Satkhira"],
  Rajshahi: ["Bogura", "Joypurhat", "Naogaon", "Natore", "Chapai Nawabganj", "Pabna", "Rajshahi", "Sirajganj"],
  Rangpur: ["Dinajpur", "Gaibandha", "Kurigram", "Lalmonirhat", "Nilphamari", "Panchagarh", "Rangpur", "Thakurgaon"],
  Barishal: ["Barguna", "Barishal", "Bhola", "Jhalokati", "Patuakhali", "Pirojpur"],
  Mymensingh: ["Jamalpur", "Mymensingh", "Netrokona", "Sherpur"],
  Sylhet: ["Habiganj", "Moulvibazar", "Sunamganj", "Sylhet"],
};

// Thana/upazila SUGGESTIONS for the highest-order-volume districts — used as a
// <datalist> (autocomplete hints), not a locked dropdown. The customer can
// always type a different value, so an incomplete list here never blocks a
// correct manual entry. Full nationwide coverage (495 upazilas) is meant to
// come from the admin-managed Location table once the backend is connected.
const BD_THANA_HINTS = {
  Dhaka: ["Mirpur", "Gulshan", "Dhanmondi", "Uttara", "Mohammadpur", "Badda", "Tejgaon", "Ramna", "Motijheel", "Jatrabari", "Demra", "Khilgaon", "Rampura", "Wari", "Lalbagh", "Kotwali", "Pallabi", "Kafrul", "Cantonment", "Adabor", "Khilkhet", "Shahbagh", "New Market", "Sabujbagh", "Dhamrai", "Dohar", "Keraniganj", "Savar", "Nawabganj"],
  Gazipur: ["Gazipur Sadar", "Tongi", "Kaliakair", "Kaliganj", "Kapasia", "Sreepur"],
  Narayanganj: ["Narayanganj Sadar", "Araihazar", "Bandar", "Rupganj", "Sonargaon"],
  Chattogram: ["Kotwali", "Panchlaish", "Pahartali", "Halishahar", "Bayazid Bostami", "Chandgaon", "Double Mooring", "Bandar", "Patenga", "Karnaphuli", "Sitakunda", "Patiya", "Boalkhali", "Rangunia", "Raozan", "Hathazari", "Fatikchhari", "Mirsharai", "Anwara", "Banshkhali", "Satkania", "Lohagara"],
  Cumilla: ["Cumilla Sadar", "Chandina", "Daudkandi", "Debidwar", "Laksam", "Muradnagar", "Chauddagram", "Barura", "Homna", "Nangalkot", "Titas"],
  "Cox's Bazar": ["Cox's Bazar Sadar", "Teknaf", "Ukhia", "Chakaria", "Ramu", "Maheshkhali", "Pekua", "Kutubdia"],
  Khulna: ["Khalishpur", "Sonadanga", "Khan Jahan Ali", "Daulatpur", "Kotwali", "Dacope", "Batiaghata", "Dumuria", "Paikgacha", "Rupsa"],
  Jashore: ["Jashore Sadar", "Abhaynagar", "Bagherpara", "Chaugachha", "Jhikargachha", "Keshabpur", "Manirampur", "Sharsha"],
  Rajshahi: ["Boalia", "Motihar", "Rajpara", "Shah Makhdum", "Paba", "Godagari", "Puthia", "Bagmara", "Charghat", "Durgapur", "Tanore"],
  Bogura: ["Bogura Sadar", "Sherpur", "Shibganj", "Sonatola", "Gabtali", "Sariakandi", "Dhunat", "Nandigram"],
  Rangpur: ["Rangpur Sadar", "Badarganj", "Mithapukur", "Pirganj", "Pirgachha", "Kaunia", "Gangachara", "Taraganj"],
  Sylhet: ["Sylhet Sadar", "Beanibazar", "Golapganj", "Companiganj", "Jaintiapur", "Kanaighat", "Zakiganj", "Bishwanath", "Balaganj", "Fenchuganj"],
  Mymensingh: ["Mymensingh Sadar", "Trishal", "Muktagachha", "Fulpur", "Bhaluka", "Gafargaon", "Ishwarganj", "Nandail", "Haluaghat"],
  Barishal: ["Barishal Sadar", "Bakerganj", "Banaripara", "Gaurnadi", "Muladi", "Babuganj", "Agailjhara", "Wazirpur", "Mehendiganj", "Hizla"],
  Feni: ["Feni Sadar", "Chhagalnaiya", "Daganbhuiyan", "Sonagazi", "Fulgazi", "Parshuram"],
  Noakhali: ["Noakhali Sadar", "Begumganj", "Chatkhil", "Companiganj", "Hatiya", "Senbagh", "Sonaimuri", "Subarnachar", "Kabirhat"],
};

/* ===========================================================
   AUTH SYSTEM
   ------------------------------------------------------------
   Mock "users" table + mock API. Every function below is the
   exact seam where Supabase Auth / a real API call will go —
   the signatures (args in, {ok, error, data} out) are kept
   stable so swapping the body is a one-line change per call:

     registerUser  -> supabase.auth.signUp() + insert profile row
     loginUser     -> supabase.auth.signInWithPassword()
     logoutUser    -> supabase.auth.signOut()
     googleLogin   -> supabase.auth.signInWithOAuth({provider:'google'})

   No hardcoded users — table starts empty.
=========================================================== */
const MOBILE_REGEX = /^01[3-9]\d{8}$/;
const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const cleanMobile = (v) => String(v || "").replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d))).replace(/\D/g, "").slice(0, 11);

function useAuthStore() {
  const users = [];
  const [currentUser, setCurrentUser] = useState(null); // session
  const [authLoading, setAuthLoading] = useState(false);

  // Session restore from localStorage (survives refresh)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("omni_user");
      if (saved) setCurrentUser(JSON.parse(saved));
    } catch {}
  }, []);

  const persist = (u) => {
    setCurrentUser(u);
    try { u ? localStorage.setItem("omni_user", JSON.stringify(u)) : localStorage.removeItem("omni_user"); } catch {}
  };

  const registerUser = async ({ name, mobile, password }) => {
    mobile = cleanMobile(mobile);
    if (!name || name.trim().length < 2) return { ok: false, error: "সঠিক নাম লিখুন" };
    if (!MOBILE_REGEX.test(mobile)) return { ok: false, error: "সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)" };
    if (!password || password.length < 6) return { ok: false, error: "পাসওয়ার্ড কমপক্ষে ৬ ক্যারেক্টার হতে হবে" };
    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim(), mobile, password }) });
      const d = await res.json();
      if (d.ok) persist(d.data);
      return d;
    } catch {
      return { ok: false, error: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন" };
    } finally { setAuthLoading(false); }
  };

  const loginUser = async ({ mobile, password }) => {
    mobile = cleanMobile(mobile);
    if (!MOBILE_REGEX.test(mobile)) return { ok: false, error: "সঠিক মোবাইল নম্বর দিন" };
    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mobile, password }) });
      const d = await res.json();
      if (d.ok) persist(d.data);
      return d;
    } catch {
      return { ok: false, error: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন" };
    } finally { setAuthLoading(false); }
  };

  const logoutUser = () => { persist(null); };

  const googleLogin = async () => ({ ok: false, error: "Google Login শীঘ্রই যুক্ত হবে" });

  return { users, currentUser, authLoading, registerUser, loginUser, logoutUser, googleLogin };
}

/* ===========================================================
   SMALL REUSABLE PIECES
=========================================================== */
function Stars({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      <Star size={12} fill={C.gold} color={C.gold} />
      <span className="text-[11px] font-semibold" style={{ color: C.navySoft }}>{rating}</span>
    </div>
  );
}

function AgentBadge({ agentType }) {
  const a = AGENT_TYPES[agentType];
  if (!a) return null;
  const bg = a.tone === "gold" ? "#FDF3E2" : "#E7F6F5";
  const color = a.tone === "gold" ? C.gold : C.teal;
  return <span className="text-[10px] font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: bg, color }}>{a.tone === "gold" ? "👑" : "⚡"} {a.label}</span>;
}

function ProductCard({ p, onAdd, onOpen }) {
  const [justAdded, setJustAdded] = useState(false);
  const hasSizes = (p.sizes || []).filter(Boolean).length > 0;
  const pct = Math.round(((p.price - p.discount) / p.price) * 100);
  const outOfStock = p.stock <= 0;
  return (
    <div className="bg-white rounded-2xl overflow-hidden border" style={{ borderColor: C.line, opacity: outOfStock ? 0.7 : 1 }}>
      <div className="relative aspect-square cursor-pointer" onClick={() => onOpen(p)}>
        <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
        {pct > 0 && !outOfStock && (
          <span className="absolute top-2 left-2 text-[10px] font-bold text-white px-2 py-1 rounded-full" style={{ backgroundColor: C.brand }}>
            -{pct}%
          </span>
        )}
        {outOfStock ? (
          <span className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-1 rounded-full bg-white/90" style={{ color: C.danger || "#DC2626" }}>স্টক শেষ</span>
        ) : p.featured ? (
          <span className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-1 rounded-full bg-white/90" style={{ color: C.navy }}>Featured</span>
        ) : null}
        <button className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow" onClick={(e) => e.stopPropagation()}>
          <Heart size={14} color={C.navySoft} />
        </button>
      </div>
      <div className="p-3 cursor-pointer" onClick={() => onOpen(p)}>
        <p className="text-[13px] font-medium leading-snug mb-1" style={{ color: C.navy, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: "34px" }}>
          {p.name}
        </p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10.5px]" style={{ color: C.navySoft }}>{p.sold}+ বিক্রি হয়েছে</span>
          <AgentBadge agentType={p.agentType} />
        </div>
        <div className="flex items-end justify-between mt-2">
          <div>
            <div className="text-[15px] font-bold" style={{ color: C.brand }}>{fmt(p.discount)}</div>
            {p.discount < p.price && <div className="text-[11px] line-through" style={{ color: "#B5AFA6" }}>{fmt(p.price)}</div>}
          </div>
          <button
            disabled={outOfStock}
            onClick={(e) => {
              e.stopPropagation();
              if (outOfStock) return;
              if (hasSizes) { onOpen(p); return; }
              onAdd(p);
              setJustAdded(true);
              setTimeout(() => setJustAdded(false), 900);
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-transform active:scale-90 disabled:opacity-40"
            style={{ backgroundColor: justAdded ? "#16A34A" : C.brand }}
          >
            {justAdded ? <Check size={16} color="#fff" /> : <Plus size={16} color="#fff" />}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===========================================================
   HERO BANNER
=========================================================== */
function HeroBanner({ onShop, onCategory }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % HERO_SLIDES.length), 4200);
    return () => clearInterval(t);
  }, []);
  const slide = HERO_SLIDES[i];
  const handleCta = () => {
    const isCategory = CATEGORIES.some((c) => c.id === slide.link);
    if (isCategory) onCategory(slide.link);
    else onShop();
  };
  return (
    <div className="relative mx-4 mt-3 rounded-2xl overflow-hidden" style={{ height: 148, backgroundColor: C.navy }}>
      {HERO_SLIDES.map((s, idx) => (
        <img key={idx} src={s.image} alt={s.title} loading={idx === 0 ? "eager" : "lazy"} className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700" style={{ opacity: idx === i ? 1 : 0 }} />
      ))}
      <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(15,27,51,0.90) 28%, rgba(15,27,51,0.35) 68%, rgba(15,27,51,0.08) 100%)" }} />

      <div className="relative h-full flex flex-col justify-center pl-4 pr-14 py-2.5">
        <span className="text-[10px] font-semibold w-max px-2 py-0.5 rounded-full mb-1.5" style={{ backgroundColor: C.brand, color: "#fff" }}>{slide.tag}</span>
        <h2 className="text-white font-bold text-[17px] leading-tight mb-0.5" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>{slide.title}</h2>
        <p className="text-white/80 text-[11px] mb-2 line-clamp-1" style={{ display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{slide.sub}</p>
        <button onClick={handleCta} className="w-max px-3 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-1" style={{ backgroundColor: "#fff", color: C.navy }}>
          {slide.cta} <ChevronRight size={12} />
        </button>

        {/* Unique Bangladeshi trust strip — payment logos + COD, right inside the banner */}
        <div className="flex items-center gap-1.5 mt-2">
          <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: "#E2136E", color: "#fff" }}>bKash</span>
          <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: "#F7941D", color: "#fff" }}>Nagad</span>
          <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: "#8236C7", color: "#fff" }}>Rocket</span>
          <span className="text-[8.5px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5" style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#fff" }}>
            <Truck size={9} /> সারাদেশে COD
          </span>
        </div>
      </div>

      <div className="absolute bottom-2 right-3 flex gap-1">
        {HERO_SLIDES.map((_, idx) => (
          <button key={idx} onClick={() => setI(idx)} className="h-1 rounded-full transition-all" style={{ width: idx === i ? 14 : 5, backgroundColor: idx === i ? C.brand : "rgba(255,255,255,0.5)" }} />
        ))}
      </div>
    </div>
  );
}

/* ===========================================================
   FLASH SALE
=========================================================== */
function useCountdown(hours = 5) {
  const [ms, setMs] = useState(hours * 3600 * 1000);
  useEffect(() => {
    const t = setInterval(() => setMs((v) => (v > 1000 ? v - 1000 : hours * 3600 * 1000)), 1000);
    return () => clearInterval(t);
  }, [hours]);
  const h = String(Math.floor(ms / 3600000)).padStart(2, "0");
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, "0");
  const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
  return { h, m, s };
}

function getFlashItems() {
  const items = PRODUCTS.filter((p) => p.active && p.stock > 0)
    .map((p) => ({ ...p, pct: Math.round(((p.price - p.discount) / p.price) * 100) }))
    .filter((p) => p.pct >= 15)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 6);
  return items.length < 2 ? [] : items;
}

function FlashSale({ onAdd, onOpen }) {
  const { h, m, s } = useCountdown(5);
  const items = getFlashItems();
  if (items.length < 2) return null;
  return (
    <div className="mt-6">
      <div className="mx-4 rounded-2xl p-4 flex items-center justify-between" style={{ background: `linear-gradient(120deg, ${C.teal}, #0B7C73)` }}>
        <div className="flex items-center gap-2">
          <Zap size={18} color="#FFD166" fill="#FFD166" />
          <span className="text-white font-bold text-[16px]" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>ফ্ল্যাশ সেল</span>
        </div>
        <div className="flex items-center gap-1">
          {[h, m, s].map((v, idx) => (
            <React.Fragment key={idx}>
              <span className="bg-white/95 text-[13px] font-bold rounded-md px-1.5 py-0.5" style={{ color: C.teal }}>{v}</span>
              {idx < 2 && <span className="text-white font-bold">:</span>}
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto px-4 pt-3 pb-1" style={{ scrollbarWidth: "none" }}>
        {items.map((p) => (
          <div key={p.id} className="w-[150px] shrink-0"><ProductCard p={p} onAdd={onAdd} onOpen={onOpen} /></div>
        ))}
      </div>
    </div>
  );
}

/* ===========================================================
   HEADER / BOTTOM NAV / FLOATING CONTACT
=========================================================== */
function Header({ query, setQuery, cartCount, onSearchFocus, scrolled, onCartClick }) {
  return (
    <div className="sticky top-0 z-40 transition-shadow" style={{ backgroundColor: C.brand, boxShadow: scrolled ? "0 4px 14px rgba(15,27,51,0.18)" : "none" }}>
      <div className="px-4 pt-3 pb-3 flex items-center gap-3">
        <span className="text-white font-extrabold text-xl tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
          {SITE.content?.logoUrl ? (
            <span className="flex items-center gap-2">
              <img src={SITE.content.logoUrl} alt={SITE.siteName || "OmniShop BD"} style={{ height: 34, width: 34, objectFit: "contain", borderRadius: 8, backgroundColor: "#fff" }} />
              <span>{(SITE.siteName || "OmniShop BD").replace(" BD", "")} <span className="font-medium text-[13px] align-middle opacity-90">BD</span></span>
            </span>
          ) : (
            <>Omni<span style={{ color: C.navy }}>Shop</span> <span className="font-medium text-[13px] align-middle opacity-90">BD</span></>
          )}
        </span>
        <button onClick={onCartClick} className="ml-auto relative active:scale-90 transition-transform" aria-label="কার্ট দেখুন">
          <ShoppingCart color="#fff" size={22} />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 text-[10px] font-bold text-white rounded-full w-4 h-4 flex items-center justify-center" style={{ backgroundColor: C.navy }}>{cartCount}</span>
          )}
        </button>
      </div>
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 bg-white rounded-full px-3.5 py-2.5">
          <Search size={16} color="#9B9488" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} onFocus={onSearchFocus} placeholder="পণ্য খুঁজুন..." className="w-full text-[13px] outline-none bg-transparent" style={{ color: C.navy, fontFamily: "'Hind Siliguri', sans-serif" }} />
        </div>
      </div>
    </div>
  );
}

function BottomNav({ view, setView, cartCount, isLoggedIn }) {
  const items = [
    { id: "home", label: "Home", icon: HomeIcon },
    { id: "shop", label: "Shop", icon: LayoutGrid },
    { id: "cart", label: "Cart", icon: ShoppingCart },
    { id: "account", label: isLoggedIn ? "Profile" : "Account", icon: User },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t flex" style={{ borderColor: C.line, maxWidth: 480, margin: "0 auto" }}>
      {items.map((it) => {
        const active = view === it.id || (it.id === "cart" && (view === "checkout" || view === "success"));
        const Icon = it.icon;
        return (
          <button key={it.id} onClick={() => setView(it.id)} className="flex-1 flex flex-col items-center gap-0.5 py-2.5 relative">
            <div className="relative">
              <Icon size={20} color={active ? C.brand : "#9B9488"} />
              {it.id === "cart" && cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 text-[9px] font-bold text-white rounded-full w-3.5 h-3.5 flex items-center justify-center" style={{ backgroundColor: C.brand }}>{cartCount}</span>
              )}
              {it.id === "account" && isLoggedIn && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full" style={{ backgroundColor: "#16A34A", border: "1.5px solid #fff" }} />
              )}
            </div>
            <span className="text-[10px] font-medium" style={{ color: active ? C.brand : "#9B9488" }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function FloatingContact() {
  const [open, setOpen] = useState(false);
  const contact = SITE.contact || {};
  const waLink = contact.whatsapp || ("https://wa.me/" + STORE_WHATSAPP_NUMBER);
  const items = [
    contact.phone ? { icon: Phone, label: "কল করুন", color: "#16A34A", href: "tel:" + contact.phone } : null,
    { icon: MessageCircle, label: "হোয়াটসঅ্যাপ", color: "#25D366", href: waLink },
    contact.messenger ? { icon: Send, label: "মেসেঞ্জার", color: "#0084FF", href: contact.messenger } : null,
    contact.telegram ? { icon: Send, label: "টেলিগ্রাম", color: "#229ED9", href: contact.telegram } : null,
  ].filter(Boolean);
  return (
    <div className="fixed z-40" style={{ right: 16, bottom: 78, maxWidth: 480 }}>
      {open && (
        <div className="mb-2 bg-white rounded-2xl shadow-lg p-2 flex flex-col gap-1 border" style={{ borderColor: C.line }}>
          {items.map((b, idx) => (
            <a key={idx} href={b.href} target={b.href.startsWith("tel:") ? undefined : "_blank"} rel="noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 text-[12px] font-medium" style={{ color: C.navy }}>
              <b.icon size={16} color={b.color} /> {b.label}
            </a>
          ))}
        </div>
      )}
      <button onClick={() => setOpen((v) => !v)} className="rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: C.brand, width: 52, height: 52 }}>
        {open ? <X size={22} color="#fff" /> : <MessageCircle size={22} color="#fff" />}
      </button>
    </div>
  );
}

/* ===========================================================
   QUICK INFO BAR — slim two-row info & action strip below hero
=========================================================== */
function TrackOrderModal({ onClose }) {
  const [mobile, setMobile] = useState("");
  const [orderId, setOrderId] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const stMap = { pending: "পেন্ডিং — যাচাই চলছে", confirmed: "কনফার্মড ✅", shipped: "শিপড 🚚", delivered: "ডেলিভারড 🎉", cancelled: "বাতিল" };
  const submit = async () => {
    if (busy || !mobile || !orderId) return;
    setBusy(true); setResult(null);
    try {
      const res = await fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mobile, orderId }) });
      const d = await res.json();
      setResult(d.ok ? { ok: true, o: d.data } : { ok: false, error: d.error });
    } catch { setResult({ ok: false, error: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন" }); }
    finally { setBusy(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: "rgba(15,27,51,0.5)" }} onClick={onClose}>
      <div className="bg-white rounded-t-3xl w-full p-5 pb-8" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[15px] font-bold" style={{ color: C.navy, fontFamily: "'Hind Siliguri', sans-serif" }}>অর্ডার ট্র্যাক করুন</p>
          <button onClick={onClose}><X size={18} color={C.navySoft} /></button>
        </div>
        <div className="flex flex-col gap-2.5">
          <input placeholder="মোবাইল নম্বর (01XXXXXXXXX)" inputMode="numeric" value={mobile} onChange={(e) => setMobile(cleanMobile(e.target.value))} className="border rounded-xl px-3.5 py-2.5 text-[13px] outline-none" style={{ borderColor: C.line, color: C.navy }} />
          <input placeholder="অর্ডার আইডি (যেমন: 12)" value={orderId} onChange={(e) => setOrderId(e.target.value.replace(/\D/g, ""))} inputMode="numeric" className="border rounded-xl px-3.5 py-2.5 text-[13px] outline-none" style={{ borderColor: C.line, color: C.navy }} />
          <button onClick={submit} disabled={busy || !mobile || !orderId} className="w-full py-3 rounded-full font-semibold text-[13px] text-white disabled:opacity-50 flex items-center justify-center gap-2" style={{ backgroundColor: C.brand }}>
            {busy && <Loader2 size={14} className="animate-spin" />} স্ট্যাটাস দেখুন
          </button>
        </div>
        {result && (
          result.ok ? (
            <div className="mt-4 rounded-2xl p-4" style={{ backgroundColor: C.cream }}>
              <p className="text-[13px] font-bold" style={{ color: C.navy }}>অর্ডার #{result.o.id}</p>
              <p className="text-[12.5px] mt-1" style={{ color: C.navySoft }}>স্ট্যাটাস: <b style={{ color: C.brand }}>{stMap[result.o.order_status] || result.o.order_status}</b></p>
              <p className="text-[12px] mt-0.5" style={{ color: C.navySoft }}>মোট: {fmt(result.o.total)} • {result.o.payment_method}</p>
              <p className="text-[11px] mt-0.5" style={{ color: C.navySoft }}>{new Date(result.o.created_at).toLocaleDateString("bn-BD")}</p>
            </div>
          ) : (
            <p className="mt-3 text-[12px] text-center" style={{ color: C.danger }}>{result.error}</p>
          )
        )}
      </div>
    </div>
  );
}

function QuickInfoBar({ trust, goAccount }) {
  const [showTrack, setShowTrack] = useState(false);
  const contact = SITE.contact || {};
  const waLink = contact.whatsapp || ("https://wa.me/" + STORE_WHATSAPP_NUMBER);
  const phoneDigits = (contact.phone || contact.imo || "").replace(/\D/g, "");
  const actions = [
    { icon: Package, label: "ট্র্যাক অর্ডার", color: C.brand, onClick: () => setShowTrack(true) },
    { icon: Clock3, label: "অর্ডার হিস্টরি", color: C.brand, onClick: goAccount },
    ...(phoneDigits ? [{ icon: Phone, label: "কল করুন", color: "#2563EB", href: "tel:" + (contact.phone || contact.imo) }] : []),
    { icon: MessageCircle, label: "হোয়াটসঅ্যাপ", color: "#25D366", href: waLink },
  ];
  return (
    <div className="px-4 mt-3">
      <div className="grid grid-cols-3" style={{ padding: "8px 0 10px" }}>
        {trust.map((t, idx) => (
          <div key={idx} className="flex flex-col items-center" style={{ gap: 4 }}>
            <t.icon size={20} color={C.brand} />
            <span className="text-[11px] text-center leading-tight" style={{ color: "#333", fontFamily: "'Hind Siliguri', sans-serif" }}>{t.label}</span>
          </div>
        ))}
      </div>
      <div className="h-px" style={{ backgroundColor: C.line }} />
      <div className="flex items-center justify-between" style={{ padding: "9px 2px 8px" }}>
        {actions.map((a, idx) => {
          const inner = (
            <>
              <a.icon size={18} color={a.color} />
              <span className="text-[10.5px] leading-tight" style={{ color: "#333", fontFamily: "'Hind Siliguri', sans-serif" }}>{a.label}</span>
            </>
          );
          return a.href ? (
            <a key={idx} href={a.href} target={a.href.startsWith("tel:") ? undefined : "_blank"} rel="noreferrer" className="flex flex-col items-center flex-1" style={{ gap: 4 }}>{inner}</a>
          ) : (
            <button key={idx} onClick={a.onClick} className="flex flex-col items-center flex-1" style={{ gap: 4 }}>{inner}</button>
          );
        })}
      </div>
      <div className="h-px" style={{ backgroundColor: C.line }} />
      {showTrack && <TrackOrderModal onClose={() => setShowTrack(false)} />}
    </div>
  );
}

/* ===========================================================
   HOME / SHOP VIEWS
=========================================================== */
function HomeView({ addToCart, openProduct, goShop, goCategory, goAccount }) {
  const trust = [{ icon: Truck, label: "ফাস্ট ডেলিভারি" }, { icon: ShieldCheck, label: "১০০% অরিজিনাল" }, { icon: Zap, label: "ক্যাশ অন ডেলিভারি" }];
  return (
    <div className="pb-6">
      <HeroBanner onShop={goShop} onCategory={goCategory} />
      <QuickInfoBar trust={trust} goAccount={goAccount} />
      <div className="flex items-center justify-between px-4 mt-6 mb-3">
        <h3 className="font-bold text-[16px]" style={{ color: C.navy, fontFamily: "'Hind Siliguri', sans-serif" }}>ক্যাটাগরি</h3>
        <button onClick={goShop} className="text-[12px] font-semibold flex items-center gap-0.5" style={{ color: C.brand }}>সব দেখুন <ChevronRight size={13} /></button>
      </div>
      <div className="flex gap-4 overflow-x-auto px-4 pb-1" style={{ scrollbarWidth: "none" }}>
        {CATEGORIES.map((c) => (
          <button key={c.id} onClick={() => goCategory(c.id)} className="flex flex-col items-center gap-1.5 shrink-0 w-[68px]">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2" style={{ borderColor: C.line }}>
              <img src={c.image} alt={c.name} className="w-full h-full object-cover" loading="lazy" />
            </div>
            <span className="text-[10.5px] font-medium text-center leading-tight" style={{ color: C.navySoft }}>{c.name}</span>
          </button>
        ))}
      </div>
      <FlashSale onAdd={addToCart} onOpen={openProduct} />
      {SECTIONS.map((sec) => {
        const flashIds = new Set(getFlashItems().map((f) => f.id));
        const items = PRODUCTS.filter((p) => p.active && p.section === sec.key && !flashIds.has(p.id));
        if (items.length === 0) return null;
        return (
          <div key={sec.key}>
            <div className="flex items-center justify-between px-4 mt-6 mb-3">
              <h3 className="font-bold text-[16px]" style={{ color: C.navy, fontFamily: "'Hind Siliguri', sans-serif" }}>{sec.label}</h3>
              <button onClick={goShop} className="text-[12px] font-semibold flex items-center gap-0.5" style={{ color: C.brand }}>সব দেখুন <ChevronRight size={13} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 px-4">
              {items.map((p) => <ProductCard key={p.id} p={p} onAdd={addToCart} onOpen={openProduct} />)}
            </div>
          </div>
        );
      })}
      <div className="mx-4 mt-6 rounded-2xl overflow-hidden relative" style={{ height: 170 }}>
        <img src="https://loremflickr.com/600/340/shopping,lifestyle" className="w-full h-full object-cover" alt="video banner" />
        <div className="absolute inset-0 bg-black/35 flex flex-col items-center justify-center gap-2">
          <button className="w-12 h-12 rounded-full bg-white/95 flex items-center justify-center"><Play size={20} color={C.brand} fill={C.brand} /></button>
          <span className="text-white text-[12px] font-semibold" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>OmniShop BD — কেন আমরা সেরা দেখুন</span>
        </div>
      </div>
    </div>
  );
}

function ShopView({ query, setQuery, activeCat, setActiveCat, addToCart, openProduct }) {
  const filtered = PRODUCTS.filter((p) => p.active && (activeCat === "all" || p.category === activeCat) && p.name.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="pb-6 px-4 pt-4">
      <div className="flex gap-2 overflow-x-auto pb-3" style={{ scrollbarWidth: "none" }}>
        {[{ id: "all", name: "সব" }, ...CATEGORIES].map((c) => (
          <button key={c.id} onClick={() => setActiveCat(c.id)} className="px-3.5 py-1.5 rounded-full text-[12px] font-semibold shrink-0 border" style={{ backgroundColor: activeCat === c.id ? C.brand : "#fff", color: activeCat === c.id ? "#fff" : C.navySoft, borderColor: activeCat === c.id ? C.brand : C.line }}>
            {c.name}
          </button>
        ))}
      </div>
      <p className="text-[12px] mb-3" style={{ color: C.navySoft }}>{filtered.length} টি পণ্য পাওয়া গেছে</p>
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <Search size={32} color="#D8D2C8" />
          <p className="text-[13px]" style={{ color: C.navySoft }}>কোনো পণ্য খুঁজে পাওয়া যায়নি</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">{filtered.map((p) => <ProductCard key={p.id} p={p} onAdd={addToCart} onOpen={openProduct} />)}</div>
      )}
    </div>
  );
}

function ProductDetail({ product, onBack, addToCart }) {
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [size, setSize] = useState("");
  if (!product) return null;
  const sizes = (product.sizes || []).filter(Boolean);
  const needSize = sizes.length > 0 && !size;
  const pct = Math.round(((product.price - product.discount) / product.price) * 100);
  const outOfStock = product.stock <= 0;
  const ytId = product.video && (product.video.match(/(?:v=|youtu\.be\/)([\w-]{6,})/) || [])[1];
  return (
    <div className="pb-24">
      <div className="relative aspect-square bg-white">
        <img src={product.images[activeImg]} alt={product.name} className="w-full h-full object-cover" />
        <button onClick={onBack} className="absolute top-3 left-3 w-9 h-9 rounded-full bg-white/95 flex items-center justify-center shadow"><ArrowLeft size={18} color={C.navy} /></button>
        {outOfStock && <span className="absolute top-3 right-3 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/95" style={{ color: C.danger }}>স্টক শেষ</span>}
      </div>
      {product.images.length > 1 && (
        <div className="flex gap-2 px-4 pt-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {product.images.map((im, i) => (
            <button key={i} onClick={() => setActiveImg(i)} className="w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0" style={{ borderColor: i === activeImg ? C.brand : C.line }}>
              <img src={im} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <div className="px-4 pt-4">
        <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
          {product.featured && <span className="text-[10px] font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: C.cream, color: C.brand }}>Featured</span>}
          <AgentBadge agentType={product.agentType} />
        </div>
        <h2 className="text-[18px] font-bold mb-1" style={{ color: C.navy, fontFamily: "'Hind Siliguri', sans-serif" }}>{product.name}</h2>
        <p className="text-[11.5px]" style={{ color: C.navySoft }}>{product.sold}+ বিক্রি হয়েছে · {outOfStock ? <span style={{ color: C.danger }}>স্টক শেষ</span> : `স্টকে আছে ${product.stock}টি`}</p>
        <div className="flex items-end gap-2 mt-2">
          <span className="text-[22px] font-bold" style={{ color: C.brand }}>{fmt(product.discount)}</span>
          {pct > 0 && (<><span className="text-[14px] line-through" style={{ color: "#B5AFA6" }}>{fmt(product.price)}</span><span className="text-[12px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: "#FDECE6", color: C.brand }}>-{pct}%</span></>)}
        </div>
        <div className="h-px my-4" style={{ backgroundColor: C.line }} />
        <p className="text-[13px] leading-relaxed" style={{ color: C.navySoft, fontFamily: "'Hind Siliguri', sans-serif" }}>
          {product.description || "এই পণ্য সম্পর্কে বিস্তারিত তথ্য শীঘ্রই যুক্ত করা হবে।"}
        </p>
        {ytId && (
          <div className="mt-4 rounded-2xl overflow-hidden aspect-video">
            <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${ytId}`} title="Product video" allowFullScreen />
          </div>
        )}
        {sizes.length > 0 && (
          <div className="mt-5">
            <span className="text-[13px] font-medium" style={{ color: C.navy }}>সাইজ বাছাই করুন {!size && <span className="text-[11px]" style={{ color: C.brand }}>*</span>}</span>
            <div className="flex gap-2 mt-2 flex-wrap">
              {sizes.map((s) => (
                <button key={s} onClick={() => setSize(s)} className="min-w-[44px] px-3 py-2 rounded-xl border text-[13px] font-semibold" style={{ borderColor: size === s ? C.brand : C.line, backgroundColor: size === s ? "#FFF3EC" : "#fff", color: size === s ? C.brand : C.navy }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center gap-3 mt-5">
          <span className="text-[13px] font-medium" style={{ color: C.navy }}>পরিমাণ</span>
          <div className="flex items-center gap-3 border rounded-full px-3 py-1.5" style={{ borderColor: C.line }}>
            <button onClick={() => setQty((q) => Math.max(1, q - 1))}><Minus size={14} color={C.navySoft} /></button>
            <span className="text-[13px] font-semibold w-4 text-center">{qty}</span>
            <button onClick={() => setQty((q) => q + 1)}><Plus size={14} color={C.navySoft} /></button>
          </div>
        </div>
      </div>
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t p-3 flex gap-2" style={{ borderColor: C.line, maxWidth: 480, margin: "0 auto" }}>
        <a href={buildWhatsappLink(product)} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#25D366" }}>
          <MessageCircle size={20} color="#fff" />
        </a>
        <button disabled={outOfStock || needSize} onClick={() => addToCart(product, qty, size)} className="flex-1 py-3 rounded-full font-semibold text-[13px] flex items-center justify-center gap-2 disabled:opacity-40" style={{ backgroundColor: C.brand, color: "#fff" }}>
          <ShoppingCart size={16} /> {outOfStock ? "স্টক শেষ" : needSize ? "আগে সাইজ বাছাই করুন" : "কার্টে যোগ করুন"}
        </button>
      </div>
    </div>
  );
}

/* ===========================================================
   CART / CHECKOUT / SUCCESS
=========================================================== */
function CartView({ cart, updateQty, removeItem, goCheckout, goShop }) {
  const subtotal = cart.reduce((s, i) => s + i.discount * i.qty, 0);
  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 px-6">
        <ShoppingCart size={40} color="#D8D2C8" />
        <p className="text-[14px] font-medium" style={{ color: C.navy }}>আপনার কার্ট খালি</p>
        <button onClick={goShop} className="px-5 py-2.5 rounded-full text-[13px] font-semibold text-white" style={{ backgroundColor: C.brand }}>শপিং শুরু করুন</button>
      </div>
    );
  }
  return (
    <div className="px-4 pt-4 pb-40">
      <h2 className="text-[17px] font-bold mb-3" style={{ color: C.navy, fontFamily: "'Hind Siliguri', sans-serif" }}>আমার কার্ট ({cart.length})</h2>
      <div className="flex flex-col gap-3">
        {cart.map((item) => (
          <div key={item.cartKey || item.id} className="flex gap-3 bg-white border rounded-2xl p-2.5" style={{ borderColor: C.line }}>
            <img src={item.images[0]} className="w-20 h-20 rounded-xl object-cover" alt={item.name} />
            <div className="flex-1 flex flex-col justify-between py-0.5">
              <p className="text-[12.5px] font-medium leading-snug" style={{ color: C.navy, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.name}{item.size ? <span className="ml-1 text-[10.5px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: "#FFF3EC", color: C.brand }}>{item.size}</span> : null}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[14px] font-bold" style={{ color: C.brand }}>{fmt(item.discount)}</span>
                <div className="flex items-center gap-2 border rounded-full px-2 py-1" style={{ borderColor: C.line }}>
                  <button onClick={() => updateQty(item.cartKey, -1)}><Minus size={12} color={C.navySoft} /></button>
                  <span className="text-[12px] font-semibold w-3 text-center">{item.qty}</span>
                  <button onClick={() => updateQty(item.cartKey, 1)}><Plus size={12} color={C.navySoft} /></button>
                </div>
              </div>
            </div>
            <button onClick={() => removeItem(item.cartKey)} className="self-start p-1"><X size={15} color="#B5AFA6" /></button>
          </div>
        ))}
      </div>
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t p-4" style={{ borderColor: C.line, maxWidth: 480, margin: "0 auto" }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[13px]" style={{ color: C.navySoft }}>সাবটোটাল</span>
          <span className="text-[16px] font-bold" style={{ color: C.navy }}>{fmt(subtotal)}</span>
        </div>
        <button onClick={goCheckout} className="w-full py-3 rounded-full font-semibold text-[13px] text-white" style={{ backgroundColor: C.brand }}>চেকআউট করুন</button>
      </div>
    </div>
  );
}

function CheckoutView({ cart, onBack, onConfirm, currentUser }) {
  const [form, setForm] = useState({ name: currentUser?.name || "", phone: currentUser?.mobile || "", city: "Dhaka", district: "", thana: "", address: "" });
  const [area, setArea] = useState("inside");
  const [thanaMode, setThanaMode] = useState("select");
  const payMethods = PAYMENTS.length ? PAYMENTS : [{ id: "cod", name: "Cash on Delivery", account: "", instructions: "", txnRequired: false }];
  const [payment, setPayment] = useState(payMethods.find((m) => /cash|cod|delivery/i.test(m.name))?.id || payMethods[0].id);
  const [senderNo, setSenderNo] = useState("");
  const [trxId, setTrxId] = useState("");
  const [coupon, setCoupon] = useState("");
  const [couponMsg, setCouponMsg] = useState(null);
  const [discountPct, setDiscountPct] = useState(0);
  const [couponAmt, setCouponAmt] = useState(0);
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState(null);

  const subtotal = cart.reduce((s, i) => s + i.discount * i.qty, 0);
  const deliveryFee = area === "inside" ? (DELIVERY.inside?.fee ?? 60) : (DELIVERY.outside?.fee ?? 120);
  const couponDiscount = discountPct > 0 ? Math.round((subtotal * discountPct) / 100) : Math.min(subtotal, couponAmt);
  const total = subtotal - couponDiscount + deliveryFee;

  const applyCoupon = () => {
    const code = coupon.trim().toUpperCase();
    const c = COUPONS.find((x) => x.enabled !== false && String(x.code).toUpperCase() === code);
    if (c) {
      if (c.type === "percentage") { setDiscountPct(Number(c.value)); setCouponAmt(0); }
      else { setDiscountPct(0); setCouponAmt(Number(c.value)); }
      setCouponMsg({ ok: true, text: c.type === "percentage" ? `কুপন প্রয়োগ হয়েছে — ${c.value}% ছাড়!` : `কুপন প্রয়োগ হয়েছে — ৳${c.value} ছাড়!` });
    } else { setDiscountPct(0); setCouponAmt(0); setCouponMsg({ ok: false, text: "কুপন কোড সঠিক নয়" }); }
  };
  const [phoneTouched, setPhoneTouched] = useState(false);
  const phoneValid = MOBILE_REGEX.test(form.phone);
  const showPhoneError = phoneTouched && form.phone.length > 0 && !phoneValid;
  const valid = form.name && phoneValid && form.address;

  const selPay = payMethods.find((m) => m.id === payment);
  const payOk = !selPay?.txnRequired || trxId.trim().length >= 4;

  const submitOrder = async () => {
    if (!valid || !payOk || placing) return;
    setPlacing(true); setPlaceError(null);
    try {
      const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cart: cart.map((i) => ({ id: i.id, qty: i.qty, size: i.size || "" })), form, area, payment: selPay?.name || payment, trxId, senderNo, coupon }) });
      const d = await res.json();
      if (d.ok) onConfirm(d.data.total, d.data.orderId);
      else setPlaceError(d.error || "অর্ডার তৈরি ব্যর্থ — আবার চেষ্টা করুন");
    } catch { setPlaceError("নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন"); }
    finally { setPlacing(false); }
  };

  return (
    <div className="px-4 pt-4 pb-32">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={onBack}><ArrowLeft size={19} color={C.navy} /></button>
        <h2 className="text-[17px] font-bold" style={{ color: C.navy, fontFamily: "'Hind Siliguri', sans-serif" }}>চেকআউট</h2>
      </div>
      <div className="bg-white border rounded-2xl p-4 mb-4" style={{ borderColor: C.line }}>
        <p className="text-[13px] font-semibold mb-3" style={{ color: C.navy }}>ডেলিভারি তথ্য</p>
        <div className="flex flex-col gap-2.5">
          <input placeholder="পূর্ণ নাম" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border rounded-xl px-3.5 py-2.5 text-[13px] outline-none" style={{ borderColor: C.line, color: C.navy }} />
          <div>
            <input placeholder="মোবাইল (01XXXXXXXXX)" value={form.phone} inputMode="numeric" maxLength={11}
              onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 11) })}
              onBlur={() => setPhoneTouched(true)}
              className="w-full border rounded-xl px-3.5 py-2.5 text-[13px] outline-none" style={{ borderColor: showPhoneError ? C.brand : C.line, color: C.navy }} />
            {showPhoneError && <p className="text-[11px] mt-1" style={{ color: C.brand }}>সঠিক মোবাইল নম্বর দিন (যেমন: 01712345678)</p>}
            {phoneValid && <p className="text-[11px] mt-1" style={{ color: "#16A34A" }}>✓ সঠিক নম্বর</p>}
          </div>
          <div className="flex gap-2.5">
            <div className="relative flex-1">
              <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value, district: "" })} className="w-full appearance-none border rounded-xl px-3.5 py-2.5 text-[13px] outline-none bg-white" style={{ borderColor: C.line, color: C.navy }}>
                {Object.keys(BD_DISTRICTS).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" color={C.navySoft} />
            </div>
            <div className="relative flex-1">
              <select value={form.district} onChange={(e) => { setThanaMode("select"); setForm({ ...form, district: e.target.value, thana: "" }); }} className="w-full appearance-none border rounded-xl px-3.5 py-2.5 text-[13px] outline-none bg-white" style={{ borderColor: C.line, color: C.navy }}>
                <option value="">জেলা বাছাই করুন</option>
                {(BD_DISTRICTS[form.city] || []).map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" color={C.navySoft} />
            </div>
          </div>
          <div className="relative">
            <select value={thanaMode === "custom" ? "__other" : form.thana} disabled={!form.district}
              onChange={(e) => {
                if (e.target.value === "__other") { setThanaMode("custom"); setForm({ ...form, thana: "" }); }
                else { setThanaMode("select"); setForm({ ...form, thana: e.target.value }); }
              }}
              className="w-full appearance-none border rounded-xl px-3.5 py-2.5 text-[13px] outline-none bg-white disabled:opacity-50" style={{ borderColor: C.line, color: C.navy }}>
              <option value="">{form.district ? "থানা / উপজেলা বাছাই করুন" : "আগে জেলা বাছাই করুন"}</option>
              {(BD_UPAZILAS[form.district] || []).map((t) => <option key={t} value={t}>{t}</option>)}
              <option value="__other">অন্যান্য (নিজে লিখুন)</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" color={C.navySoft} />
          </div>
          {thanaMode === "custom" && (
            <input placeholder="আপনার থানা / উপজেলার নাম লিখুন" value={form.thana} onChange={(e) => setForm({ ...form, thana: e.target.value })} className="border rounded-xl px-3.5 py-2.5 text-[13px] outline-none" style={{ borderColor: C.line, color: C.navy }} />
          )}
          <textarea placeholder="সম্পূর্ণ ঠিকানা" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} className="border rounded-xl px-3.5 py-2.5 text-[13px] outline-none resize-none" style={{ borderColor: C.line, color: C.navy }} />
        </div>
      </div>
      <div className="bg-white border rounded-2xl p-4 mb-4" style={{ borderColor: C.line }}>
        <p className="text-[13px] font-semibold mb-3" style={{ color: C.navy }}>ডেলিভারি এরিয়া</p>
        {[{ id: "inside", ...DELIVERY.inside }, { id: "outside", ...DELIVERY.outside }].map((o) => (
          <label key={o.id} className="flex items-center gap-2.5 py-1.5 cursor-pointer">
            <input type="radio" checked={area === o.id} onChange={() => setArea(o.id)} style={{ accentColor: C.brand, width: 15, height: 15 }} />
            <MapPin size={12} color={C.navySoft} />
            <span className="text-[12.5px]" style={{ color: C.navy }}>{o.label} — ৳{o.fee}</span>
            <span className="text-[10.5px] ml-auto" style={{ color: C.navySoft }}>({o.time})</span>
          </label>
        ))}
      </div>
      <div className="bg-white border rounded-2xl p-4 mb-4" style={{ borderColor: C.line }}>
        <p className="text-[13px] font-semibold mb-3" style={{ color: C.navy }}>পেমেন্ট মেথড</p>
        {payMethods.map((o) => {
          const isCod = /cash|cod|delivery/i.test(o.name);
          const Icon = isCod ? Truck : Landmark;
          return (
            <label key={o.id} className="flex items-center gap-2.5 py-1.5 cursor-pointer">
              <input type="radio" checked={payment === o.id} onChange={() => setPayment(o.id)} style={{ accentColor: C.brand, width: 15, height: 15 }} />
              <Icon size={12} color={C.navySoft} />
              <span className="text-[12.5px]" style={{ color: C.navy }}>{o.name}</span>
            </label>
          );
        })}
        {(() => {
          const sel = payMethods.find((m) => m.id === payment);
          if (!sel || !sel.txnRequired) return null;
          return (
            <div className="mt-2 flex flex-col gap-2">
              <p className="text-[11.5px] rounded-xl p-2.5 leading-relaxed" style={{ backgroundColor: C.cream, color: C.navySoft }}>
                <b style={{ color: C.navy }}>{sel.name}</b> নম্বর: <b style={{ color: C.brand }}>{sel.account || "—"}</b>{sel.instructions ? " — " + sel.instructions : ""}
              </p>
              <input placeholder="যে নম্বর থেকে টাকা পাঠালেন" inputMode="numeric" value={senderNo} onChange={(e) => setSenderNo(cleanMobile(e.target.value))} className="border rounded-xl px-3.5 py-2.5 text-[13px] outline-none" style={{ borderColor: C.line, color: C.navy }} />
              <input placeholder="Transaction ID" value={trxId} onChange={(e) => setTrxId(e.target.value)} className="border rounded-xl px-3.5 py-2.5 text-[13px] outline-none" style={{ borderColor: C.line, color: C.navy }} />
            </div>
          );
        })()}
      </div>
      <div className="bg-white border rounded-2xl p-4 mb-4 flex gap-2" style={{ borderColor: C.line }}>
        <div className="flex-1 flex items-center gap-2 border rounded-xl px-3" style={{ borderColor: C.line }}>
          <Tag size={14} color={C.navySoft} />
          <input placeholder="কুপন কোড (OMNI10)" value={coupon} onChange={(e) => setCoupon(e.target.value)} className="w-full py-2.5 text-[13px] outline-none" style={{ color: C.navy }} />
        </div>
        <button onClick={applyCoupon} className="px-4 rounded-xl text-[12px] font-semibold text-white" style={{ backgroundColor: C.teal }}>প্রয়োগ</button>
      </div>
      {couponMsg && <p className="text-[12px] mb-3 -mt-2" style={{ color: couponMsg.ok ? "#16A34A" : C.brand }}>{couponMsg.text}</p>}
      <div className="bg-white border rounded-2xl p-4 mb-5" style={{ borderColor: C.line }}>
        <div className="flex justify-between text-[13px] mb-1.5" style={{ color: C.navySoft }}><span>সাবটোটাল</span><span>{fmt(subtotal)}</span></div>
        {discountPct > 0 && <div className="flex justify-between text-[13px] mb-1.5" style={{ color: "#16A34A" }}><span>কুপন ছাড়</span><span>-{fmt(couponDiscount)}</span></div>}
        <div className="flex justify-between text-[13px] mb-2" style={{ color: C.navySoft }}><span>ডেলিভারি</span><span>{fmt(deliveryFee)}</span></div>
        <div className="h-px mb-2" style={{ backgroundColor: C.line }} />
        <div className="flex justify-between text-[15px] font-bold" style={{ color: C.navy }}><span>মোট</span><span style={{ color: C.brand }}>{fmt(total)}</span></div>
      </div>
      <button disabled={!valid || !payOk || placing} onClick={submitOrder} className="w-full py-3.5 rounded-full font-semibold text-[14px] text-white disabled:opacity-40" style={{ backgroundColor: C.brand }}>
        {placing ? "অর্ডার হচ্ছে..." : <>অর্ডার কনফার্ম করুন ({fmt(total)})</>}
      </button>
      {placeError && <p className="text-[12px] text-center mt-2" style={{ color: C.danger }}>{placeError}</p>}
      {!valid && <p className="text-[11px] text-center mt-2" style={{ color: C.navySoft }}>নাম, সঠিক মোবাইল ও ঠিকানা পূরণ করুন</p>}
    </div>
  );
}

function SuccessView({ total, orderId, onContinue }) {
  const waMsg = encodeURIComponent(`আসসালামুয়ালাইকুম, আমার অর্ডারটি কনফার্ম করুন।\n🆔 Order ID: ${orderId}\n💰 মোট: ৳${total}`);
  const waHref = `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${waMsg}`;
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center gap-3">
      <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: "#E9F9EF" }}><CheckCircle2 size={34} color="#16A34A" /></div>
      <h2 className="text-[17px] font-bold" style={{ color: C.navy, fontFamily: "'Hind Siliguri', sans-serif" }}>অর্ডার সফল হয়েছে!</h2>
      <p className="text-[13px]" style={{ color: C.navySoft }}>আপনার অর্ডার মূল্য {fmt(total)} — শীঘ্রই আমরা আপনার সাথে যোগাযোগ করব।</p>
      {orderId && <p className="text-[13px] font-bold" style={{ color: C.brand }}>অর্ডার আইডি: #{orderId}</p>}
      {orderId && (
        <a href={waHref} target="_blank" rel="noreferrer" className="mt-1 px-5 py-2.5 rounded-full text-[12.5px] font-semibold text-white flex items-center gap-2" style={{ backgroundColor: "#25D366" }}>
          <MessageCircle size={15} /> WhatsApp-এ কনফার্ম করুন
        </a>
      )}
      <button onClick={onContinue} className="mt-2 px-6 py-2.5 rounded-full text-[13px] font-semibold text-white" style={{ backgroundColor: C.brand }}>শপিং চালিয়ে যান</button>
    </div>
  );
}

/* ===========================================================
   ACCOUNT — LOGIN / REGISTER / PROFILE
=========================================================== */
function GoogleButton({ onClick }) {
  return (
    <button onClick={onClick} className="w-full mt-2.5 py-3 rounded-full font-medium text-[13px] flex items-center justify-center gap-2 border" style={{ borderColor: C.line, color: C.navy }}>
      <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.9 32.6 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34 5.6 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.6 15.6 18.9 12.7 24 12.7c3.1 0 5.8 1.1 8 3l6-6C34 5.6 29.3 4 24 4c-7.7 0-14.4 4.3-17.7 10.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.6 2.4-7.2 2.4-5.4 0-9.9-3.4-11.5-8.2l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.9 2.6-2.7 4.9-5.1 6.6l6.2 5.2C39.9 37.1 44 31.1 44 24c0-1.2-.1-2.4-.4-3.5z"/></svg>
      Google দিয়ে চালিয়ে যান
    </button>
  );
}

function AuthForms({ registerUser, loginUser, googleLogin, authLoading, onAuthSuccess }) {
  const [tab, setTab] = useState("login");
  const [showPw, setShowPw] = useState(false);
  const [msg, setMsg] = useState(null);
  const [login, setLogin] = useState({ mobile: "", password: "" });
  const [reg, setReg] = useState({ name: "", mobile: "", password: "", confirm: "" });

  const submitLogin = async () => {
    setMsg(null);
    const res = await loginUser(login);
    if (!res.ok) setMsg({ ok: false, text: res.error });
    else onAuthSuccess();
  };

  const submitRegister = async () => {
    setMsg(null);
    if (reg.password !== reg.confirm) { setMsg({ ok: false, text: "পাসওয়ার্ড মিলছে না" }); return; }
    const res = await registerUser(reg);
    if (!res.ok) setMsg({ ok: false, text: res.error });
    else onAuthSuccess();
  };

  return (
    <div className="px-4 pt-6 pb-10">
      <div className="bg-white border rounded-2xl p-5" style={{ borderColor: C.line }}>
        <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-3" style={{ backgroundColor: C.cream }}>
          <User size={24} color={C.brand} />
        </div>
        <p className="text-[14px] font-semibold text-center" style={{ color: C.navy }}>OmniShop BD-তে স্বাগতম</p>

        <div className="flex bg-gray-50 rounded-full p-1 mt-4 mb-4">
          {[{ id: "login", label: "লগইন" }, { id: "register", label: "রেজিস্ট্রেশন" }].map((t) => (
            <button key={t.id} onClick={() => { setTab(t.id); setMsg(null); }} className="flex-1 py-2 rounded-full text-[12.5px] font-semibold transition-colors" style={{ backgroundColor: tab === t.id ? C.brand : "transparent", color: tab === t.id ? "#fff" : C.navySoft }}>
              {t.label}
            </button>
          ))}
        </div>

        {msg && (
          <div className="flex items-start gap-2 rounded-xl px-3 py-2.5 mb-3 text-[12px]" style={{ backgroundColor: msg.ok ? "#E9F9EF" : "#FDECE6", color: msg.ok ? "#16A34A" : C.brand }}>
            <AlertCircle size={14} className="mt-0.5 shrink-0" /> <span>{msg.text}</span>
          </div>
        )}

        {tab === "login" ? (
          <div className="flex flex-col gap-2.5">
            <input placeholder="মোবাইল (01XXXXXXXXX)" inputMode="numeric" value={login.mobile} onChange={(e) => setLogin({ ...login, mobile: cleanMobile(e.target.value) })} className="border rounded-xl px-3.5 py-2.5 text-[13px] outline-none" style={{ borderColor: C.line, color: C.navy }} />
            <div className="relative">
              <input type={showPw ? "text" : "password"} placeholder="পাসওয়ার্ড" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} className="w-full border rounded-xl px-3.5 py-2.5 pr-10 text-[13px] outline-none" style={{ borderColor: C.line, color: C.navy }} />
              <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setShowPw((v) => !v)}>{showPw ? <EyeOff size={15} color={C.navySoft} /> : <Eye size={15} color={C.navySoft} />}</button>
            </div>
            <button onClick={submitLogin} disabled={authLoading || !login.mobile || !login.password} className="w-full py-3 rounded-full font-semibold text-[13px] text-white disabled:opacity-50 flex items-center justify-center gap-2" style={{ backgroundColor: C.brand }}>
              {authLoading && <Loader2 size={14} className="animate-spin" />} লগইন করুন
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <input placeholder="পূর্ণ নাম" value={reg.name} onChange={(e) => setReg({ ...reg, name: e.target.value })} className="border rounded-xl px-3.5 py-2.5 text-[13px] outline-none" style={{ borderColor: C.line, color: C.navy }} />
            <input placeholder="মোবাইল (01XXXXXXXXX)" inputMode="numeric" value={reg.mobile} onChange={(e) => setReg({ ...reg, mobile: cleanMobile(e.target.value) })} className="border rounded-xl px-3.5 py-2.5 text-[13px] outline-none" style={{ borderColor: C.line, color: C.navy }} />
            <input type="password" placeholder="পাসওয়ার্ড (কমপক্ষে ৬ ক্যারেক্টার)" value={reg.password} onChange={(e) => setReg({ ...reg, password: e.target.value })} className="border rounded-xl px-3.5 py-2.5 text-[13px] outline-none" style={{ borderColor: C.line, color: C.navy }} />
            <input type="password" placeholder="পাসওয়ার্ড কনফার্ম করুন" value={reg.confirm} onChange={(e) => setReg({ ...reg, confirm: e.target.value })} className="border rounded-xl px-3.5 py-2.5 text-[13px] outline-none" style={{ borderColor: C.line, color: C.navy }} />
            <button onClick={submitRegister} disabled={authLoading || !reg.name || !reg.mobile || !reg.password || !reg.confirm} className="w-full py-3 rounded-full font-semibold text-[13px] text-white disabled:opacity-50 flex items-center justify-center gap-2" style={{ backgroundColor: C.brand }}>
              {authLoading && <Loader2 size={14} className="animate-spin" />} রেজিস্ট্রেশন করুন
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

function ProfileView({ user, onLogout }) {
  const initials = user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const [orders, setOrders] = useState(null);
  useEffect(() => {
    fetch("/api/my-orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mobile: user.mobile }) })
      .then((r) => r.json()).then((d) => setOrders(d.ok ? d.data : [])).catch(() => setOrders([]));
  }, [user.mobile]);
  const stMap = { pending: "পেন্ডিং", confirmed: "কনফার্মড", shipped: "শিপড", delivered: "ডেলিভারড", cancelled: "বাতিল" };
  return (
    <div className="px-4 pt-6 pb-10">
      <div className="bg-white border rounded-2xl p-5" style={{ borderColor: C.line }}>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-[16px]" style={{ backgroundColor: C.brand }}>{initials}</div>
          <div>
            <p className="text-[15px] font-bold" style={{ color: C.navy }}>{user.name}</p>
            <p className="text-[12.5px]" style={{ color: C.navySoft }}>{user.mobile}</p>
          </div>
        </div>
        <button className="w-full mt-4 py-2.5 rounded-full text-[12.5px] font-semibold border" style={{ borderColor: C.line, color: C.navySoft }} disabled>
          প্রোফাইল এডিট (শীঘ্রই আসছে)
        </button>
      </div>

      <div className="bg-white border rounded-2xl p-5 mt-4" style={{ borderColor: C.line }}>
        <p className="text-[13px] font-semibold mb-3" style={{ color: C.navy }}>অর্ডার হিস্টরি</p>
        {orders === null ? (
          <div className="flex justify-center py-8"><Loader2 size={22} color={C.brand} className="animate-spin" /></div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Package size={30} color="#D8D2C8" />
            <p className="text-[12.5px]" style={{ color: C.navySoft }}>এখনো কোনো অর্ডার নেই</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {orders.map((o) => (
              <div key={o.id} className="flex items-center justify-between border rounded-xl px-3 py-2.5" style={{ borderColor: C.line }}>
                <div>
                  <p className="text-[12.5px] font-semibold" style={{ color: C.navy }}>অর্ডার #{o.id}</p>
                  <p className="text-[11px]" style={{ color: C.navySoft }}>{new Date(o.created_at).toLocaleDateString("bn-BD")} • {o.payment_method}</p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-bold" style={{ color: C.brand }}>{fmt(o.total)}</p>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: C.cream, color: C.navySoft }}>{stMap[o.order_status] || o.order_status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={onLogout} className="w-full mt-4 py-3 rounded-full font-semibold text-[13px] flex items-center justify-center gap-2" style={{ backgroundColor: "#FDECE6", color: C.brand }}>
        <LogOut size={15} /> লগআউট
      </button>
    </div>
  );
}

function SiteFooter() {
  const [policy, setPolicy] = useState(null);
  const content = SITE.content || {};
  const items = [
    { key: "privacy", label: "প্রাইভেসি পলিসি", text: content.privacy },
    { key: "returnPolicy", label: "রিটার্ন পলিসি", text: content.returnPolicy },
    { key: "terms", label: "শর্তাবলী", text: content.terms },
  ];
  return (
    <div className="px-4 pb-8 pt-1 text-center">
      <div className="flex items-center justify-center gap-4">
        {items.map((it) => (
          <button key={it.key} onClick={() => setPolicy(it)} className="text-[11px] underline" style={{ color: C.navySoft }}>{it.label}</button>
        ))}
      </div>
      <p className="text-[10.5px] mt-2" style={{ color: "#B5AFA6" }}>© {new Date().getFullYear()} {SITE.siteName || "OmniShop BD"}</p>
      {policy && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: "rgba(15,27,51,0.5)" }} onClick={() => setPolicy(null)}>
          <div className="bg-white rounded-t-3xl w-full p-5 pb-8 text-left" style={{ maxWidth: 480, maxHeight: "70vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[15px] font-bold" style={{ color: C.navy, fontFamily: "'Hind Siliguri', sans-serif" }}>{policy.label}</p>
              <button onClick={() => setPolicy(null)}><X size={18} color={C.navySoft} /></button>
            </div>
            <p className="text-[13px] leading-relaxed whitespace-pre-line" style={{ color: C.navySoft }}>{policy.text || "শীঘ্রই যুক্ত হবে।"}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function AccountView({ auth, onAuthSuccess }) {
  if (auth.currentUser) return <ProfileView user={auth.currentUser} onLogout={auth.logoutUser} />;
  return <AuthForms registerUser={auth.registerUser} loginUser={auth.loginUser} googleLogin={auth.googleLogin} authLoading={auth.authLoading} onAuthSuccess={onAuthSuccess} />;
}

/* ===========================================================
   APP
=========================================================== */
function AppInner() {
  const auth = useAuthStore();
  const [view, setView] = useState("home");
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("all");
  const [cart, setCart] = useState([]);
  const [product, setProduct] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [orderTotal, setOrderTotal] = useState(0);

  const addToCart = (p, qty = 1, size = "") => {
    setCart((prev) => {
      const key = String(p.id) + "|" + (size || "");
      const existing = prev.find((i) => i.cartKey === key);
      if (existing) return prev.map((i) => (i.cartKey === key ? { ...i, qty: i.qty + qty } : i));
      return [...prev, { ...p, qty, size: size || "", cartKey: key }];
    });
  };
  const updateQty = (key, delta) => setCart((prev) => prev.map((i) => (i.cartKey === key ? { ...i, qty: Math.max(1, i.qty + delta) } : i)).filter((i) => i.qty > 0));
  const removeItem = (key) => setCart((prev) => prev.filter((i) => i.cartKey !== key));
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const goShop = () => { setActiveCat("all"); setView("shop"); };
  const goCategory = (id) => { setActiveCat(id); setView("shop"); };
  const openProduct = (p) => { setProduct(p); setView("product"); };
  // Successful login/register redirects to homepage per spec
  const [orderIdDone, setOrderIdDone] = useState(null);
  const confirmOrder = (total, orderId) => { setOrderTotal(total); setOrderIdDone(orderId); setCart([]); setView("success"); };

  useEffect(() => {
    if (auth.currentUser && view === "account") {
      // stay on account (now shows profile) — no forced redirect needed here
    }
  }, [auth.currentUser]); // eslint-disable-line

  const onScroll = (e) => setScrolled(e.target.scrollTop > 4);

  return (
    <div className="w-full min-h-screen flex justify-center" style={{ backgroundColor: "#F7F4EF", fontFamily: "'Poppins', 'Hind Siliguri', sans-serif" }}>
      <style>{FONT_IMPORT}</style>
      <div className="w-full relative" style={{ maxWidth: 480, backgroundColor: "#F7F4EF" }}>
        {view !== "product" && <Header query={query} setQuery={setQuery} cartCount={cartCount} scrolled={scrolled} onSearchFocus={goShop} onCartClick={() => setView("cart")} />}
        <div onScroll={onScroll} style={{ minHeight: "70vh" }}>
          {view === "home" && <><HomeView addToCart={addToCart} openProduct={openProduct} goShop={goShop} goCategory={goCategory} goAccount={() => setView("account")} /><SiteFooter /></>}
          {view === "shop" && <ShopView query={query} setQuery={setQuery} activeCat={activeCat} setActiveCat={setActiveCat} addToCart={addToCart} openProduct={openProduct} />}
          {view === "product" && <ProductDetail product={product} onBack={() => setView("shop")} addToCart={(p, q, s) => { addToCart(p, q, s); setView("cart"); }} />}
          {view === "cart" && <CartView cart={cart} updateQty={updateQty} removeItem={removeItem} goCheckout={() => setView("checkout")} goShop={goShop} />}
          {view === "checkout" && <CheckoutView cart={cart} onBack={() => setView("cart")} onConfirm={confirmOrder} currentUser={auth.currentUser} />}
          {view === "success" && <SuccessView total={orderTotal} orderId={orderIdDone} onContinue={() => setView("home")} />}
          {view === "account" && <AccountView auth={auth} onAuthSuccess={() => setView("home")} />}
        </div>

        {view === "home" && (
          <div className="px-4 pt-2 pb-24">
            <div className="rounded-2xl p-5" style={{ backgroundColor: C.navy }}>
              <p className="text-white font-bold text-[15px] mb-1" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>OmniShop BD</p>
              <p className="text-white/70 text-[12px] mb-3">বাংলাদেশের বিশ্বস্ত অনলাইন শপ। ক্যাশ অন ডেলিভারি সুবিধা।</p>
              <div className="flex gap-3">{[Facebook, Instagram, Send].map((I, idx) => <div key={idx} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><I size={14} color="#fff" /></div>)}</div>
            </div>
          </div>
        )}

        {(view === "home" || view === "shop") && <FloatingContact />}
        <BottomNav view={view} setView={setView} cartCount={cartCount} isLoggedIn={!!auth.currentUser} />
      </div>
    </div>
  );
}


/* ===========================================================
   BOOTSTRAP WRAPPER — loads live catalog from the database,
   then renders the untouched UI. Shows the branded loader
   until the first payload arrives.
=========================================================== */
export default function App() {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/bootstrap", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (!d.ok) throw new Error(d.error || "bootstrap failed");
        CATEGORIES = d.categories || [];
        SECTIONS = (d.sections || []).map((s) => ({ key: s.key, label: s.label }));
        AGENT_TYPES = { normal: null };
        for (const a of d.agentTypes || []) {
          if (a.key === "normal") continue;
          AGENT_TYPES[a.key] = { label: a.label, tone: a.tone === "brand" ? "gold" : "info" };
        }
        PRODUCTS = d.products || [];
        HERO_SLIDES = d.heroSlides || [];
        if (d.delivery) DELIVERY = d.delivery;
        COUPONS = d.coupons || [];
        PAYMENTS = d.paymentMethods || [];
        SITE = { ...(d.settings || {}), content: d.content || {} };
        if (d.whatsappNumber) STORE_WHATSAPP_NUMBER = d.whatsappNumber;
        setReady(true);
      })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, []);

  if (failed)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-8 text-center" style={{ backgroundColor: C.cream }}>
        <AlertCircle size={34} color={C.brand} />
        <p className="text-[14px] font-semibold" style={{ color: C.navy, fontFamily: "'Hind Siliguri', sans-serif" }}>সংযোগে সমস্যা হচ্ছে</p>
        <button onClick={() => location.reload()} className="px-6 py-2.5 rounded-full text-[13px] font-semibold text-white" style={{ backgroundColor: C.brand }}>আবার চেষ্টা করুন</button>
      </div>
    );
  if (!ready)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{ backgroundColor: C.cream }}>
        <Loader2 size={30} color={C.brand} className="animate-spin" />
        <p className="text-[13px] font-medium" style={{ color: C.navySoft, fontFamily: "'Hind Siliguri', sans-serif" }}>লোড হচ্ছে...</p>
      </div>
    );
  return <AppInner />;
}
