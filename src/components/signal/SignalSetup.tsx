"use client";

import Link from "next/link";
import { ROOM_RE, randomRoom, type Role } from "../../lib/signals";

type Props = {
  room: string;
  role: Role | null;
  onRoomChange: (room: string) => void;
  onRoleChange: (role: Role) => void;
  onStart: (s: { room: string; role: Role }) => void;
};

const ROLES: { role: Role; title: string; desc: string }[] = [
  { role: "drum", title: "보내기", desc: "드럼 · 버튼으로 신호를 보내요" },
  { role: "bass", title: "받기", desc: "베이스 · 화면에 신호가 크게 떠요" },
];

export default function SignalSetup({ room, role, onRoomChange, onRoleChange, onStart }: Props) {
  const validRoom = ROOM_RE.test(room);
  const canStart = validRoom && role !== null;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5">
      <Link href="/" className="self-start py-2 text-sm font-semibold text-stone-400 hover:text-stone-200">
        ← <span className="font-brand">Conti Memory</span>
      </Link>

      <header className="mt-4">
        <h1 className="text-2xl font-bold tracking-tight text-stone-50">밴드 신호</h1>
        <p className="mt-2 break-keep text-base leading-relaxed text-stone-400">
          드럼에서 버튼을 누르면 베이스 화면에 바로 떠요. 같은 방 코드로 들어오세요.
        </p>
      </header>

      <section className="mt-8">
        <label htmlFor="room" className="text-sm font-semibold text-stone-400">
          방 코드 (숫자 4자리)
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="room"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            value={room}
            onChange={(e) => onRoomChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
            className="min-w-0 flex-1 rounded-2xl border border-stone-700 bg-stone-900 px-5 py-4 text-center font-mono text-4xl font-bold tracking-[0.4em] text-stone-50 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30"
          />
          <button
            type="button"
            onClick={() => onRoomChange(randomRoom())}
            className="shrink-0 rounded-2xl border border-stone-700 px-4 text-sm font-semibold text-stone-300 active:bg-stone-800"
          >
            새 코드
          </button>
        </div>
        {!validRoom && room.length > 0 && (
          <p className="mt-2 text-sm text-rose-300">숫자 4자리를 입력해 주세요.</p>
        )}
      </section>

      <section className="mt-8">
        <p className="text-sm font-semibold text-stone-400">내 역할</p>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {ROLES.map((r) => {
            const active = role === r.role;
            return (
              <button
                key={r.role}
                type="button"
                aria-pressed={active}
                onClick={() => onRoleChange(r.role)}
                className={`flex min-h-32 flex-col items-start justify-between rounded-2xl border-2 p-4 text-left transition-colors ${
                  active
                    ? "border-amber-300 bg-amber-300 text-stone-950"
                    : "border-stone-700 bg-stone-900 text-stone-100 active:bg-stone-800"
                }`}
              >
                <span className="text-2xl font-bold">{r.title}</span>
                <span className={`break-keep text-sm ${active ? "text-stone-800" : "text-stone-400"}`}>
                  {r.desc}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="mt-auto pt-10">
        <button
          type="button"
          disabled={!canStart}
          onClick={() => role && onStart({ room, role })}
          className="w-full rounded-2xl bg-stone-50 py-5 text-lg font-bold text-stone-950 transition-opacity disabled:opacity-30"
        >
          {canStart ? `${room}번 방 들어가기` : "방 코드와 역할을 골라 주세요"}
        </button>
      </div>
    </main>
  );
}
