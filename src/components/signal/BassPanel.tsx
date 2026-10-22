"use client";

import { useEffect, useRef, useState } from "react";
import { findSignal, type SignalMessage } from "../../lib/signals";
import { useBandChannel } from "../../lib/useBandChannel";
import { useWakeLock } from "../../lib/useWakeLock";
import { ConnBadge, LeaveButton } from "./parts";

/** 이 시간이 지나면 배경색을 빼고 글자만 남긴다 */
const FRESH_MS = 8000;

type Received = SignalMessage & { receivedAt: number };

export default function BassPanel({ room, onLeave }: { room: string; onLeave: () => void }) {
  const [last, setLast] = useState<Received | null>(null);
  const [now, setNow] = useState(() => Date.now());
  // 진동은 사용자가 한 번이라도 화면을 눌러야 동작한다 (들어가기 버튼을 눌렀으면 이미 된 상태)
  const [tapped, setTapped] = useState(() => navigator.userActivation?.hasBeenActive ?? true);
  const seen = useRef(new Set<string>());
  const wake = useWakeLock();

  const { clientId, state, peers, send } = useBandChannel({
    room,
    role: "bass",
    onSignal: (msg) => {
      // 받았다는 표시는 중복이어도 다시 보낸다 (드럼 쪽은 사람 단위로 센다)
      send("ack", { id: msg.id, by: clientId });
      if (seen.current.has(msg.id) || !findSignal(msg.kind)) return;
      seen.current.add(msg.id);
      setLast({ ...msg, receivedAt: Date.now() });
      setNow(Date.now());
      navigator.vibrate?.([180, 80, 180]);
    },
  });

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const sig = last ? findSignal(last.kind) : undefined;
  const age = last ? Math.max(0, Math.floor((now - last.receivedAt) / 1000)) : 0;
  const fresh = last ? now - last.receivedAt < FRESH_MS : false;

  return (
    <main
      onPointerDown={() => setTapped(true)}
      className={`relative flex h-dvh w-full flex-col overflow-hidden transition-colors duration-700 ${
        sig && fresh ? sig.flash : "bg-black"
      }`}
    >
      {/* 신호가 오는 순간: 흰색 번쩍 → 신호 색 (key 로 매번 다시 재생) */}
      {last && <div key={last.id} className="signal-flash pointer-events-none absolute inset-0 bg-white" aria-hidden />}

      <header
        className={`relative z-10 flex items-center justify-between gap-2 px-4 pt-3 ${
          sig && fresh ? "text-stone-950" : "text-stone-300"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-xl font-bold tracking-widest">{room}</span>
          <span className={sig && fresh ? "rounded-full bg-black/80 px-2 py-0.5" : ""}>
            <ConnBadge state={state} />
          </span>
        </div>
        <span className={sig && fresh ? "rounded-xl bg-black/80" : ""}>
          <LeaveButton onLeave={onLeave} />
        </span>
      </header>

      <section className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 text-center">
        {sig && last ? (
          <>
            <p
              data-testid="signal-label"
              className={`break-keep font-black leading-[0.95] tracking-tight ${
                fresh ? "text-stone-950" : sig.text
              } text-[clamp(4rem,24vw,12rem)]`}
            >
              {sig.label}
            </p>
            {"sub" in sig && (
              <p className={`mt-3 text-3xl font-bold ${fresh ? "text-stone-900" : "text-stone-400"}`}>{sig.sub}</p>
            )}
          </>
        ) : (
          <div data-testid="waiting">
            <p className="text-lg font-semibold text-stone-500">받기 · 베이스</p>
            <p className="mt-2 font-mono text-[clamp(4rem,26vw,9rem)] font-black leading-none tracking-widest text-stone-100">
              {room}
            </p>
            <p className="mt-6 text-xl font-semibold text-stone-400">
              {state === "connected"
                ? peers.drum > 0
                  ? "드럼 연결됨 · 신호 기다리는 중"
                  : "드럼이 들어오길 기다리는 중"
                : "연결하는 중…"}
            </p>
          </div>
        )}
      </section>

      <footer
        className={`relative z-10 flex items-center justify-between gap-2 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-sm font-semibold ${
          sig && fresh ? "text-stone-900" : "text-stone-500"
        }`}
      >
        <span data-testid="age">{last ? (age < 1 ? "방금" : `${age}초 전`) : `드럼 ${peers.drum}명`}</span>
        <span>
          {!tapped
            ? "화면을 한 번 눌러 주세요 (진동·화면 유지)"
            : wake === "on"
              ? "화면 켜짐 유지"
              : wake === "unsupported"
                ? "화면 자동 꺼짐 주의"
                : "화면 유지 실패 · 다시 눌러 주세요"}
        </span>
      </footer>
    </main>
  );
}
