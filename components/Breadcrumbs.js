"use client";

import { useRouter } from "next/navigation";

export default function Breadcrumbs({ trail, isOwner, onLogout, showSearch }) {
  const router = useRouter();

  return (
    <div className="sticky top-0 z-20 bg-paper/90 backdrop-blur border-b border-violet-100/60">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2">
        {trail.length > 1 && (
          <button
            onClick={() => router.push(trail[trail.length - 2].href)}
            className="shrink-0 w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-violet-600 active:scale-95 transition"
            aria-label="Back"
          >
            ←
          </button>
        )}
        <div className="flex-1 min-w-0 flex items-center gap-1 text-sm overflow-x-auto">
          {trail.map((step, i) => (
            <span key={step.href} className="flex items-center gap-1 shrink-0">
              {i > 0 && <span className="text-ink/30">/</span>}
              <button
                onClick={() => router.push(step.href)}
                className={`truncate max-w-[9rem] ${
                  i === trail.length - 1 ? "font-semibold text-ink" : "text-ink/50"
                }`}
              >
                {step.label}
              </button>
            </span>
          ))}
        </div>
        {showSearch && (
          <button
            onClick={() => router.push("/search")}
            className="shrink-0 w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-violet-600"
            aria-label="Search"
          >
            🔍
          </button>
        )}
        {isOwner ? (
          onLogout && (
            <button
              onClick={onLogout}
              className="shrink-0 text-xs text-ink/40 px-2 py-1 rounded-lg hover:bg-violet-50"
            >
              Log out
            </button>
          )
        ) : (
          <button
            onClick={() => router.push("/login")}
            className="shrink-0 text-xs text-violet-400 px-2 py-1 rounded-lg hover:bg-violet-50"
          >
            Admin
          </button>
        )}
      </div>
    </div>
  );
}
