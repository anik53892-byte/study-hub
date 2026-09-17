export default function PremiumBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-indigo-50 via-sky-50 to-rose-50">
      <div className="absolute -top-20 -left-16 w-72 h-72 rounded-full bg-violet-200/40 blur-3xl animate-drift" />
      <div
        className="absolute top-1/4 -right-20 w-80 h-80 rounded-full bg-sky-200/40 blur-3xl animate-drift"
        style={{ animationDelay: "2.5s" }}
      />
      <div
        className="absolute bottom-0 left-1/3 w-64 h-64 rounded-full bg-amber-100/40 blur-3xl animate-drift"
        style={{ animationDelay: "4.5s" }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-56 h-56 rounded-full bg-emerald-100/30 blur-3xl animate-drift"
        style={{ animationDelay: "1.5s" }}
      />
    </div>
  );
}
