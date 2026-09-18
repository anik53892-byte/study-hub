"use client";

import { useRouter } from "next/navigation";

export default function Breadcrumbs({ trail, isOwner, onLogout, showSearch, variant = "solid" }) {
  const router = useRouter();
  const glass = variant === "glass";
  const premium = variant === "premium";

  const wrapClass = glass
    ? "sticky top-0 z-20 bg-white/10 backdrop-blur-xl border-b border-white/20"
    : premium
    ? "sticky top-0 z-20 bg-white/40 backdrop-blur-xl border-b border-white/50"
    : "sticky top-0 z-20 bg-paper/90 backdrop-blur border-b border-violet-100/60";

  const iconBtnClass = glass
    ? "shrink-0 w-9 h-9 rounded-full bg-white/25 backdrop-blur-md border border-white/30 flex items-center justify-center text-white active:scale-95 transition"
    : premium
    ? "shrink-0 w-9 h-9 rounded-full bg-white/60 backdrop-blur-md border border-white/50 shadow-sm flex items-center justify-center text-violet-600 active:scale-95 transition"
    : "shrink-0 w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-violet-600 active:scale-95 transition";

  const activeLabelClass = glass ? "font-semibold text-white" : "font-semibold text-ink";
  const inactiveLabelClass = glass ? "text-white/60" : "text-ink/50";
  const dividerClass = glass ? "text-white/30" : "text-ink/30";
  const adminBtnClass = glass
    ? "shrink-0 text-xs text-white/80 px-2 py-1 rounded-lg bg-white/15 backdrop-blur-md border border-white/25"
    : premium
    ? "shrink-0 text-xs text-violet-500 px-2 py-1 rounded-lg bg-white/50 backdrop-blur-md border border-white/50"
    : "shrink-0 text-xs text-violet-400 px-2 py-1 rounded-lg hover:bg-violet-50";
  const logoutBtnClass = glass
    ? "shrink-0 text-xs text-white/70 px-2 py-1 rounded-lg bg-white/10 backdrop-blur-md border border-white/20"
    : premium
    ? "shrink-0 text-xs text-ink/50 px-2 py-1 rounded-lg bg-white/40 backdrop-blur-md border border-white/40"
    : "shrink-0 text-xs text-ink/40 px-2 py-1 rounded-lg hover:bg-violet-50";

  return (
    <div className={wrapClass}>
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2">
        {trail.length > 1 && (
          <button
            onClick={() => router.push(trail[trail.length - 2].href)}
            className={iconBtnClass}
            aria-label="Back"
          >
            ←
          </button>
        )}
        <div className="flex-1 min-w-0 flex items-center gap-1 text-sm overflow-x-auto">
          {trail.map((step, i) => (
            <span key={step.href} className="flex items-center gap-1 shrink-0">
              {i > 0 && <span className={dividerClass}>/</span>}
              <button
                onClick={() => router.push(step.href)}
                className={`truncate max-w-[9rem] ${i === trail.length - 1 ? activeLabelClass : inactiveLabelClass}`}
              >
                {step.label}
              </button>
            </span>
          ))}
        </div>
        {showSearch && (
          <button onClick={() => router.push("/search")} className={iconBtnClass} aria-label="Search">
            🔍
          </button>
        )}
        {isOwner ? (
          onLogout && (
            <button onClick={onLogout} className={logoutBtnClass}>
              Log out
            </button>
          )
        ) : (
          <button onClick={() => router.push("/login")} className={adminBtnClass}>
            Admin
          </button>
        )}
      </div>
    </div>
  );
}
