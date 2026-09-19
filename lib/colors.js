// Each color gives: a hex dot (for pickers), an rgb triple for glows/tints,
// and a light text tone used only on the reading page's tinted card.
export const PALETTE = [
  { key: "dark", label: "Dark", dot: "#3f3f46", rgb: "255,255,255", tintable: false },
  { key: "violet", label: "Violet", dot: "#8b5cf6", rgb: "139,92,246", tintable: true },
  { key: "teal", label: "Teal", dot: "#2dd4bf", rgb: "45,212,191", tintable: true },
  { key: "rose", label: "Rose", dot: "#fb7185", rgb: "251,113,133", tintable: true },
  { key: "amber", label: "Amber", dot: "#fbbf24", rgb: "251,191,36", tintable: true },
  { key: "sky", label: "Sky", dot: "#38bdf8", rgb: "56,189,248", tintable: true },
  { key: "emerald", label: "Emerald", dot: "#34d399", rgb: "52,211,153", tintable: true },
  { key: "pink", label: "Pink", dot: "#f472b6", rgb: "244,114,182", tintable: true },
];

export function colorFor(key) {
  return PALETTE.find((c) => c.key === key) || PALETTE[0];
}

export function autoColor(index) {
  // Skip "dark" for auto-cycling new folders/lessons — start from violet onward.
  const cycle = PALETTE.slice(1);
  return cycle[index % cycle.length].key;
}

// Inline style for a folder/lesson icon's soft glow, tinted by its color.
export function glowStyle(key) {
  const c = colorFor(key);
  if (!c.tintable) return {};
  return { filter: `drop-shadow(0 0 10px rgba(${c.rgb},0.45))` };
}

// Background style for the lesson reading card — a subtle dark tint, or plain dark if "dark".
export function readingTintStyle(key) {
  const c = colorFor(key);
  if (!c.tintable) {
    return { background: "linear-gradient(165deg, rgba(255,255,255,0.03), rgba(10,10,12,0.9))" };
  }
  return { background: `linear-gradient(165deg, rgba(${c.rgb},0.16), rgba(12,12,14,0.92))` };
}

export const ICONS = [
  "📁", "📚", "🧪", "🧮", "🌍", "📝", "🏛️", "🔬", "🎨", "💡",
  "🪩", "🗽", "🌿", "🏝️", "🪐", "☀️", "🏩", "🕌", "🌁", "🗺️",
  "🌐", "🏆", "📗", "📘", "📄", "🔔", "🔐", "🔮", "🔍", "💠", "🔥",
];

export function autoIcon(index) {
  return ICONS[index % ICONS.length];
}
