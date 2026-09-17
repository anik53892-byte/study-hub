"use client";

import { useEffect, useState } from "react";
import { fetchAllFolders } from "@/lib/db";
import { Modal } from "./Modal";

function buildPaths(folders) {
  const byId = Object.fromEntries(folders.map((f) => [f.id, f]));
  const cache = {};
  function pathFor(id) {
    if (cache[id]) return cache[id];
    const f = byId[id];
    if (!f) return "";
    const p = f.parent_id ? `${pathFor(f.parent_id)} / ${f.name}` : f.name;
    cache[id] = p;
    return p;
  }
  folders.forEach((f) => pathFor(f.id));
  return cache;
}

export default function FolderPickerModal({ open, onClose, onSelect, excludeIds, allowRoot = true, title = "Move to…" }) {
  const [folders, setFolders] = useState(null);

  useEffect(() => {
    if (open) {
      setFolders(null);
      fetchAllFolders()
        .then(setFolders)
        .catch(() => setFolders([]));
    }
  }, [open]);

  if (!open) return null;

  const paths = folders ? buildPaths(folders) : {};
  const options = (folders || [])
    .filter((f) => !excludeIds || !excludeIds.has(f.id))
    .sort((a, b) => paths[a.id].localeCompare(paths[b.id]));

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {allowRoot && (
          <button
            onClick={() => onSelect(null)}
            className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium bg-violet-100 text-ink"
          >
            🏠 Home (top level)
          </button>
        )}
        {folders === null && <p className="text-sm text-ink/40 px-1 py-2">Loading…</p>}
        {folders && options.length === 0 && !allowRoot && (
          <p className="text-sm text-ink/40 px-1 py-2">No other folders yet.</p>
        )}
        {options.map((f) => (
          <button
            key={f.id}
            onClick={() => onSelect(f.id)}
            className="w-full text-left px-4 py-3 rounded-xl text-sm bg-violet-50/60 text-ink truncate"
          >
            📁 {paths[f.id]}
          </button>
        ))}
      </div>
    </Modal>
  );
}
