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
    </div>
  );
}
