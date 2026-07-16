// components/CategoryRow.tsx
import { Shirt, Footprints, Watch, Gem, MoreHorizontal } from "lucide-react";
import Link from "next/link";

const categories = [
  { label: "পোশাক", slug: "clothing", icon: Shirt },
  { label: "জুতা", slug: "shoes", icon: Footprints },
  { label: "ঘড়ি", slug: "watch", icon: Watch },
  { label: "গহনা", slug: "jewelry", icon: Gem },
  { label: "সব", slug: "all", icon: MoreHorizontal },
];

export default function CategoryRow() {
  return (
    <div className="grid grid-cols-5 gap-2 px-4 py-3">
      {categories.map(({ label, slug, icon: Icon }) => (
        <Link
          key={slug}
          href={`/shop?category=${slug}`}
          className="flex flex-col items-center gap-1.5"
        >
          <div className="w-11 h-11 rounded-full bg-[var(--surface)] flex items-center justify-center">
            <Icon size={18} className="text-[var(--text)]" />
          </div>
          <span className="text-[10px] text-[var(--text-muted)]">{label}</span>
        </Link>
      ))}
    </div>
  );
}
