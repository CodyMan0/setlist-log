"use client";

import { useMemo, useState } from "react";
import {
  type Feed,
  type Setlist,
  norm,
  fmtDate,
  fmtShort,
  daysAgo,
  datedRange,
  dateLabel,
} from "../lib/feed";
import InfoTooltip from "./InfoTooltip";

type Props = {
  feed: Feed;
  /** 헤더 제목 (예: "금요예배 찬양 검색") */
  title: string;
  /** 헤더 설명 첫 단어 강조 (예: "언제 어떤 찬양") */
  lead: string;
};

export default function SearchView({ feed, title, lead }: Props) {
  const setlists = feed.setlists ?? [];
  const [q, setQ] = useState("");
  const [showAll, setShowAll] = useState(false);
  const query = q.trim();

  const results = useMemo(() => {
    if (!query) return [];
    const nq = norm(query);
    return setlists
      .filter((s) => s.songs.some((song) => norm(song).includes(nq)))
      .map((s) => ({
        ...s,
        matched: s.songs.filter((song) => norm(song).includes(nq)),
      }));
  }, [query, setlists]);

  const list = showAll ? setlists : setlists.slice(0, 6);
  const { oldest, newest } = datedRange(setlists);
  const updated = feed.updatedAt?.slice(0, 10);
  const last = results[0] as (Setlist & { matched: string[] }) | undefined;

  return (
    <main className="mx-auto w-full min-h-dvh max-w-xl px-5 pb-24 pt-4">
      <header className="mb-5">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-stone-800">
          {title}
          <InfoTooltip />
        </h1>
        <p className="mt-2 break-keep text-base leading-relaxed text-stone-600">
          <b className="font-semibold text-stone-800">{lead}</b>을 했는지
          찾아드려요. 곡 이름을 검색하면 마지막으로 한 날을 알려줘요.
        </p>
      </header>

      <div className="sticky top-3 z-10">
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="곡 이름 검색 (예: 주의 보혈)"
          className="w-full rounded-2xl border border-stone-200 bg-white/90 px-5 py-4 text-lg text-stone-800 shadow-sm outline-none backdrop-blur placeholder:text-stone-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
        />
      </div>

      {/* 검색해도 레이아웃이 쪼그라들지 않도록 콘텐츠 영역에 최소 높이 고정 */}
      <div className="mt-6 min-h-[70dvh]">
        {!query && (
          <section>
            <p className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-stone-400">
              <span>
                <b className="font-semibold text-stone-700">총 {feed.count}개</b>{" "}
                콘티
              </span>
              <span className="text-stone-300">·</span>
              <span>
                {oldest && fmtShort(oldest)} ~ {newest && fmtShort(newest)}
              </span>
              <span className="text-stone-300">·</span>
              <span>갱신 {updated && fmtShort(updated)}</span>
            </p>

            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-sm font-semibold text-stone-500">
                {showAll ? "전체 콘티" : "최근 콘티"}
              </h2>
              <button
                onClick={() => setShowAll((v) => !v)}
                className="text-sm font-medium text-amber-700 hover:text-amber-800"
              >
                {showAll ? "접기" : `전체 ${feed.count}개 보기`}
              </button>
            </div>

            <ul className="space-y-3">
              {list.map((s) => (
                <li
                  key={s.videoId}
                  className="rounded-2xl border border-stone-100 bg-white p-4"
                >
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-base font-semibold text-stone-700 hover:text-amber-700"
                  >
                    {dateLabel(s)} <span aria-hidden>↗</span>
                  </a>
                  <p className="mt-1.5 break-keep text-base leading-relaxed text-stone-500">
                    {s.songs.join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {query && !last && (
          <p className="pt-12 text-center text-base text-stone-400">
            “{query}” 으로 한 기록이 없어요.
          </p>
        )}

        {query && last && (
          <section>
            <div className="pt-1">
              <p className="text-sm text-stone-400">
                마지막으로 한 날{last.approx ? " (추정 · 업로드일)" : ""}
              </p>
              <p className="mt-1.5 text-[2.5rem] font-bold leading-none tracking-tight text-stone-900">
                {fmtDate(last.date)}
              </p>
              <p className="mt-3 text-base text-stone-500">
                {last.date
                  ? daysAgo(last.date) === 0
                    ? "오늘 · "
                    : `${daysAgo(last.date)}일 전 · `
                  : ""}
                지금까지 {results.length}번
              </p>
            </div>

            <h2 className="mb-3 mt-9 text-sm font-semibold text-stone-500">
              이전 기록
            </h2>
            <ul className="space-y-2">
              {results.map((s) => (
                <li
                  key={s.videoId}
                  className="flex items-center justify-between gap-3 rounded-xl border border-stone-100 bg-white px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-stone-700">
                      {dateLabel(s)}
                    </p>
                    <p className="truncate text-sm text-stone-400">
                      {s.matched.join(" · ")}
                    </p>
                  </div>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 rounded-lg bg-stone-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-700"
                  >
                    영상 ▶
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <footer className="mt-10 text-center text-sm text-stone-300">
        데이터: 유튜브 @anointing3545 · 매주 자동 갱신
      </footer>
    </main>
  );
}
