export default function HomeBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden gb-base">
      <div className="absolute -top-10 -left-10 w-56 h-56 sm:w-64 sm:h-64 gb-cluster gb-cluster-tl">
        <svg viewBox="0 0 220 220" className="w-full h-full" style={{ overflow: "visible" }}>
          <defs>
            <filter id="gbGlowTL" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.4" />
            </filter>
          </defs>
          <g filter="url(#gbGlowTL)">
            <ellipse cx="110" cy="110" rx="95" ry="46" transform="rotate(18 110 110)" className="gb-trail gb-trail-1" />
            <ellipse cx="110" cy="110" rx="78" ry="34" transform="rotate(-32 110 110)" className="gb-trail gb-trail-2" />
            <ellipse cx="110" cy="110" rx="60" ry="60" transform="rotate(60 110 110)" className="gb-trail gb-trail-3" />
          </g>
          <circle cx="182" cy="86" r="1.6" className="gb-star gb-star-a" />
          <circle cx="48" cy="132" r="1.3" className="gb-star gb-star-b" />
        </svg>
      </div>

      <div className="absolute -bottom-10 -right-10 w-56 h-56 sm:w-64 sm:h-64 gb-cluster gb-cluster-br">
        <svg viewBox="0 0 220 220" className="w-full h-full" style={{ overflow: "visible" }}>
          <defs>
            <filter id="gbGlowBR" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.2" />
            </filter>
          </defs>
          <g filter="url(#gbGlowBR)">
            <ellipse cx="110" cy="110" rx="95" ry="46" transform="rotate(-24 110 110)" className="gb-trail gb-trail-1" />
            <ellipse cx="110" cy="110" rx="78" ry="34" transform="rotate(40 110 110)" className="gb-trail gb-trail-2" />
            <ellipse cx="110" cy="110" rx="60" ry="60" transform="rotate(-65 110 110)" className="gb-trail gb-trail-3" />
          </g>
          <circle cx="42" cy="140" r="1.6" className="gb-star gb-star-a" />
          <circle cx="170" cy="80" r="1.3" className="gb-star gb-star-b" />
        </svg>
      </div>

      <style>{`
        /* Background color/gradient is unchanged from before. */
        .gb-base {
          background: linear-gradient(160deg, #cfc9de 0%, #d8d4e6 45%, #cac5da 100%);
        }
        .gb-trail {
          fill: none;
          stroke-width: 1.0;
          animation: gbPulse 6s ease-in-out infinite;
        }
        .gb-trail-1 { stroke: rgba(255, 255, 255, 0.72); animation-delay: 0s; }
        .gb-trail-2 { stroke: rgba(196, 181, 253, 0.68); animation-delay: 1.2s; }
        .gb-trail-3 { stroke: rgba(255, 255, 255, 0.58); animation-delay: 2.4s; }

        .gb-cluster-tl { animation: gbSpin 130s linear infinite; transform-origin: center; }
        .gb-cluster-br { animation: gbSpin 150s linear infinite reverse; transform-origin: center; }

        .gb-star {
          fill: rgba(255, 255, 255, 0.85);
          animation: gbTwinkle 4.5s ease-in-out infinite;
        }
        .gb-star-b { animation-delay: 2s; }

        @keyframes gbSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes gbPulse {
          0%, 100% { stroke-opacity: 0.55; }
          50% { stroke-opacity: 1; }
        }
        @keyframes gbTwinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
