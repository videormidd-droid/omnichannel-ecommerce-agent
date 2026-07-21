"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, Package, Tags, ShoppingBag, Wallet, Truck, Users, Ticket,
  FileText, Headphones, MapPin, Settings, LogOut, Menu, Bell, Search, Plus,
  Pencil, Trash2, X, Check, ChevronDown, Image as ImageIcon, AlertTriangle,
  TrendingUp, DollarSign, Clock, Star, Eye, EyeOff, Loader2, Package2,
  ShoppingCart, CheckCircle2, XCircle, ChevronRight, Save, Phone, Send,
  MessageCircle, UserPlus, Boxes, Percent, UploadCloud, Rows, Zap, Film,
  Rocket, Crown, Link2, GalleryHorizontal, Images, Copy, ExternalLink
} from "lucide-react";

/* ===========================================================
   DESIGN TOKENS — same brand identity as the customer site,
   restyled into a SaaS admin layout (sidebar + topbar).
=========================================================== */
const C = {
  brand: "#FF4713",
  brandDark: "#D93A0C",
  navy: "#0F1B33",
  navySoft: "#425066",
  teal: "#0E9E93",
  cream: "#FFF8F3",
  line: "#EAE6DF",
  bg: "#F7F5F1",
  gold: "#E8A33D",
  danger: "#DC2626",
  success: "#16A34A",
  sidebar: "#0F1B33",
};
const FONT_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');";

/* ===========================================================
   MOCK "DATABASE" — every table below maps 1:1 to a future
   Supabase table. CRUD helper comments show exactly where
   the real query goes later. No hardcoded business data —
   only a seed admin account exists so the login demo works.
=========================================================== */
const SEED_DB = {
  // table: admins (id, email, password, role, created_at)
  admins: [
    { id: "adm_1", email: "admin@omnishopbd.com", password: "admin123", role: "Super Admin", created_at: new Date().toISOString() },
  ],
  // table: categories (id, name, image, has_size, created_at)
  categories: [
    { id: "cat_1", name: "Electronics", image: "https://loremflickr.com/200/200/electronics", hasSize: false },
    { id: "cat_2", name: "Fashion", image: "https://loremflickr.com/200/200/clothing", hasSize: true },
    { id: "cat_3", name: "Gadgets", image: "https://loremflickr.com/200/200/smartwatch", hasSize: false },
    { id: "cat_4", name: "Accessories", image: "https://loremflickr.com/200/200/accessory", hasSize: false },
  ],
  // table: products (...)
  // NEW fields added on top of the existing ones (old data kept as-is):
  //   section   -> which homepage block the item shows in (see `sections` table)
  //   agentType -> handling/display behaviour (see `agentTypes` table)
  //   whatsapp  -> ready-made wa.me link with a pre-filled per-product message
  products: [
    { id: "p_1", name: "Premium Leather Tote Bag", price: 3200, discount: 2650, stock: 24, sold: 58, category: "cat_4", subcategory: "Bags", tags: "leather,bag,women", images: ["https://loremflickr.com/500/500/leather,handbag?lock=1", "https://loremflickr.com/500/500/leather,handbag?lock=2"], video: "", description: "প্রিমিয়াম মানের লেদার ব্যাগ।", featured: true, active: true, section: "homepage_top", agentType: "normal", whatsapp: "" },
    { id: "p_2", name: "Pro Wireless Earbuds ANC", price: 4500, discount: 3420, stock: 6, sold: 132, category: "cat_1", subcategory: "Audio", tags: "earbuds,wireless", images: ["https://loremflickr.com/500/500/earbuds?lock=3"], video: "", description: "নয়েজ ক্যান্সেলেশন সহ প্রিমিয়াম ইয়ারবাডস।", featured: true, active: true, section: "homepage_middle", agentType: "railway", whatsapp: "" },
    { id: "p_3", name: "Classic Trench Coat", price: 3799, discount: 2999, stock: 0, sold: 41, category: "cat_2", subcategory: "Jackets", tags: "coat,fashion", images: ["https://loremflickr.com/500/500/trenchcoat?lock=4"], video: "", description: "শীতের জন্য পারফেক্ট ট্রেঞ্চ কোট।", featured: false, active: true, section: "homepage_bottom", agentType: "hyper", whatsapp: "" },
  ],
  // table: sections — controls WHERE on the homepage an item appears.
  // Admin can add new ones any time (see Sections manager) — the frontend
  // just does products.filter(p => p.section === key) per section.
  sections: [
    { id: "sec_1", key: "homepage_top", label: "হোমপেজ — উপরে (Top)" },
    { id: "sec_2", key: "homepage_middle", label: "হোমপেজ — মাঝখানে (Middle)" },
    { id: "sec_3", key: "homepage_bottom", label: "হোমপেজ — নিচে (Bottom)" },
  ],
  // table: agent_types — controls HOW an item behaves/looks on the storefront.
  // Admin can add new ones any time (see Agent Types manager).
  agentTypes: [
    { id: "agt_1", key: "normal", label: "Normal", badge: "সাধারণ প্রদর্শন", tone: "neutral" },
    { id: "agt_2", key: "railway", label: "Railway", badge: "⚡ ফাস্ট / বাল্ক অর্ডার", tone: "info" },
    { id: "agt_3", key: "hyper", label: "Hyper", badge: "👑 প্রিমিয়াম / অটো-প্রসেসিং", tone: "brand" },
  ],
  // table: hero_slides — controls the homepage hero banner carousel.
  // Same image field + uploadFile() logic as products/categories, so an
  // uploaded photo drops straight into the slider with zero extra wiring.
  heroSlides: [
    { id: "hero_1", tag: "নতুন কালেকশন", title: "শরতের সেরা ফ্যাশন", sub: "ট্রেন্ডি জ্যাকেট ও কোট — ৪০% পর্যন্ত ছাড়", cta: "কালেকশন দেখুন", link: "", image: "https://loremflickr.com/900/1100/fashion,coat,model" },
    { id: "hero_2", tag: "টেক সেল", title: "ইলেকট্রনিক্স মেগা সেল", sub: "ফোন, ল্যাপটপ ও গ্যাজেটে বিশেষ অফার", cta: "অফার দেখুন", link: "", image: "https://loremflickr.com/900/1100/electronics,gadgets" },
  ],
  // table: orders (...)
  orders: [
    { id: "OSBD-100231", customer: "Rafiq Islam", phone: "01711223344", items: [{ name: "Premium Leather Tote Bag", qty: 1 }], total: 2710, payment: "bKash", txnId: "8F3K9AZ1", status: "pending", paymentStatus: "paid", deliveryStatus: "processing", createdAt: new Date(Date.now() - 3600e3).toISOString() },
    { id: "OSBD-100230", customer: "Sadia Akter", phone: "01899887766", items: [{ name: "Pro Wireless Earbuds ANC", qty: 1 }], total: 3480, payment: "COD", txnId: "", status: "confirmed", paymentStatus: "unpaid", deliveryStatus: "processing", createdAt: new Date(Date.now() - 7200e3).toISOString() },
    { id: "OSBD-100229", customer: "Tanvir Hasan", phone: "01611998877", items: [{ name: "Classic Trench Coat", qty: 2 }], total: 6058, payment: "Nagad", txnId: "N77281X", status: "shipped", paymentStatus: "paid", deliveryStatus: "shipped", createdAt: new Date(Date.now() - 86400e3).toISOString() },
    { id: "OSBD-100228", customer: "Mim Sultana", phone: "01522334455", items: [{ name: "Premium Leather Tote Bag", qty: 1 }], total: 2710, payment: "COD", txnId: "", status: "delivered", paymentStatus: "paid", deliveryStatus: "delivered", createdAt: new Date(Date.now() - 172800e3).toISOString() },
  ],
  // table: users (id, name, mobile, created_at) — populated by the storefront auth system
  users: [
    { id: "usr_1", name: "Rafiq Islam", mobile: "01711223344", orders: 3 },
    { id: "usr_2", name: "Sadia Akter", mobile: "01899887766", orders: 1 },
  ],
  // table: payment_methods
  paymentMethods: [
    { id: "pm_1", name: "bKash", account: "01700000000", instructions: "Send Money করে Transaction ID লিখুন", enabled: true, txnRequired: true },
    { id: "pm_2", name: "Nagad", account: "01700000001", instructions: "Send Money করে Transaction ID লিখুন", enabled: true, txnRequired: true },
    { id: "pm_3", name: "Rocket", account: "01700000002-1", instructions: "Cash Out করে Transaction ID লিখুন", enabled: false, txnRequired: true },
    { id: "pm_4", name: "Bank Transfer", account: "AC 0123456789 — Dutch Bangla Bank", instructions: "ট্রান্সফারের পর রশিদ সংরক্ষণ করুন", enabled: true, txnRequired: false },
    { id: "pm_5", name: "Cash on Delivery", account: "—", instructions: "পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন", enabled: true, txnRequired: false },
  ],
  // table: delivery_zones
  deliveryZones: [
    { id: "dz_1", name: "Inside Dhaka", charge: 60, eta: "1-2 days", freeAbove: 5000 },
    { id: "dz_2", name: "Outside Dhaka", charge: 120, eta: "3-5 days", freeAbove: 5000 },
  ],
  // table: locations (division -> districts -> thanas)
  locations: [
    { id: "loc_1", division: "Dhaka", districts: [{ name: "Dhaka", thanas: ["Dhanmondi", "Mirpur", "Gulshan"] }, { name: "Gazipur", thanas: ["Tongi", "Sreepur"] }] },
    { id: "loc_2", division: "Chattogram", districts: [{ name: "Chattogram", thanas: ["Panchlaish", "Kotwali"] }] },
  ],
  // table: coupons
  coupons: [
    { id: "cp_1", code: "OMNI10", type: "percentage", value: 10, enabled: true },
    { id: "cp_2", code: "FLAT200", type: "fixed", value: 200, enabled: true },
  ],
  // table: content (single row of editable site text)
  content: {
    homepageText: "বাংলাদেশের বিশ্বস্ত অনলাইন শপ। ক্যাশ অন ডেলিভারি সুবিধা।",
    descriptionTemplate: "প্রিমিয়াম মানের উপকরণে তৈরি এই পণ্যটি দৈনন্দিন ব্যবহারের জন্য উপযুক্ত। ১০০% অরিজিনাল পণ্যের নিশ্চয়তাসহ সারাদেশে ক্যাশ অন ডেলিভারি সুবিধা।",
    privacy: "আপনার তথ্য সুরক্ষিত রাখা আমাদের অগ্রাধিকার। এখানে প্রাইভেসি পলিসির বিস্তারিত লেখা থাকবে।",
    returnPolicy: "পণ্য হাতে পাওয়ার ৭ দিনের মধ্যে রিটার্ন করা যাবে শর্তসাপেক্ষে।",
    terms: "ওয়েবসাইট ব্যবহারের শর্তাবলী এখানে বিস্তারিতভাবে লেখা থাকবে।",
  },
  // table: contact_links + support_agents
  contact: { whatsapp: "https://wa.me/8801700000000", messenger: "https://m.me/omnishopbd", telegram: "https://t.me/omnishopbd", phone: "+8801700000000" },
  agents: [
    { id: "ag_1", name: "Nusrat (Support)", role: "Customer Support", contact: "01700000010" },
  ],
  // table: settings (single row)
  settings: { siteName: "OmniShop BD", logo: "", currency: "BDT (৳)", maintenance: false },
};

const fmt = (n) => "৳" + Number(n || 0).toLocaleString("en-BD");
const genOrderId = () => "OSBD-" + Math.floor(100000 + Math.random() * 899999);

/* ===========================================================
   FILE UPLOAD — matches the Node/Express + multer backend
   the user already has:

     const upload = multer({ storage });
     app.post("/upload", upload.single("file"), (req,res) => {
       res.json({ url: `http://localhost:5000/uploads/${req.file.filename}` });
     });

   Right now there's no live backend attached to this preview,
   so uploadFile() falls back to an in-browser base64 preview —
   the product is still fully usable. The moment a real backend
   (Railway or otherwise) is online, uncomment the fetch() call
   below and delete the fallback block. No other code changes
   are needed anywhere else in the file.
=========================================================== */
async function uploadFile(file) {
  try {
    const data = new FormData();
    data.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: data });
    const d = await res.json();
    if (d.ok && d.url) return { url: d.url };
  } catch (e) { /* fall through to preview */ }
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ url: reader.result });
    reader.readAsDataURL(file);
  });
}

