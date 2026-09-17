export default function SaveStatus({ status }) {
  const map = {
    idle: { text: "", color: "" },
    saving: { text: "Saving…", color: "text-amber-500" },
    saved: { text: "Saved", color: "text-emerald-500" },
    error: { text: "Save failed — check your connection", color: "text-rose-500" },
  };
  const s = map[status] || map.idle;
  if (!s.text) return <span className="text-xs">&nbsp;</span>;
  return <span className={`text-xs font-medium ${s.color}`}>{s.text}</span>;
}
