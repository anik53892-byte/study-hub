"use client";

import { useState } from "react";
import { glowStyle } from "@/lib/colors";

export default function FolderCard({ folder, onOpen, onMenu, count, compact = false }) {
  const [pressed, setPressed] = useState(false);

  return (
    <div
      role="button"
      onClick={() => onOpen(folder)}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      className={`relative overflow-hidden rounded-2xl border border-violet-200/15
        bg-gradient-to-br from-white/[0.07] to-white/[0.015] backdrop-blur-md
        shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_6px_20px_rgba(0,0,0,0.45),0_0_24px_rgba(168,85,247,0.1)]
        flex flex-col justify-between cursor-pointer select-none transition-transform
        ${compact ? "p-2.5 min-h-[4.75rem] rounded-[14px]" : "p-4 min-h-[6.5rem]"}
        ${pressed ? "scale-[0.97]" : "scale-100"}`}
    >
      <div className="absolute inset-x-0 top-0 h-2/5 bg-gradient-to-b from-white/[0.06] to-transparent pointer-events-none" />

      {onMenu && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMenu(folder);
          }}
          className={`absolute rounded-full bg-white/10 flex items-center justify-center text-violet-200
            ${compact ? "top-1.5 right-1.5 w-5 h-5 text-[10px]" : "top-2.5 right-2.5 w-6 h-6 text-xs"}`}
          aria-label="Folder options"
        >
          ⋮
        </button>
      )}
      <div className={compact ? "text-lg" : "text-2xl"} style={glowStyle(folder.color)}>
        {folder.icon}
      </div>
      <div>
        <div className={`text-violet-50 font-medium leading-snug break-words ${compact ? "text-[11px] pr-4" : "text-sm pr-6 mt-2.5"}`}>
          {folder.name}
        </div>
        {typeof count === "number" && (
          <div
            className={`inline-flex w-fit items-center gap-1 font-medium bg-violet-500/15 border border-violet-300/20 text-violet-100 rounded-full
              ${compact ? "text-[8.5px] px-1.5 py-0.5 mt-1" : "text-[11px] px-2 py-0.5 mt-1.5"}`}
          >
            {count} {count === 1 ? "item" : "items"}
          </div>
        )}
      </div>
    </div>
  );
}
