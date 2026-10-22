"use client";

import { useEffect, useState } from "react";

export type WakeState = "on" | "off" | "unsupported";

/**
 * 화면 꺼짐 방지(Screen Wake Lock). 실패해도 괜찮다.
 * 화면 복귀·탭(pointerdown) 때 잡혀 있지 않으면 다시 요청한다.
 */
export function useWakeLock(enabled = true): WakeState {
  const [state, setState] = useState<WakeState>("off");

  useEffect(() => {
    if (!enabled) return;
    if (!("wakeLock" in navigator)) {
      setState("unsupported");
      return;
    }
    let sentinel: WakeLockSentinel | null = null;
    let disposed = false;
    let pending = false;

    const request = async () => {
      if (disposed || pending || (sentinel && !sentinel.released)) return;
      if (document.visibilityState !== "visible") return;
      pending = true;
      try {
        const s = await navigator.wakeLock.request("screen");
        if (disposed) {
          s.release().catch(() => {});
          return;
        }
        sentinel = s;
        setState("on");
        s.addEventListener("release", () => {
          if (!disposed) setState("off");
        });
      } catch {
        if (!disposed) setState("off");
      } finally {
        pending = false;
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") request();
    };
    request();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pointerdown", request);
    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pointerdown", request);
      sentinel?.release().catch(() => {});
    };
  }, [enabled]);

  return state;
}
