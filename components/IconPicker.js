"use client";

import { ICONS } from "@/lib/colors";

export default function IconPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
      {ICONS.map((i) => (
        <button
          type="button"
          key={i}
          onClick={() => onChange(i)}
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
            value === i ? "bg-violet-500" : "bg-violet-50"
          }`}
        >
          {i}
        </button>
      ))}
    </div>
  );
}
