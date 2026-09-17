"use client";

import { useState } from "react";
import { colorFor } from "@/lib/colors";

export default function FolderCard({ folder, onOpen, onMenu }) {
  const c = colorFor(folder.color);
  const [pressed, setPressed] = useState(false);

  return (
    <div
      role="button"
      onClick={() => onOpen(folder)}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      className={`relative ${c.bg} ${c.text} rounded-2xl p-4 min-h-[6rem] shadow-sm ring-1 ${c.ring}
        flex flex-col justify-between cursor-pointer select-none transition-transform
        ${pressed ? "scale-[0.97]" : "scale-100"}`}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onMenu(folder);
        }}
        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/50 flex items-center justify-center text-sm"
        aria-label="Folder options"
      >
        ⋮
      </button>
      <div className="text-2xl">{folder.icon}</div>
      <div className="font-medium text-sm leading-snug pr-6 break-words">{folder.name}</div>
    </div>
  );
}
