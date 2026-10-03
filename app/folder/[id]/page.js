"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
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
  copyFolderTo,
  moveFolder,
  createLesson,
  updateLessonMeta,
  deleteLesson,
  reorderLessons,
  duplicateLesson,
  copyLessonTo,
  moveLesson,
  fetchAllFolders,
  invalidMoveTargets,
} from "@/lib/db";
import { useClipboard, setClipboard, clearClipboard } from "@/lib/clipboard";
import { withRetry } from "@/lib/retry";
import { useRealtimeRefresh } from "@/lib/useRealtimeRefresh";
import { autoColor, autoIcon } from "@/lib/colors";
import { useAuth } from "@/lib/useAuth";
import Breadcrumbs from "@/components/Breadcrumbs";
import LiveBackground from "@/components/LiveBackground";
import FolderCard from "@/components/FolderCard";
import IconPicker from "@/components/IconPicker";
import SaveStatus from "@/components/SaveStatus";
import SaveToast from "@/components/SaveToast";
import { Modal, ConfirmDialog } from "@/components/Modal";
import FolderPickerModal from "@/components/FolderPickerModal";
import { EmptyState, ListSkeleton } from "@/components/EmptyState";

const LessonEditor = dynamic(() => import("@/components/LessonEditor"), { ssr: false });

const FOLDER_MESSAGES = [
  "Sweet Heart ❤️‍🔥মনোযোগ দাও, অর্জন আসবেই।",
  "প্রতিদিনের চর্চা তোমাকে এগিয়ে নেবে।",
  "ছোট পদক্ষেপই বড় সাফল্যের শুরু।",
  "Pollobi,মায়ের কষ্ট মনে রেখো, বাবার স্বপ্ন পূরণ করো—সাফল্য তোমার হতেই হবে।",
];

const AUTOSAVE_DELAY_MS = 1500;

