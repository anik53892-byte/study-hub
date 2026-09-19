"use client";

import { useEffect, useState } from "react";

function seeded(i, salt) {
  const x = Math.sin(i * 999 + salt * 37.7) * 10000;
  return x - Math.floor(x);
}

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

  const hearts = Array.from({ length: 6 }).map((_, i) => {
    const left = seeded(i, 1) * 100;
    const size = 14 + seeded(i, 2) * 8;
    const duration = 8 + seeded(i, 3) * 4;
    const delay = seeded(i, 4) * 6;
    const emoji = i % 2 === 0 ? "✦" : i % 3 === 0 ? "💖" : "💕";
    return { left, size, duration, delay, emoji, key: i };
  });

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
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/75" />

      {hearts.map((h) => (
        <span
          key={h.key}
          className="absolute bottom-0 select-none animate-floatUp"
          style={{
            left: `${h.left}%`,
            fontSize: `${h.size}px`,
            animationDuration: `${h.duration}s`,
            animationDelay: `${h.delay}s`,
            opacity: 0,
            filter: "drop-shadow(0 0 6px rgba(216,180,254,0.6))",
          }}
        >
          {h.emoji}
        </span>
      ))}

      <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center">
        <div className="animate-introFade">
          <p className="text-xs tracking-[0.35em] uppercase text-violet-200/70 mb-3">Study Hub</p>
          <h1 className="font-serif italic font-bold text-4xl sm:text-5xl animate-introGlow">Hi {name}</h1>
          <div className="h-0.5 w-16 mx-auto mt-4 mb-3 rounded-full bg-gradient-to-r from-transparent via-violet-300 to-transparent animate-underlinePulse" />
          <p className="text-violet-100/70 text-sm">Getting your space ready…</p>
        </div>
      </div>
    </div>
  );
}
