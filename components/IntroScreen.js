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
      className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-700 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/intro-bg.jpg')" }}
      />
      <div className="absolute inset-0 animate-colorWash mix-blend-multiply" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/40" />

      <div className="absolute -top-10 -left-10 w-56 h-56 rounded-full bg-violet-300/40 blur-3xl animate-floatSlow" />
      <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-amber-200/30 blur-3xl animate-floatSlower" />
      <div className="absolute top-1/3 right-10 w-40 h-40 rounded-full bg-sky-200/30 blur-2xl animate-floatSlow" />

      <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center">
        <div className="animate-introFade">
          <p className="text-xs tracking-[0.35em] uppercase text-white/70 mb-3">Study Hub</p>
          <h1 className="text-4xl sm:text-5xl font-semibold text-white drop-shadow-lg">
            Hi {name}
          </h1>
          <p className="mt-3 text-white/80 text-sm">Getting your space ready…</p>
        </div>
      </div>
    </div>
  );
}
