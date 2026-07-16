// app/account/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, LayoutDashboard, Package, Wallet, LogOut } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const links = [
  { href: "/dashboard", label: "রিসেলার ড্যাশবোর্ড", icon: LayoutDashboard },
  { href: "/orders", label: "আমার অর্ডার", icon: Package },
  { href: "/withdraw", label: "উত্তোলন", icon: Wallet },
];

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .single();

  return (
    <main className="max-w-md mx-auto pb-20 bg-white min-h-screen px-4 pt-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)] font-bold">
          {(profile?.full_name ?? "U")[0]}
        </div>
        <div>
          <p className="font-semibold text-sm">{profile?.full_name ?? "রিসেলার"}</p>
          <p className="text-xs text-[var(--text-muted)]">{profile?.phone ?? user.email}</p>
        </div>
      </div>

      <div className="mt-6 space-y-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center justify-between py-3 border-b border-[var(--border)]"
          >
            <span className="flex items-center gap-3 text-sm">
              <Icon size={17} className="text-[var(--text-muted)]" />
              {label}
            </span>
            <ChevronRight size={16} className="text-[var(--text-muted)]" />
          </Link>
        ))}
      </div>

      <form action="/auth/signout" method="post">
        <button className="flex items-center gap-2 text-sm text-red-600 mt-6">
          <LogOut size={16} />
          লগআউট
        </button>
      </form>

      <BottomNav />
    </main>
  );
}
