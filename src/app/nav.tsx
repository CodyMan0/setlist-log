"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// 상단: 예배 카테고리 / 하위: 보기 모드
const CATEGORIES = [
  { key: "intouch", label: "인터치", search: "/intouch", ranking: "/intouch/insights" },
  { key: "friday", label: "금요예배", search: "/", ranking: "/insights" },
] as const;

export default function Nav() {
  const pathname = usePathname();
  const isIntouch = pathname.startsWith("/intouch");
  const isRanking = pathname.endsWith("/insights");
  const current = isIntouch ? CATEGORIES[0] : CATEGORIES[1];

  const subTabs = [
    { href: current.search, label: "검색", active: !isRanking },
    { href: current.ranking, label: "랭킹", active: isRanking },
  ];

  return (
    <nav className="mx-auto w-full max-w-xl px-5 pt-5">
      {/* 상단: 카테고리 세그먼트 컨트롤 (한 덩어리·동일 너비) */}
      <div className="flex rounded-full bg-stone-100 p-1">
        {CATEGORIES.map((c) => {
          const active = c.key === current.key;
          return (
            <Link
              key={c.key}
              href={c.search}
              className={`flex-1 rounded-full py-2 text-center text-sm font-bold transition-colors ${
                active
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-400 hover:text-stone-600"
              }`}
            >
              {c.label}
            </Link>
          );
        })}
      </div>

      {/* 하위: 검색 / 랭킹 언더라인 탭 */}
      <div className="mt-3 flex gap-5 border-b border-stone-100 px-1">
        {subTabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`-mb-px border-b-2 pb-2 text-sm font-semibold transition-colors ${
              t.active
                ? "border-stone-900 text-stone-900"
                : "border-transparent text-stone-400 hover:text-stone-600"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
