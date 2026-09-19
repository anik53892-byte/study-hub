"use client";

import { PALETTE } from "@/lib/colors";

export default function ColorPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {PALETTE.map((c) => (
        <button
          type="button"
          key={c.key}
          onClick={() => onChange(c.key)}
          className={`w-9 h-9 rounded-full ring-2 transition ${
            value === c.key ? "ring-violet-400" : "ring-transparent"
          }`}
          style={{ background: c.dot }}
          aria-label={c.label}
          title={c.label}
        />
      ))}
    </div>
  );
}
