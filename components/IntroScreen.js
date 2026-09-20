"use client";

import { useEffect, useState } from "react";

function seeded(i, salt) {
  const x = Math.sin(i * 999 + salt * 37.7) * 10000;
  return x - Math.floor(x);
}

export default function IntroScreen({ name = "Pollobi", onDone }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const leaveTimer = setTimeout(() => {
      setLeaving(true);
    }, 3400);

    const doneTimer = setTimeout(() => {
      onDone?.();
    }, 4400);

    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  // Tiny glowing particles.
  // Kept mostly toward the edges so the center remains clean.
  const particles = Array.from({ length: 12 }).map((_, i) => {
    const nearLeft = i % 2 === 0;

    const left = nearLeft
      ? seeded(i, 1) * 22
      : 78 + seeded(i, 1) * 20;

    const top = 8 + seeded(i, 2) * 84;

    const size = 2 + seeded(i, 3) * 3;

    const duration = 11 + seeded(i, 4) * 9;

    const delay = seeded(i, 5) * 8;

    return {
      left,
      top,
      size,
      duration,
      delay,
      key: i,
    };
  });

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-1000 ib-root ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* =========================================================
          BACKGROUND PHOTO
          ========================================================= */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/intro-bg.jpg')",
        }}
      />

      {/* =========================================================
          SOFT AURORA / LIGHT CLOUDS
          ========================================================= */}
      <div className="absolute inset-0 ib-aurora-layer pointer-events-none">
        <div className="ib-cloud ib-cloud-1" />
        <div className="ib-cloud ib-cloud-2" />
        <div className="ib-cloud ib-cloud-3" />
        <div className="ib-cloud ib-cloud-4" />
      </div>

      {/* =========================================================
          VERY SOFT DARK OVERLAY
          Keeps photo visible while protecting text readability.
          ========================================================= */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/10 to-black/55 pointer-events-none" />

      {/* =========================================================
          SUBTLE EDGE VIGNETTE
          ========================================================= */}
      <div className="absolute inset-0 ib-vignette pointer-events-none" />

      {/* =========================================================
          FLOATING LIGHT PARTICLES
          ========================================================= */}
      {particles.map((p) => (
        <span
          key={p.key}
          className="absolute rounded-full ib-particle pointer-events-none"
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

      {/* =========================================================
          MAIN INTRO CONTENT
          ========================================================= */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center">
        <div className="ib-glass-card animate-introFade">
          {/* Small label */}
          <p className="text-[11px] sm:text-xs tracking-[0.35em] uppercase text-violet-100/75 mb-4">
            Study Hub
          </p>

          {/* Main greeting */}
          <h1 className="font-serif italic font-bold text-4xl sm:text-5xl text-white animate-introGlow">
            Hi {name}
          </h1>

          {/* Elegant glowing underline */}
          <div className="h-px w-20 mx-auto mt-5 mb-4 rounded-full bg-gradient-to-r from-transparent via-violet-200/80 to-transparent animate-underlinePulse" />

          {/* Loading message */}
          <p className="text-white/75 text-sm tracking-wide">
            Getting your space ready…
          </p>
        </div>
      </div>

      <style>{`
        /* =========================================================
           AURORA
           ========================================================= */

        .ib-aurora-layer {
          mix-blend-mode: screen;
          animation: ibBreathe 12s ease-in-out infinite;
        }

        .ib-cloud {
          position: absolute;
          border-radius: 9999px;
          filter: blur(80px);
          opacity: 0.38;
          pointer-events: none;
          will-change: transform;
        }

        .ib-cloud-1 {
          width: 60vw;
          height: 60vw;
          top: -18%;
          left: -18%;

          background:
            radial-gradient(
              circle,
              rgba(196, 181, 253, 0.55),
              transparent 70%
            );

          animation: ibDrift1 30s ease-in-out infinite;
        }

        .ib-cloud-2 {
          width: 55vw;
          height: 55vw;
          top: -12%;
          right: -20%;

          background:
            radial-gradient(
              circle,
              rgba(244, 114, 182, 0.38),
              transparent 70%
            );

          animation: ibDrift2 36s ease-in-out infinite;
        }

        .ib-cloud-3 {
          width: 65vw;
          height: 65vw;
          bottom: -22%;
          left: -10%;

          background:
            radial-gradient(
              circle,
              rgba(34, 211, 238, 0.25),
              transparent 70%
            );

          animation: ibDrift3 40s ease-in-out infinite;
        }

        .ib-cloud-4 {
          width: 50vw;
          height: 50vw;
          bottom: -16%;
          right: -16%;

          background:
            radial-gradient(
              circle,
              rgba(168, 85, 247, 0.32),
              transparent 70%
            );

          animation: ibDrift4 33s ease-in-out infinite;
        }

        @keyframes ibBreathe {
          0%,
          100% {
            opacity: 0.72;
          }

          50% {
            opacity: 1;
          }
        }

        @keyframes ibDrift1 {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }

          50% {
            transform: translate(4%, 3%) scale(1.08);
          }
        }

        @keyframes ibDrift2 {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }

          50% {
            transform: translate(-3%, 4%) scale(1.06);
          }
        }

        @keyframes ibDrift3 {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }

          50% {
            transform: translate(3%, -3%) scale(1.05);
          }
        }

        @keyframes ibDrift4 {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }

          50% {
            transform: translate(-4%, -3%) scale(1.07);
          }
        }

        /* =========================================================
           VIGNETTE
           ========================================================= */

        .ib-vignette {
          background:
            radial-gradient(
              ellipse at center,
              transparent 35%,
              rgba(0, 0, 0, 0.16) 75%,
              rgba(0, 0, 0, 0.30) 100%
            );
        }

        /* =========================================================
           PARTICLES
           ========================================================= */

        .ib-particle {
          background: rgba(255, 255, 255, 0.82);

          box-shadow:
            0 0 5px 1px rgba(216, 180, 254, 0.45),
            0 0 12px rgba(255, 255, 255, 0.18);

          animation-name: ibParticleFloat;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;

          opacity: 0;

          will-change: transform, opacity;
        }

        @keyframes ibParticleFloat {
          0% {
            transform: translateY(0) scale(0.8);
            opacity: 0;
          }

          15% {
            opacity: 0.85;
          }

          50% {
            transform: translateY(-16px) scale(1);
            opacity: 0.45;
          }

          85% {
            opacity: 0.8;
          }

          100% {
            transform: translateY(0) scale(0.8);
            opacity: 0;
          }
        }

        /* =========================================================
           GLASS CONTENT CARD
           ========================================================= */

        .ib-glass-card {
          padding: 30px 30px 28px;

          border-radius: 28px;

          background:
            linear-gradient(
              135deg,
              rgba(255, 255, 255, 0.075),
              rgba(255, 255, 255, 0.025)
            );

          border: 1px solid rgba(255, 255, 255, 0.10);

          box-shadow:
            0 10px 40px rgba(0, 0, 0, 0.12),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);

          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
        }

        /* =========================================================
           CONTENT ENTRANCE
           ========================================================= */

        .animate-introFade {
          animation:
            introContent
            1.4s
            cubic-bezier(0.22, 1, 0.36, 1)
            both;
        }

        @keyframes introContent {
          0% {
            opacity: 0;
            transform: translateY(18px) scale(0.97);
            filter: blur(6px);
          }

          60% {
            filter: blur(0);
          }

          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        /* =========================================================
           MAIN TEXT GLOW
           ========================================================= */

        .animate-introGlow {
          animation:
            introTextGlow
            3.2s
            ease-in-out
            infinite;
        }

        @keyframes introTextGlow {
          0%,
          100% {
            text-shadow:
              0 2px 14px rgba(196, 181, 253, 0.35);
          }

          50% {
            text-shadow:
              0 2px 22px rgba(196, 181, 253, 0.65),
              0 0 36px rgba(168, 85, 247, 0.20);
          }
        }

        /* =========================================================
           UNDERLINE
           ========================================================= */

        .animate-underlinePulse {
          animation:
            underlinePulse
            2.8s
            ease-in-out
            infinite;
        }

        @keyframes underlinePulse {
          0%,
          100% {
            opacity: 0.45;
            transform: scaleX(0.82);
          }

          50% {
            opacity: 1;
            transform: scaleX(1);
          }
        }

        /* =========================================================
           MOBILE OPTIMIZATION
           ========================================================= */

        @media (max-width: 640px) {
          .ib-glass-card {
            padding: 26px 24px 24px;
            border-radius: 24px;
          }

          .ib-cloud {
            filter: blur(65px);
          }
        }

        /* =========================================================
           REDUCED MOTION
           ========================================================= */

        @media (prefers-reduced-motion: reduce) {
          .ib-aurora-layer,
          .ib-cloud,
          .ib-particle,
          .animate-introFade,
          .animate-introGlow,
          .animate-underlinePulse {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

এই version-এ মূল পরিবর্তন

- 📸 Photo বেশি visible থাকবে
- 🌌 Aurora থাকবে, কিন্তু খুব বেশি চোখে লাগবে না
- ✨ 12টি ছোট glowing particle থাকবে
- 🪻 "Hi Pollobi"-তে soft purple glow
- 🧊 Text-এর পিছনে subtle glass effect
- 🌫️ Text আসার সময় blur → clear animation
- 💫 Underline খুব subtle pulse করবে
- 🌑 চারপাশে soft vignette থাকবে
- 📱 Mobile-এর জন্য আলাদা spacing
- ♿ "prefers-reduced-motion" support আছে
- ⏳ Intro শেষে smooth 1-second fade-out
- 🔥 পুরো effect-টা এমন রাখা হয়েছে যেন Study Hub-এর intro মনে হয়, কোনো flashy landing-page animation নয়।

একটা গুরুত্বপূর্ণ বিষয়: "intro-bg.jpg"-এর ছবিটা যদি নিজেই খুব উজ্জ্বল/রঙিন হয়, তাহলে "bg-gradient-to-b"-এর opacity আরও 5–10% কমানো যেতে পারে।
