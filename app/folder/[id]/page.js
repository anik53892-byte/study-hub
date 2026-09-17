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
import { colorFor, autoColor, ICONS, PALETTE } from "@/lib/colors";
import { useAuth } from "@/lib/useAuth";
import Breadcrumbs from "@/components/Breadcrumbs";
import FolderCard from "@/components/FolderCard";
import { Modal, ConfirmDialog } from "@/components/Modal";
import FolderPickerModal from "@/components/FolderPickerModal";
import { EmptyState, ListSkeleton } from "@/components/EmptyState";

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

  const c = folder ? colorFor(folder.color) : null;
  const trail = [
    { href: "/home", label: "Home" },
    ...ancestors.map((a) => ({ href: `/folder/${a.id}`, label: a.name })),
  ];

  return (
    <div className="min-h-screen pb-28">
      <Breadcrumbs trail={trail} isOwner={isOwner} onLogout={handleLogout} />

      <div className="max-w-2xl mx-auto px-4 pt-6">
        {folder && (
          <div className={`rounded-2xl ${c.bg} ${c.text} p-4 mb-4 flex items-center gap-3`}>
            <span className="text-2xl">{folder.icon}</span>
            <h1 className="font-semibold text-lg">{folder.name}</h1>
          </div>
        )}

        {error && <p className="text-sm text-rose-500 px-1 mb-3">{error}</p>}

        {(subfolders === null || lessons === null) && <ListSkeleton />}

        {subfolders && subfolders.length > 0 && (
          <div className="mb-5">
            <h2 className="text-xs uppercase tracking-wide text-ink/40 mb-2 px-1">Sub-folders</h2>
            <div className="grid grid-cols-2 gap-3">
              {subfolders.map((sf, idx) => (
                <div key={sf.id} className="relative">
                  <FolderCard
                    folder={sf}
                    onOpen={(f) => router.push(`/folder/${f.id}`)}
                    onMenu={isOwner ? (f) => setMenuFolder(f) : null}
                  />
                  {isOwner && (
                    <div className="flex justify-center gap-1 mt-1">
                      <button
                        onClick={() => moveFolderUpDown(idx, -1)}
                        disabled={idx === 0}
                        className="w-6 h-6 rounded-full bg-violet-50 text-violet-500 disabled:opacity-30 text-xs"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveFolderUpDown(idx, 1)}
                        disabled={idx === subfolders.length - 1}
                        className="w-6 h-6 rounded-full bg-violet-50 text-violet-500 disabled:opacity-30 text-xs"
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
            <h2 className="text-xs uppercase tracking-wide text-ink/40 mb-2 px-1">Lessons</h2>
            <ul className="space-y-2">
              {lessons.map((lesson, idx) => {
                const lc = colorFor(lesson.color);
                return (
                  <li
                    key={lesson.id}
                    className={`${lc.bg} ${lc.text} rounded-2xl shadow-sm px-4 py-3 flex items-center gap-2`}
                  >
                    <button
                      onClick={() => router.push(`/lesson/${lesson.id}`)}
                      className="flex-1 text-left font-medium text-sm truncate"
                    >
                      📝 {lesson.title}
                    </button>
                    {isOwner && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => moveLessonUpDown(idx, -1)}
                          disabled={idx === 0}
                          className="w-7 h-7 rounded-full bg-white/60 disabled:opacity-30 text-xs"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveLessonUpDown(idx, 1)}
                          disabled={idx === lessons.length - 1}
                          className="w-7 h-7 rounded-full bg-white/60 disabled:opacity-30 text-xs"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => setMenuLesson(lesson)}
                          className="w-7 h-7 rounded-full bg-white/60 text-xs"
                          aria-label="Lesson options"
                        >
                          ⋮
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
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
            className="bg-violet-500 text-white rounded-full px-5 py-3 shadow-lg shadow-violet-300 text-sm font-medium active:scale-95 transition"
          >
            + Add Lesson
          </button>
          <button
            onClick={() => setAddFolderOpen(true)}
            className="bg-white text-violet-600 border border-violet-200 rounded-full px-5 py-3 shadow-md text-sm font-medium active:scale-95 transition"
          >
            + Add Sub-folder
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
  const [icon, setIcon] = useState(ICONS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setColor(autoColor(existingCount));
      setIcon(ICONS[0]);
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
  const [color, setColor] = useState("blue");
  const [icon, setIcon] = useState(ICONS[0]);
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
        <p className="text-xs text-ink/40 -mt-2">Background color for this lesson</p>
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
  const [color, setColor] = useState("blue");
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
        <p className="text-xs text-ink/40 -mt-2">Background color</p>
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

function IconPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {ICONS.map((i) => (
        <button
          type="button"
          key={i}
          onClick={() => onChange(i)}
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
            value === i ? "bg-violet-500" : "bg-violet-50"
          }`}
        >
          {i}
        </button>
      ))}
    </div>
  );
}

function ColorPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {PALETTE.map((c) => (
        <button
          type="button"
          key={c.key}
          onClick={() => onChange(c.key)}
          className={`w-9 h-9 rounded-full ${c.bg} ring-2 ${
            value === c.key ? "ring-violet-500" : "ring-transparent"
          }`}
          aria-label={c.key}
        />
      ))}
    </div>
  );
}
