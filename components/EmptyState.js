export function EmptyState({ emoji = "📭", title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 text-ink/50">
      <div className="text-4xl mb-3">{emoji}</div>
      <p className="font-medium text-ink/70">{title}</p>
      {subtitle && <p className="text-sm mt-1">{subtitle}</p>}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 px-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-24 rounded-2xl bg-violet-100/50 animate-pulse" />
      ))}
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div className="space-y-3 px-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-14 rounded-2xl bg-violet-100/50 animate-pulse" />
      ))}
    </div>
  );
}
