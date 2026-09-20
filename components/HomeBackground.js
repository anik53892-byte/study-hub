export default function HomeBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden hb-base">
      <svg
        className="absolute left-1/2 top-1/2 hb-svg"
        viewBox="0 0 600 600"
        style={{ transform: "translate(-50%, -50%)" }}
      >
        <defs>
          <filter id="hbGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g className="hb-ring hb-ring-1">
          <circle cx="300" cy="300" r="140" className="hb-track" />
          <circle cx="300" cy="300" r="140" className="hb-trail hb-trail-1" filter="url(#hbGlow)" />
        </g>

        <g className="hb-ring hb-ring-2">
          <circle cx="300" cy="300" r="210" className="hb-track" />
          <circle cx="300" cy="300" r="210" className="hb-trail hb-trail-2" filter="url(#hbGlow)" />
        </g>

        <g className="hb-ring hb-ring-3">
          <circle cx="300" cy="300" r="270" className="hb-track" />
          <circle cx="300" cy="300" r="270" className="hb-trail hb-trail-3" filter="url(#hbGlow)" />
        </g>

        <circle cx="300" cy="300" r="60" className="hb-core" filter="url(#hbGlow)" />
      </svg>

      <style>{`
        .hb-base {
          background: radial-gradient(circle at 50% 45%, #17132a 0%, #0e0c1a 55%, #0a0912 100%);
        }
        .hb-svg {
          width: 140vmax;
          height: 140vmax;
          overflow: visible;
        }
        .hb-track {
          fill: none;
          stroke: rgba(196, 181, 253, 0.12);
          stroke-width: 1;
        }
        .hb-trail {
          fill: none;
          stroke-width: 2.5;
          stroke-linecap: round;
          animation: hbColorCycle 14s linear infinite, hbDash linear infinite;
        }
        .hb-trail-1 {
          stroke-dasharray: 70 810;
          animation-duration: 14s, 9s;
        }
        .hb-trail-2 {
          stroke-dasharray: 100 1220;
          animation-duration: 14s, 15s;
          animation-direction: normal, reverse;
        }
        .hb-trail-3 {
          stroke-dasharray: 130 1600;
          animation-duration: 14s, 21s;
        }
        .hb-ring-1 { animation: hbSpin 40s linear infinite; transform-origin: 300px 300px; }
        .hb-ring-2 { animation: hbSpin 60s linear infinite reverse; transform-origin: 300px 300px; }
        .hb-ring-3 { animation: hbSpin 85s linear infinite; transform-origin: 300px 300px; }
        .hb-core {
          fill: rgba(216, 180, 254, 0.18);
          animation: hbColorCycle 14s linear infinite, hbPulse 5s ease-in-out infinite;
        }
        @keyframes hbSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes hbDash {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -1000; }
        }
        @keyframes hbPulse {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }
        @keyframes hbColorCycle {
          0%   { stroke: #c4b5fd; }
          20%  { stroke: #a855f7; }
          40%  { stroke: #f472b6; }
          60%  { stroke: #22d3ee; }
          80%  { stroke: #60a5fa; }
          100% { stroke: #c4b5fd; }
        }
        .hb-core { animation-name: hbCoreColorCycle, hbPulse; }
        @keyframes hbCoreColorCycle {
          0%   { fill: rgba(196,181,253,0.18); }
          20%  { fill: rgba(168,85,247,0.18); }
          40%  { fill: rgba(244,114,182,0.18); }
          60%  { fill: rgba(34,211,238,0.18); }
          80%  { fill: rgba(96,165,250,0.18); }
          100% { fill: rgba(196,181,253,0.18); }
        }
      `}</style>
    </div>
  );
}
