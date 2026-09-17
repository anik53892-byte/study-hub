const HEARTS = ["💕", "💖"];

// Deterministic pseudo-random so server and client render the same values (avoids hydration mismatch).
function seeded(i, salt) {
  const x = Math.sin(i * 999 + salt * 37.7) * 10000;
  return x - Math.floor(x);
}

export default function LiveBackground({ count = 14 }) {
  const hearts = Array.from({ length: count }).map((_, i) => {
    const left = seeded(i, 1) * 100;
    const size = 14 + seeded(i, 2) * 26; // 14px–40px
    const duration = 9 + seeded(i, 3) * 10; // 9s–19s
    const delay = seeded(i, 4) * 12;
    const emoji = HEARTS[i % HEARTS.length];
    return { left, size, duration, delay, emoji, key: i };
  });

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-b from-violet-400 via-fuchsia-300 to-pink-200">
      <div className="absolute inset-0 bg-gradient-to-t from-white/10 via-transparent to-white/10" />
      {hearts.map((h) => (
        <span
          key={h.key}
          className="absolute bottom-0 animate-floatUp select-none"
          style={{
            left: `${h.left}%`,
            fontSize: `${h.size}px`,
            animationDuration: `${h.duration}s`,
            animationDelay: `${h.delay}s`,
            opacity: 0,
          }}
        >
          {h.emoji}
        </span>
      ))}
    </div>
  );
}