// টাইটেলের শুরুতে কিবোর্ড থেকে বসানো ইমোজি থাকলে সেটা আলাদা করে বের করে আনে।
function splitLeadingEmoji(text) {
  const match = (text || "").match(/^(\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*)\s*/u);
  if (!match || !match[1]) return { icon: null, rest: text || "" };
  return { icon: match[1], rest: text.slice(match[0].length) };
}
export default function FolderPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const isOwner = !!user;
  const clip = useClipboard();

  const [folder, setFolder] = useState(null);
  const [ancestors, setAncestors] = useState([]);
  const [subfolders, setSubfolders] = useState(null);
  const [lessons, setLessons] = useState(null);
  const [error, setError] = useState("");
  const [pasting, setPasting] = useState(false);

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

  // ----- Menu for the folder you're currently viewing (not its children) -----
  const [folderMenuOpen, setFolderMenuOpen] = useState(false);
  const [editThisFolderOpen, setEditThisFolderOpen] = useState(false);
  const [moveThisFolderOpen, setMoveThisFolderOpen] = useState(false);
  const [confirmDeleteThisFolder, setConfirmDeleteThisFolder] = useState(false);

  // ----- Folder notes (write directly on the folder page) -----
  const [content, setContent] = useState(null); // null = still loading
  const [showEditor, setShowEditor] = useState(false);
  const editorRef = useRef(null);
  const hasNotes = !!content && content.replace(/<[^>]*>/g, "").trim() !== "";
  const [saveStatus, setSaveStatus] = useState("idle");
  const saveTimer = useRef(null);
  const pendingRef = useRef(null);

  async function flushSave() {
    clearTimeout(saveTimer.current);
    const p = pendingRef.current;
    if (!p) return;
    pendingRef.current = null;
    setSaveStatus("saving");
    try {
      await updateFolder(p.id, p.payload);
      setSaveStatus("saved");
    } catch {
      if (!pendingRef.current) pendingRef.current = p;
      setSaveStatus("error");
    }
  }

  function handleEditorChange(html, text) {
    pendingRef.current = { id, payload: { content: html, content_text: text } };
    setSaveStatus("saving");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(flushSave, AUTOSAVE_DELAY_MS);
  }

  useEffect(() => {
    let cancelled = false;
    setContent(null);
    setShowEditor(false);
    setSaveStatus("idle");
    fetchFolder(id)
      .then((f) => {
        if (!cancelled) setContent(f.content ?? "");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      flushSave();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    function beforeUnload(e) {
      if (pendingRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, []);

  // ----- Rotating quote -----
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Skip realtime refresh while there are unsaved notes being typed
  useRealtimeRefresh(["folders", "lessons"], load, () => !!pendingRef.current);

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
    await flushSave();
    await supabase.auth.signOut();
    router.refresh();
  }

  async function moveFolderUpDown(index, direction) {
    const swap = index + direction;
    if (!subfolders || swap < 0 || swap >= subfolders.length) return;
    const prev = subfolders;
    const next = [...prev];
    [next[index], next[swap]] = [next[swap], next[index]];
    setSubfolders(next);
    try {
      await reorderFolders(next.map((f) => f.id));
    } catch {
      setSubfolders(prev);
      setError("Couldn't save the new order.");
    }
  }

  async function moveLessonUpDown(index, direction) {
    const swap = index + direction;
    if (!lessons || swap < 0 || swap >= lessons.length) return;
    const prev = lessons;
    const next = [...prev];
    [next[index], next[swap]] = [next[swap], next[index]];
    setLessons(next);
    try {
      await reorderLessons(next.map((l) => l.id));
    } catch {
      setLessons(prev);
      setError("Couldn't save the new order.");
    }
  }

  // ----- Copy / Cut / Paste -----
  // "Copy" leaves the original where it is — pasting makes a new duplicate.
  // "Cut" marks the item to be MOVED — pasting relocates the original (no duplicate)
  // and clears the clipboard automatically, the same way cut/paste works elsewhere.
  function handleCopy(item, type) {
    setClipboard({ type, id: item.id, name: type === "lesson" ? item.title : item.name, mode: "copy" });
    setMenuFolder(null);
    setMenuLesson(null);
    setFolderMenuOpen(false);
  }

  function handleCut(item, type) {
    setClipboard({ type, id: item.id, name: type === "lesson" ? item.title : item.name, mode: "move" });
    setMenuFolder(null);
    setMenuLesson(null);
    setFolderMenuOpen(false);
  }

  async function pasteInto(targetFolderId) {
    if (!clip || pasting) return;
    setPasting(true);
    setError("");
    try {
      if (clip.mode === "move") {
        if (clip.type === "folder") {
          const all = await fetchAllFolders();
          if (invalidMoveTargets(all, clip.id).has(targetFolderId)) {
            throw new Error("Can't move a folder inside itself.");
          }
          await moveFolder(clip.id, targetFolderId);
        } else {
          await moveLesson(clip.id, targetFolderId);
        }
        clearClipboard();
        await load();
      } else {
        if (clip.type === "folder") {
          const copy = await copyFolderTo(clip.id, targetFolderId);
          if (targetFolderId === id) setSubfolders((prev) => [...(prev || []), copy]);
        } else {
          const copy = await copyLessonTo(clip.id, targetFolderId);
          if (targetFolderId === id) setLessons((prev) => [...(prev || []), copy]);
        }
      }
    } catch (e) {
      setError(e?.message || "Couldn't paste here.");
    } finally {
      setPasting(false);
    }
  }

  const trail = [
    { href: "/home", label: "Home" },
    ...ancestors.map((a) => ({ href: `/folder/${a.id}`, label: a.name })),
  ];

  return (
    <div className="min-h-screen pb-56 relative">
      <LiveBackground heartCount={7} /> <SaveToast status={saveStatus} />
      <Breadcrumbs trail={trail} isOwner={isOwner} onLogout={handleLogout} variant="premium" />

      <div className="max-w-2xl mx-auto px-4 pt-6">
        {folder && (
          <div className="relative rounded-2xl bg-white/40 backdrop-blur-md border border-white/55 shadow-[0_8px_20px_rgba(90,70,120,0.14),inset_0_1px_0_rgba(255,255,255,0.5)] p-4 mb-4 flex items-center gap-3">
            <span className="text-2xl" style={{ filter: "drop-shadow(0 2px 6px rgba(124,58,237,0.25))" }}>
              {folder.icon}
            </span>
            <h1 className="font-semibold text-lg text-[#3f3355] flex-1 min-w-0 truncate">{folder.name}</h1>
            {isOwner && (
              <button
                onClick={() => setFolderMenuOpen(true)}
                aria-label="Folder options"
                className="w-11 h-11 shrink-0 rounded-full bg-white/70 flex items-center justify-center text-violet-700 text-xl font-bold active:scale-90 transition"
              >
                ⋮
              </button>
            )}
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

        {/* ===== Notes: write directly inside this folder ===== */}
        {folder?.parent_id &&
          content !== null &&
          (isOwner ? (
            (showEditor || hasNotes) && (
              <div className="mb-5" ref={editorRef}>
                <div className="flex items-center justify-between px-1 mb-2">
                  <h2 className="text-xs uppercase tracking-wide text-[#6d5d8c]">Notes</h2>
                  <SaveStatus status={saveStatus} />
                </div>
                <LessonEditor key={id} content={content} onChange={handleEditorChange} />
              </div>
            )
          ) : (
            content.replace(/<[^>]*>/g, "").trim() && (
              <div
                className="lesson-content rounded-2xl p-5 mb-5"
                style={{ background: "#111113", border: "1px solid #242428" }}
                dangerouslySetInnerHTML={{ __html: content }}
              />
            )
          ))}

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
              {lessons.map((lesson, idx) => {
                const { icon: lessonIcon, rest: lessonText } = splitLeadingEmoji(lesson.title);
                return (
                  <li
                    key={lesson.id}
                    className="relative overflow-hidden bg-white/40 backdrop-blur-md border border-white/55 rounded-2xl shadow-[0_8px_20px_rgba(90,70,120,0.14),inset_0_1px_0_rgba(255,255,255,0.5)] px-4 py-3 flex items-center gap-2"
                  >
                    <button
                      onClick={() => router.push(`/lesson/${lesson.id}`)}
                      className="flex-1 flex items-center gap-2 min-w-0 text-left font-semibold text-sm text-[#3f3355]"
                    >
                      {lessonIcon && <span className="text-2xl leading-none shrink-0">{lessonIcon}</span>}
                      <span className="truncate">{lessonText}</span>
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
                );
              })}
            </ul>
            {/* Extra breathing room so the last lesson's ↑↓⋮ buttons aren't
                covered by the floating action buttons at the bottom. */}
            {isOwner && <div className="h-32" />}
          </div>
        )}

        {subfolders && lessons && subfolders.length === 0 && lessons.length === 0 && !(isOwner && showEditor) && !(isOwner && hasNotes) && (
          <EmptyState
            emoji="📄"
            title="Nothing here yet"
            subtitle={isOwner ? "Add a sub-folder or a lesson to get started" : "Check back soon"}
          />
        )}
      </div>

      {isOwner && (
        <div className="fixed bottom-6 right-6 sm:right-1/2 sm:translate-x-[calc(18rem)] flex flex-col gap-2 items-end">
          {clip && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => pasteInto(id)}
                disabled={pasting}
                className="text-violet-700 bg-white/90 backdrop-blur rounded-full pl-4 pr-3 py-2.5 text-xs font-medium active:scale-95 transition shadow-[0_0_0_1px_rgba(255,255,255,0.4)_inset,0_8px_20px_rgba(90,70,120,0.25)] disabled:opacity-50 max-w-[13rem] truncate"
              >
                {pasting ? "Working…" : clip.mode === "move" ? `✂️ Move "${clip.name}" here` : `📥 Paste "${clip.name}"`}
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
            onClick={() => setAddLessonOpen(true)}
            className="text-white rounded-full px-5 py-3 text-sm font-medium active:scale-95 transition
              bg-gradient-to-br from-sky-400 to-sky-600 shadow-[0_0_0_1px_rgba(255,255,255,0.25)_inset,0_8px_22px_rgba(2,132,199,0.4)]"
          >
            + New Lesson
          </button>
          {folder?.parent_id && (
            <button
              onClick={() => {
                setShowEditor(true);
                setTimeout(() => editorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 150);
              }}
              className="text-white rounded-full px-5 py-3 text-sm font-medium active:scale-95 transition
                bg-gradient-to-br from-violet-400 to-violet-600 shadow-[0_0_0_1px_rgba(255,255,255,0.25)_inset,0_8px_22px_rgba(124,58,237,0.4)]"
            >
              + Rich Text Editor
            </button>
          )}
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
        onCreate={async (title) => {
          const created = await createLesson({ folderId: id, title, color: autoColor(lessons?.length || 0) });
          setLessons((prev) => [...(prev || []), created]);
          setAddLessonOpen(false);
        }}
      />

      {/* Current folder's own menu (the folder you're viewing right now) */}
      <Modal
        open={folderMenuOpen && !editThisFolderOpen && !moveThisFolderOpen}
        onClose={() => setFolderMenuOpen(false)}
        title={folder?.name || ""}
      >
        <div className="space-y-2">
          <MenuButton label="✏️ Rename" onClick={() => setEditThisFolderOpen(true)} />
          <MenuButton label="📋 Copy" onClick={() => handleCopy(folder, "folder")} />
          <MenuButton label="✂️ Cut" onClick={() => handleCut(folder, "folder")} />
          <MenuButton label="➡️ Move to…" onClick={() => setMoveThisFolderOpen(true)} />
          {clip && (
            <MenuButton
              label={clip.mode === "move" ? `✂️ Move "${clip.name}" inside` : `📥 Paste "${clip.name}" inside`}
              onClick={async () => {
                await pasteInto(folder.id);
                setFolderMenuOpen(false);
              }}
            />
          )}
          <MenuButton
            label="🗑️ Delete this folder"
            danger
            onClick={() => {
              setConfirmDeleteThisFolder(true);
              setFolderMenuOpen(false);
            }}
          />
        </div>
      </Modal>

      <EditFolderModal
        open={editThisFolderOpen}
        folder={folder}
        onClose={() => {
          setEditThisFolderOpen(false);
          setFolderMenuOpen(false);
        }}
        onSave={async (patch) => {
          const updated = await updateFolder(folder.id, patch);
          setFolder(updated);
          setEditThisFolderOpen(false);
          setFolderMenuOpen(false);
        }}
      />

      <MoveFolderPicker
        open={moveThisFolderOpen}
        folder={folder}
        onClose={() => {
          setMoveThisFolderOpen(false);
          setFolderMenuOpen(false);
        }}
        onMoved={async () => {
          setMoveThisFolderOpen(false);
          setFolderMenuOpen(false);
          await load();
        }}
      />

      <ConfirmDialog
        open={confirmDeleteThisFolder}
        title="Delete this folder?"
        message={`"${folder?.name}" and everything inside it will be permanently deleted. This can't be undone.`}
        danger
        confirmLabel="Delete everything"
        onCancel={() => setConfirmDeleteThisFolder(false)}
        onConfirm={async () => {
          await deleteFolder(folder.id);
          setConfirmDeleteThisFolder(false);
          router.push(folder.parent_id ? `/folder/${folder.parent_id}` : "/home");
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
          <MenuButton label="✏️ Rename" onClick={() => setEditFolderOpen(true)} />
          <MenuButton label="📋 Copy" onClick={() => handleCopy(menuFolder, "folder")} />
          <MenuButton label="✂️ Cut" onClick={() => handleCut(menuFolder, "folder")} />
          <MenuButton
            label="📄 Duplicate"
            onClick={async () => {
              const copy = await duplicateFolder(menuFolder.id);
              setSubfolders((prev) => [...(prev || []), copy]);
              setMenuFolder(null);
            }}
          />
          <MenuButton label="➡️ Move to…" onClick={() => setMoveFolderOpen(true)} />
          {clip && (
            <MenuButton
              label={clip.mode === "move" ? `✂️ Move "${clip.name}" inside` : `📥 Paste "${clip.name}" inside`}
              onClick={async () => {
                await pasteInto(menuFolder.id);
                setMenuFolder(null);
              }}
            />
          )}
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
          <MenuButton label="✏️ Rename" onClick={() => setRenameLessonOpen(true)} />
          <MenuButton label="📋 Copy" onClick={() => handleCopy(menuLesson, "lesson")} />
          <MenuButton label="✂️ Cut" onClick={() => handleCut(menuLesson, "lesson")} />
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
        onSave={async (title) => {
          const updated = await updateLessonMeta(menuLesson.id, { title, color: menuLesson.color });
          setLessons((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
          setRenameLessonOpen(false);
          setMenuLesson(null);
        }}
      />

      <FolderPickerModal
        open={moveLessonOpen}
        allowRoot={false}
        title="Move lesson to…"
        currentId={menuLesson?.folder_id}
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
  }, [open]);

  async function submit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      await onCreate({ name: name.trim(), color: autoColor(existingCount), icon });
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
      await onSave({ name: name.trim(), color: folder.color, icon });
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setTitle("");
      setError("");
    }
  }, [open]);

  async function submit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError("");
    try {
      await onCreate(title.trim());
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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (lesson) {
      setTitle(lesson.title);
    }
  }, [lesson]);

  if (!lesson) return null;

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(title.trim());
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
