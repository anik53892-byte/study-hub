// Each color has a glass-style background (translucent + blur works via bg-*/40
// combined with backdrop-blur on the card itself) plus a matching text/ring tone.
export const PALETTE = [
  { key: "blue", bg: "bg-sky-100/60", text: "text-sky-900", ring: "ring-sky-200/60" },
  { key: "purple", bg: "bg-violet-100/60", text: "text-violet-900", ring: "ring-violet-200/60" },
  { key: "green", bg: "bg-emerald-100/60", text: "text-emerald-900", ring: "ring-emerald-200/60" },
  { key: "orange", bg: "bg-orange-100/60", text: "text-orange-900", ring: "ring-orange-200/60" },
  { key: "pink", bg: "bg-pink-100/60", text: "text-pink-900", ring: "ring-pink-200/60" },
  { key: "yellow", bg: "bg-amber-100/60", text: "text-amber-900", ring: "ring-amber-200/60" },
  { key: "mint", bg: "bg-teal-100/60", text: "text-teal-900", ring: "ring-teal-200/60" },
  { key: "peach", bg: "bg-rose-100/60", text: "text-rose-900", ring: "ring-rose-200/60" },
];

export function colorFor(key) {
  return PALETTE.find((c) => c.key === key) || PALETTE[0];
}

export function autoColor(index) {
  return PALETTE[index % PALETTE.length].key;
}

export const ICONS = [
  "📁", "📚", "🧪", "🧮", "🌍", "📝", "🏛️", "🔬", "🎨", "💡",
  "🪩", "🗽", "🌿", "🏝️", "🪐", "☀️", "🏩", "🕌", "🌁", "🗺️",
  "🌐", "🏆", "📗", "📘", "📄", "🔔", "🔐", "🔮", "🔍", "💠", "🔥",
];

export function autoIcon(index) {
  return ICONS[index % ICONS.length];
}
