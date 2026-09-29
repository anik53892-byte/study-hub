"use client";

import { useEffect, useState } from "react";

/*
 * A small toast fixed at the top-left of the screen. Pass it the same
 * status string used by <SaveStatus/> ("idle" | "saving" | "saved" | "error").
 * It shows itself for ~2 seconds whenever status becomes "saved" or "error",
 * then fades out on its own — nothing else needs to hide it.
 */
export default function SaveToast({ status }) {
  const [msg, setMsg] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (status !== "saved" && status !== "error") return;

    setMsg(status === "saved" ? { text: "✓ Saved", tone: "ok" } : { text: "✕ Couldn't save", tone: "error" });
    setVisible(true);

    const hide = setTimeout(() => setVisible(false), 2000);
    return () => clearTimeout(hide);
  }, [status]);

  if (!msg) return null;

  return (
    <div
      className={`fixed top-4 left-4 z-[60] px-4 py-2 rounded-xl text-sm font-medium text-white shadow-lg backdrop-blur transition-opacity duration-300
        ${visible ? "opacity-100" : "opacity-0"}
        ${msg.tone === "ok" ? "bg-emerald-500/90" : "bg-rose-500/90"}`}
    >
      {msg.text}
    </div>
  );
}
