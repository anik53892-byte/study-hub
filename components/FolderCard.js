"use client";

import { useState } from "react";

export default function FolderCard({ folder, onOpen, onMenu, count, compact = false }) {
  const [pressed, setPressed] = useState(false);

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
          className={`absolute z-10 rounded-full bg-white/70 flex items-center justify-center text-violet-700 font-bold active:scale-90 transition-transform
            ${compact ? "top-1 right-1 w-8 h-8 text-lg" : "top-2 right-2 w-10 h-10 text-xl"}`}
          aria-label="Folder options"
        >
          ⋮
        </button>
      )}
      <div className={compact ? "text-lg" : "text-2xl"} style={{ filter: "drop-shadow(0 2px 6px rgba(124,58,237,0.25))" }}>
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
