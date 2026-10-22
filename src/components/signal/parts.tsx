"use client";

import { useState } from "react";
import type { ConnState } from "../../lib/useBandChannel";

const CONN: Record<ConnState, { label: string; dot: string }> = {
  connecting: { label: "연결 중", dot: "bg-amber-300 animate-pulse" },
  connected: { label: "연결됨", dot: "bg-emerald-400" },
  reconnecting: { label: "다시 연결 중", dot: "bg-amber-300 animate-pulse" },
  offline: { label: "오프라인", dot: "bg-rose-500" },
};

export function ConnBadge({ state }: { state: ConnState }) {
  const c = CONN[state];
  return (
    <span data-conn={state} className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-300">
      <span className={`h-2.5 w-2.5 rounded-full ${c.dot}`} aria-hidden />
      {c.label}
    </span>
  );
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/** 받는 쪽(베이스) 바로가기 링크 복사 */
export function CopyBassLink({ room }: { room: string }) {
  const [done, setDone] = useState<"idle" | "ok" | "fail">("idle");
  const onClick = async () => {
    const url = `${window.location.origin}/signal?room=${room}&role=bass`;
    const ok = await copyText(url);
    setDone(ok ? "ok" : "fail");
    setTimeout(() => setDone("idle"), 1800);
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-11 rounded-xl border border-stone-700 px-3 text-sm font-semibold text-stone-200 active:bg-stone-800"
    >
      {done === "ok" ? "복사됨 ✓" : done === "fail" ? "복사 실패" : "받는 쪽 링크 복사"}
    </button>
  );
}

export function LeaveButton({ onLeave }: { onLeave: () => void }) {
  return (
    <button
      type="button"
      onClick={onLeave}
      className="min-h-11 rounded-xl px-3 text-sm font-semibold text-stone-400 active:bg-stone-800"
    >
      나가기
    </button>
  );
}
