"use client";

import { useEffect, useState } from "react";

/*
 * Tiny in-app clipboard for "Copy → Paste".
 * Stores { type: "folder" | "lesson", id, name } in localStorage so it survives
 * page navigation. Every page that calls useClipboard() updates instantly.
 */

const KEY = "study-hub-clipboard";
const EVENT = "study-hub-clipboard-change";

export function getClipboard() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setClipboard(item) {
  try {
    localStorage.setItem(KEY, JSON.stringify(item));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

export function clearClipboard() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

export function useClipboard() {
  const [clip, setClip] = useState(null);
  useEffect(() => {
    const sync = () => setClip(getClipboard());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return clip;
}
