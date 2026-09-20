export default function HomeBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden gb-base">
      <div className="absolute -top-8 -left-8 w-48 h-48 sm:w-56 sm:h-56 gb-cluster gb-cluster-tl">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <circle cx="100" cy="100" r="68" className="gb-ring" />
          <circle cx="100" cy="100" r="92" className="gb-ring gb-ring-thin" />
          <circle cx="58" cy="55" r="12" className="gb-particle gb-particle-a" />
          <circle cx="138" cy="128" r="8" className="gb-particle gb-particle-b" />
        </svg>
      </div>

      <div className="absolute -bottom-8 -right-8 w-48 h-48 sm:w-56 sm:h-56 gb-cluster gb-cluster-br">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <circle cx="100" cy="100" r="68" className="gb-ring" />
          <circle cx="100" cy="100" r="92" className="gb-ring gb-ring-thin" />
          <circle cx="145" cy="68" r="11" className="gb-particle gb-particle-a" />
          <circle cx="62" cy="140" r="7" className="gb-particle gb-particle-b" />
        </svg>
      </div>

      <style>{`
        .gb-base {
          background: linear-gradient(160deg, #cfc9de 0%, #d8d4e6 45%, #cac5da 100%);
        }
        .gb-ring {
          fill: none;
          stroke: rgba(255, 255, 255, 0.32);
          stroke-width: 1.1;
        }
        .gb-ring-thin {
          stroke: rgba(196, 181, 253, 0.28);
          stroke-width: 0.7;
        }
        .gb-particle {
          fill: rgba(255, 255, 255, 0.38);
          transform-box: fill-box;
          transform-origin: center;
        }
        .gb-particle-b {
          fill: rgba(196, 181, 253, 0.32);
        }
        .gb-cluster-tl {
          animation: gbSpin 100s linear infinite;
          transform-origin: center;
        }
        .gb-cluster-br {
          animation: gbSpin 120s linear infinite reverse;
          transform-origin: center;
        }
        .gb-particle-a {
          animation: gbFloat 8s ease-in-out infinite;
        }
        .gb-particle-b {
          animation: gbFloat 10s ease-in-out infinite reverse;
        }
        @keyframes gbSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes gbFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}
