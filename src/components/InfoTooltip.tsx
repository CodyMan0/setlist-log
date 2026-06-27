"use client";

import { useState } from "react";

// 데이터 출처/원리를 알려주는 ? 아이콘. 마우스 오버(데스크탑) + 탭(모바일) 모두 동작.
export default function InfoTooltip() {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex align-middle">
      <button
        type="button"
        aria-label="데이터 수집 방식 안내"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        className="flex h-5 w-5 items-center justify-center rounded-full border border-stone-300 text-[11px] font-bold text-stone-400 transition-colors hover:border-stone-400 hover:text-stone-600"
      >
        ?
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 top-7 z-20 w-64 -translate-x-1/2 break-keep rounded-xl bg-stone-900 px-3.5 py-3 text-left text-xs leading-relaxed font-normal text-stone-100 shadow-lg"
        >
          유튜브{" "}
          <b className="font-semibold text-white">@anointing3545</b> 채널 영상에서
          자동으로 가져와요. <b className="font-semibold text-white">제목에 적힌
          날짜</b>를 기준으로 정리하고, 제목에 날짜가 없으면{" "}
          <b className="font-semibold text-white">‘날짜 모름’</b>으로 표시해요.
        </span>
      )}
    </span>
  );
}
