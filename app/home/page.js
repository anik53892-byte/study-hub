"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  fetchFolders,
  fetchFolderItemCounts,
  fetchLessonProgress,
  createFolder,
  updateFolder,
  deleteFolder,
  reorderFolders,
  duplicateFolder,
  copyFolderTo,
  moveFolder,
  fetchAllFolders,
  invalidMoveTargets,
} from "@/lib/db";
import { useClipboard, setClipboard, clearClipboard } from "@/lib/clipboard";
import { withRetry } from "@/lib/retry";
import { useRealtimeRefresh } from "@/lib/useRealtimeRefresh";
import { autoColor, autoIcon } from "@/lib/colors";
import { useAuth } from "@/lib/useAuth";
import Breadcrumbs from "@/components/Breadcrumbs";
import FolderCard from "@/components/FolderCard";
import HomeBackground from "@/components/HomeBackground";
import IconPicker from "@/components/IconPicker";
import { Modal, ConfirmDialog } from "@/components/Modal";
import FolderPickerModal from "@/components/FolderPickerModal";
import { EmptyState, CardSkeleton } from "@/components/EmptyState";

const MESSAGES = [
  "Pollobi, নিজের উপর বিশ্বাস রাখো, তুমি পারবে।",
  "আজকের একটু পড়াই আগামীকালের বড় পরিবর্তন।",
  "স্বপ্ন পূরণের পথ শুরু করো আজ থেকেই।",
  "প্রতিদিনের ছোট চেষ্টা বড় সাফল্যের চাবিকাঠি।",
  "ধৈর্য আর অধ্যবসায়ই সাফল্যের রহস্য।",
  "মনোযোগ দাও, অর্জন আসবেই।",
];

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const isOwner = !!user;
  const clip = useClipboard();

  const [folders, setFolders] = useState(null);
  const [counts, setCounts] = useState({});
  const [progress, setProgress] = useState({});
  const [msgIndex, setMsgIndex] = useState(0);
  const [quoteVisible, setQuoteVisible] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [menuFolder, setMenuFolder] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [error, setError] = useState("");
  const [pasting, setPasting] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setQuoteVisible(false);
      setTimeout(() => {
        setMsgIndex((i) => (i + 1) % MESSAGES.length);
        setQuoteVisible(true);
      }, 600);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    load();
  }, []);

  useRealtimeRefresh(["folders", "lessons"], load);

  async function load() {
    try {
      setError("");
      const data = await withRetry(() => fetchFolders(null));
      setFolders(data);
      const c = await fetchFolderItemCounts(data.map((f) => f.id));
      setCounts(c);
      const p = await fetchLessonProgress();
      setProgress(p);
    } catch {
      setError("Couldn't load your folders. Check your connection.");
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.refresh();
  }

  function handleCopy(folder) {
    setClipboard({ type: "folder", id: folder.id, name: folder.name });
    setMenuFolder(null);
  }

  // Home only holds folders (lessons must live inside a folder), so pasting a
  // copied lesson at the top level isn't offered here.
  async function pasteHere() {
    if (!clip || clip.type !== "folder" || pasting) return;
    setPasting(true);
    setError("");
    try {
      const copy = await copyFolderTo(clip.id, null);
      setFolders((prev) => [...(prev || []), copy]);
      setCounts((prev) => ({ ...prev, [copy.id]: 0 }));
    } catch (e) {
      setError(e?.message || "Couldn't paste here.");
    } finally {
      setPasting(false);
    }
  }

  // Swaps a top-level folder with its neighbor and saves the new order.
  async function moveFolderUpDown(index, direction) {
    const swap = index + direction;
    if (!folders || swap < 0 || swap >= folders.length) return;
    const prev = folders;
    const next = [...prev];
    [next[index], next[swap]] = [next[swap], next[index]];
    setFolders(next);
    try {
      await reorderFolders(next.map((f) => f.id));
    } catch {
      setFolders(prev);
      setError("Couldn't save the new order.");
    }
  }

  return (
    <div className="min-h-screen pb-28 relative">
      <HomeBackground />
      <Breadcrumbs
        trail={[{ href: "/home", label: "Home" }]}
        isOwner={isOwner}
        onLogout={handleLogout}
        showSearch
        variant="premium"
      />

      <div className="max-w-2xl mx-auto px-4 pt-6">
        <div className="relative bg-white/40 backdrop-blur-xl border border-white/55 rounded-3xl px-5 py-7 mb-6 shadow-[0_10px_28px_rgba(90,70,120,0.15),inset_0_1px_0_rgba(255,255,255,0.6)] flex items-center justify-center min-h-[5.5rem]">
          <p
            className={`text-center font-serif italic font-extrabold text-xl sm:text-2xl leading-snug text-violet-800
              [text-shadow:0_2px_10px_rgba(91,33,182,0.18)] transition-opacity duration-500
              ${quoteVisible ? "opacity-100" : "opacity-0"}`}
          >
            "{MESSAGES[msgIndex]}"
          </p>
        </div>

        <h1 className="text-xl font-semibold mt-2 mb-3 px-1 text-[#3f3355]">📚 My Study</h1>

        {error && <p className="text-sm text-rose-700 bg-rose-100/70 border border-rose-200 backdrop-blur rounded-xl px-3 py-2 mb-3">{error}</p>}

        {folders === null && <CardSkeleton />}

        {folders && folders.length === 0 && (
          <EmptyState emoji="🗂️" title="No folders yet" subtitle={isOwner ? "Create your first folder to get started" : "Check back soon"} />
        )}

        {folders && folders.length > 0 && (
          <div className="grid grid-cols-2 gap-3 px-1">
            {folders.map((f, idx) => (
              <div key={f.id} className="relative">
                <FolderCard
                  folder={f}
                  count={counts[f.id]}
                  progress={progress[f.id]}
                  onOpen={(folder) => router.push(`/folder/${folder.id}`)}
                  onMenu={isOwner ? (folder) => setMenuFolder(folder) : null}
                />
                {isOwner && (
                  <div className="flex justify-center gap-1 mt-1">
                    <button
                      onClick={() => moveFolderUpDown(idx, -1)}
                      disabled={idx === 0}
                      className="w-7 h-7 rounded-full bg-white/60 text-violet-700 disabled:opacity-30 text-xs"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveFolderUpDown(idx, 1)}
                      disabled={idx === folders.length - 1}
                      className="w-7 h-7 rounded-full bg-white/60 text-violet-700 disabled:opacity-30 text-xs"
                    >
                      ↓
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {isOwner && (
        <div className="fixed bottom-6 right-6 sm:right-1/2 sm:translate-x-[calc(18rem)] flex flex-col gap-2 items-end">
          {clip && clip.type === "folder" && (
            <div className="flex items-center gap-2">
              <button
                onClick={pasteHere}
                disabled={pasting}
                className="text-violet-700 bg-white/90 backdrop-blur rounded-full pl-4 pr-3 py-2.5 text-xs font-medium active:scale-95 transition shadow-[0_0_0_1px_rgba(255,255,255,0.4)_inset,0_8px_20px_rgba(90,70,120,0.25)] disabled:opacity-50 max-w-[13rem] truncate"
              >
                {pasting ? "Pasting…" : `📥 Paste "${clip.name}"`}
              </button>
              <button
                onClick={clearClipboard}
                aria-label="Clear clipboard"
                className="w-8 h-8 shrink-0 rounded-full bg-white/70 text-violet-700 text-xs active:scale-90 transition"
              >
                ✕
              </button>
            </div>
          )}
          <button
            onClick={() => setAddOpen(true)}
            className="text-white rounded-full px-5 py-3 text-sm font-medium active:scale-95 transition
              bg-gradient-to-br from-violet-400 to-violet-600 shadow-[0_0_0_1px_rgba(255,255,255,0.25)_inset,0_8px_22px_rgba(124,58,237,0.45)]"
          >
            + New Folder
          </button>
        </div>
      )}

      <AddFolderModal
        open={addOpen}
        existingCount={folders?.length || 0}
        onClose={() => setAddOpen(false)}
        onCreate={async (payload) => {
          const created = await createFolder({ ...payload, parentId: null });
          setFolders((prev) => [...(prev || []), created]);
          setCounts((prev) => ({ ...prev, [created.id]: 0 }));
          setAddOpen(false);
        }}
      />

      <Modal open={!!menuFolder && !editOpen && !moveOpen} onClose={() => setMenuFolder(null)} title={menuFolder?.name || ""}>
        <div className="space-y-2">
          <MenuButton label="📂 Open" onClick={() => router.push(`/folder/${menuFolder.id}`)} />
          <MenuButton label="✏️ Rename" onClick={() => setEditOpen(true)} />
          <MenuButton label="📋 Copy" onClick={() => handleCopy(menuFolder)} />
          <MenuButton
            label="📄 Duplicate"
            onClick={async () => {
              const copy = await duplicateFolder(menuFolder.id);
              setFolders((prev) => [...(prev || []), copy]);
              setMenuFolder(null);
              load();
            }}
          />
          <MenuButton label="➡️ Move to…" onClick={() => setMoveOpen(true)} />
          {clip && clip.type === "folder" && (
            <MenuButton
              label={`📥 Paste "${clip.name}" inside`}
              onClick={async () => {
                setPasting(true);
                setError("");
                try {
                  const copy = await copyFolderTo(clip.id, menuFolder.id);
                  if (menuFolder.id === null) setFolders((prev) => [...(prev || []), copy]);
                } catch (e) {
                  setError(e?.message || "Couldn't paste here.");
                } finally {
                  setPasting(false);
                  setMenuFolder(null);
                }
              }}
            />
          )}
          <MenuButton
            label="🗑️ Delete folder"
            danger
            onClick={() => {
              setConfirmDelete(menuFolder);
              setMenuFolder(null);
            }}
          />
        </div>
      </Modal>

      <EditFolderModal
        open={editOpen}
        folder={menuFolder}
        onClose={() => {
          setEditOpen(false);
          setMenuFolder(null);
        }}
        onSave={async (patch) => {
          const updated = await updateFolder(menuFolder.id, patch);
          setFolders((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
          setEditOpen(false);
          setMenuFolder(null);
        }}
      />

      <MoveFolderPicker
        open={moveOpen}
        folder={menuFolder}
        onClose={() => {
          setMoveOpen(false);
          setMenuFolder(null);
        }}
        onMoved={(id) => {
          setFolders((prev) => prev.filter((f) => f.id !== id));
          setMoveOpen(false);
          setMenuFolder(null);
        }}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete this folder?"
        message={`"${confirmDelete?.name}" and everything inside it — sub-folders and lessons — will be permanently deleted. This can't be undone.`}
        danger
        confirmLabel="Delete everything"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => {
          await deleteFolder(confirmDelete.id);
          setFolders((prev) => prev.filter((f) => f.id !== confirmDelete.id));
          setConfirmDelete(null);
        }}
      />
    </div>
  );
}

function MoveFolderPicker({ open, folder, onClose, onMoved }) {
  const [excludeIds, setExcludeIds] = useState(null);

  useEffect(() => {
    if (open && folder) {
      fetchAllFolders().then((all) => setExcludeIds(invalidMoveTargets(all, folder.id)));
    }
  }, [open, folder]);

  if (!folder) return null;

  return (
    <FolderPickerModal
      open={open && excludeIds !== null}
      onClose={onClose}
      excludeIds={excludeIds}
      currentId={folder.parent_id ?? null}
      onSelect={async (targetId) => {
        await moveFolder(folder.id, targetId);
        onMoved(folder.id);
      }}
    />
  );
}

function MenuButton({ label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium ${
        danger ? "bg-rose-50 text-rose-600" : "bg-violet-50 text-ink"
      }`}
    >
      {label}
    </button>
  );
}

function AddFolderModal({ open, existingCount, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(autoIcon(existingCount));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setIcon(autoIcon(existingCount));
      setError("");
    }
  }, [open, existingCount]);

  async function submit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      // Color is assigned automatically behind the scenes — no picker shown to the user.
      await onCreate({ name: name.trim(), color: autoColor(existingCount), icon });
    } catch {
      setError("Couldn't save the folder. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New folder">
      <form onSubmit={submit} className="space-y-4">
        <input
          autoFocus
          placeholder="Folder name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-violet-100 bg-violet-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-300"
        />
        <p className="text-xs text-ink/40 -mb-2">Icon auto-picked — change if you like</p>
        <IconPicker value={icon} onChange={setIcon} />
        {error && <p className="text-sm text-rose-500">{error}</p>}
        <button
          disabled={saving || !name.trim()}
          className="w-full rounded-xl bg-violet-500 text-white py-3 text-sm font-medium disabled:opacity-50"
        >
          {saving ? "Saving…" : "Create folder"}
        </button>
      </form>
    </Modal>
  );
}

function EditFolderModal({ open, folder, onClose, onSave }) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📁");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (folder) {
      setName(folder.name);
      setIcon(folder.icon);
    }
  }, [folder]);

  if (!folder) return null;

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      // Color is left untouched — there's no picker here, so the existing color stays as-is.
      await onSave({ name: name.trim(), color: folder.color, icon });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit folder">
      <form onSubmit={submit} className="space-y-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-violet-100 bg-violet-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-300"
        />
        <IconPicker value={icon} onChange={setIcon} />
        <button
          disabled={saving || !name.trim()}
          className="w-full rounded-xl bg-violet-500 text-white py-3 text-sm font-medium disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </Modal>
  );
}
