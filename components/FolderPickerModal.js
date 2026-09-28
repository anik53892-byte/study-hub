"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchAllFolders } from "@/lib/db";
import { Modal } from "./Modal";

/*
 * Tap-to-choose destination picker (used for Move and Paste).
 *
 * Props:
 *  - onSelect(folderIdOrNull): called when a destination is tapped (null = Home / top level)
 *  - excludeIds: Set of folder ids that can't be chosen (shown dimmed)
 *  - currentId: where the item is right now (null = Home). That row is marked and can't be chosen.
 *  - allowRoot: show the "Home" row (false for lessons — they must live inside a folder)
 */
export default function FolderPickerModal({
  open,
  onClose,
  onSelect,
  excludeIds,
  currentId = undefined,
  allowRoot = true,
  title = "Move to…",
}) {
  const [folders, setFolders] = useState(null);
  const [expanded, setExpanded] = useState(() => new Set());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setFolders(null);
    setBusy(false);
    fetchAllFolders()
      .then((list) => {
        if (cancelled) return;
        setFolders(list);
        // Open the branch that contains the current location, so it's easy to see.
        const byId = Object.fromEntries(list.map((f) => [f.id, f]));
        const open = new Set();
        let p = currentId ? byId[currentId]?.parent_id : null;
        while (p) {
          open.add(p);
          p = byId[p]?.parent_id;
        }
        setExpanded(open);
      })
      .catch(() => !cancelled && setFolders([]));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const childrenMap = useMemo(() => {
    const map = {};
    (folders || []).forEach((f) => {
      const key = f.parent_id || "root";
      (map[key] = map[key] || []).push(f);
    });
    Object.values(map).forEach((arr) =>
      arr.sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || a.name.localeCompare(b.name))
    );
    return map;
  }, [folders]);

  // Flatten the tree into visible rows (respecting expanded state).
  const rows = useMemo(() => {
    const out = [];
    function walk(parentKey, depth) {
      (childrenMap[parentKey] || []).forEach((f) => {
        const hasKids = !!childrenMap[f.id]?.length;
        out.push({ folder: f, depth, hasKids });
        if (hasKids && expanded.has(f.id)) walk(f.id, depth + 1);
      });
    }
    walk("root", 0);
    return out;
  }, [childrenMap, expanded]);

  if (!open) return null;

  function toggle(id) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function choose(id) {
    if (busy) return;
    setBusy(true);
    try {
      await onSelect(id);
    } finally {
      setBusy(false);
    }
  }

  const homeIsCurrent = currentId === null;

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className={`space-y-1.5 max-h-[60vh] overflow-y-auto ${busy ? "opacity-60 pointer-events-none" : ""}`}>
        {allowRoot && (
          <button
            onClick={() => choose(null)}
            disabled={homeIsCurrent}
            className="w-full text-left px-4 py-3.5 rounded-xl text-sm font-semibold bg-violet-100 text-ink active:scale-[0.98] transition disabled:opacity-50"
          >
            🏠 Home (top level)
            {homeIsCurrent && <span className="ml-2 text-xs font-normal text-ink/50">— এখানেই আছে</span>}
          </button>
        )}

        {folders === null && <p className="text-sm text-ink/40 px-1 py-2">Loading…</p>}

        {folders && rows.length === 0 && (
          <p className="text-sm text-ink/40 px-1 py-2">No folders yet.</p>
        )}

        {rows.map(({ folder: f, depth, hasKids }) => {
          const excluded = !!excludeIds && excludeIds.has(f.id);
          const isCurrent = currentId === f.id;
          const disabled = excluded || isCurrent;
          return (
            <div key={f.id} className="flex items-center gap-1" style={{ paddingLeft: depth * 16 }}>
              {hasKids ? (
                <button
                  onClick={() => toggle(f.id)}
                  aria-label={expanded.has(f.id) ? "Collapse" : "Expand"}
                  className="w-10 h-10 shrink-0 rounded-full text-violet-700 text-base active:scale-90 transition"
                >
                  {expanded.has(f.id) ? "▾" : "▸"}
                </button>
              ) : (
                <span className="w-10 shrink-0" />
              )}
              <button
                onClick={() => choose(f.id)}
                disabled={disabled}
                className="flex-1 min-w-0 text-left px-3 py-3 rounded-xl text-sm bg-violet-50/70 text-ink active:scale-[0.98] transition disabled:opacity-40"
              >
                <span className="block truncate">
                  {f.icon || "📁"} {f.name}
                  {isCurrent && <span className="ml-2 text-xs text-ink/50">— এখানেই আছে</span>}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
