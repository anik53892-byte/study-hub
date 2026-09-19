function seeded(i, salt) {
  const x = Math.sin(i * 999 + salt * 37.7) * 10000;
  return x - Math.floor(x);
}

export default function LiveBackground({ heartCount = 8 }) {
  const hearts = Array.from({ length: heartCount }).map((_, i) => {
    const left = seeded(i, 1) * 100;
    const size = 13 + seeded(i, 2) * 10;
    const duration = 8 + seeded(i, 3) * 5;
    const delay = seeded(i, 4) * 10;
    const emoji = i % 3 === 0 ? "✦" : i % 2 === 0 ? "💞" : "💕";
    return { left, size, duration, delay, emoji, key: i };
  });

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#050506]">
      <div className="absolute -top-20 -left-16 w-72 h-72 rounded-full bg-violet-500/30 blur-[80px] animate-drift" />
      <div
        className="absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-purple-600/25 blur-[90px] animate-drift"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="absolute bottom-0 left-1/4 w-64 h-64 rounded-full bg-fuchsia-500/20 blur-[80px] animate-drift"
        style={{ animationDelay: "4s" }}
      />
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
    </div>
  );
}