// Builds a ready-made wa.me deep link pre-filled with this product's
// name, price and a link back to it — this is the "click an ad, open
// WhatsApp with the exact product already written in" flow discussed earlier.
function buildWhatsappLink(phone, product) {
  if (!phone) return "";
  const msg = `আসসালামুয়ালাইকুম, আমি এই প্রোডাক্টটি সম্পর্কে জানতে চাই:\n\n📦 ${product.name}\n💰 মূল্য: ৳${product.discount || product.price}\n\nএটা কি স্টকে আছে?`;
  // accepts either a raw number (8801...) or an already-pasted wa.me link
  const trimmed = phone.trim();
  const base = /^https?:\/\//i.test(trimmed) ? trimmed.split("?")[0] : `https://wa.me/${trimmed.replace(/[^\d]/g, "")}`;
  return `${base}?text=${encodeURIComponent(msg)}`;
}

// Plain wa.me link (no pre-filled message) — used for live auto-linking as
// the admin types the WhatsApp number in the Social Contact block below.
// Also accepts a full WhatsApp link pasted directly — used as-is in that case.
function buildWhatsappNumberLink(input) {
  if (!input) return "";
  const trimmed = input.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed; // already a link — paste it as-is
  const digits = trimmed.replace(/[^\d]/g, "");
  return digits ? `https://wa.me/${digits}` : "";
}
// Accepts either a bare username (with or without @) or a full m.me link.
function buildMessengerLink(input) {
  if (!input) return "";
  const trimmed = input.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed; // already a link — paste it as-is
  return `https://m.me/${trimmed.replace(/^@/, "")}`;
}
// Accepts either a bare username (with or without @) or a full t.me link.
function buildTelegramLink(input) {
  if (!input) return "";
  const trimmed = input.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed; // already a link — paste it as-is
  return `https://t.me/${trimmed.replace(/^@/, "")}`;
}

/* ===========================================================
   IMAGE UPLOAD FIELDS — one shared "logic core" used everywhere
   an image is needed: hero banner, category image, product gallery.
   All three call the same uploadFile() from above, so the moment
   a real storage backend (Supabase Storage / your /upload API) is
   wired in, every one of these fields starts returning permanent
   public URLs automatically — nothing else in the form changes.
=========================================================== */
function SingleImageUploader({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    const { url } = await uploadFile(file); // -> real storage URL once backend is live
    onChange(url);
    setUploading(false);
  };
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-14 h-14 rounded-xl overflow-hidden border shrink-0 flex items-center justify-center" style={{ borderColor: C.line, backgroundColor: C.cream }}>
        {uploading ? <Loader2 size={16} className="animate-spin" color={C.brand} /> : value ? <img src={value} className="w-full h-full object-cover" /> : <ImageIcon size={16} color={C.navySoft} />}
      </div>
      <div className="flex-1 flex flex-col gap-1.5">
        <input className={inputCls} style={inputStyle} placeholder="ইমেজ URL" value={value?.startsWith("data:") ? "" : value || ""} onChange={(e) => onChange(e.target.value)} />
        <label className="text-[11.5px] font-semibold flex items-center gap-1 w-max cursor-pointer" style={{ color: C.teal }}>
          <UploadCloud size={13} /> মোবাইল/ডিভাইস থেকে আপলোড করুন
          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
        </label>
      </div>
    </div>
  );
}

function MultiImageUploader({ images, onChange, max = 8 }) {
  const [uploadingCount, setUploadingCount] = useState(0);
  const filledCount = images.filter((im) => im && im.trim() !== "").length;
  const atLimit = images.length >= max;

  // 1) IMAGE UPLOAD SYSTEM — opens mobile gallery / file manager, supports
  //    picking multiple photos at once; each becomes a base64 preview via
  //    uploadFile() until a real storage backend is wired in.
  const handleFiles = async (fileList) => {
    const room = max - images.length;
    const files = Array.from(fileList).slice(0, Math.max(room, 0));
    if (files.length === 0) return;
    setUploadingCount(files.length);
    const uploaded = [];
    for (const file of files) {
      const { url } = await uploadFile(file); // one call per photo, same core logic
      uploaded.push(url);
    }
    setUploadingCount(0);
    onChange([...images, ...uploaded].slice(0, max));
  };

  const removeAt = (i) => onChange(images.filter((_, idx) => idx !== i));
  const setUrl = (i, val) => onChange(images.map((im, idx) => (idx === i ? val : im)));

  // 2) IMAGE URL SYSTEM — a dedicated blank row is added every time this is
  //    pressed; typing into it live-updates the preview above instantly.
  const addUrlSlot = () => !atLimit && onChange([...images, ""]);

  // Uploaded photos are base64 "data:" URIs — those get a plain thumbnail.
  // Everything else is an editable URL row.
  const urlRows = images.map((im, i) => ({ im, i })).filter(({ im }) => !im?.startsWith("data:"));

  return (
    <div>
      {/* PREVIEW GRID — every photo (uploaded or by URL) shows here with its own delete button */}
      {(images.length > 0 || uploadingCount > 0) && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
          {images.map((im, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden border" style={{ borderColor: C.line, backgroundColor: C.cream }}>
              {im ? <img src={im} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={16} color={C.navySoft} /></div>}
              <button type="button" onClick={() => removeAt(i)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center">
                <X size={11} color="#fff" />
              </button>
            </div>
          ))}
          {Array.from({ length: uploadingCount }).map((_, i) => (
            <div key={"u" + i} className="aspect-square rounded-xl border flex items-center justify-center" style={{ borderColor: C.line, backgroundColor: C.cream }}>
              <Loader2 size={16} className="animate-spin" color={C.brand} />
            </div>
          ))}
        </div>
      )}

      {/* GALLERY UPLOAD BUTTON */}
      <label className="text-[12.5px] font-semibold inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-white cursor-pointer mb-2" style={{ backgroundColor: C.teal, opacity: atLimit ? 0.5 : 1 }}>
        <UploadCloud size={14} /> ছবি আপলোড করুন
        <input type="file" accept="image/*" multiple className="hidden" disabled={atLimit} onChange={(e) => handleFiles(e.target.files)} />
      </label>

      {/* URL ROWS — one input per URL entry, with instant preview + its own remove button */}
      {urlRows.length > 0 && (
        <div className="flex flex-col gap-1.5 mb-2">
          {urlRows.map(({ im, i }) => (
            <div key={i} className="flex items-center gap-2">
              <input className={inputCls} style={inputStyle} placeholder="Image URL পেস্ট করুন" value={im} onChange={(e) => setUrl(i, e.target.value)} />
              <button type="button" onClick={() => removeAt(i)} className="p-2.5 rounded-lg shrink-0" style={{ backgroundColor: "#FDECE6" }}>
                <X size={13} color={C.danger} />
              </button>
            </div>
          ))}
        </div>
      )}

      <button type="button" onClick={addUrlSlot} disabled={atLimit} className="text-[12px] font-semibold flex items-center gap-1" style={{ color: C.brand, opacity: atLimit ? 0.5 : 1 }}>
        <Plus size={13} /> আরো URL যোগ করুন
      </button>

      <p className="text-[11px] mt-1.5" style={{ color: C.navySoft }}>{filledCount}/{max} ছবি যুক্ত হয়েছে — গ্যালারি/স্লাইডারে এই ক্রমেই দেখাবে।</p>
    </div>
  );
}

/* ===========================================================
   SMALL REUSABLE UI PIECES
=========================================================== */
function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-10 h-5.5 rounded-full relative transition-colors shrink-0"
      style={{ backgroundColor: checked ? C.success : "#D8D2C8", height: 22, width: 40 }}
    >
      <span className="absolute top-0.5 rounded-full bg-white transition-transform shadow" style={{ width: 18, height: 18, left: 2, transform: checked ? "translateX(18px)" : "translateX(0)" }} />
    </button>
  );
}

function Badge({ text, tone = "neutral" }) {
  const tones = {
    neutral: { bg: "#EFEAE3", color: C.navySoft },
    success: { bg: "#E9F9EF", color: C.success },
    warning: { bg: "#FEF3E2", color: C.gold },
    danger: { bg: "#FDECE6", color: C.danger },
    brand: { bg: "#FFEDE6", color: C.brand },
    info: { bg: "#E7F6F5", color: C.teal },
  };
  const t = tones[tone] || tones.neutral;
  return <span className="text-[11px] font-semibold px-2 py-1 rounded-full whitespace-nowrap" style={{ backgroundColor: t.bg, color: t.color }}>{text}</span>;
}

function Modal({ title, onClose, children, footer, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
      <div className="bg-white w-full sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col" style={{ maxWidth: wide ? 640 : 480, maxHeight: "92vh" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: C.line }}>
          <h3 className="font-bold text-[15px]" style={{ color: C.navy }}>{title}</h3>
          <button onClick={onClose}><X size={19} color={C.navySoft} /></button>
        </div>
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-3.5 border-t flex justify-end gap-2" style={{ borderColor: C.line }}>{footer}</div>}
      </div>
    </div>
  );
}

function ConfirmDialog({ text, onCancel, onConfirm }) {
  return (
    <Modal title="নিশ্চিত করুন" onClose={onCancel} footer={
      <>
        <button onClick={onCancel} className="px-4 py-2 rounded-xl text-[13px] font-semibold" style={{ color: C.navySoft, backgroundColor: "#F2EFE9" }}>বাতিল</button>
        <button onClick={onConfirm} className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white" style={{ backgroundColor: C.danger }}>ডিলিট করুন</button>
      </>
    }>
      <div className="flex items-start gap-3">
        <AlertTriangle size={20} color={C.danger} className="shrink-0 mt-0.5" />
        <p className="text-[13px]" style={{ color: C.navySoft }}>{text}</p>
      </div>
    </Modal>
  );
}

function Field({ label, children }) {
  return (
    <div className="mb-3">
      {label && <label className="block text-[12px] font-semibold mb-1.5" style={{ color: C.navy }}>{label}</label>}
      {children}
    </div>
  );
}

// Small, tidy box for showing an auto-generated link (WhatsApp/Messenger/
// Telegram/Facebook) — keeps the long URL from stretching the layout, and
// gives a one-tap Copy + Open button so the admin can quickly share it.
function LinkChip({ link }) {
  const [status, setStatus] = useState("idle"); // idle | ok | fail
  const hiddenRef = useRef(null);
  if (!link) return null;

  const copy = async () => {
    let ok = false;
    // 1) modern Clipboard API — works on most browsers over HTTPS
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link);
        ok = true;
      }
    } catch {
      ok = false;
    }
    // 2) fallback for mobile webviews / non-secure contexts where the
    //    Clipboard API is blocked — select a hidden field and use the
    //    legacy copy command instead, so it still actually copies.
    if (!ok) {
      try {
        const el = hiddenRef.current;
        el.value = link;
        el.focus();
        el.select();
        el.setSelectionRange(0, link.length);
        ok = document.execCommand("copy");
      } catch {
        ok = false;
      }
    }
    setStatus(ok ? "ok" : "fail");
    setTimeout(() => setStatus("idle"), 1600);
  };

  return (
    <div className="flex items-center gap-1.5 mt-1.5 pl-2.5 pr-1.5 py-1.5 rounded-lg border max-w-full" style={{ borderColor: C.line, backgroundColor: "#fff" }}>
      <span className="flex-1 min-w-0 text-[11.5px] truncate" style={{ color: C.navySoft }}>{link}</span>
      {/* hidden field used only as a copy target for the legacy fallback above */}
      <textarea ref={hiddenRef} readOnly defaultValue={link} style={{ position: "fixed", top: 0, left: "-9999px", height: 1, width: 1, opacity: 0 }} />
      <button type="button" onClick={copy}
        className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold text-white transition-colors"
        style={{ backgroundColor: status === "ok" ? C.success : status === "fail" ? C.danger : C.teal }}>
        {status === "ok" ? <Check size={11} /> : <Copy size={11} />}
        {status === "ok" ? "কপি হয়েছে" : status === "fail" ? "লিংক সিলেক্ট করুন" : "কপি"}
      </button>
      <a href={link} target="_blank" rel="noreferrer" className="shrink-0 p-1.5 rounded-md" style={{ backgroundColor: "#F2EFE9" }} title="ওপেন করুন">
        <ExternalLink size={12} color={C.navySoft} />
      </a>
    </div>
  );
}
const inputCls = "w-full border rounded-xl px-3.5 py-2.5 text-[13px] outline-none";
const inputStyle = { borderColor: C.line, color: C.navy };

function PrimaryBtn({ children, onClick, icon: Icon, full, disabled, small }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`rounded-xl font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 transition-transform active:scale-95 ${full ? "w-full" : ""}`}
      style={{ backgroundColor: C.brand, color: "#fff", padding: small ? "8px 14px" : "10px 18px", fontSize: small ? 12 : 13 }}>
      {Icon && <Icon size={small ? 13 : 15} />} {children}
    </button>
  );
}
function GhostBtn({ children, onClick, icon: Icon, small, tone }) {
  return (
    <button onClick={onClick}
      className="rounded-xl font-semibold flex items-center justify-center gap-1.5 border transition-transform active:scale-95"
      style={{ borderColor: C.line, color: tone === "danger" ? C.danger : C.navySoft, padding: small ? "7px 12px" : "9px 16px", fontSize: small ? 12 : 13 }}>
      {Icon && <Icon size={small ? 13 : 14} />} {children}
    </button>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-[13px] font-medium text-white"
      style={{ backgroundColor: toast.type === "error" ? C.danger : C.success }}>
      {toast.type === "error" ? <XCircle size={16} /> : <CheckCircle2 size={16} />} {toast.text}
    </div>
  );
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-2">
      <Icon size={30} color="#D8D2C8" />
      <p className="text-[13px]" style={{ color: C.navySoft }}>{text}</p>
    </div>
  );
}

