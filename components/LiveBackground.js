export default function LiveBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-paper">
      <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full bg-violet-200/50 blur-3xl animate-drift" />
      <div
        className="absolute top-1/3 -right-20 w-80 h-80 rounded-full bg-sky-200/50 blur-3xl animate-drift"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="absolute bottom-0 left-1/4 w-64 h-64 rounded-full bg-amber-100/60 blur-3xl animate-drift"
        style={{ animationDelay: "4s" }}
      />
      <div
        className="absolute top-10 right-1/4 w-40 h-40 rounded-full bg-pink-100/50 blur-2xl animate-drift"
        style={{ animationDelay: "1s" }}
      />
      <div
        className="absolute bottom-1/4 right-10 w-52 h-52 rounded-full bg-emerald-100/40 blur-3xl animate-drift"
        style={{ animationDelay: "3s" }}
      />
      {/* subtle floating sparkles */}
      {[...Array(6)].map((_, i) => (
        <span
          key={i}
          className="absolute text-violet-300/50 animate-floatSlow"
          style={{
            top: `${12 + i * 14}%`,
            left: `${(i * 37) % 90}%`,
            fontSize: `${10 + (i % 3) * 6}px`,
            animationDelay: `${i * 0.8}s`,
            animationDuration: `${6 + i}s`,
          }}
        >
          ✦
        </span>
      ))}
    </div>
  );
}
