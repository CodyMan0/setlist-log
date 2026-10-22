"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabase } from "./supabase";
import { randomId, type AckMessage, type Role, type SignalMessage } from "./signals";

export type ConnState = "connecting" | "connected" | "reconnecting" | "offline";

type Options = {
  room: string;
  role: Role;
  onSignal?: (msg: SignalMessage) => void;
  onAck?: (msg: AckMessage) => void;
};

const MAX_BACKOFF = 10_000;

/**
 * `band-signal:<room>` 채널에 붙는다.
 * - broadcast `signal` (드럼 → 베이스), `ack` (베이스 → 드럼). self:false
 * - presence 로 역할별 접속 인원을 센다
 * - 끊기면(에러·타임아웃·닫힘·오프라인 복귀·화면 복귀) 채널을 새로 만들어 다시 붙는다
 */
export function useBandChannel({ room, role, onSignal, onAck }: Options) {
  const [clientId] = useState(randomId);
  const [state, setState] = useState<ConnState>("connecting");
  const [peers, setPeers] = useState({ drum: 0, bass: 0 });
  const [generation, setGeneration] = useState(0);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const joinedRef = useRef(false);
  const retryRef = useRef(0);
  const handlers = useRef({ onSignal, onAck });
  useEffect(() => {
    handlers.current = { onSignal, onAck };
  });

  useEffect(() => {
    const supabase = getSupabase();
    let disposed = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const scheduleRetry = () => {
      if (disposed || retryTimer) return;
      joinedRef.current = false;
      setState(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "reconnecting");
      const delay = Math.min(1000 * 2 ** retryRef.current, MAX_BACKOFF);
      retryRef.current += 1;
      retryTimer = setTimeout(() => {
        if (!disposed) setGeneration((g) => g + 1);
      }, delay);
    };

    const channel = supabase.channel(`band-signal:${room}`, {
      config: {
        broadcast: { self: false },
        presence: { key: clientId, enabled: true },
      },
    });
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "signal" }, ({ payload }) => {
        handlers.current.onSignal?.(payload as SignalMessage);
      })
      .on("broadcast", { event: "ack" }, ({ payload }) => {
        handlers.current.onAck?.(payload as AckMessage);
      })
      .on("presence", { event: "sync" }, () => {
        const counts = { drum: 0, bass: 0 };
        const presence = channel.presenceState<{ role?: Role }>();
        for (const [key, metas] of Object.entries(presence)) {
          if (key === clientId) continue;
          const r = metas[0]?.role;
          if (r === "drum" || r === "bass") counts[r] += 1;
        }
        setPeers(counts);
      })
      .subscribe((status, err) => {
        if (disposed) return;
        if (status === "SUBSCRIBED") {
          joinedRef.current = true;
          retryRef.current = 0;
          setState("connected");
          channel.track({ role, at: Date.now() }).catch(() => {});
          return;
        }
        if (err) console.warn("[band-signal]", status, err);
        // CHANNEL_ERROR / TIMED_OUT / CLOSED → 채널을 버리고 새로 붙는다
        scheduleRetry();
      });

    const kick = () => {
      if (disposed || joinedRef.current) return;
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = undefined;
      }
      retryRef.current = 0;
      setGeneration((g) => g + 1);
    };
    const onOffline = () => {
      joinedRef.current = false;
      setState("offline");
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") kick();
    };
    window.addEventListener("online", kick);
    window.addEventListener("offline", onOffline);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      disposed = true;
      joinedRef.current = false;
      if (retryTimer) clearTimeout(retryTimer);
      window.removeEventListener("online", kick);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("visibilitychange", onVisible);
      if (channelRef.current === channel) channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [room, role, clientId, generation]);

  const send = useCallback(
    async (event: "signal" | "ack", payload: SignalMessage | AckMessage) => {
      const channel = channelRef.current;
      if (!channel || !joinedRef.current) return false;
      const res = await channel.send({ type: "broadcast", event, payload });
      return res === "ok";
    },
    [],
  );

  return { clientId, state, peers, send };
}
