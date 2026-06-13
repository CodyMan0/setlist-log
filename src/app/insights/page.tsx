"use client";

import { useMemo, useState } from "react";
import data from "../../../data/setlists.json";

type Setlist = { date: string; songs: string[] };

const SETLISTS = (data.setlists as Setlist[]) ?? [];
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, "");

function fmtShort(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${y}.${String(m).padStart(2, "0")}.${String(d).padStart(2, "0")}`;
}

// 곡별로 부른 횟수를 집계한다. 메들리("A + B")는 각각 분리해서 센다.
function buildRanking() {
  const map = new Map<
    string,
    { count: number; last: string; forms: Map<string, number> }
  >();
  for (const s of SETLISTS) {
    for (const raw of s.songs) {
      for (const piece of raw.split("+").map((x) => x.trim())) {
        const key = norm(piece);
        if (!key) continue;
        const e = map.get(key) ?? { count: 0, last: "", forms: new Map() };
        e.count += 1;
        if (s.date > e.last) e.last = s.date;
        e.forms.set(piece, (e.forms.get(piece) ?? 0) + 1);
        map.set(key, e);
      }
    }
  }
  return [...map.values()]
    .map((e) => {
      let display = "";
      let max = 0;
      for (const [form, c] of e.forms) if (c > max) ((max = c), (display = form));
      return { display, count: e.count, last: e.last };
    })
    .sort((a, b) => b.count - a.count || (a.last < b.last ? 1 : -1));
}

export default function Insights() {
  const ranking = useMemo(buildRanking, []);
  const [q, setQ] = useState("");
  const query = q.trim();
  const shown = useMemo(() => {
    if (!query) return ranking;
    const nq = norm(query);
    return ranking.filter((r) => norm(r.display).includes(nq));
  }, [ranking, query]);

  return (
    <main className="mx-auto w-full min-h-dvh max-w-xl px-5 pb-24 pt-4">
      <header className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-stone-800">찬양 랭킹</h1>
        <p className="mt-2 break-keep text-base leading-relaxed text-stone-600">
          많이 부른 찬양 순서예요. 총{" "}
          <b className="font-semibold text-stone-800">{ranking.length}곡</b>을 불렀어요.
        </p>
      </header>

      <div className="sticky top-3 z-10">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="곡 이름으로 거르기"
          className="w-full rounded-2xl border border-stone-200 bg-white/90 px-5 py-3.5 text-base text-stone-800 shadow-sm outline-none backdrop-blur placeholder:text-stone-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
        />
      </div>

      <ol className="mt-6 space-y-0.5">
        {shown.map((r, i) => {
          const rank = query ? null : i + 1;
          return (
            <li
              key={r.display}
              className="flex items-center gap-3 rounded-xl px-2 py-3 hover:bg-white"
            >
              <span
                className={`w-7 shrink-0 text-center text-base font-bold ${
                  rank && rank <= 3 ? "text-amber-500" : "text-stone-300"
                }`}
              >
                {rank ?? "·"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-stone-800">
                  {r.display}
                </p>
                <p className="text-xs text-stone-400">마지막 {fmtShort(r.last)}</p>
              </div>
              <span className="shrink-0 text-base font-bold text-stone-700">
                {r.count}
                <span className="ml-0.5 text-xs font-normal text-stone-400">번</span>
              </span>
            </li>
          );
        })}
        {shown.length === 0 && (
          <p className="pt-12 text-center text-base text-stone-400">
            “{query}” 곡이 없어요.
          </p>
        )}
      </ol>
    </main>
  );
}
