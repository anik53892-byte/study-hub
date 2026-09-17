"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { fetchFolders, createFolder, updateFolder, deleteFolder } from "@/lib/db";
import { PALETTE, ICONS, autoColor } from "@/lib/colors";
import Breadcrumbs from "@/components/Breadcrumbs";
import FolderCard from "@/components/FolderCard";
import { Modal, ConfirmDialog } from "@/components/Modal";
import { EmptyState, CardSkeleton } from "@/components/EmptyState";
import { useRequireAuth } from "@/lib/useRequireAuth";

const MESSAGES = [
  "আজকের একটু পড়াই আগামীকালের বড় পরিবর্তন।",
  "Small steps today build big results tomorrow.",
  "One page a day keeps doubts away.",
  "Focus for 10 minutes — momentum does the rest.",
  "Consistency beats intensity. Keep going.",
];

export default function HomePage() {
  useRequireAuth();
  const router = useRouter();
  const [folders, setFolders] = useState(null);
  const [msgIndex, setMsgIndex] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [menuFolder, setMenuFolder] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = setInterval(() => setMsgIndex((i) => (i + 1) % MESSAGES.length), 6000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setError("");
      const data = await fetchFolders();
      setFolders(data);
    } catch (e) {
      setError("Couldn't load your folders. Check your connection.");
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen pb-28">
      <Breadcrumbs trail={[{ href: "/home", label: "Home" }]} onLogout={handleLogout} showSearch />

      <div className="max-w-2xl mx-auto px-4 pt-6">
        <p key={msgIndex} className="text-center text-sm text-violet-600/80 animate-fadeIn min-h-[2.5rem]">
          {MESSAGES[msgIndex]}
        </p>

        <h1 className="text-xl font-semibold mt-4 mb-3 px-1">📚 My Study</h1>

        {error && <p className="text-sm text-rose-500 px-1 mb-3">{error}</p>}

        {folders === null && <CardSkeleton />}

        {folders && folders.length === 0 && (
          <EmptyState emoji="🗂️" title="No folders yet" subtitle="Create your first folder to get started" />
        )}

        {folders && folders.length > 0 && (
          <div className="grid grid-cols-2 gap-3 px-1">
            {folders.map((f) => (
              <FolderCard
                key={f.id}
                folder={f}
                onOpen={(folder) => router.push(`/folder/${folder.id}`)}
                onMenu={(folder) => setMenuFolder(folder)}
              />
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => setAddOpen(true)}
        className="fixed bottom-6 right-6 sm:right-1/2 sm:translate-x-[calc(18rem)] bg-violet-500 text-white rounded-full px-5 py-3 shadow-lg shadow-violet-300 text-sm font-medium active:scale-95 transition"
      >
        + Add Folder
      </button>

      <AddFolderModal
        open={addOpen}
        existingCount={folders?.length || 0}
        onClose={() => setAddOpen(false)}
        onCreate={async (payload) => {
          const created = await createFolder(payload);
          setFolders((prev) => [...(prev || []), created]);
          setAddOpen(false);
        }}
      />

      <Modal open={!!menuFolder && !editOpen} onClose={() => setMenuFolder(null)} title={menuFolder?.name || ""}>
        <div className="space-y-2">
          <MenuButton label="📂 Open" onClick={() => router.push(`/folder/${menuFolder.id}`)} />
          <MenuButton label="✏️ Rename & recolor" onClick={() => setEditOpen(true)} />
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

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete this folder?"
        message={`"${confirmDelete?.name}" and everything inside it — all items and lessons — will be permanently deleted. This can't be undone.`}
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
        <IconPicker value={icon} onChange={setIcon} />
        <ColorPicker value={color} onChange={setColor} />
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
    <Modal open={open} onClose={onClose} title="Edit folder">
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
