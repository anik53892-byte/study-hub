export const PALETTE = [
  { key: "blue", bg: "bg-sky-100", text: "text-sky-900", ring: "ring-sky-200" },
  { key: "purple", bg: "bg-violet-100", text: "text-violet-900", ring: "ring-violet-200" },
  { key: "green", bg: "bg-emerald-100", text: "text-emerald-900", ring: "ring-emerald-200" },
  { key: "orange", bg: "bg-orange-100", text: "text-orange-900", ring: "ring-orange-200" },
  { key: "pink", bg: "bg-pink-100", text: "text-pink-900", ring: "ring-pink-200" },
  { key: "yellow", bg: "bg-amber-100", text: "text-amber-900", ring: "ring-amber-200" },
];

export function colorFor(key) {
  return PALETTE.find((c) => c.key === key) || PALETTE[0];
}

export function autoColor(index) {
  return PALETTE[index % PALETTE.length].key;
}

export const ICONS = ["📁", "📚", "🧪", "🧮", "🌍", "📝", "🏛️", "🔬", "🎨", "💡"];
