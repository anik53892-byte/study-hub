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

  /* =========================================================
     SMALL BACKGROUND PARTICLES
     ========================================================= */

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

  /* =========================================================
     HEART PARTICLES
     ========================================================= */

  const heartTypes = ["❤️‍🔥", "💗", "💞", "💕"];

  const hearts = Array.from({ length: 30 }).map((_, i) => {
    const spread = (seeded(i, 10) - 0.5) * 210;

    const drift = (seeded(i, 11) - 0.5) * 140;

    const size = 11 + seeded(i, 12) * 12;

    const duration = 3.2 + seeded(i, 13) * 2.2;

    const delay = seeded(i, 14) * 3.8;

    const rotate = -35 + seeded(i, 15) * 70;

    const rise = 250 + seeded(i, 16) * 100;

    return {
      heart: heartTypes[i % heartTypes.length],
      spread,
      drift,
      size,
      duration,
      delay,
      rotate,
      rise,
      key: i,
    };
  });

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-1000 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* =====================================================
          BACKGROUND PHOTO
          ===================================================== */}

      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/intro-bg.jpg')",
        }}
      />

      {/* =====================================================
          SOFT AURORA
          ===================================================== */}

      <div className="absolute inset-0 ib-aurora-layer pointer-events-none">
        <div className="ib-cloud ib-cloud-1" />
        <div className="ib-cloud ib-cloud-2" />
        <div className="ib-cloud ib-cloud-3" />
        <div className="ib-cloud ib-cloud-4" />
      </div>

      {/* =====================================================
          SOFT DARK OVERLAY
          ===================================================== */}

      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/10 to-black/55 pointer-events-none" />

      {/* =====================================================
          EDGE VIGNETTE
          ===================================================== */}

      <div className="absolute inset-0 ib-vignette pointer-events-none" />

      {/* =====================================================
          BACKGROUND LIGHT PARTICLES
          ===================================================== */}

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

      {/* =====================================================
          MAIN CONTENT
          ===================================================== */}

      <div className="relative z-10 h-full w-full">

        {/* ===================================================
            HEART BURST
            Behind the card and rising upward
            =================================================== */}

        <div className="absolute left-1/2 bottom-[13%] -translate-x-1/2 w-[320px] h-[390px] pointer-events-none z-10">

          {/* Soft heart glow at the origin */}

          <div className="heart-origin-glow" />

          {/* Tiny central heart pulse */}

          <div className="heart-origin">
            💗
          </div>

          {hearts.map((h) => (
            <span
              key={h.key}
              className="heart-particle"
              style={{
                "--spread": `${h.spread}px`,
                "--drift": `${h.drift}px`,
                "--size": `${h.size}px`,
                "--rotate": `${h.rotate}deg`,
                "--rise": `${h.rise}px`,
                animationDuration: `${h.duration}s`,
                animationDelay: `${h.delay}s`,
              }}
            >
              {h.heart}
            </span>
          ))}
        </div>

        {/* ===================================================
            BOTTOM GLASS CARD
            =================================================== */}

        <div className="absolute left-0 right-0 bottom-0 flex justify-center px-5 pb-[7vh] sm:pb-[8vh] z-20">

          <div className="ib-bottom-card animate-bottomCard">

            {/* Small label */}

            <p className="text-[11px] sm:text-xs tracking-[0.35em] uppercase text-violet-100/75 mb-4">
              Study Hub
            </p>

            {/* Main greeting */}

            <h1 className="font-serif italic font-bold text-4xl sm:text-5xl text-white animate-introGlow">
              Hi {name}
            </h1>

            {/* Glowing underline */}

            <div className="h-px w-20 mx-auto mt-5 mb-4 rounded-full bg-gradient-to-r from-transparent via-violet-200/80 to-transparent animate-underlinePulse" />

            {/* Loading message */}

            <p className="text-white/75 text-sm tracking-wide">
              Getting your space ready…
            </p>

          </div>
        </div>
      </div>

      {/* =====================================================
          CSS
          ===================================================== */}

      <style>{`

        /* =====================================================
           AURORA
           ===================================================== */

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


        /* =====================================================
           VIGNETTE
           ===================================================== */

        .ib-vignette {
          background:
            radial-gradient(
              ellipse at center,
              transparent 35%,
              rgba(0, 0, 0, 0.16) 75%,
              rgba(0, 0, 0, 0.30) 100%
            );
        }


        /* =====================================================
           BACKGROUND PARTICLES
           ===================================================== */

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


        /* =====================================================
           BOTTOM GLASS CARD
           ===================================================== */

        .ib-bottom-card {

          position: relative;

          width: min(88vw, 360px);

          padding: 26px 26px 24px;

          border-radius: 28px;

          background:
            linear-gradient(
              135deg,
              rgba(255, 255, 255, 0.105),
              rgba(255, 255, 255, 0.035)
            );

          border:
            1px solid rgba(255, 255, 255, 0.13);

          box-shadow:
            0 18px 55px rgba(0, 0, 0, 0.22),
            inset 0 1px 0 rgba(255, 255, 255, 0.10);

          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);

          text-align: center;
        }


        /* =====================================================
           CARD ENTER:
           BOTTOM → BLUR → CLEAR
           ===================================================== */

        .animate-bottomCard {

          animation:
            bottomCardAppear
            1.5s
            cubic-bezier(0.22, 1, 0.36, 1)
            both;

        }

        @keyframes bottomCardAppear {

          0% {
            opacity: 0;

            transform:
              translateY(45px)
              scale(0.95);

            filter: blur(10px);
          }

          55% {
            opacity: 0.85;
            filter: blur(2px);
          }

          100% {
            opacity: 1;

            transform:
              translateY(0)
              scale(1);

            filter: blur(0);
          }

        }


        /* =====================================================
           HI POLLOBI PURPLE GLOW
           ===================================================== */

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
              0 2px 14px
              rgba(196, 181, 253, 0.35);

          }

          50% {

            text-shadow:
              0 2px 22px
              rgba(196, 181, 253, 0.72),

              0 0 38px
              rgba(168, 85, 247, 0.24);

          }

        }


        /* =====================================================
           UNDERLINE
           ===================================================== */

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


        /* =====================================================
           HEART ORIGIN GLOW
           ===================================================== */

        .heart-origin-glow {

          position: absolute;

          left: 50%;
          bottom: 0;

          width: 80px;
          height: 50px;

          transform: translateX(-50%);

          border-radius: 50%;

          background:
            radial-gradient(
              ellipse,
              rgba(244, 114, 182, 0.35),
              transparent 70%
            );

          filter: blur(12px);

          animation:
            heartOriginGlow
            2.5s
            ease-in-out
            infinite;

        }

        @keyframes heartOriginGlow {

          0%,
          100% {
            opacity: 0.25;
            transform: translateX(-50%) scale(0.8);
          }

          50% {
            opacity: 0.8;
            transform: translateX(-50%) scale(1.25);
          }

        }


        /* =====================================================
           CENTRAL HEART
           ===================================================== */

        .heart-origin {

          position: absolute;

          left: 50%;
          bottom: -2px;

          transform: translateX(-50%);

          font-size: 17px;

          filter:
            drop-shadow(
              0 0 7px
              rgba(244, 114, 182, 0.75)
            );

          animation:
            heartOrigin
            2.5s
            ease-out
            infinite;

        }

        @keyframes heartOrigin {

          0% {
            opacity: 0;
            transform:
              translateX(-50%)
              translateY(10px)
              scale(0.5);
          }

          20% {
            opacity: 1;
          }

          55% {
            opacity: 0.7;

            transform:
              translateX(-50%)
              translateY(-20px)
              scale(1);
          }

          100% {
            opacity: 0;

            transform:
              translateX(-50%)
              translateY(-45px)
              scale(0.7);
          }

        }


        /* =====================================================
           HEART PARTICLES
           ===================================================== */

        .heart-particle {

          position: absolute;

          left: 50%;
          bottom: 0;

          font-size: var(--size);

          opacity: 0;

          filter:
            drop-shadow(
              0 0 5px
              rgba(244, 114, 182, 0.70)
            );

          animation-name: heartBurst;

          animation-timing-function:
            cubic-bezier(0.22, 0.61, 0.36, 1);

          animation-iteration-count: infinite;

          will-change:
            transform,
            opacity;

        }

        @keyframes heartBurst {

          0% {

            opacity: 0;

            transform:
              translateX(
                calc(-50% + var(--spread))
              )
              translateY(15px)
              scale(0.35)
              rotate(0deg);

          }

          10% {
            opacity: 1;
          }

          35% {

            opacity: 0.95;

            transform:
              translateX(
                calc(-50% + var(--spread))
              )
              translateY(-80px)
              scale(0.95)
              rotate(calc(var(--rotate) * 0.3));

          }

          65% {

            opacity: 0.65;

          }

          100% {

            opacity: 0;

            transform:
              translateX(
                calc(
                  -50% +
                  var(--spread) +
                  var(--drift)
                )
              )
              translateY(
                calc(-1 * var(--rise))
              )
              scale(0.72)
              rotate(var(--rotate));

          }

        }


        /* =====================================================
           MOBILE
           ===================================================== */

        @media (max-width: 640px) {

          .ib-bottom-card {

            width: min(90vw, 350px);

            padding:
              24px
              22px
              22px;

            border-radius: 24px;

          }

          .ib-cloud {
            filter: blur(65px);
          }

          .heart-particle {
            font-size:
              calc(var(--size) * 0.9);
          }

        }


        /* =====================================================
           REDUCED MOTION
           ===================================================== */

        @media (prefers-reduced-motion: reduce) {

          .ib-aurora-layer,
          .ib-cloud,
          .ib-particle,
          .animate-bottomCard,
          .animate-introGlow,
          .animate-underlinePulse,
          .heart-origin-glow,
          .heart-origin,
          .heart-particle {

            animation: none !important;

          }

        }

      `}</style>
    </div>
  );
}
