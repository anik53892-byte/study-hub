"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  fetchFolder,
  fetchFolders,
  fetchLessons,
  fetchAncestors,
  createFolder,
  updateFolder,
  deleteFolder,
  reorderFolders,
  duplicateFolder,
  moveFolder,
  createLesson,
  updateLessonMeta,
  deleteLesson,
  reorderLessons,
  duplicateLesson,
  moveLesson,
  fetchAllFolders,
  invalidMoveTargets,
} from "@/lib/db";
import { withRetry } from "@/lib/retry";
import { useRealtimeRefresh } from "@/lib/useRealtimeRefresh";
import { autoColor, autoIcon } from "@/lib/colors";
import { useAuth } from "@/lib/useAuth";
import Breadcrumbs from "@/components/Breadcrumbs";
import LiveBackground from "@/components/LiveBackground";
import FolderCard from "@/components/FolderCard";
import ColorPicker from "@/components/ColorPicker";
import IconPicker from "@/components/IconPicker";
import { Modal, ConfirmDialog } from "@/components/Modal";
import FolderPickerModal from "@/components/FolderPickerModal";
import { EmptyState, ListSkeleton } from "@/components/EmptyState";

const FOLDER_MESSAGES = [
  "Sweet heart 💝 মনোযোগ দাও, অর্জন আসবেই।",
  "প্রতিদিনের চর্চা তোমাকে এগিয়ে নেবে।",
  "ছোট পদক্ষেপই বড় সাফল্যের শুরু।",
  "আজকের অধ্যবসায় আগামীর সাফল্য।",
];

