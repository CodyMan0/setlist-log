"use client";

import { useEffect, useRef, useState } from "react";
import { SIGNALS, findSignal, randomId, type AckMessage, type SignalKind } from "../../lib/signals";
import { useBandChannel } from "../../lib/useBandChannel";
import { useWakeLock } from "../../lib/useWakeLock";
import { ConnBadge, CopyBassLink, LeaveButton } from "./parts";

const ACK_TIMEOUT = 2000;

type Sent = {
  id: string;
  kind: SignalKind;
  acks: string[];
  status: "sending" | "waiting" | "received" | "missed" | "failed";
};

export default function DrumPanel({ room, onLeave }: { room: string; onLeave: () => void }) {
  const [last, setLast] = useState<Sent | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useWakeLock();

  const onAck = (msg: AckMessage) => {
    setLast((cur) => {
      if (!cur || cur.id !== msg.id || cur.acks.includes(msg.by)) return cur;
      return { ...cur, acks: [...cur.acks, msg.by], status: "received" };
    });
  };

  const { state, peers, send } = useBandChannel({ room, role: "drum", onAck });
  const connected = state === "connected";

  useEffect(() => () => clearTimeout(timer.current), []);

  const fire = async (kind: SignalKind) => {
    const id = randomId();
    clearTimeout(timer.current);
    setLast({ id, kind, acks: [], status: "sending" });
    navigator.vibrate?.(30);
    const ok = await send("signal", { id, kind, at: Date.now() });
    if (!ok) {
      setLast((cur) => (cur?.id === id ? { ...cur, status: "failed" } : cur));
      return;
    }
    setLast((cur) => (cur?.id === id && cur.status === "sending" ? { ...cur, status: "waiting" } : cur));
    timer.current = setTimeout(() => {
      setLast((cur) => (cur?.id === id && cur.acks.length === 0 ? { ...cur, status: "missed" } : cur));
    }, ACK_TIMEOUT);
  };

  return (
    <main className="mx-auto flex h-dvh w-full max-w-xl flex-col px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
      <header className="flex items-center justify-between gap-2 px-1">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-stone-500">보내기 · 드럼</p>
          <p className="font-mono text-2xl font-bold leading-tight tracking-widest text-stone-50">{room}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <CopyBassLink room={room} />
          <LeaveButton onLeave={onLeave} />
        </div>
      </header>

      <div className="mt-2 flex items-center justify-between px-1">
        <ConnBadge state={state} />
        <span data-testid="receivers" className="text-sm font-semibold text-stone-300">
          받는 사람 <b className={peers.bass > 0 ? "text-emerald-300" : "text-rose-300"}>{peers.bass}명</b>
        </span>
      </div>

      <AckBar last={last} />

      <div className="mt-3 grid min-h-0 flex-1 grid-cols-3 grid-rows-3 gap-2">
        {SIGNALS.map((s) => {
          const isLast = last?.kind === s.kind;
          return (
            <button
              key={s.kind}
              type="button"
              data-signal={s.kind}
              disabled={!connected}
              onClick={() => fire(s.kind)}
              className={`relative flex min-h-20 touch-manipulation select-none flex-col items-center justify-center rounded-2xl ${s.button} text-stone-950 transition-transform active:scale-95 disabled:opacity-35 ${
                isLast ? "ring-4 ring-white ring-offset-2 ring-offset-stone-950" : ""
              }`}
            >
              <span className="break-keep text-[clamp(1.25rem,6vw,2rem)] font-black leading-tight">{s.label}</span>
              {"sub" in s && <span className="text-sm font-bold opacity-70">{s.sub}</span>}
              {isLast && last.status === "received" && (
                <span className="absolute right-1.5 top-1.5 rounded-full bg-stone-950 px-2 py-0.5 text-xs font-bold text-emerald-300">
                  ✓ {last.acks.length}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </main>
  );
}

function AckBar({ last }: { last: Sent | null }) {
  const sig = last ? findSignal(last.kind) : undefined;
  let text = "버튼을 누르면 받는 쪽에 바로 떠요";
  let tone = "border-stone-800 text-stone-500";
  if (last && sig) {
    switch (last.status) {
      case "sending":
      case "waiting":
        text = `${sig.label} · 보내는 중…`;
        tone = "border-stone-700 text-stone-200";
        break;
      case "received":
        text = `${sig.label} · 받음 ✓ (${last.acks.length}명)`;
        tone = "border-emerald-400 bg-emerald-400/15 text-emerald-200";
        break;
      case "missed":
        text = `${sig.label} · 아직 안 받음`;
        tone = "border-rose-400 bg-rose-400/15 text-rose-200";
        break;
      case "failed":
        text = `${sig.label} · 보내지 못했어요 (연결 확인)`;
        tone = "border-rose-400 bg-rose-400/15 text-rose-200";
        break;
    }
  }
  return (
    <p
      data-testid="ack"
      data-status={last?.status ?? "idle"}
      aria-live="polite"
      className={`mt-3 rounded-xl border px-4 py-3 text-center text-lg font-bold ${tone}`}
    >
      {text}
    </p>
  );
}
