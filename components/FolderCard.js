"use client";

import { useState } from "react";
import { colorFor } from "@/lib/colors";

export default function FolderCard({ folder, onOpen, onMenu, count }) {
  const c = colorFor(folder.color);
  const [pressed, setPressed] = useState(false);

  return (
    <div
      role="button"
      onClick={() => onOpen(folder)}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      className={`relative ${c.bg} ${c.text} backdrop-blur-md rounded-2xl p-4 min-h-[6.5rem] shadow-sm
        ring-1 ${c.ring} border border-white/40
        flex flex-col justify-between cursor-pointer select-none transition-transform
        ${pressed ? "scale-[0.97]" : "scale-100"}`}
    >
      {onMenu && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMenu(folder);
          }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/50 backdrop-blur flex items-center justify-center text-sm"
          aria-label="Folder options"
        >
          ⋮
        </button>
      )}
      <div className="text-2xl">{folder.icon}</div>
      <div className="font-medium text-sm leading-snug pr-6 break-words">{folder.name}</div>
      {typeof count === "number" && (
        <div className="mt-1 inline-flex w-fit items-center gap-1 text-[11px] font-medium bg-white/50 backdrop-blur rounded-full px-2 py-0.5">
          {count} {count === 1 ? "item" : "items"}
        </div>
      )}
    </div>
  );
}
