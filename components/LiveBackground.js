const HEARTS = ["💞", "💗", "❤️‍🔥"];

function seeded(i, salt) {
  const x = Math.sin(i * 999 + salt * 37.7) * 10000;
  return x - Math.floor(x);
}

export default function LiveBackground({ heartCount = 10 }) {
  const hearts = Array.from({ length: heartCount }).map((_, i) => {
    const fromLeft = i % 2 === 0;
    const left = fromLeft ? seeded(i, 1) * 14 : 86 + seeded(i, 1) * 10;
    const size = 14 + seeded(i, 2) * 10;
    const duration = 8 + seeded(i, 3) * 6;
    const delay = seeded(i, 4) * 10;
    // Drift toward the center-ish, scattering left or right as it rises.
    const dx = (fromLeft ? 1 : -1) * (30 + seeded(i, 5) * 90);
    const emoji = HEARTS[i % HEARTS.length];
    return { left, size, duration, delay, dx, emoji, key: i };
  });

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-b from-[#c7c3d6] via-[#d6d3e2] to-[#cdc9dc]">
      <div className="absolute -top-16 -left-14 w-64 h-64 rounded-full bg-violet-200/60 blur-[70px] animate-drift" />
      <div
        className="absolute top-1/3 -right-20 w-72 h-72 rounded-full bg-fuchsia-100/60 blur-[80px] animate-drift"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="absolute bottom-0 left-1/4 w-60 h-60 rounded-full bg-white/60 blur-[70px] animate-drift"
        style={{ animationDelay: "4s" }}
      />
      {hearts.map((h) => (
        <span
          key={h.key}
          className="absolute bottom-0 select-none animate-floatUpDrift"
          style={{
            left: `${h.left}%`,
            fontSize: `${h.size}px`,
            animationDuration: `${h.duration}s`,
            animationDelay: `${h.delay}s`,
            opacity: 0,
            "--dx": `${h.dx}px`,
          }}
        >
          {h.emoji}
        </span>
      ))}
    </div>
  );
}