export default function FolderPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const isOwner = !!user;

  const [folder, setFolder] = useState(null);
  const [ancestors, setAncestors] = useState([]);
  const [subfolders, setSubfolders] = useState(null);
  const [lessons, setLessons] = useState(null);
  const [error, setError] = useState("");

  const [msgIndex, setMsgIndex] = useState(0);
  const [quoteVisible, setQuoteVisible] = useState(true);

  const [addFolderOpen, setAddFolderOpen] = useState(false);
  const [addLessonOpen, setAddLessonOpen] = useState(false);
  const [menuFolder, setMenuFolder] = useState(null);
  const [editFolderOpen, setEditFolderOpen] = useState(false);
  const [moveFolderOpen, setMoveFolderOpen] = useState(false);
  const [menuLesson, setMenuLesson] = useState(null);
  const [renameLessonOpen, setRenameLessonOpen] = useState(false);
  const [moveLessonOpen, setMoveLessonOpen] = useState(false);
  const [confirmDeleteFolder, setConfirmDeleteFolder] = useState(null);
  const [confirmDeleteLesson, setConfirmDeleteLesson] = useState(null);

  useEffect(() => {
    const t = setInterval(() => {
      setQuoteVisible(false);
      setTimeout(() => {
        setMsgIndex((i) => (i + 1) % FOLDER_MESSAGES.length);
        setQuoteVisible(true);
      }, 600);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    load();
  }, [id]);

  useRealtimeRefresh(["folders", "lessons"], load);

  async function load() {
    try {
      setError("");
      const [f, subs, less, anc] = await withRetry(() =>
        Promise.all([fetchFolder(id), fetchFolders(id), fetchLessons(id), fetchAncestors(id)])
      );
      setFolder(f);
      setSubfolders(subs);
      setLessons(less);
      setAncestors(anc);
    } catch {
      setError("Couldn't load this folder. Check your connection.");
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.refresh();
  }

  async function moveFolderUpDown(index, direction) {
    const next = [...subfolders];
    const swap = index + direction;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    setSubfolders(next);
    reorderFolders(next.map((f) => f.id)).catch(() => setError("Couldn't save the new order."));
  }

  async function moveLessonUpDown(index, direction) {
    const next = [...lessons];
    const swap = index + direction;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    setLessons(next);
    reorderLessons(next.map((l) => l.id)).catch(() => setError("Couldn't save the new order."));
  }

  const trail = [
    { href: "/home", label: "Home" },
    ...ancestors.map((a) => ({ href: `/folder/${a.id}`, label: a.name })),
  ];

  return (
    <div className="min-h-screen pb-28 relative">
      <LiveBackground heartCount={7} />
      <Breadcrumbs trail={trail} isOwner={isOwner} onLogout={handleLogout} variant="premium" />

      <div className="max-w-2xl mx-auto px-4 pt-6">
        {folder && (
          <div className="rounded-2xl bg-white/40 backdrop-blur-md border border-white/55 shadow-[0_8px_20px_rgba(90,70,120,0.14),inset_0_1px_0_rgba(255,255,255,0.5)] p-4 mb-4 flex items-center gap-3">
            <span className="text-2xl" style={{ filter: "drop-shadow(0 2px 6px rgba(124,58,237,0.25))" }}>
              {folder.icon}
            </span>
            <h1 className="font-semibold text-lg text-[#3f3355]">{folder.name}</h1>
          </div>
        )}

        <div className="relative bg-white/40 backdrop-blur-xl border border-white/55 rounded-2xl px-4 py-4 mb-5 shadow-[0_8px_20px_rgba(90,70,120,0.14),inset_0_1px_0_rgba(255,255,255,0.5)] min-h-[3.5rem] flex items-center justify-center">
          <p
            className={`text-center font-serif italic font-extrabold text-base sm:text-lg text-violet-800 [text-shadow:0_2px_8px_rgba(91,33,182,0.15)] transition-opacity duration-500
              ${quoteVisible ? "opacity-100" : "opacity-0"}`}
          >
            "{FOLDER_MESSAGES[msgIndex]}"
          </p>
        </div>

        {error && <p className="text-sm text-rose-700 bg-rose-100/70 border border-rose-200 backdrop-blur rounded-xl px-3 py-2 mb-3">{error}</p>}

        {(subfolders === null || lessons === null) && <ListSkeleton />}

        {subfolders && subfolders.length > 0 && (
          <div className="mb-5">
            <h2 className="text-xs uppercase tracking-wide text-[#6d5d8c] mb-2 px-1">Sub-folders</h2>
            <div className="grid grid-cols-3 gap-2.5">
              {subfolders.map((sf, idx) => (
                <div key={sf.id} className="relative">
                  <FolderCard
                    folder={sf}
                    compact
                    onOpen={(f) => router.push(`/folder/${f.id}`)}
                    onMenu={isOwner ? (f) => setMenuFolder(f) : null}
                  />
                  {isOwner && (
                    <div className="flex justify-center gap-1 mt-1">
                      <button
                        onClick={() => moveFolderUpDown(idx, -1)}
                        disabled={idx === 0}
                        className="w-5 h-5 rounded-full bg-white/60 text-violet-700 disabled:opacity-30 text-[10px]"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveFolderUpDown(idx, 1)}
                        disabled={idx === subfolders.length - 1}
                        className="w-5 h-5 rounded-full bg-white/60 text-violet-700 disabled:opacity-30 text-[10px]"
                      >
                        ↓
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {lessons && lessons.length > 0 && (
          <div>
            <h2 className="text-xs uppercase tracking-wide text-[#6d5d8c] mb-2 px-1">Lessons</h2>
            <ul className="space-y-2">
              {lessons.map((lesson, idx) => (
                <li
                  key={lesson.id}
                  className="relative overflow-hidden bg-white/40 backdrop-blur-md border border-white/55 rounded-2xl shadow-[0_8px_20px_rgba(90,70,120,0.14),inset_0_1px_0_rgba(255,255,255,0.5)] px-4 py-3 flex items-center gap-2"
                >
                  <button
                    onClick={() => router.push(`/lesson/${lesson.id}`)}
                    className="flex-1 text-left font-semibold text-sm truncate text-[#3f3355]"
                  >
                    📝 {lesson.title}
                  </button>
                  {isOwner && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => moveLessonUpDown(idx, -1)}
                        disabled={idx === 0}
                        className="w-7 h-7 rounded-full bg-white/60 text-violet-700 disabled:opacity-30 text-xs"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveLessonUpDown(idx, 1)}
                        disabled={idx === lessons.length - 1}
                        className="w-7 h-7 rounded-full bg-white/60 text-violet-700 disabled:opacity-30 text-xs"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => setMenuLesson(lesson)}
                        className="w-7 h-7 rounded-full bg-white/60 text-violet-700 text-xs"
                        aria-label="Lesson options"
                      >
                        ⋮
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {subfolders && lessons && subfolders.length === 0 && lessons.length === 0 && (
          <EmptyState
            emoji="📄"
            title="Nothing here yet"
            subtitle={isOwner ? "Add a sub-folder or a lesson to get started" : "Check back soon"}
          />
        )}
      </div>

      {isOwner && (
        <div className="fixed bottom-6 right-6 sm:right-1/2 sm:translate-x-[calc(18rem)] flex flex-col gap-2 items-end">
          <button
            onClick={() => setAddLessonOpen(true)}
            className="text-white rounded-full px-5 py-3 text-sm font-medium active:scale-95 transition
              bg-gradient-to-br from-sky-400 to-sky-600 shadow-[0_0_0_1px_rgba(255,255,255,0.25)_inset,0_8px_22px_rgba(2,132,199,0.4)]"
          >
            + New Lesson
          </button>
          <button
            onClick={() => setAddFolderOpen(true)}
            className="text-white rounded-full px-5 py-3 text-sm font-medium active:scale-95 transition
              bg-gradient-to-br from-pink-400 to-pink-600 shadow-[0_0_0_1px_rgba(255,255,255,0.25)_inset,0_8px_22px_rgba(219,39,119,0.4)]"
          >
            + New Sub-folder
          </button>
        </div>
      )}

      <AddFolderModal
        open={addFolderOpen}
        existingCount={subfolders?.length || 0}
        onClose={() => setAddFolderOpen(false)}
        onCreate={async (payload) => {
          const created = await createFolder({ ...payload, parentId: id });
          setSubfolders((prev) => [...(prev || []), created]);
          setAddFolderOpen(false);
        }}
      />

      <AddLessonModal
        open={addLessonOpen}
        existingCount={lessons?.length || 0}
        onClose={() => setAddLessonOpen(false)}
        onCreate={async (title, color) => {
          const created = await createLesson({ folderId: id, title, color });
          setLessons((prev) => [...(prev || []), created]);
          setAddLessonOpen(false);
        }}
      />

      {/* Sub-folder menu */}
      <Modal
        open={!!menuFolder && !editFolderOpen && !moveFolderOpen}
        onClose={() => setMenuFolder(null)}
        title={menuFolder?.name || ""}
      >
        <div className="space-y-2">
          <MenuButton label="📂 Open" onClick={() => router.push(`/folder/${menuFolder.id}`)} />
          <MenuButton label="✏️ Rename & recolor" onClick={() => setEditFolderOpen(true)} />
          <MenuButton
            label="📄 Duplicate"
            onClick={async () => {
              const copy = await duplicateFolder(menuFolder.id);
              setSubfolders((prev) => [...(prev || []), copy]);
              setMenuFolder(null);
            }}
          />
          <MenuButton label="➡️ Move to…" onClick={() => setMoveFolderOpen(true)} />
          <MenuButton
            label="🗑️ Delete folder"
            danger
            onClick={() => {
              setConfirmDeleteFolder(menuFolder);
              setMenuFolder(null);
            }}
          />
        </div>
      </Modal>

      <EditFolderModal
        open={editFolderOpen}
        folder={menuFolder}
        onClose={() => {
          setEditFolderOpen(false);
          setMenuFolder(null);
        }}
        onSave={async (patch) => {
          const updated = await updateFolder(menuFolder.id, patch);
          setSubfolders((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
          setEditFolderOpen(false);
          setMenuFolder(null);
        }}
      />

      <MoveFolderPicker
        open={moveFolderOpen}
        folder={menuFolder}
        onClose={() => {
          setMoveFolderOpen(false);
          setMenuFolder(null);
        }}
        onMoved={(fid) => {
          setSubfolders((prev) => prev.filter((f) => f.id !== fid));
          setMoveFolderOpen(false);
          setMenuFolder(null);
        }}
      />

      {/* Lesson menu */}
      <Modal
        open={!!menuLesson && !renameLessonOpen && !moveLessonOpen}
        onClose={() => setMenuLesson(null)}
        title={menuLesson?.title || ""}
      >
        <div className="space-y-2">
          <MenuButton label="📖 Open" onClick={() => router.push(`/lesson/${menuLesson.id}`)} />
          <MenuButton label="✏️ Rename & recolor" onClick={() => setRenameLessonOpen(true)} />
          <MenuButton
            label="📄 Duplicate"
            onClick={async () => {
              const copy = await duplicateLesson(menuLesson.id);
              setLessons((prev) => [...(prev || []), copy]);
              setMenuLesson(null);
            }}
          />
          <MenuButton label="➡️ Move to…" onClick={() => setMoveLessonOpen(true)} />
          <MenuButton
            label="🗑️ Delete lesson"
            danger
            onClick={() => {
              setConfirmDeleteLesson(menuLesson);
              setMenuLesson(null);
            }}
          />
        </div>
      </Modal>

      <RenameLessonModal
        open={renameLessonOpen}
        lesson={menuLesson}
        onClose={() => {
          setRenameLessonOpen(false);
          setMenuLesson(null);
        }}
        onSave={async (title, color) => {
          const updated = await updateLessonMeta(menuLesson.id, { title, color });
          setLessons((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
          setRenameLessonOpen(false);
          setMenuLesson(null);
        }}
      />

      <FolderPickerModal
        open={moveLessonOpen}
        allowRoot={false}
        title="Move lesson to…"
        onClose={() => {
          setMoveLessonOpen(false);
          setMenuLesson(null);
        }}
        onSelect={async (targetFolderId) => {
          await moveLesson(menuLesson.id, targetFolderId);
          setLessons((prev) => prev.filter((l) => l.id !== menuLesson.id));
          setMoveLessonOpen(false);
          setMenuLesson(null);
        }}
      />

      <ConfirmDialog
        open={!!confirmDeleteFolder}
        title="Delete this sub-folder?"
        message={`"${confirmDeleteFolder?.name}" and everything inside it will be permanently deleted. This can't be undone.`}
        danger
        confirmLabel="Delete everything"
        onCancel={() => setConfirmDeleteFolder(null)}
        onConfirm={async () => {
          await deleteFolder(confirmDeleteFolder.id);
          setSubfolders((prev) => prev.filter((f) => f.id !== confirmDeleteFolder.id));
          setConfirmDeleteFolder(null);
        }}
      />

      <ConfirmDialog
        open={!!confirmDeleteLesson}
        title="Delete this lesson?"
        message={`"${confirmDeleteLesson?.title}" will be permanently deleted. This can't be undone.`}
        danger
        onCancel={() => setConfirmDeleteLesson(null)}
        onConfirm={async () => {
          await deleteLesson(confirmDeleteLesson.id);
          setLessons((prev) => prev.filter((l) => l.id !== confirmDeleteLesson.id));
          setConfirmDeleteLesson(null);
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
  const [color, setColor] = useState(autoColor(existingCount));
  const [icon, setIcon] = useState(autoIcon(existingCount));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setColor(autoColor(existingCount));
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
      await onCreate({ name: name.trim(), color, icon });
    } catch {
      setError("Couldn't save the sub-folder. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New sub-folder">
      <form onSubmit={submit} className="space-y-4">
        <input
          autoFocus
          placeholder="Sub-folder name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-violet-100 bg-violet-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-300"
        />
        <IconPicker value={icon} onChange={setIcon} />
        <ColorPicker value={color} onChange={setColor} />
        {error && <p className="text-sm text-rose-500">{error}</p>}
        <button
          disabled={saving || !name.trim()}
          className="w-full rounded-xl bg-violet-500 text-white py-3 text-sm font-medium disabled:opacity-50"
        >
          {saving ? "Saving…" : "Create sub-folder"}
        </button>
      </form>
    </Modal>
  );
}

function EditFolderModal({ open, folder, onClose, onSave }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("violet");
  const [icon, setIcon] = useState("📁");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (folder) {
      setName(folder.name);
      setColor(folder.color);
      setIcon(folder.icon);
    }
  }, [folder]);

  if (!folder) return null;

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ name: name.trim(), color, icon });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit sub-folder">
      <form onSubmit={submit} className="space-y-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-violet-100 bg-violet-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-300"
        />
        <IconPicker value={icon} onChange={setIcon} />
        <ColorPicker value={color} onChange={setColor} />
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

function AddLessonModal({ open, existingCount, onClose, onCreate }) {
  const [title, setTitle] = useState("");
  const [color, setColor] = useState(autoColor(existingCount));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setTitle("");
      setColor(autoColor(existingCount));
      setError("");
    }
  }, [open, existingCount]);

  async function submit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError("");
    try {
      await onCreate(title.trim(), color);
    } catch {
      setError("Couldn't save the lesson. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New lesson">
      <form onSubmit={submit} className="space-y-4">
        <input
          autoFocus
          placeholder="Lesson title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-xl border border-violet-100 bg-violet-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-300"
        />
        <p className="text-xs text-ink/40 -mt-2">Reading-page background tint</p>
        <ColorPicker value={color} onChange={setColor} />
        {error && <p className="text-sm text-rose-500">{error}</p>}
        <button
          disabled={saving || !title.trim()}
          className="w-full rounded-xl bg-violet-500 text-white py-3 text-sm font-medium disabled:opacity-50"
        >
          {saving ? "Saving…" : "Create lesson"}
        </button>
      </form>
    </Modal>
  );
}

function RenameLessonModal({ open, lesson, onClose, onSave }) {
  const [title, setTitle] = useState("");
  const [color, setColor] = useState("dark");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (lesson) {
      setTitle(lesson.title);
      setColor(lesson.color);
    }
  }, [lesson]);

  if (!lesson) return null;

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(title.trim(), color);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit lesson">
      <form onSubmit={submit} className="space-y-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-xl border border-violet-100 bg-violet-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-300"
        />
        <p className="text-xs text-ink/40 -mt-2">Reading-page background tint</p>
        <ColorPicker value={color} onChange={setColor} />
        <button
          disabled={saving || !title.trim()}
          className="w-full rounded-xl bg-violet-500 text-white py-3 text-sm font-medium disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </form>
    </Modal>
  );
}
