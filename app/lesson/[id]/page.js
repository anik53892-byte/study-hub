"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabaseClient";
import { fetchItem, fetchFolder, fetchLessonByItem, saveLesson } from "@/lib/db";
import Breadcrumbs from "@/components/Breadcrumbs";
import SaveStatus from "@/components/SaveStatus";
import { ListSkeleton } from "@/components/EmptyState";
import { useRequireAuth } from "@/lib/useRequireAuth";

const LessonEditor = dynamic(() => import("@/components/LessonEditor"), { ssr: false });

const AUTOSAVE_DELAY_MS = 1500;

export default function LessonPage() {
  useRequireAuth();
  const { id: itemId } = useParams();
  const router = useRouter();

  const [folder, setFolder] = useState(null);
  const [item, setItem] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState("idle");
  const [loadError, setLoadError] = useState("");

  const dirtyRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    load();
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  async function load() {
    try {
      setLoadError("");
      const it = await fetchItem(itemId);
      const [f, l] = await Promise.all([fetchFolder(it.folder_id), fetchLessonByItem(itemId)]);
      setItem(it);
      setFolder(f);
      setLesson(l);
    } catch {
      setLoadError("Couldn't load this lesson. Check your connection.");
    }
  }

  const doSave = useCallback(async () => {
    if (!dirtyRef.current || !lesson) return;
    const payload = dirtyRef.current;
    setStatus("saving");
    try {
      const updated = await saveLesson(lesson.id, {
        title: item.name,
        content: payload.content,
        content_text: payload.content_text,
      });
      setLesson(updated);
      dirtyRef.current = null;
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }, [lesson, item]);

  function handleChange(html, text) {
    dirtyRef.current = { content: html, content_text: text };
    setStatus("saving");
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(doSave, AUTOSAVE_DELAY_MS);
  }

  async function handleManualSave() {
    clearTimeout(timerRef.current);
    await doSave();
  }

  useEffect(() => {
    function beforeUnload(e) {
      if (dirtyRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, []);

  async function handleLogout() {
    if (dirtyRef.current) await doSave();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  async function exitEditing() {
    if (dirtyRef.current) await doSave();
    setEditing(false);
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <p className="text-sm text-rose-500">{loadError}</p>
      </div>
    );
  }

  if (!item || !folder || !lesson) {
    return (
      <div className="min-h-screen pt-20">
        <ListSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      <Breadcrumbs
        trail={[
          { href: "/home", label: "Home" },
          { href: `/folder/${folder.id}`, label: folder.name },
          { href: `/lesson/${item.id}`, label: item.name },
        ]}
        onLogout={handleLogout}
      />

      <div className="max-w-2xl mx-auto px-4 pt-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold truncate pr-3">{item.name}</h1>
        <div className="flex items-center gap-3 shrink-0">
          {editing && <SaveStatus status={status} />}
          {editing ? (
            <button
              onClick={exitEditing}
              className="text-sm font-medium bg-violet-500 text-white px-4 py-2 rounded-xl"
            >
              Done
            </button>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="text-sm font-medium bg-violet-50 text-violet-600 px-4 py-2 rounded-xl"
            >
              ✏️ Edit
            </button>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-4">
        {editing ? (
          <>
            <LessonEditor content={lesson.content} onChange={handleChange} />
            <button
              onClick={handleManualSave}
              className="mt-4 w-full rounded-xl bg-violet-500 text-white py-3 text-sm font-medium"
            >
              Save now
            </button>
          </>
        ) : lesson.content ? (
          <div
            className="lesson-content bg-white rounded-2xl shadow-sm p-5"
            dangerouslySetInnerHTML={{ __html: lesson.content }}
          />
        ) : (
          <div className="text-center py-16 text-ink/50">
            <p className="mb-4">No content yet — start writing your lesson.</p>
            <button
              onClick={() => setEditing(true)}
              className="bg-violet-500 text-white px-5 py-3 rounded-xl text-sm font-medium"
            >
              Start writing
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