function SectionHeader({ title, sub, action }) {
  return (
    <div className="flex items-start justify-between mb-5 gap-3 flex-wrap">
      <div>
        <h2 className="text-[19px] font-bold" style={{ color: C.navy, fontFamily: "'Poppins', sans-serif" }}>{title}</h2>
        {sub && <p className="text-[12.5px] mt-0.5" style={{ color: C.navySoft }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function Card({ children, className = "" }) {
  return <div className={`bg-white rounded-2xl border ${className}`} style={{ borderColor: C.line }}>{children}</div>;
}

/* ===========================================================
   LOGIN PAGE
=========================================================== */
function LoginPage({ admins, onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim(), password }) });
      const d = await res.json();
      if (!d.ok) { setLoading(false); setError(d.error || "ইমেইল অথবা পাসওয়ার্ড ভুল"); return; }
      try { localStorage.setItem("omni_admin", JSON.stringify(d.data)); } catch {}
      setLoading(false);
      onLogin(d.data);
    } catch {
      setLoading(false); setError("নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: C.navy }}>
      <style>{FONT_IMPORT}</style>
      <div className="w-full max-w-[380px]">
        <div className="text-center mb-6">
          <span className="text-2xl font-extrabold text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Omni<span style={{ color: C.brand }}>Shop</span> BD
          </span>
          <p className="text-white/60 text-[12.5px] mt-1">Admin Panel — লগইন করুন</p>
        </div>
        <div className="bg-white rounded-2xl p-6">
          {error && (
            <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-3 text-[12px]" style={{ backgroundColor: "#FDECE6", color: C.danger }}>
              <AlertTriangle size={14} className="shrink-0" /> {error}
            </div>
          )}
          <Field label="ইমেইল">
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@omnishopbd.com" className={inputCls} style={inputStyle} onKeyDown={(e) => e.key === "Enter" && submit()} />
          </Field>
          <Field label="পাসওয়ার্ড">
            <div className="relative">
              <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={inputCls} style={{ ...inputStyle, paddingRight: 40 }} onKeyDown={(e) => e.key === "Enter" && submit()} />
              <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setShowPw((v) => !v)}>{showPw ? <EyeOff size={15} color={C.navySoft} /> : <Eye size={15} color={C.navySoft} />}</button>
            </div>
          </Field>
          <PrimaryBtn full onClick={submit} disabled={loading || !email || !password}>
            {loading ? <Loader2 size={15} className="animate-spin" /> : "লগইন করুন"}
          </PrimaryBtn>
        </div>
        <p className="text-white/40 text-[11px] text-center mt-4">Supabase Auth যুক্ত হলে এই লগইন সম্পূর্ণ সিকিউর হবে (session/token সহ)।</p>
      </div>
    </div>
  );
}

