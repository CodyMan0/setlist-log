// 드럼 → 베이스로 보내는 신호 목록.
// 색은 어두운 무대에서 멀리서도 구분되도록 채도 높은 것만 쓴다.
export const SIGNALS = [
  { kind: "next", label: "다음 곡", button: "bg-emerald-400", flash: "bg-emerald-400", text: "text-emerald-300" },
  { kind: "repeat", label: "한 번 더", sub: "반복", button: "bg-sky-400", flash: "bg-sky-400", text: "text-sky-300" },
  { kind: "chorus", label: "코러스", button: "bg-amber-300", flash: "bg-amber-300", text: "text-amber-200" },
  { kind: "bridge", label: "브릿지", button: "bg-violet-400", flash: "bg-violet-400", text: "text-violet-300" },
  { kind: "ending", label: "엔딩", button: "bg-rose-400", flash: "bg-rose-400", text: "text-rose-300" },
  { kind: "break", label: "브레이크", sub: "빠짐", button: "bg-stone-100", flash: "bg-stone-100", text: "text-stone-100" },
  { kind: "buildup", label: "빌드업", button: "bg-orange-400", flash: "bg-orange-400", text: "text-orange-300" },
  { kind: "tempo-up", label: "템포 ↑", button: "bg-red-500", flash: "bg-red-500", text: "text-red-400" },
  { kind: "tempo-down", label: "템포 ↓", button: "bg-blue-500", flash: "bg-blue-500", text: "text-blue-400" },
] as const;

export type SignalDef = (typeof SIGNALS)[number];
export type SignalKind = SignalDef["kind"];

export function findSignal(kind: string): SignalDef | undefined {
  return SIGNALS.find((s) => s.kind === kind);
}

export type Role = "drum" | "bass";

/** 브로드캐스트로 오가는 메시지 */
export type SignalMessage = { id: string; kind: SignalKind; at: number };
export type AckMessage = { id: string; by: string };

export const ROOM_RE = /^\d{4}$/;
export const ROOM_KEY = "conti-signal-room";

export function randomRoom(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function randomId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
