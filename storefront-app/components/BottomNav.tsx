// components/BottomNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, Heart, User } from "lucide-react";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/shop", label: "Shoping", icon: ShoppingBag },
  { href: "/cart", label: "Cart", icon: Heart },
  { href: "/dashboard", label: "Account", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--border)] flex justify-around py-2 max-w-md mx-auto">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-1 px-3 py-1"
          >
            <Icon
              size={20}
              className={active ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}
            />
            <span
              className={`text-[10px] ${
                active ? "text-[var(--accent)] font-medium" : "text-[var(--text-muted)]"
              }`}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
