"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "검색" },
  { href: "/insights", label: "랭킹" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav className="mx-auto flex w-full max-w-xl gap-1 px-5 pt-5">
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              active
                ? "bg-stone-900 text-white"
                : "text-stone-400 hover:text-stone-600"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
