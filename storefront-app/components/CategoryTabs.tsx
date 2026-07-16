// components/CategoryTabs.tsx
"use client";

import { useState } from "react";

const tabs = ["All", "Man", "Woman", "Girls"];

export default function CategoryTabs({
  onChange,
}: {
  onChange?: (tab: string) => void;
}) {
  const [active, setActive] = useState("All");

  return (
    <div className="flex items-center justify-between px-4 mt-4">
      <h2 className="font-bold text-base">Categories</h2>
      <button className="text-xs text-[var(--accent)] font-medium">See All</button>
    </div>
  );
}

export function CategoryPills({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (t: string) => void;
}) {
  return (
    <div className="flex gap-2 px-4 mt-3 overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onSelect(t)}
          className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
            active === t
              ? "bg-[var(--accent)] text-white"
              : "bg-[var(--surface)] text-[var(--text)]"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
