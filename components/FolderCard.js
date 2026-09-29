"use client";

import { useState } from "react";
import { colorFor } from "@/lib/colors";

export default function FolderCard({ folder, onOpen, onMenu, count, compact = false }) {
  const [pressed, setPressed] = useState(false);
  const c = colorFor(folder.color);

  return (
    <div
      role="button"
      onClick={() => onOpen(folder)}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      className={`relative overflow-hidden rounded-2xl border border-white/55
        bg-white/40 backdrop-blur-md
        shadow-[0_8px_20px_rgba(90,70,120,0.14),inset_0_1px_0_rgba(255,255,255,0.5)]
        flex flex-col justify-between cursor-pointer select-none transition-transform
        ${compact ? "p-2.5 min-h-[5.5rem] rounded-[14px]" : "p-4 min-h-[6.5rem]"}
        ${pressed ? "scale-[0.97]" : "scale-100"}`}
    >
      <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />

      {onMenu && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMenu(folder);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className={`absolute z-10 rounded-full bg-white/80 flex items-center justify-center text-violet-700 font-bold active:scale-90 transition-transform
            before:content-[''] before:absolute before:-inset-2
            ${compact ? "top-1 right-1 w-10 h-10 text-2xl" : "top-2 right-2 w-12 h-12 text-2xl"}`}
          aria-label="Folder options"
        >
          ⋮
        </button>
      )}

      <div
        className={`inline-flex items-center justify-center shrink-0 ${
          compact ? "w-9 h-9 rounded-xl text-lg" : "w-11 h-11 rounded-2xl text-2xl"
        }`}
        style={{
          background: c.tintable
            ? `linear-gradient(155deg, rgba(${c.rgb},0.35), rgba(${c.rgb},0.14))`
            : "rgba(63,51,85,0.08)",
          boxShadow: c.tintable ? `0 4px 10px rgba(${c.rgb},0.28)` : "none",
        }}
      >
        {folder.icon}
      </div>

      <div>
        <div className={`text-[#3f3355] font-semibold leading-snug break-words ${compact ? "text-[11px]" : "text-sm mt-2.5"}`}>
          {folder.name}
        </div>
        {typeof count === "number" && (
          <div
            className={`inline-flex w-fit items-center gap-1 font-medium bg-violet-500/12 border border-violet-500/20 text-violet-700 rounded-full
              ${compact ? "text-[8.5px] px-1.5 py-0.5 mt-1" : "text-[11px] px-2 py-0.5 mt-1.5"}`}
          >
            {count} {count === 1 ? "item" : "items"}
          </div>
        )}
      </div>
    </div>
  );
}