/* ===========================================================
   DASHBOARD
=========================================================== */
function Dashboard({ db, go }) {
  const totalSales = db.orders.filter((o) => o.paymentStatus === "paid").reduce((s, o) => s + o.total, 0);
  const pending = db.orders.filter((o) => o.status === "pending").length;
  const lowStock = db.products.filter((p) => p.stock <= 8);
  const stats = [
    { label: "মোট প্রোডাক্ট", value: db.products.length, icon: Package, tone: "brand" },
    { label: "মোট অর্ডার", value: db.orders.length, icon: ShoppingBag, tone: "info" },
    { label: "মোট সেলস", value: fmt(totalSales), icon: DollarSign, tone: "success" },
    { label: "পেন্ডিং অর্ডার", value: pending, icon: Clock, tone: "warning" },
    { label: "লো স্টক", value: lowStock.length, icon: AlertTriangle, tone: "danger" },
  ];
  const toneColor = { brand: C.brand, info: C.teal, success: C.success, warning: C.gold, danger: C.danger };
  return (
    <div>
      <SectionHeader title="ড্যাশবোর্ড" sub="আপনার স্টোরের সার্বিক অবস্থা" />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {stats.map((s, i) => (
          <Card key={i} className="p-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5" style={{ backgroundColor: toneColor[s.tone] + "18" }}>
              <s.icon size={17} color={toneColor[s.tone]} />
            </div>
            <p className="text-[18px] font-bold" style={{ color: C.navy }}>{s.value}</p>
            <p className="text-[11.5px] mt-0.5" style={{ color: C.navySoft }}>{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-[14px]" style={{ color: C.navy }}>সাম্প্রতিক অর্ডার</p>
            <button onClick={() => go("orders")} className="text-[12px] font-semibold flex items-center gap-0.5" style={{ color: C.brand }}>সব দেখুন <ChevronRight size={13} /></button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="text-left" style={{ color: C.navySoft }}>
                  <th className="pb-2 font-medium">অর্ডার আইডি</th><th className="pb-2 font-medium">কাস্টমার</th><th className="pb-2 font-medium">মূল্য</th><th className="pb-2 font-medium">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody>
                {db.orders.slice(0, 5).map((o) => (
                  <tr key={o.id} className="border-t" style={{ borderColor: C.line }}>
                    <td className="py-2.5 font-medium" style={{ color: C.navy }}>{o.id}</td>
                    <td className="py-2.5" style={{ color: C.navySoft }}>{o.customer}</td>
                    <td className="py-2.5" style={{ color: C.navy }}>{fmt(o.total)}</td>
                    <td className="py-2.5"><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-4">
          <p className="font-bold text-[14px] mb-3" style={{ color: C.navy }}>কুইক অ্যাকশন</p>
          <div className="flex flex-col gap-2">
            {[
              { label: "নতুন প্রোডাক্ট যোগ করুন", icon: Plus, go: "products" },
              { label: "নতুন ক্যাটাগরি যোগ করুন", icon: Tags, go: "categories" },
              { label: "অর্ডার ম্যানেজ করুন", icon: ShoppingBag, go: "orders" },
              { label: "কুপন তৈরি করুন", icon: Ticket, go: "coupons" },
            ].map((a, i) => (
              <button key={i} onClick={() => go(a.go)} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-[12.5px] font-medium text-left" style={{ borderColor: C.line, color: C.navy }}>
                <a.icon size={15} color={C.brand} /> {a.label}
              </button>
            ))}
          </div>
          {lowStock.length > 0 && (
            <div className="mt-3 rounded-xl px-3 py-2.5" style={{ backgroundColor: "#FDECE6" }}>
              <p className="text-[12px] font-semibold flex items-center gap-1.5" style={{ color: C.danger }}><AlertTriangle size={13} /> লো স্টক অ্যালার্ট</p>
              <p className="text-[11.5px] mt-1" style={{ color: C.navySoft }}>{lowStock.map((p) => p.name).join(", ")}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending: { tone: "warning", text: "Pending" }, confirmed: { tone: "info", text: "Confirmed" },
    shipped: { tone: "info", text: "Shipped" }, delivered: { tone: "success", text: "Delivered" },
    cancelled: { tone: "danger", text: "Cancelled" }, paid: { tone: "success", text: "Paid" },
    unpaid: { tone: "danger", text: "Unpaid" }, processing: { tone: "warning", text: "Processing" },
  };
  const m = map[status] || { tone: "neutral", text: status };
  return <Badge text={m.text} tone={m.tone} />;
}

/* ===========================================================
   PRODUCTS
=========================================================== */
function ProductForm({ initial, categories, sections, agentTypes, whatsappPhone, onSave, onClose, onNeedSection, onNeedAgent }) {
  const emptyForm = {
    name: "", price: "", discount: "", stock: "", sold: 0, category: categories[0]?.id || "", subcategory: "", tags: "",
    images: [], video: "", description: "", featured: false, active: true,
    section: sections[0]?.key || "", agentType: agentTypes[0]?.key || "",
    facebook: "", whatsappNumber: "", whatsapp: "", messengerUsername: "", messenger: "", telegramUsername: "", telegram: "",
    messageTemplate: "", minPrice: "", maxPrice: "", suggestedPrice: "", sizes: "",
  };
  const [f, setF] = useState(initial || emptyForm);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [saveLock, setSaveLock] = useState(false);

  const handleVideoUpload = async (file) => {
    if (!file) return;
    setUploadingVideo(true);
    const { url } = await uploadFile(file);
    setF((p) => ({ ...p, video: url }));
    setUploadingVideo(false);
  };

  // CANCEL — clears every input in the form back to blank, then closes.
  const handleCancel = () => { setF(emptyForm); onClose(); };

  // live auto-link builders — the wa.me / m.me / t.me link is generated
  // the moment the admin types the number/username, no extra click needed.
  const setWhatsappNumber = (val) => setF((p) => ({ ...p, whatsappNumber: val, whatsapp: buildWhatsappNumberLink(val) }));
  const setMessengerUsername = (val) => setF((p) => ({ ...p, messengerUsername: val, messenger: buildMessengerLink(val) }));
  const setTelegramUsername = (val) => setF((p) => ({ ...p, telegramUsername: val, telegram: buildTelegramLink(val) }));

  const valid = f.name && f.price && f.category;
  return (
    <Modal title={initial ? "প্রোডাক্ট এডিট করুন" : "নতুন প্রোডাক্ট যোগ করুন"} onClose={handleCancel} wide
      footer={<><GhostBtn onClick={handleCancel}>বাতিল</GhostBtn><PrimaryBtn icon={Save} disabled={!valid || saveLock} onClick={() => { if (saveLock) return; setSaveLock(true); onSave({ ...f, price: +f.price, discount: +f.discount || +f.price, stock: +f.stock || 0 }); }}>{saveLock ? "সেভ হচ্ছে..." : "সেভ করুন"}</PrimaryBtn></>}>
      <div className="grid sm:grid-cols-2 gap-x-3">
        <Field label="প্রোডাক্ট নাম *"><input className={inputCls} style={inputStyle} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="ক্যাটাগরি *">
          <select className={inputCls} style={inputStyle} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="মূল্য (৳) *"><input type="number" className={inputCls} style={inputStyle} value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></Field>
        <Field label="ডিসকাউন্ট মূল্য (৳)"><input type="number" className={inputCls} style={inputStyle} value={f.discount} onChange={(e) => setF({ ...f, discount: e.target.value })} /></Field>
        <Field label="স্টক পরিমাণ"><input type="number" className={inputCls} style={inputStyle} value={f.stock} onChange={(e) => setF({ ...f, stock: e.target.value })} /></Field>
        <Field label="সাবক্যাটাগরি"><input className={inputCls} style={inputStyle} value={f.subcategory} onChange={(e) => setF({ ...f, subcategory: e.target.value })} /></Field>
      </div>
      <Field label="ট্যাগ (কমা দিয়ে আলাদা করুন)"><input className={inputCls} style={inputStyle} value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} /></Field>

      <Field label="প্রোডাক্ট গ্যালারি (একাধিক ছবি) — স্লাইডার/গ্যালারি হিসেবে দেখাবে">
        <MultiImageUploader images={f.images} onChange={(imgs) => setF((p) => ({ ...p, images: imgs }))} max={8} />
      </Field>

      <Field label="ভিডিও — YouTube লিংক অথবা ফাইল Upload করুন">
        <div className="flex items-center gap-2">
          <input className={inputCls} style={inputStyle} value={f.video?.startsWith("data:") ? "" : f.video} onChange={(e) => setF({ ...f, video: e.target.value })} placeholder="https://youtube.com/watch?v=..." />
          <label className="p-2.5 rounded-lg border cursor-pointer shrink-0 flex items-center gap-1" style={{ borderColor: C.line }} title="Upload video">
            {uploadingVideo ? <Loader2 size={14} className="animate-spin" color={C.brand} /> : <Film size={14} color={C.navySoft} />}
            <input type="file" accept="video/*" className="hidden" onChange={(e) => handleVideoUpload(e.target.files[0])} />
          </label>
        </div>
        {f.video?.startsWith("data:") && <p className="text-[11px] mt-1" style={{ color: C.success }}>✓ ভিডিও আপলোড হয়েছে (প্রিভিউ মোড)</p>}
      </Field>

      <div className="grid sm:grid-cols-2 gap-x-3">
        <Field label={<span className="flex items-center justify-between">সেকশন <button type="button" onClick={onNeedSection} className="text-[11px] font-semibold" style={{ color: C.brand }}>+ নতুন সেকশন</button></span>}>
          <select className={inputCls} style={inputStyle} value={f.section} onChange={(e) => setF({ ...f, section: e.target.value })}>
            {sections.map((s) => <option key={s.id} value={s.key}>{s.label}</option>)}
          </select>
        </Field>
        <Field label={<span className="flex items-center justify-between">এজেন্ট টাইপ <button type="button" onClick={onNeedAgent} className="text-[11px] font-semibold" style={{ color: C.brand }}>+ নতুন এজেন্ট</button></span>}>
          <select className={inputCls} style={inputStyle} value={f.agentType} onChange={(e) => setF({ ...f, agentType: e.target.value })}>
            {agentTypes.map((a) => <option key={a.id} value={a.key}>{a.label}</option>)}
          </select>
        </Field>
      </div>

      <div className="rounded-xl border p-3.5 mt-1 mb-3" style={{ borderColor: C.line, backgroundColor: C.cream }}>
        <p className="text-[12.5px] font-bold mb-2.5 flex items-center gap-1.5" style={{ color: C.navy }}>
          <Phone size={14} /> সোশ্যাল যোগাযোগ (এই প্রোডাক্টের জন্য)
        </p>

        <Field label="Facebook লিংক">
          <input className={inputCls} style={inputStyle} value={f.facebook} onChange={(e) => setF({ ...f, facebook: e.target.value })} placeholder="https://facebook.com/..." />
          <LinkChip link={f.facebook} />
        </Field>

        <Field label="WhatsApp নম্বর অথবা লিংক">
          <div className="flex items-center gap-2">
            <input className={inputCls} style={inputStyle} value={f.whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="8801XXXXXXXXX অথবা https://wa.me/..." />
            <button type="button" onClick={() => setF((p) => ({ ...p, whatsapp: buildWhatsappLink(p.whatsappNumber || whatsappPhone, p) }))} className="px-3 py-2.5 rounded-lg text-[11px] font-semibold text-white shrink-0 flex items-center gap-1" style={{ backgroundColor: C.teal }}>
              <Link2 size={12} /> মেসেজসহ লিংক
            </button>
          </div>
          <LinkChip link={f.whatsapp} />
        </Field>

        <Field label="Messenger ইউজারনেম">
          <input className={inputCls} style={inputStyle} value={f.messengerUsername} onChange={(e) => setMessengerUsername(e.target.value)} placeholder="username" />
          <LinkChip link={f.messenger} />
        </Field>

        <Field label="Telegram ইউজারনেম">
          <input className={inputCls} style={inputStyle} value={f.telegramUsername} onChange={(e) => setTelegramUsername(e.target.value)} placeholder="username" />
          <LinkChip link={f.telegram} />
        </Field>

        <p className="text-[11px]" style={{ color: C.navySoft }}>নম্বর/ইউজারনেম লিখলে অথবা সরাসরি লিংক পেস্ট করলে — দুই ক্ষেত্রেই সঠিক লিংক অটোমেটিক তৈরি/সেভ হয়ে যাবে।</p>
      </div>

      <Field label="বিবরণ"><textarea rows={3} className={inputCls} style={inputStyle} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
      {categories.find((c) => c.id === f.category)?.hasSize && (
        <Field label="সাইজ অপশন (কমা দিয়ে লিখুন)">
          <input className={inputCls} style={inputStyle} placeholder="যেমন: S,M,L,XL অথবা 39,40,41,42" value={f.sizes} onChange={(e) => setF({ ...f, sizes: e.target.value })} />
        </Field>
      )}

      {/* ============ SMART CONTROL ============ */}
      <div className="sm:col-span-2 rounded-xl border p-3 mt-1 mb-2" style={{ borderColor: C.line, backgroundColor: "#FAF8F5" }}>
        <p className="text-[12px] font-bold mb-2 flex items-center gap-1.5" style={{ color: C.navy }}>⚡ Smart Control <span className="font-normal text-[10.5px]" style={{ color: C.navySoft }}>(WhatsApp মেসেজ ও এজেন্ট প্রাইস গাইড)</span></p>
        <Field label="ডাইনামিক টেমপ্লেট — এটাই WhatsApp মেসেজ হবে (খালি রাখলে সাধারণ মেসেজ যাবে)">
          <textarea rows={5} className={inputCls} style={inputStyle} placeholder={"Product Name: {name}\nPrice: {price}\nDiscount: {discount}\nStock: {stock}\n\nDescription:\n{description}\n\nImage:\n{image}"} value={f.messageTemplate} onChange={(e) => setF({ ...f, messageTemplate: e.target.value })} />
        </Field>
        <div className="flex gap-1 flex-wrap mb-2">
          {["{name}", "{price}", "{discount}", "{stock}", "{description}", "{image}", "{id}"].map((v) => (
            <button key={v} type="button" onClick={() => setF((p) => ({ ...p, messageTemplate: (p.messageTemplate || "") + v }))} className="text-[10.5px] px-2 py-1 rounded-lg border font-mono" style={{ borderColor: C.line, color: C.navySoft, backgroundColor: "#fff" }}>{v}</button>
          ))}
        </div>
        {f.messageTemplate && f.messageTemplate.trim() && (
          <div className="rounded-xl border p-2.5 mb-2" style={{ borderColor: C.line, backgroundColor: "#fff" }}>
            <p className="text-[10.5px] font-semibold mb-1" style={{ color: C.navySoft }}>প্রিভিউ (আসল ডেটা বসিয়ে):</p>
            <p className="text-[11.5px] whitespace-pre-line" style={{ color: C.navy }}>
              {(f.messageTemplate.includes("{id}") ? "" : "ID: " + (initial?.id ?? "(অটো)") + "\n\n") + f.messageTemplate
                .split("{name}").join(f.name || "—")
                .split("{price}").join("৳" + (f.price || "—"))
                .split("{discount}").join("৳" + (f.discount || f.price || "—"))
                .split("{stock}").join(String(f.stock || "—"))
                .split("{description}").join(f.description || "—")
                .split("{image}").join(f.images[0] || "—")
                .split("{id}").join(String(initial?.id ?? "(অটো)"))}
            </p>
          </div>
        )}
        <div className="grid grid-cols-3 gap-x-2">
          <Field label="Min Price"><input type="number" className={inputCls} style={inputStyle} value={f.minPrice} onChange={(e) => setF({ ...f, minPrice: e.target.value })} /></Field>
          <Field label="Max Price"><input type="number" className={inputCls} style={inputStyle} value={f.maxPrice} onChange={(e) => setF({ ...f, maxPrice: e.target.value })} /></Field>
          <Field label="Suggested"><input type="number" className={inputCls} style={inputStyle} value={f.suggestedPrice} onChange={(e) => setF({ ...f, suggestedPrice: e.target.value })} /></Field>
        </div>
        <p className="text-[10.5px]" style={{ color: C.navySoft }}>এই দামগুলো কাস্টমার দেখবে না — শুধু আপনার ও এজেন্টের গাইড (negotiation) হিসেবে সেভ হয়।</p>
      </div>
      <div className="flex items-center gap-6 mt-2">
        <label className="flex items-center gap-2 text-[12.5px] font-medium" style={{ color: C.navy }}><Toggle checked={f.featured} onChange={(v) => setF({ ...f, featured: v })} /> Featured</label>
        <label className="flex items-center gap-2 text-[12.5px] font-medium" style={{ color: C.navy }}><Toggle checked={f.active} onChange={(v) => setF({ ...f, active: v })} /> Active</label>
      </div>
    </Modal>
  );
}

function ProductsManager({ db, setDb, toast, go }) {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const filtered = db.products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  const catName = (id) => db.categories.find((c) => c.id === id)?.name || "—";
  const sectionLabel = (key) => db.sections.find((s) => s.key === key)?.label || key || "—";
  const agentInfo = (key) => db.agentTypes.find((a) => a.key === key) || { label: key, tone: "neutral" };

  const save = (data) => {
    if (editing) {
      setDb((p) => ({ ...p, products: p.products.map((x) => (x.id === editing.id ? { ...x, ...data } : x)) }));
      toast("প্রোডাক্ট আপডেট হয়েছে");
    } else {
      // INSERT INTO products (...) — Supabase later
      setDb((p) => ({ ...p, products: [{ id: "p_" + Date.now(), ...data }, ...p.products] }));
      toast("নতুন প্রোডাক্ট যোগ হয়েছে");
    }
    setShowForm(false); setEditing(null);
  };
  const remove = () => {
    setDb((p) => ({ ...p, products: p.products.filter((x) => x.id !== deleting.id) }));
    toast("প্রোডাক্ট ডিলিট হয়েছে", "error"); setDeleting(null);
  };

  return (
    <div>
      <SectionHeader title="প্রোডাক্ট ম্যানেজমেন্ট" sub={`মোট ${db.products.length} টি প্রোডাক্ট`}
        action={<PrimaryBtn icon={Plus} onClick={() => { setEditing(null); setShowForm(true); }}>নতুন প্রোডাক্ট</PrimaryBtn>} />
      <Card className="p-3 mb-4">
        <div className="flex items-center gap-2 border rounded-xl px-3 py-2" style={{ borderColor: C.line }}>
          <Search size={15} color={C.navySoft} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="প্রোডাক্ট খুঁজুন..." className="w-full text-[13px] outline-none" style={{ color: C.navy }} />
        </div>
      </Card>
      <Card className="overflow-x-auto">
        {filtered.length === 0 ? <EmptyState icon={Package} text="কোনো প্রোডাক্ট পাওয়া যায়নি" /> : (
          <table className="w-full text-[12.5px] min-w-[860px]">
            <thead><tr className="text-left border-b" style={{ borderColor: C.line, color: C.navySoft }}>
              <th className="p-3 font-medium">প্রোডাক্ট</th><th className="p-3 font-medium">ক্যাটাগরি</th><th className="p-3 font-medium">সেকশন</th><th className="p-3 font-medium">এজেন্ট</th><th className="p-3 font-medium">মূল্য</th><th className="p-3 font-medium">স্টক</th><th className="p-3 font-medium">সোল্ড</th><th className="p-3 font-medium">স্ট্যাটাস</th><th className="p-3 font-medium text-right">অ্যাকশন</th>
            </tr></thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b" style={{ borderColor: C.line }}>
                  <td className="p-3 flex items-center gap-2.5">
                    <img src={p.images[0]} className="w-10 h-10 rounded-lg object-cover" />
                    <div><p className="font-medium" style={{ color: C.navy }}>{p.name}</p>{p.featured && <Badge text="Featured" tone="brand" />}</div>
                  </td>
                  <td className="p-3" style={{ color: C.navySoft }}>{catName(p.category)}</td>
                  <td className="p-3"><Badge text={sectionLabel(p.section).replace("হোমপেজ — ", "")} tone="neutral" /></td>
                  <td className="p-3"><Badge text={agentInfo(p.agentType).label} tone={agentInfo(p.agentType).tone} /></td>
                  <td className="p-3" style={{ color: C.navy }}>{fmt(p.discount)}</td>
                  <td className="p-3">{p.stock <= 8 ? <Badge text={`${p.stock} (Low)`} tone="danger" /> : <span style={{ color: C.navySoft }}>{p.stock}</span>}</td>
                  <td className="p-3" style={{ color: C.navySoft }}>{p.sold}</td>
                  <td className="p-3">{p.active ? <Badge text="Active" tone="success" /> : <Badge text="Inactive" tone="neutral" />}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setEditing(p); setShowForm(true); }} className="p-1.5 rounded-lg border" style={{ borderColor: C.line }}><Pencil size={13} color={C.navySoft} /></button>
                      <button onClick={() => setDeleting(p)} className="p-1.5 rounded-lg border" style={{ borderColor: C.line }}><Trash2 size={13} color={C.danger} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      {showForm && (
        <ProductForm
          initial={editing}
          categories={db.categories}
          sections={db.sections}
          agentTypes={db.agentTypes}
          whatsappPhone={db.contact.phone}
          onSave={save}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onNeedSection={() => { setShowForm(false); setEditing(null); go("sections"); toast("নতুন সেকশন যোগ করে আবার প্রোডাক্ট ওপেন করুন"); }}
          onNeedAgent={() => { setShowForm(false); setEditing(null); go("agenttypes"); toast("নতুন এজেন্ট টাইপ যোগ করে আবার প্রোডাক্ট ওপেন করুন"); }}
        />
      )}
      {deleting && <ConfirmDialog text={`"${deleting.name}" প্রোডাক্টটি ডিলিট করতে চান?`} onCancel={() => setDeleting(null)} onConfirm={remove} />}
    </div>
  );
}

/* ===========================================================
   CATEGORIES
=========================================================== */
function CategoriesManager({ db, setDb, toast }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [f, setF] = useState({ name: "", image: "", hasSize: false });

  const openNew = () => { setEditing(null); setF({ name: "", image: "", hasSize: false }); setShowForm(true); };
  const openEdit = (c) => { setEditing(c); setF(c); setShowForm(true); };
  const save = () => {
    if (editing) { setDb((p) => ({ ...p, categories: p.categories.map((c) => (c.id === editing.id ? { ...c, ...f } : c)) })); toast("ক্যাটাগরি আপডেট হয়েছে"); }
    else { setDb((p) => ({ ...p, categories: [{ id: "cat_" + Date.now(), ...f }, ...p.categories] })); toast("নতুন ক্যাটাগরি যোগ হয়েছে"); }
    setShowForm(false);
  };
  const remove = () => { setDb((p) => ({ ...p, categories: p.categories.filter((c) => c.id !== deleting.id) })); toast("ক্যাটাগরি ডিলিট হয়েছে", "error"); setDeleting(null); };

  return (
    <div>
      <SectionHeader title="ক্যাটাগরি ম্যানেজমেন্ট" sub="প্রোডাক্ট ফিল্টার ও হোমপেজের সাথে সংযুক্ত" action={<PrimaryBtn icon={Plus} onClick={openNew}>নতুন ক্যাটাগরি</PrimaryBtn>} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {db.categories.map((c) => (
          <Card key={c.id} className="p-3">
            <img src={c.image} className="w-full h-28 object-cover rounded-xl mb-3" />
            <p className="font-semibold text-[13.5px]" style={{ color: C.navy }}>{c.name}</p>
            <div className="flex items-center justify-between mt-1">
              {c.hasSize ? <Badge text="Size Enabled" tone="info" /> : <Badge text="No Size" tone="neutral" />}
              <div className="flex gap-1.5">
                <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg border" style={{ borderColor: C.line }}><Pencil size={13} color={C.navySoft} /></button>
                <button onClick={() => setDeleting(c)} className="p-1.5 rounded-lg border" style={{ borderColor: C.line }}><Trash2 size={13} color={C.danger} /></button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      {showForm && (
        <Modal title={editing ? "ক্যাটাগরি এডিট করুন" : "নতুন ক্যাটাগরি"} onClose={() => setShowForm(false)}
          footer={<><GhostBtn onClick={() => setShowForm(false)}>বাতিল</GhostBtn><PrimaryBtn icon={Save} disabled={!f.name} onClick={save}>সেভ করুন</PrimaryBtn></>}>
          <Field label="ক্যাটাগরি নাম *"><input className={inputCls} style={inputStyle} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="ক্যাটাগরি ইমেজ"><SingleImageUploader value={f.image} onChange={(url) => setF({ ...f, image: url })} /></Field>
          <label className="flex items-center gap-2 text-[12.5px] font-medium mt-2" style={{ color: C.navy }}>
            <Toggle checked={f.hasSize} onChange={(v) => setF({ ...f, hasSize: v })} /> এই ক্যাটাগরিতে Size (S/M/L/XL) থাকবে
          </label>
        </Modal>
      )}
      {deleting && <ConfirmDialog text={`"${deleting.name}" ক্যাটাগরিটি ডিলিট করতে চান?`} onCancel={() => setDeleting(null)} onConfirm={remove} />}
    </div>
  );
}

/* ===========================================================
   HERO BANNER — the homepage top carousel. Same upload logic as
   categories/products, so a photo taken on a phone slots straight
   into the slider (frontend just loops db.heroSlides in order).
=========================================================== */
function HeroBannerManager({ db, setDb, toast }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const empty = { tag: "", title: "", sub: "", cta: "", link: "", image: "" };
  const [f, setF] = useState(empty);

  const openNew = () => { setEditing(null); setF(empty); setShowForm(true); };
  const openEdit = (s) => { setEditing(s); setF(s); setShowForm(true); };
  const save = () => {
    if (editing) { setDb((p) => ({ ...p, heroSlides: p.heroSlides.map((s) => (s.id === editing.id ? { ...s, ...f } : s)) })); toast("ব্যানার আপডেট হয়েছে"); }
    else { setDb((p) => ({ ...p, heroSlides: [...p.heroSlides, { id: "hero_" + Date.now(), ...f }] })); toast("নতুন হিরো ব্যানার যোগ হয়েছে"); }
    setShowForm(false);
  };
  const remove = () => { setDb((p) => ({ ...p, heroSlides: p.heroSlides.filter((s) => s.id !== deleting.id) })); toast("ব্যানার ডিলিট হয়েছে", "error"); setDeleting(null); };
  const move = (i, dir) => {
    setDb((p) => {
      const arr = [...p.heroSlides];
      const j = i + dir;
      if (j < 0 || j >= arr.length) return p;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...p, heroSlides: arr };
    });
  };

  return (
    <div>
      <SectionHeader title="হিরো ব্যানার" sub="হোমপেজের উপরের স্লাইডার — ছবি মোবাইল থেকে সরাসরি আপলোড করা যাবে" action={<PrimaryBtn icon={Plus} onClick={openNew}>নতুন ব্যানার</PrimaryBtn>} />
      <div className="grid sm:grid-cols-2 gap-3">
        {db.heroSlides.map((s, i) => (
          <Card key={s.id} className="overflow-hidden">
            <div className="relative h-36">
              <img src={s.image} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex flex-col justify-center px-3">
                {s.tag && <Badge text={s.tag} tone="brand" />}
                <p className="text-white font-bold text-[14px] mt-1">{s.title}</p>
              </div>
            </div>
            <div className="p-3 flex items-center justify-between">
              <p className="text-[11.5px]" style={{ color: C.navySoft }}>ক্রম #{i + 1}</p>
              <div className="flex gap-1.5">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1.5 rounded-lg border disabled:opacity-30" style={{ borderColor: C.line }}><ChevronRight size={13} style={{ transform: "rotate(-90deg)" }} color={C.navySoft} /></button>
                <button onClick={() => move(i, 1)} disabled={i === db.heroSlides.length - 1} className="p-1.5 rounded-lg border disabled:opacity-30" style={{ borderColor: C.line }}><ChevronRight size={13} style={{ transform: "rotate(90deg)" }} color={C.navySoft} /></button>
                <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg border" style={{ borderColor: C.line }}><Pencil size={13} color={C.navySoft} /></button>
                <button onClick={() => setDeleting(s)} className="p-1.5 rounded-lg border" style={{ borderColor: C.line }}><Trash2 size={13} color={C.danger} /></button>
              </div>
            </div>
          </Card>
        ))}
        {db.heroSlides.length === 0 && <EmptyState icon={GalleryHorizontal} text="কোনো ব্যানার নেই" />}
      </div>
      {showForm && (
        <Modal title={editing ? "ব্যানার এডিট করুন" : "নতুন হিরো ব্যানার"} onClose={() => setShowForm(false)}
          footer={<><GhostBtn onClick={() => setShowForm(false)}>বাতিল</GhostBtn><PrimaryBtn icon={Save} disabled={!f.title || !f.image} onClick={save}>সেভ করুন</PrimaryBtn></>}>
          <Field label="ব্যানার ছবি *"><SingleImageUploader value={f.image} onChange={(url) => setF({ ...f, image: url })} /></Field>
          <Field label="ট্যাগ (ছোট ব্যাজ, যেমন 'টেক সেল')"><input className={inputCls} style={inputStyle} value={f.tag} onChange={(e) => setF({ ...f, tag: e.target.value })} /></Field>
          <Field label="টাইটেল *"><input className={inputCls} style={inputStyle} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
          <Field label="সাব-টেক্সট"><input className={inputCls} style={inputStyle} value={f.sub} onChange={(e) => setF({ ...f, sub: e.target.value })} /></Field>
          <div className="grid sm:grid-cols-2 gap-x-3">
            <Field label="বাটন টেক্সট (CTA)"><input className={inputCls} style={inputStyle} value={f.cta} onChange={(e) => setF({ ...f, cta: e.target.value })} placeholder="কালেকশন দেখুন" /></Field>
            <Field label="বাটন লিংক / ক্যাটাগরি"><input className={inputCls} style={inputStyle} value={f.link} onChange={(e) => setF({ ...f, link: e.target.value })} placeholder="/shop?cat=fashion" /></Field>
          </div>
        </Modal>
      )}
      {deleting && <ConfirmDialog text={`"${deleting.title}" ব্যানারটি ডিলিট করতে চান?`} onCancel={() => setDeleting(null)} onConfirm={remove} />}
    </div>
  );
}

/* ===========================================================
   SECTIONS — controls where products appear on the homepage.
   Frontend logic (for later): products.filter(p => p.section === "homepage_top")
=========================================================== */
function SectionsManager({ db, setDb, toast }) {
  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState({ key: "", label: "" });
  const [deleting, setDeleting] = useState(null);

  const save = () => {
    const key = f.key.trim().toLowerCase().replace(/\s+/g, "_");
    if (!key || !f.label) return;
    setDb((p) => ({ ...p, sections: [...p.sections, { id: "sec_" + Date.now(), key, label: f.label }] }));
    toast("নতুন সেকশন যোগ হয়েছে"); setShowForm(false); setF({ key: "", label: "" });
  };
  const remove = () => { setDb((p) => ({ ...p, sections: p.sections.filter((s) => s.id !== deleting.id) })); toast("সেকশন ডিলিট হয়েছে", "error"); setDeleting(null); };

  return (
    <div>
      <SectionHeader title="সেকশন ম্যানেজমেন্ট" sub="হোমপেজে প্রোডাক্ট কোথায় দেখাবে তা নিয়ন্ত্রণ করুন (Top / Middle / Bottom / নতুন যেকোনো সেকশন)" action={<PrimaryBtn icon={Plus} onClick={() => setShowForm(true)}>নতুন সেকশন</PrimaryBtn>} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {db.sections.map((s) => (
          <Card key={s.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-[13.5px]" style={{ color: C.navy }}>{s.label}</p>
                <p className="text-[11px] mt-0.5" style={{ color: C.navySoft }}><code>{s.key}</code></p>
              </div>
              <button onClick={() => setDeleting(s)} className="p-1.5 rounded-lg border" style={{ borderColor: C.line }}><Trash2 size={13} color={C.danger} /></button>
            </div>
          </Card>
        ))}
      </div>
      {showForm && (
        <Modal title="নতুন সেকশন যোগ করুন" onClose={() => setShowForm(false)} footer={<><GhostBtn onClick={() => setShowForm(false)}>বাতিল</GhostBtn><PrimaryBtn icon={Save} disabled={!f.key || !f.label} onClick={save}>যোগ করুন</PrimaryBtn></>}>
          <Field label="সেকশনের Key (ইংরেজিতে, স্পেস ছাড়া)"><input className={inputCls} style={inputStyle} value={f.key} onChange={(e) => setF({ ...f, key: e.target.value })} placeholder="homepage_featured" /></Field>
          <Field label="প্রদর্শনী নাম (Label)"><input className={inputCls} style={inputStyle} value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} placeholder="হোমপেজ — ফিচার্ড" /></Field>
        </Modal>
      )}
      {deleting && <ConfirmDialog text={`"${deleting.label}" সেকশনটি ডিলিট করতে চান? এই সেকশনে থাকা প্রোডাক্টগুলো আর কোথাও দেখাবে না, নতুন সেকশন সিলেক্ট করে দিন।`} onCancel={() => setDeleting(null)} onConfirm={remove} />}
    </div>
  );
}

/* ===========================================================
   AGENT TYPES — controls how a product behaves/looks on the
   storefront (normal / railway / hyper, or anything new).
=========================================================== */
const AGENT_ICONS = { normal: Package, railway: Rocket, hyper: Crown };
function AgentTypesManager({ db, setDb, toast }) {
  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState({ key: "", label: "", badge: "", tone: "neutral" });
  const [deleting, setDeleting] = useState(null);

  const save = () => {
    const key = f.key.trim().toLowerCase().replace(/\s+/g, "_");
    if (!key || !f.label) return;
    setDb((p) => ({ ...p, agentTypes: [...p.agentTypes, { id: "agt_" + Date.now(), key, label: f.label, badge: f.badge, tone: f.tone }] }));
    toast("নতুন এজেন্ট টাইপ যোগ হয়েছে"); setShowForm(false); setF({ key: "", label: "", badge: "", tone: "neutral" });
  };
  const remove = () => { setDb((p) => ({ ...p, agentTypes: p.agentTypes.filter((a) => a.id !== deleting.id) })); toast("এজেন্ট টাইপ ডিলিট হয়েছে", "error"); setDeleting(null); };

  return (
    <div>
      <SectionHeader title="এজেন্ট টাইপ ম্যানেজমেন্ট" sub="প্রতিটি প্রোডাক্টের হ্যান্ডলিং/UI বিহেভিয়ার (Normal সাধারণ, Railway ফাস্ট/বাল্ক, Hyper প্রিমিয়াম) — নতুন টাইপও যোগ করা যাবে" action={<PrimaryBtn icon={Plus} onClick={() => setShowForm(true)}>নতুন এজেন্ট টাইপ</PrimaryBtn>} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {db.agentTypes.map((a) => {
          const Icon = AGENT_ICONS[a.key] || Zap;
          return (
            <Card key={a.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: C.cream }}><Icon size={16} color={C.brand} /></div>
                  <div>
                    <p className="font-semibold text-[13.5px]" style={{ color: C.navy }}>{a.label}</p>
                    <p className="text-[11px]" style={{ color: C.navySoft }}><code>{a.key}</code></p>
                  </div>
                </div>
                <button onClick={() => setDeleting(a)} className="p-1.5 rounded-lg border" style={{ borderColor: C.line }}><Trash2 size={13} color={C.danger} /></button>
              </div>
              {a.badge && <div className="mt-3"><Badge text={a.badge} tone={a.tone} /></div>}
            </Card>
          );
        })}
      </div>
      {showForm && (
        <Modal title="নতুন এজেন্ট টাইপ যোগ করুন" onClose={() => setShowForm(false)} footer={<><GhostBtn onClick={() => setShowForm(false)}>বাতিল</GhostBtn><PrimaryBtn icon={Save} disabled={!f.key || !f.label} onClick={save}>যোগ করুন</PrimaryBtn></>}>
          <Field label="Key (ইংরেজিতে, স্পেস ছাড়া)"><input className={inputCls} style={inputStyle} value={f.key} onChange={(e) => setF({ ...f, key: e.target.value })} placeholder="vip" /></Field>
          <Field label="প্রদর্শনী নাম"><input className={inputCls} style={inputStyle} value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} placeholder="VIP" /></Field>
          <Field label="ব্যাজ টেক্সট"><input className={inputCls} style={inputStyle} value={f.badge} onChange={(e) => setF({ ...f, badge: e.target.value })} placeholder="⭐ VIP কাস্টমার প্রায়োরিটি" /></Field>
          <Field label="ব্যাজ কালার">
            <select className={inputCls} style={inputStyle} value={f.tone} onChange={(e) => setF({ ...f, tone: e.target.value })}>
              {["neutral", "success", "warning", "danger", "brand", "info"].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
        </Modal>
      )}
      {deleting && <ConfirmDialog text={`"${deleting.label}" এজেন্ট টাইপটি ডিলিট করতে চান?`} onCancel={() => setDeleting(null)} onConfirm={remove} />}
    </div>
  );
}

/* ===========================================================
   ORDERS
=========================================================== */
function OrdersManager({ db, setDb, toast }) {
  const [filter, setFilter] = useState("all");
  const [openOrder, setOpenOrder] = useState(null);
  const filtered = db.orders.filter((o) => filter === "all" || o.status === filter);

  const updateOrder = (id, patch) => {
    setDb((p) => ({ ...p, orders: p.orders.map((o) => (o.id === id ? { ...o, ...patch } : o)) }));
    setOpenOrder((o) => (o && o.id === id ? { ...o, ...patch } : o));
    toast("অর্ডার আপডেট হয়েছে");
  };

  return (
    <div>
      <SectionHeader title="অর্ডার ম্যানেজমেন্ট" sub={`মোট ${db.orders.length} টি অর্ডার`} />
      <div className="flex gap-2 overflow-x-auto pb-3">
        {["all", "pending", "confirmed", "shipped", "delivered", "cancelled"].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className="px-3.5 py-1.5 rounded-full text-[12px] font-semibold shrink-0 border capitalize"
            style={{ backgroundColor: filter === s ? C.brand : "#fff", color: filter === s ? "#fff" : C.navySoft, borderColor: filter === s ? C.brand : C.line }}>{s}</button>
        ))}
      </div>
      <Card className="overflow-x-auto">
        {filtered.length === 0 ? <EmptyState icon={ShoppingBag} text="কোনো অর্ডার পাওয়া যায়নি" /> : (
          <table className="w-full text-[12.5px] min-w-[760px]">
            <thead><tr className="text-left border-b" style={{ borderColor: C.line, color: C.navySoft }}>
              <th className="p-3 font-medium">অর্ডার আইডি</th><th className="p-3 font-medium">কাস্টমার</th><th className="p-3 font-medium">মূল্য</th><th className="p-3 font-medium">পেমেন্ট</th><th className="p-3 font-medium">স্ট্যাটাস</th><th className="p-3 font-medium text-right">অ্যাকশন</th>
            </tr></thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-b" style={{ borderColor: C.line }}>
                  <td className="p-3 font-medium" style={{ color: C.navy }}>{o.id}</td>
                  <td className="p-3" style={{ color: C.navySoft }}>{o.customer}<br /><span className="text-[11px]">{o.phone}</span><br /><span className="text-[10.5px]" style={{ color: "#9B9488" }}>{o.createdAt ? new Date(o.createdAt).toLocaleDateString("bn-BD", { day: "numeric", month: "short", year: "numeric" }) : ""}</span></td>
                  <td className="p-3" style={{ color: C.navy }}>{fmt(o.total)}</td>
                  <td className="p-3" style={{ color: C.navySoft }}>{o.payment}</td>
                  <td className="p-3"><StatusBadge status={o.status} /></td>
                  <td className="p-3 text-right"><GhostBtn small onClick={() => setOpenOrder(o)}>বিস্তারিত</GhostBtn></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      {openOrder && (
        <Modal title={openOrder.id} onClose={() => setOpenOrder(null)}>
          <div className="flex flex-col gap-3 text-[13px]">
            <div><span style={{ color: C.navySoft }}>কাস্টমার: </span><b style={{ color: C.navy }}>{openOrder.customer} ({openOrder.phone})</b></div>
            {openOrder.createdAt && <div><span style={{ color: C.navySoft }}>তারিখ: </span><b style={{ color: C.navy }}>{new Date(openOrder.createdAt).toLocaleString("bn-BD", { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" })}</b></div>}
            <div className="rounded-xl p-3" style={{ backgroundColor: "#FAF8F5" }}>
              <p className="text-[11.5px] font-semibold mb-1" style={{ color: C.navySoft }}>ডেলিভারি ঠিকানা</p>
              {(openOrder.division || openOrder.district || openOrder.thana) && (
                <p style={{ color: C.navy }}><b>{[openOrder.thana, openOrder.district, openOrder.division].filter(Boolean).join(", ")}</b></p>
              )}
              <p className="text-[12px] mt-0.5" style={{ color: C.navySoft }}>{openOrder.address || "—"}</p>
            </div>
            <div><span style={{ color: C.navySoft }}>প্রোডাক্ট: </span>{openOrder.items.map((it, i) => <span key={i} style={{ color: C.navy }}>{it.name}{it.size ? ` (সাইজ: ${it.size})` : ""} × {it.qty}{i < openOrder.items.length - 1 ? ", " : ""}</span>)}</div>
            <div><span style={{ color: C.navySoft }}>মোট মূল্য: </span><b style={{ color: C.brand }}>{fmt(openOrder.total)}</b>{openOrder.deliveryCharge > 0 && <span className="text-[11.5px]" style={{ color: C.navySoft }}> (ডেলিভারিসহ ৳{openOrder.deliveryCharge})</span>}</div>
            <div><span style={{ color: C.navySoft }}>পেমেন্ট মেথড: </span><b style={{ color: C.navy }}>{openOrder.payment}</b></div>
            {openOrder.txnId && <div><span style={{ color: C.navySoft }}>Transaction ID: </span><b style={{ color: C.navy }}>{openOrder.txnId}</b></div>}
            <Field label="অর্ডার স্ট্যাটাস">
              <select className={inputCls} style={inputStyle} value={openOrder.status} onChange={(e) => updateOrder(openOrder.id, { status: e.target.value })}>
                {["pending", "confirmed", "shipped", "delivered", "cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="পেমেন্ট স্ট্যাটাস">
              <select className={inputCls} style={inputStyle} value={openOrder.paymentStatus} onChange={(e) => updateOrder(openOrder.id, { paymentStatus: e.target.value })}>
                {["unpaid", "paid"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="ডেলিভারি স্ট্যাটাস">
              <select className={inputCls} style={inputStyle} value={openOrder.deliveryStatus} onChange={(e) => updateOrder(openOrder.id, { deliveryStatus: e.target.value })}>
                {["processing", "shipped", "delivered"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ===========================================================
   PAYMENTS
=========================================================== */
function PaymentsManager({ db, setDb, toast }) {
  const update = (id, patch) => { setDb((p) => ({ ...p, paymentMethods: p.paymentMethods.map((m) => (m.id === id ? { ...m, ...patch } : m)) })); toast("পেমেন্ট মেথড আপডেট হয়েছে"); };
  return (
    <div>
      <SectionHeader title="পেমেন্ট ম্যানেজমেন্ট" sub="bKash, Nagad, Rocket, Bank ও COD সেটআপ" />
      <div className="flex flex-col gap-3">
        {db.paymentMethods.map((m) => (
          <Card key={m.id} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-[14px]" style={{ color: C.navy }}>{m.name}</p>
              <Toggle checked={m.enabled} onChange={(v) => update(m.id, { enabled: v })} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="অ্যাকাউন্ট নম্বর / বিস্তারিত"><input className={inputCls} style={inputStyle} value={m.account} onChange={(e) => update(m.id, { account: e.target.value })} /></Field>
              <Field label="নির্দেশনা"><input className={inputCls} style={inputStyle} value={m.instructions} onChange={(e) => update(m.id, { instructions: e.target.value })} /></Field>
            </div>
            <label className="flex items-center gap-2 text-[12.5px] font-medium" style={{ color: C.navy }}>
              <Toggle checked={m.txnRequired} onChange={(v) => update(m.id, { txnRequired: v })} /> Transaction ID বাধ্যতামূলক
            </label>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ===========================================================
   DELIVERY
=========================================================== */
function DeliveryManager({ db, setDb, toast }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [f, setF] = useState({ name: "", charge: "", eta: "", freeAbove: "" });
  const [deleting, setDeleting] = useState(null);

  const openNew = () => { setEditing(null); setF({ name: "", charge: "", eta: "", freeAbove: "" }); setShowForm(true); };
  const openEdit = (z) => { setEditing(z); setF(z); setShowForm(true); };
  const save = () => {
    const data = { ...f, charge: +f.charge || 0, freeAbove: +f.freeAbove || 0 };
    if (editing) { setDb((p) => ({ ...p, deliveryZones: p.deliveryZones.map((z) => (z.id === editing.id ? { ...z, ...data } : z)) })); toast("জোন আপডেট হয়েছে"); }
    else { setDb((p) => ({ ...p, deliveryZones: [...p.deliveryZones, { id: "dz_" + Date.now(), ...data }] })); toast("নতুন ডেলিভারি জোন যোগ হয়েছে"); }
    setShowForm(false);
  };
  const remove = () => { setDb((p) => ({ ...p, deliveryZones: p.deliveryZones.filter((z) => z.id !== deleting.id) })); toast("জোন ডিলিট হয়েছে", "error"); setDeleting(null); };

  return (
    <div>
      <SectionHeader title="ডেলিভারি ম্যানেজমেন্ট" sub="জোন, চার্জ ও ফ্রি ডেলিভারি নিয়ম" action={<PrimaryBtn icon={Plus} onClick={openNew}>নতুন জোন</PrimaryBtn>} />
      <div className="grid sm:grid-cols-2 gap-3">
        {db.deliveryZones.map((z) => (
          <Card key={z.id} className="p-4">
            <div className="flex items-center justify-between">
              <p className="font-bold text-[14px]" style={{ color: C.navy }}>{z.name}</p>
              <div className="flex gap-1.5">
                <button onClick={() => openEdit(z)} className="p-1.5 rounded-lg border" style={{ borderColor: C.line }}><Pencil size={13} color={C.navySoft} /></button>
                <button onClick={() => setDeleting(z)} className="p-1.5 rounded-lg border" style={{ borderColor: C.line }}><Trash2 size={13} color={C.danger} /></button>
              </div>
            </div>
            <p className="text-[12.5px] mt-2" style={{ color: C.navySoft }}>চার্জ: <b style={{ color: C.navy }}>{fmt(z.charge)}</b></p>
            <p className="text-[12.5px]" style={{ color: C.navySoft }}>সময়: <b style={{ color: C.navy }}>{z.eta}</b></p>
            <p className="text-[12.5px]" style={{ color: C.navySoft }}>ফ্রি ডেলিভারি: <b style={{ color: C.navy }}>{fmt(z.freeAbove)}+</b></p>
          </Card>
        ))}
      </div>
      {showForm && (
        <Modal title={editing ? "জোন এডিট করুন" : "নতুন ডেলিভারি জোন"} onClose={() => setShowForm(false)}
          footer={<><GhostBtn onClick={() => setShowForm(false)}>বাতিল</GhostBtn><PrimaryBtn icon={Save} disabled={!f.name} onClick={save}>সেভ করুন</PrimaryBtn></>}>
          <Field label="জোনের নাম *"><input className={inputCls} style={inputStyle} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="ডেলিভারি চার্জ (৳)"><input type="number" className={inputCls} style={inputStyle} value={f.charge} onChange={(e) => setF({ ...f, charge: e.target.value })} /></Field>
          <Field label="আনুমানিক সময়"><input className={inputCls} style={inputStyle} value={f.eta} onChange={(e) => setF({ ...f, eta: e.target.value })} placeholder="1-2 days" /></Field>
          <Field label="এই পরিমাণের উপরে ফ্রি ডেলিভারি (৳)"><input type="number" className={inputCls} style={inputStyle} value={f.freeAbove} onChange={(e) => setF({ ...f, freeAbove: e.target.value })} /></Field>
        </Modal>
      )}
      {deleting && <ConfirmDialog text={`"${deleting.name}" জোনটি ডিলিট করতে চান?`} onCancel={() => setDeleting(null)} onConfirm={remove} />}
    </div>
  );
}

/* ===========================================================
   USERS
=========================================================== */
function UsersManager({ db }) {
  return (
    <div>
      <SectionHeader title="ইউজার ম্যানেজমেন্ট" sub={`মোট ${db.users.length} জন কাস্টমার (স্টোরফ্রন্ট রেজিস্ট্রেশন থেকে)`} />
      <Card className="overflow-x-auto">
        {db.users.length === 0 ? <EmptyState icon={Users} text="এখনো কোনো ইউজার নেই" /> : (
          <table className="w-full text-[12.5px] min-w-[480px]">
            <thead><tr className="text-left border-b" style={{ borderColor: C.line, color: C.navySoft }}>
              <th className="p-3 font-medium">নাম</th><th className="p-3 font-medium">মোবাইল</th><th className="p-3 font-medium">অর্ডার সংখ্যা</th><th className="p-3 font-medium text-right">অ্যাকশন</th>
            </tr></thead>
            <tbody>
              {db.users.map((u) => (
                <tr key={u.id} className="border-b" style={{ borderColor: C.line }}>
                  <td className="p-3 font-medium" style={{ color: C.navy }}>{u.name}</td>
                  <td className="p-3" style={{ color: C.navySoft }}>{u.mobile}</td>
                  <td className="p-3" style={{ color: C.navySoft }}>{u.orders}</td>
                  <td className="p-3 text-right"><GhostBtn small disabled>এডিট (শীঘ্রই)</GhostBtn></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

/* ===========================================================
   COUPONS
=========================================================== */
function CouponsManager({ db, setDb, toast }) {
  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState({ code: "", type: "percentage", value: "" });
  const [deleting, setDeleting] = useState(null);

  const save = () => {
    setDb((p) => ({ ...p, coupons: [...p.coupons, { id: "cp_" + Date.now(), code: f.code.toUpperCase(), type: f.type, value: +f.value, enabled: true }] }));
    toast("নতুন কুপন তৈরি হয়েছে");
    setShowForm(false); setF({ code: "", type: "percentage", value: "" });
  };
  const toggle = (id, v) => setDb((p) => ({ ...p, coupons: p.coupons.map((c) => (c.id === id ? { ...c, enabled: v } : c)) }));
  const remove = () => { setDb((p) => ({ ...p, coupons: p.coupons.filter((c) => c.id !== deleting.id) })); toast("কুপন ডিলিট হয়েছে", "error"); setDeleting(null); };

  return (
    <div>
      <SectionHeader title="কুপন ম্যানেজমেন্ট" sub="ডিসকাউন্ট কোড তৈরি ও নিয়ন্ত্রণ করুন" action={<PrimaryBtn icon={Plus} onClick={() => setShowForm(true)}>নতুন কুপন</PrimaryBtn>} />
      <Card className="overflow-x-auto">
        {db.coupons.length === 0 ? <EmptyState icon={Ticket} text="কোনো কুপন নেই" /> : (
          <table className="w-full text-[12.5px] min-w-[480px]">
            <thead><tr className="text-left border-b" style={{ borderColor: C.line, color: C.navySoft }}>
              <th className="p-3 font-medium">কোড</th><th className="p-3 font-medium">ধরন</th><th className="p-3 font-medium">মান</th><th className="p-3 font-medium">স্ট্যাটাস</th><th className="p-3 font-medium text-right">অ্যাকশন</th>
            </tr></thead>
            <tbody>
              {db.coupons.map((c) => (
                <tr key={c.id} className="border-b" style={{ borderColor: C.line }}>
                  <td className="p-3 font-bold" style={{ color: C.brand }}>{c.code}</td>
                  <td className="p-3 capitalize" style={{ color: C.navySoft }}>{c.type}</td>
                  <td className="p-3" style={{ color: C.navy }}>{c.type === "percentage" ? `${c.value}%` : fmt(c.value)}</td>
                  <td className="p-3"><Toggle checked={c.enabled} onChange={(v) => toggle(c.id, v)} /></td>
                  <td className="p-3 text-right"><button onClick={() => setDeleting(c)} className="p-1.5 rounded-lg border" style={{ borderColor: C.line }}><Trash2 size={13} color={C.danger} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      {showForm && (
        <Modal title="নতুন কুপন তৈরি করুন" onClose={() => setShowForm(false)}
          footer={<><GhostBtn onClick={() => setShowForm(false)}>বাতিল</GhostBtn><PrimaryBtn icon={Save} disabled={!f.code || !f.value} onClick={save}>তৈরি করুন</PrimaryBtn></>}>
          <Field label="কুপন কোড *"><input className={inputCls} style={inputStyle} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} placeholder="OMNI20" /></Field>
          <Field label="ধরন">
            <div className="flex gap-2">
              {["percentage", "fixed"].map((t) => (
                <button key={t} onClick={() => setF({ ...f, type: t })} className="flex-1 py-2 rounded-xl text-[12.5px] font-semibold border capitalize" style={{ backgroundColor: f.type === t ? C.brand : "#fff", color: f.type === t ? "#fff" : C.navySoft, borderColor: f.type === t ? C.brand : C.line }}>
                  <Percent size={12} className="inline mr-1" />{t}
                </button>
              ))}
            </div>
          </Field>
          <Field label={f.type === "percentage" ? "ছাড়ের হার (%)" : "ছাড়ের পরিমাণ (৳)"}><input type="number" className={inputCls} style={inputStyle} value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} /></Field>
        </Modal>
      )}
      {deleting && <ConfirmDialog text={`"${deleting.code}" কুপনটি ডিলিট করতে চান?`} onCancel={() => setDeleting(null)} onConfirm={remove} />}
    </div>
  );
}

/* ===========================================================
   CONTENT MANAGEMENT
=========================================================== */
function ContentManager({ db, setDb, toast }) {
  const [f, setF] = useState(db.content);
  const save = () => { setDb((p) => ({ ...p, content: f })); toast("কন্টেন্ট সেভ হয়েছে"); };
  const fields = [
    { key: "homepageText", label: "হোমপেজ টেক্সট" },
    { key: "descriptionTemplate", label: "প্রোডাক্ট বিবরণ টেমপ্লেট" },
    { key: "privacy", label: "Privacy Policy" },
    { key: "returnPolicy", label: "Return Policy" },
    { key: "terms", label: "Terms & Conditions" },
  ];
  return (
    <div>
      <SectionHeader title="কন্টেন্ট ম্যানেজমেন্ট" sub="সাইটের টেক্সট ও পলিসি এডিট করুন" action={<PrimaryBtn icon={Save} onClick={save}>সব সেভ করুন</PrimaryBtn>} />
      <div className="flex flex-col gap-4">
        {fields.map((fl) => (
          <Card key={fl.key} className="p-4">
            <Field label={fl.label}><textarea rows={3} className={inputCls} style={inputStyle} value={f[fl.key]} onChange={(e) => setF({ ...f, [fl.key]: e.target.value })} /></Field>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ===========================================================
   CONTACT & SUPPORT
=========================================================== */
function ContactManager({ db, setDb, toast }) {
  const [c, setC] = useState(db.contact);
  const [agentForm, setAgentForm] = useState(null);
  const saveContact = () => { setDb((p) => ({ ...p, contact: c })); toast("যোগাযোগ তথ্য সেভ হয়েছে"); };
  const addAgent = () => {
    if (!agentForm?.name) return;
    setDb((p) => ({ ...p, agents: [...p.agents, { id: "ag_" + Date.now(), ...agentForm }] }));
    toast("নতুন এজেন্ট যোগ হয়েছে"); setAgentForm(null);
  };
  const removeAgent = (id) => { setDb((p) => ({ ...p, agents: p.agents.filter((a) => a.id !== id) })); toast("এজেন্ট মুছে ফেলা হয়েছে", "error"); };

  return (
    <div>
      <SectionHeader title="কন্টাক্ট ও সাপোর্ট" sub="ফ্লোটিং কন্টাক্ট বাটন ও সাপোর্ট এজেন্ট নিয়ন্ত্রণ করুন" />
      <Card className="p-4 mb-4">
        <p className="font-bold text-[14px] mb-3" style={{ color: C.navy }}>কন্টাক্ট লিংক</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="WhatsApp লিংক"><input className={inputCls} style={inputStyle} value={c.whatsapp} onChange={(e) => setC({ ...c, whatsapp: e.target.value })} /></Field>
          <Field label="Messenger লিংক"><input className={inputCls} style={inputStyle} value={c.messenger} onChange={(e) => setC({ ...c, messenger: e.target.value })} /></Field>
          <Field label="Telegram লিংক"><input className={inputCls} style={inputStyle} value={c.telegram} onChange={(e) => setC({ ...c, telegram: e.target.value })} /></Field>
          <Field label="ফোন নম্বর"><input className={inputCls} style={inputStyle} value={c.phone} onChange={(e) => setC({ ...c, phone: e.target.value })} /></Field>
        </div>
        <PrimaryBtn small icon={Save} onClick={saveContact}>সেভ করুন</PrimaryBtn>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold text-[14px]" style={{ color: C.navy }}>সাপোর্ট এজেন্ট</p>
          <GhostBtn small icon={UserPlus} onClick={() => setAgentForm({ name: "", role: "", contact: "" })}>এজেন্ট যোগ করুন</GhostBtn>
        </div>
        <div className="flex flex-col gap-2">
          {db.agents.map((a) => (
            <div key={a.id} className="flex items-center justify-between border rounded-xl px-3 py-2.5" style={{ borderColor: C.line }}>
              <div>
                <p className="text-[13px] font-medium" style={{ color: C.navy }}>{a.name}</p>
                <p className="text-[11.5px]" style={{ color: C.navySoft }}>{a.role} · {a.contact}</p>
              </div>
              <button onClick={() => removeAgent(a.id)}><Trash2 size={14} color={C.danger} /></button>
            </div>
          ))}
        </div>
      </Card>

      {agentForm && (
        <Modal title="নতুন সাপোর্ট এজেন্ট" onClose={() => setAgentForm(null)} footer={<><GhostBtn onClick={() => setAgentForm(null)}>বাতিল</GhostBtn><PrimaryBtn icon={Save} onClick={addAgent}>যোগ করুন</PrimaryBtn></>}>
          <Field label="নাম"><input className={inputCls} style={inputStyle} value={agentForm.name} onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })} /></Field>
          <Field label="রোল"><input className={inputCls} style={inputStyle} value={agentForm.role} onChange={(e) => setAgentForm({ ...agentForm, role: e.target.value })} placeholder="Customer Support" /></Field>
          <Field label="মোবাইল / যোগাযোগ"><input className={inputCls} style={inputStyle} value={agentForm.contact} onChange={(e) => setAgentForm({ ...agentForm, contact: e.target.value })} /></Field>
        </Modal>
      )}
    </div>
  );
}

/* ===========================================================
   LOCATIONS
=========================================================== */
function LocationsManager({ db, setDb, toast }) {
  const [newDivision, setNewDivision] = useState("");
  const [newDistrict, setNewDistrict] = useState({});
  const [newThana, setNewThana] = useState({});

  const addDivision = () => {
    if (!newDivision.trim()) return;
    setDb((p) => ({ ...p, locations: [...p.locations, { id: "loc_" + Date.now(), division: newDivision, districts: [] }] }));
    toast("নতুন বিভাগ যোগ হয়েছে"); setNewDivision("");
  };
  const addDistrict = (locId) => {
    const name = newDistrict[locId];
    if (!name?.trim()) return;
    setDb((p) => ({ ...p, locations: p.locations.map((l) => (l.id === locId ? { ...l, districts: [...l.districts, { name, thanas: [] }] } : l)) }));
    setNewDistrict({ ...newDistrict, [locId]: "" }); toast("নতুন জেলা যোগ হয়েছে");
  };
  const addThana = (locId, distIdx) => {
    const key = locId + "_" + distIdx;
    const name = newThana[key];
    if (!name?.trim()) return;
    setDb((p) => ({ ...p, locations: p.locations.map((l) => (l.id !== locId ? l : { ...l, districts: l.districts.map((d, i) => (i === distIdx ? { ...d, thanas: [...d.thanas, name] } : d)) })) }));
    setNewThana({ ...newThana, [key]: "" }); toast("নতুন থানা যোগ হয়েছে");
  };

  return (
    <div>
      <SectionHeader title="লোকেশন ম্যানেজমেন্ট" sub="বিভাগ → জেলা → থানা — চেকআউট ফর্মে ব্যবহৃত হয়" />
      <Card className="p-4 mb-4">
        <div className="flex gap-2">
          <input className={inputCls} style={inputStyle} placeholder="নতুন বিভাগের নাম" value={newDivision} onChange={(e) => setNewDivision(e.target.value)} />
          <PrimaryBtn small icon={Plus} onClick={addDivision}>যোগ করুন</PrimaryBtn>
        </div>
      </Card>
      <div className="flex flex-col gap-3">
        {db.locations.map((l) => (
          <Card key={l.id} className="p-4">
            <p className="font-bold text-[14px] mb-2" style={{ color: C.navy }}>{l.division}</p>
            <div className="flex flex-col gap-2 mb-3">
              {l.districts.map((d, di) => (
                <div key={di} className="border rounded-xl p-2.5" style={{ borderColor: C.line }}>
                  <p className="text-[12.5px] font-semibold mb-1.5" style={{ color: C.navySoft }}>{d.name}</p>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {d.thanas.map((t, ti) => <Badge key={ti} text={t} />)}
                  </div>
                  <div className="flex gap-1.5">
                    <input className="flex-1 border rounded-lg px-2.5 py-1.5 text-[12px] outline-none" style={inputStyle} placeholder="নতুন থানা" value={newThana[l.id + "_" + di] || ""} onChange={(e) => setNewThana({ ...newThana, [l.id + "_" + di]: e.target.value })} />
                    <button onClick={() => addThana(l.id, di)} className="px-2.5 rounded-lg text-white text-[11px] font-semibold" style={{ backgroundColor: C.teal }}>যোগ</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-1.5">
              <input className="flex-1 border rounded-lg px-2.5 py-1.5 text-[12px] outline-none" style={inputStyle} placeholder="নতুন জেলা" value={newDistrict[l.id] || ""} onChange={(e) => setNewDistrict({ ...newDistrict, [l.id]: e.target.value })} />
              <button onClick={() => addDistrict(l.id)} className="px-2.5 rounded-lg text-white text-[11px] font-semibold" style={{ backgroundColor: C.brand }}>জেলা যোগ</button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ===========================================================
   SETTINGS
=========================================================== */
function SettingsManager({ db, setDb, toast }) {
  const [f, setF] = useState(db.settings);
  const save = () => { setDb((p) => ({ ...p, settings: f })); toast("সেটিংস সেভ হয়েছে"); };
  return (
    <div>
      <SectionHeader title="সেটিংস" sub="সাইটের মূল কনফিগারেশন" action={<PrimaryBtn icon={Save} onClick={save}>সেভ করুন</PrimaryBtn>} />
      <Card className="p-4 max-w-lg">
        <Field label="ওয়েবসাইটের নাম"><input className={inputCls} style={inputStyle} value={f.siteName} onChange={(e) => setF({ ...f, siteName: e.target.value })} /></Field>
        <Field label="লোগো URL"><input className={inputCls} style={inputStyle} value={f.logo} onChange={(e) => setF({ ...f, logo: e.target.value })} placeholder="https://..." /></Field>
        <Field label="কারেন্সি"><input className={inputCls} style={inputStyle} value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value })} /></Field>
        <label className="flex items-center gap-2 text-[12.5px] font-medium mt-1" style={{ color: C.navy }}>
          <Toggle checked={f.maintenance} onChange={(v) => setF({ ...f, maintenance: v })} /> Maintenance Mode
        </label>
        {f.maintenance && <p className="text-[11.5px] mt-2 rounded-lg px-2.5 py-2" style={{ backgroundColor: "#FDECE6", color: C.danger }}>চালু থাকলে কাস্টমাররা সাইটে "শীঘ্রই আসছে" মেসেজ দেখবে।</p>}
      </Card>
    </div>
  );
}

/* ===========================================================
   LAYOUT — SIDEBAR + TOPBAR
=========================================================== */
const NAV = [
  { id: "dashboard", label: "ড্যাশবোর্ড", icon: LayoutDashboard },
  { id: "hero", label: "হিরো ব্যানার", icon: GalleryHorizontal },
  { id: "products", label: "প্রোডাক্ট", icon: Package },
  { id: "categories", label: "ক্যাটাগরি", icon: Tags },
  { id: "sections", label: "সেকশন", icon: Rows },
  { id: "agenttypes", label: "এজেন্ট টাইপ", icon: Rocket },
  { id: "orders", label: "অর্ডার", icon: ShoppingBag },
  { id: "payments", label: "পেমেন্ট", icon: Wallet },
  { id: "delivery", label: "ডেলিভারি", icon: Truck },
  { id: "users", label: "ইউজার", icon: Users },
  { id: "coupons", label: "কুপন", icon: Ticket },
  { id: "content", label: "কন্টেন্ট", icon: FileText },
  { id: "contact", label: "কন্টাক্ট ও সাপোর্ট", icon: Headphones },
  { id: "locations", label: "লোকেশন", icon: MapPin },
  { id: "settings", label: "সেটিংস", icon: Settings },
];

function Sidebar({ active, setActive, open, setOpen, onLogout, siteName }) {
  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setOpen(false)} />}
      <div className="fixed lg:sticky top-0 z-50 lg:z-0 h-screen flex flex-col transition-transform"
        style={{ width: 240, backgroundColor: C.sidebar, transform: open ? "translateX(0)" : "translateX(-100%)" }}
      >
        <div className="p-5 flex items-center justify-between">
          <span className="text-white font-extrabold text-[17px]" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Omni<span style={{ color: C.brand }}>Shop</span> BD
          </span>
          <button className="lg:hidden" onClick={() => setOpen(false)}><X size={18} color="#fff" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-3">
          {NAV.map((n) => (
            <button key={n.id} onClick={() => { setActive(n.id); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-1 text-[13px] font-medium transition-colors"
              style={{ backgroundColor: active === n.id ? C.brand : "transparent", color: active === n.id ? "#fff" : "rgba(255,255,255,0.65)" }}>
              <n.icon size={16} /> {n.label}
            </button>
          ))}
        </div>
        <div className="p-3 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <button onClick={onLogout} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium" style={{ color: "rgba(255,255,255,0.75)" }}>
            <LogOut size={16} /> লগআউট
          </button>
        </div>
      </div>
      {/* fixed sidebar spacer for desktop */}
      <style>{`@media (min-width:1024px){.admin-shell{padding-left:0}}`}</style>
    </>
  );
}

function Topbar({ setOpen, admin, title }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="sticky top-0 z-30 bg-white border-b flex items-center justify-between px-4 py-3" style={{ borderColor: C.line }}>
      <div className="flex items-center gap-3">
        <button className="lg:hidden" onClick={() => setOpen(true)}><Menu size={20} color={C.navy} /></button>
        <span className="font-semibold text-[14px] hidden sm:block" style={{ color: C.navy }}>{title}</span>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative"><Bell size={18} color={C.navySoft} /><span className="absolute -top-1 -right-1 w-2 h-2 rounded-full" style={{ backgroundColor: C.brand }} /></button>
        <div className="relative">
          <button onClick={() => setMenuOpen((v) => !v)} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] font-bold" style={{ backgroundColor: C.brand }}>
              {admin.email[0].toUpperCase()}
            </div>
            <ChevronDown size={14} color={C.navySoft} className="hidden sm:block" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 bg-white border rounded-xl shadow-lg w-48 py-1.5 z-40" style={{ borderColor: C.line }}>
              <div className="px-3.5 py-2 border-b" style={{ borderColor: C.line }}>
                <p className="text-[12.5px] font-semibold" style={{ color: C.navy }}>{admin.email}</p>
                <p className="text-[11px]" style={{ color: C.navySoft }}>{admin.role}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===========================================================
   APP
=========================================================== */
export default function App() {
  const [admin, setAdmin] = useState(null);
  const [db, setDb] = useState(SEED_DB);
  const [active, setActive] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [loadingState, setLoadingState] = useState(false);
  const saveChainRef = useRef(Promise.resolve());

  const toast = (text, type = "success") => { setToastMsg({ text, type }); setTimeout(() => setToastMsg(null), 2500); };

  // restore admin session
  useEffect(() => {
    try { const a = localStorage.getItem("omni_admin"); if (a) setAdmin(JSON.parse(a)); } catch {}
  }, []);

  const reloadState = React.useCallback(async () => {
    const res = await fetch("/api/admin/state");
    const d = await res.json();
    if (d.ok) setDb((prev) => ({ ...prev, ...d.state }));
    return d.ok;
  }, []);

  // load real DB state once logged in
  useEffect(() => {
    if (!admin) return;
    let cancel = false;
    setLoadingState(true);
    (async () => {
      try { await reloadState(); } catch { if (!cancel) toast("ডেটা লোড ব্যর্থ — রিফ্রেশ করুন", "error"); }
      finally { if (!cancel) setLoadingState(false); }
    })();
    return () => { cancel = true; };
  }, [admin, reloadState]);

  // intercept setDb: persist changed collections to the database
  const persistingSetDb = React.useCallback((updater) => {
    setDb((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      const keys = Object.keys(next);
      const changed = keys.filter((k) => JSON.stringify(next[k]) !== JSON.stringify(prev[k]));
      if (changed.length) {
        // Sequential save queue — prevents double-insert races, and always
        // re-syncs from the database after collections that generate ids.
        saveChainRef.current = saveChainRef.current.then(async () => {
          let needReload = false;
          for (const k of changed) {
            try {
              const res = await fetch("/api/admin/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ collection: k, value: next[k] }) });
              const d = await res.json();
              if (!d.ok) { toast("সেভ ব্যর্থ: " + k, "error"); }
              if (d.reload) needReload = true;
            } catch { toast("সেভ ব্যর্থ — নেটওয়ার্ক", "error"); }
          }
          if (needReload) { try { await reloadState(); } catch {} }
        });
      }
      return next;
    });
  }, [reloadState]);

  const logout = () => { try { localStorage.removeItem("omni_admin"); } catch {} setAdmin(null); };

  if (!admin) return <LoginPage admins={db.admins} onLogin={setAdmin} />;

  const titleMap = Object.fromEntries(NAV.map((n) => [n.id, n.label]));

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: C.bg, fontFamily: "'Inter', 'Poppins', sans-serif" }}>
      <style>{FONT_IMPORT}</style>
      <Sidebar active={active} setActive={setActive} open={sidebarOpen} setOpen={setSidebarOpen} onLogout={logout} siteName={db.settings.siteName} />
      <div className="flex-1 min-w-0 flex flex-col lg:ml-[240px]">
        <Topbar setOpen={setSidebarOpen} admin={admin} title={titleMap[active]} />
        <div className="p-4 sm:p-6 flex-1">
          {active === "dashboard" && <Dashboard db={db} go={setActive} />}
          {active === "hero" && <HeroBannerManager db={db} setDb={persistingSetDb} toast={toast} />}
          {active === "products" && <ProductsManager db={db} setDb={persistingSetDb} toast={toast} go={setActive} />}
          {active === "categories" && <CategoriesManager db={db} setDb={persistingSetDb} toast={toast} />}
          {active === "sections" && <SectionsManager db={db} setDb={persistingSetDb} toast={toast} />}
          {active === "agenttypes" && <AgentTypesManager db={db} setDb={persistingSetDb} toast={toast} />}
          {active === "orders" && <OrdersManager db={db} setDb={persistingSetDb} toast={toast} />}
          {active === "payments" && <PaymentsManager db={db} setDb={persistingSetDb} toast={toast} />}
          {active === "delivery" && <DeliveryManager db={db} setDb={persistingSetDb} toast={toast} />}
          {active === "users" && <UsersManager db={db} />}
          {active === "coupons" && <CouponsManager db={db} setDb={persistingSetDb} toast={toast} />}
          {active === "content" && <ContentManager db={db} setDb={persistingSetDb} toast={toast} />}
          {active === "contact" && <ContactManager db={db} setDb={persistingSetDb} toast={toast} />}
          {active === "locations" && <LocationsManager db={db} setDb={persistingSetDb} toast={toast} />}
          {active === "settings" && <SettingsManager db={db} setDb={persistingSetDb} toast={toast} />}
        </div>
      </div>
      <Toast toast={toastMsg} />
    </div>
  );
}
