"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  fetchFolder,
  fetchItems,
  createItem,
  updateItem,
  deleteItem,
  reorderItems,
} from "@/lib/db";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Modal, ConfirmDialog } from "@/components/Modal";
import { EmptyState, ListSkeleton } from "@/components/EmptyState";
import { colorFor } from "@/lib/colors";
import { useRequireAuth } from "@/lib/useRequireAuth";

export default function FolderPage() {
  useRequireAuth();
  const { id } = useParams();
  const router = useRouter();
  const [folder, setFolder] = useState(null);
  const [items, setItems] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [renameItem, setRenameItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, [id]);

  async function load() {
    try {
      setError("");
      const [f, its] = await Promise.all([fetchFolder(id), fetchItems(id)]);
      setFolder(f);
      setItems(its);
    } catch {
      setError("Couldn't load this folder. Check your connection.");
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  async function move(index, direction) {
    const next = [...items];
    const swapWith = index + direction;
    if (swapWith < 0 || swapWith >= next.length) return;
    [next[index], next[swapWith]] = [next[swapWith], next[index]];
    setItems(next);
    reorderItems(next.map((i) => i.id)).catch(() => setError("Couldn't save the new order."));
  }

  const c = folder ? colorFor(folder.color) : null;

  return (
    <div className="min-h-screen pb-28">
      <Breadcrumbs
        trail={[
          { href: "/home", label: "Home" },
          { href: `/folder/${id}`, label: folder?.name || "…" },
        ]}
        onLogout={handleLogout}
      />

      <div className="max-w-2xl mx-auto px-4 pt-6">
        {folder && (
          <div className={`rounded-2xl ${c.bg} ${c.text} p-4 mb-4 flex items-center gap-3`}>
            <span className="text-2xl">{folder.icon}</span>
            <h1 className="font-semibold text-lg">{folder.name}</h1>
          </div>
        )}

        {error && <p className="text-sm text-rose-500 px-1 mb-3">{error}</p>}

        {items === null && <ListSkeleton />}

        {items && items.length === 0 && (
          <EmptyState emoji="📄" title="No items in this folder" subtitle="Add your first item to start a lesson" />
        )}

        {items && items.length > 0 && (
          <ul className="space-y-2">
            {items.map((item, idx) => (
              <li
                key={item.id}
                className="bg-white rounded-2xl shadow-sm px-4 py-3 flex items-center gap-2"
              >
                <button
                  onClick={() => router.push(`/lesson/${item.id}`)}
                  className="flex-1 text-left font-medium text-sm truncate"
                >
                  {item.name}
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => move(idx, -1)}
                    disabled={idx === 0}
                    className="w-7 h-7 rounded-full bg-violet-50 text-violet-500 disabled:opacity-30 text-xs"
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => move(idx, 1)}
                    disabled={idx === items.length - 1}
                    className="w-7 h-7 rounded-full bg-violet-50 text-violet-500 disabled:opacity-30 text-xs"
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => setRenameItem(item)}
                    className="w-7 h-7 rounded-full bg-violet-50 text-violet-500 text-xs"
                    aria-label="Rename"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => setConfirmDelete(item)}
                    className="w-7 h-7 rounded-full bg-rose-50 text-rose-500 text-xs"
                    aria-label="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        onClick={() => setAddOpen(true)}
        className="fixed bottom-6 right-6 sm:right-1/2 sm:translate-x-[calc(18rem)] bg-violet-500 text-white rounded-full px-5 py-3 shadow-lg shadow-violet-300 text-sm font-medium active:scale-95 transition"
      >
        + Add Item
      </button>

      <AddItemModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreate={async (name) => {
          const created = await createItem({ folderId: id, name });
          setItems((prev) => [...(prev || []), created]);
          setAddOpen(false);
        }}
      />

      <RenameItemModal
        open={!!renameItem}
        item={renameItem}
        onClose={() => setRenameItem(null)}
        onSave={async (name) => {
          const updated = await updateItem(renameItem.id, { name });
          setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
          setRenameItem(null);
        }}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete this item?"
        message={`"${confirmDelete?.name}" and its lesson content will be permanently deleted. This can't be undone.`}
        danger
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => {
          await deleteItem(confirmDelete.id);
          setItems((prev) => prev.filter((i) => i.id !== confirmDelete.id));
          setConfirmDelete(null);
        }}
      />
    </div>
  );
}

function AddItemModal({ open, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setError("");
    }
  }, [open]);

  async function submit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      await onCreate(name.trim());
    } catch {
      setError("Couldn't save the item. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New item">
      <form onSubmit={submit} className="space-y-4">
        <input
          autoFocus
          placeholder="Item name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-violet-100 bg-violet-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-300"
        />
        {error && <p className="text-sm text-rose-500">{error}</p>}
        <button
          disabled={saving || !name.trim()}
          className="w-full rounded-xl bg-violet-500 text-white py-3 text-sm font-medium disabled:opacity-50"
        >
          {saving ? "Saving…" : "Create item"}
        </button>
      </form>
    </Modal>
  );
}

function RenameItemModal({ open, item, onClose, onSave }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) setName(item.name);
  }, [item]);

  if (!item) return null;

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(name.trim());
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Rename item">
      <form onSubmit={submit} className="space-y-4">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-violet-100 bg-violet-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-300"
        />
        <button
          disabled={saving || !name.trim()}
          className="w-full rounded-xl bg-violet-500 text-white py-3 text-sm font-medium disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </form>
    </Modal>
  );
}
