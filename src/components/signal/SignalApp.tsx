"use client";

import { useEffect, useState } from "react";
import { ROOM_KEY, ROOM_RE, randomRoom, type Role } from "../../lib/signals";
import SignalSetup from "./SignalSetup";
import DrumPanel from "./DrumPanel";
import BassPanel from "./BassPanel";

type Session = { room: string; role: Role };

function readUrl(): Partial<Session> {
  const p = new URLSearchParams(window.location.search);
  const room = p.get("room") ?? "";
  const role = p.get("role");
  return {
    room: ROOM_RE.test(room) ? room : undefined,
    role: role === "drum" || role === "bass" ? role : undefined,
  };
}

function writeUrl(s: Session | null, room?: string) {
  const url = new URL(window.location.href);
  url.search = "";
  if (s) {
    url.searchParams.set("room", s.room);
    url.searchParams.set("role", s.role);
  } else if (room) {
    url.searchParams.set("room", room);
  }
  window.history.replaceState(null, "", url);
}

export default function SignalApp() {
  const [ready, setReady] = useState(false);
  const [room, setRoom] = useState("");
  const [role, setRole] = useState<Role | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  // 방 코드 기본값: URL → 마지막에 쓴 방(localStorage) → 랜덤
  useEffect(() => {
    const fromUrl = readUrl();
    let saved = "";
    try {
      saved = localStorage.getItem(ROOM_KEY) ?? "";
    } catch {}
    const r = fromUrl.room ?? (ROOM_RE.test(saved) ? saved : randomRoom());
    setRoom(r);
    if (fromUrl.role) setRole(fromUrl.role);
    if (fromUrl.room && fromUrl.role) start({ room: fromUrl.room, role: fromUrl.role });
    setReady(true);
  }, []);

  function start(s: Session) {
    try {
      localStorage.setItem(ROOM_KEY, s.room);
    } catch {}
    writeUrl(s);
    setSession(s);
  }

  function leave() {
    if (session) writeUrl(null, session.room);
    setSession(null);
  }

  return (
    <div className="fixed inset-0 overflow-y-auto bg-stone-950 text-stone-100 [color-scheme:dark]">
      {!ready ? null : session ? (
        session.role === "drum" ? (
          <DrumPanel room={session.room} onLeave={leave} />
        ) : (
          <BassPanel room={session.room} onLeave={leave} />
        )
      ) : (
        <SignalSetup
          room={room}
          role={role}
          onRoomChange={setRoom}
          onRoleChange={setRole}
          onStart={start}
        />
      )}
    </div>
  );
}
