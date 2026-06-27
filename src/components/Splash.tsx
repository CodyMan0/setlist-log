"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import icon from "../app/icon.png";

const KEY = "conti-splash-last";
const INTERVAL = 3 * 24 * 60 * 60 * 1000; // 3일

export default function Splash() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // 최초 방문이거나 마지막 노출로부터 3일이 지났으면 띄운다.
    let last = 0;
    try {
      last = Number(localStorage.getItem(KEY)) || 0;
    } catch {}
    if (Date.now() - last < INTERVAL) return;

    try {
      localStorage.setItem(KEY, String(Date.now()));
    } catch {}
    setShow(true);
    const t = setTimeout(() => setShow(false), 2400);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <div className="splash-overlay fixed inset-0 z-50 flex items-center justify-center bg-white">
      <div className="splash-content flex flex-col items-center gap-4">
        <Image
          src={icon}
          alt="Conti Memory"
          width={72}
          height={72}
          priority
          className="rounded-2xl"
        />
        <p className="font-brand text-3xl font-bold tracking-tight text-stone-900">
          Conti Memory
        </p>
      </div>
    </div>
  );
}
