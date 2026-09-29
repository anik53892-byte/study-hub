// Each color gives: a hex dot (for pickers), an rgb triple for glows/tints,
// and a light text tone used only on the reading page's tinted card.
// Deeper, richer ("premium") tones than a flat/bright palette.
export const PALETTE = [
  { key: "dark", label: "Charcoal", dot: "#27272a", rgb: "255,255,255", tintable: false },
  { key: "violet", label: "Violet", dot: "#7c3aed", rgb: "124,58,237", tintable: true },
  { key: "teal", label: "Teal", dot: "#0d9488", rgb: "13,148,136", tintable: true },
  { key: "rose", label: "Ruby", dot: "#e11d48", rgb: "225,29,72", tintable: true },
  { key: "amber", label: "Gold", dot: "#d97706", rgb: "217,119,6", tintable: true },
  { key: "sky", label: "Sapphire", dot: "#0284c7", rgb: "2,132,199", tintable: true },
  { key: "emerald", label: "Emerald", dot: "#059669", rgb: "5,150,105", tintable: true },
  { key: "pink", label: "Magenta", dot: "#db2777", rgb: "219,39,119", tintable: true },
];

// A "no color" fallback — used when color is null/undefined, or an unknown key.
const NONE = { key: null, label: "None", dot: "#a1a1aa", rgb: "161,161,170", tintable: false };

export function colorFor(key) {
  if (!key) return NONE;
  return PALETTE.find((c) => c.key === key) || NONE;
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

// Background style for the lesson reading card — a subtle dark tint, or plain dark if "dark"/None.
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
  "📡", "⚔️", "🧸", "🧑‍✈️", "🧝", "👳", "🙎", "♻️", "🧑‍🎄", "💥",
  "💯", "🫂", "🗣️", "🧠", "🫶", "👋", "👐", "👉", "👇", "🙅",
  "🍂", "🍁", "🍃", "🌳", "🌲", "🪴", "🌅", "🌊", "⚡", "☔",
  "⛅", "🌨️", "🌠", "🦕", "🦜", "🕊️", "🐬", "🐠", "🍎", "🍏",
  "🍚", "✈️", "🚢", "🚊", "🕍", "💒", "🏟️", "🗾", "🎆", "🥁",
  "💵", "⚖️", "🥻", "👔", "☂️", "✒️", "📖", "📅", "🕐", "📢",
  "🔊", "❌", "🎼",
];

export function autoIcon(index) {
  return ICONS[index % ICONS.length];
}
