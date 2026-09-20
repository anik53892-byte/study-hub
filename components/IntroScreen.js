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

  // Small glowing particles, kept away from the center (where a face usually is).
  const particles = Array.from({ length: 8 }).map((_, i) => {
    const nearLeft = i % 2 === 0;
    const left = nearLeft ? seeded(i, 1) * 22 : 78 + seeded(i, 1) * 20;
    const top = 8 + seeded(i, 2) * 84;
    const size = 3 + seeded(i, 3) * 4;
    const duration = 10 + seeded(i, 4) * 8;
    const delay = seeded(i, 5) * 8;
    return { left, top, size, duration, delay, key: i };
  });

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-700 ib-root ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Photo stays sharp, unobstructed and dominant */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/intro-bg.jpg')" }}
      />

      {/* Soft aurora light clouds, blended, drifting slowly — kept toward the edges */}
      <div className="absolute inset-0 ib-aurora-layer">
        <div className="ib-cloud ib-cloud-1" />
        <div className="ib-cloud ib-cloud-2" />
        <div className="ib-cloud ib-cloud-3" />
        <div className="ib-cloud ib-cloud-4" />
      </div>

      {/* Gentle dark vignette so the text stays readable — unchanged intent from before */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/70" />

      {particles.map((p) => (
        <span
          key={p.key}
          className="absolute rounded-full ib-particle"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center">
        <div className="animate-introFade">
          <p className="text-xs tracking-[0.35em] uppercase text-violet-200/70 mb-3">Study Hub</p>
          <h1 className="font-serif italic font-bold text-4xl sm:text-5xl animate-introGlow">Hi {name}</h1>
          <div className="h-0.5 w-16 mx-auto mt-4 mb-3 rounded-full bg-gradient-to-r from-transparent via-violet-300 to-transparent animate-underlinePulse" />
          <p className="text-violet-100/70 text-sm">Getting your space ready…</p>
        </div>
      </div>

      <style>{`
        .ib-aurora-layer {
          mix-blend-mode: screen;
          animation: ibBreathe 9s ease-in-out infinite;
        }
        .ib-cloud {
          position: absolute;
          border-radius: 9999px;
          filter: blur(70px);
          opacity: 0.55;
        }
        .ib-cloud-1 {
          width: 60vw; height: 60vw;
          top: -18%; left: -18%;
          background: radial-gradient(circle, rgba(196,181,253,0.55), transparent 70%);
          animation: ibDrift1 26s ease-in-out infinite;
        }
        .ib-cloud-2 {
          width: 55vw; height: 55vw;
          top: -12%; right: -20%;
          background: radial-gradient(circle, rgba(244,114,182,0.45), transparent 70%);
          animation: ibDrift2 32s ease-in-out infinite;
        }
        .ib-cloud-3 {
          width: 65vw; height: 65vw;
          bottom: -22%; left: -10%;
          background: radial-gradient(circle, rgba(34,211,238,0.32), transparent 70%);
          animation: ibDrift3 36s ease-in-out infinite;
        }
        .ib-cloud-4 {
          width: 50vw; height: 50vw;
          bottom: -16%; right: -16%;
          background: radial-gradient(circle, rgba(168,85,247,0.4), transparent 70%);
          animation: ibDrift4 29s ease-in-out infinite;
        }
        @keyframes ibBreathe {
          0%, 100% { opacity: 0.75; }
          50% { opacity: 1; }
        }
        @keyframes ibDrift1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(4%, 3%) scale(1.08); }
        }
        @keyframes ibDrift2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-3%, 4%) scale(1.06); }
        }
        @keyframes ibDrift3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(3%, -3%) scale(1.05); }
        }
        @keyframes ibDrift4 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-4%, -3%) scale(1.07); }
        }
        .ib-particle {
          background: rgba(255, 255, 255, 0.85);
          box-shadow: 0 0 6px 2px rgba(216, 180, 254, 0.6);
          animation-name: ibParticleFloat;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          opacity: 0;
        }
        @keyframes ibParticleFloat {
          0% { transform: translateY(0); opacity: 0; }
          15% { opacity: 0.9; }
          50% { transform: translateY(-14px); opacity: 0.5; }
          85% { opacity: 0.9; }
          100% { transform: translateY(0); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
