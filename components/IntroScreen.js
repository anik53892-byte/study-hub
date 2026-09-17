"use client";

import { useEffect, useState } from "react";

export default function IntroScreen({ name = "Pollobi", onDone }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const leaveTimer = setTimeout(() => setLeaving(true), 3400);
    const doneTimer = setTimeout(() => onDone?.(), 4000);
    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center
        bg-gradient-to-br from-violet-200 via-sky-100 to-amber-100
        transition-opacity duration-700 ${leaving ? "opacity-0" : "opacity-100"}`}
    >
      <div className="animate-introFade text-center px-6">
        <p className="text-sm tracking-[0.35em] uppercase text-violet-500/70 mb-3">
          Study Hub
        </p>
        <h1 className="text-4xl sm:text-5xl font-semibold text-ink">
          Hi {name}
        </h1>
        <p className="mt-3 text-violet-700/60 text-sm">Getting your space ready…</p>
      </div>
    </div>
  );
}
