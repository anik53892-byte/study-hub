"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabaseClient";
import { fetchLesson, fetchAncestors, saveLessonContent } from "@/lib/db";
import { withRetry } from "@/lib/retry";
import { useRealtimeRefresh } from "@/lib/useRealtimeRefresh";
import { colorFor } from "@/lib/colors";
import { useAuth } from "@/lib/useAuth";
import Breadcrumbs from "@/components/Breadcrumbs";
import PremiumBackground from "@/components/PremiumBackground";
import SaveStatus from "@/components/SaveStatus";
import { ListSkeleton } from "@/components/EmptyState";

const LessonEditor = dynamic(() => import("@/components/LessonEditor"), { ssr: false });

const AUTOSAVE_DELAY_MS = 1500;

export default function LessonPage() {
  const { id: lessonId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const isOwner = !!user;

  const [lesson, setLesson] = useState(null);
  const [ancestors, setAncestors] = useState([]);
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState("idle");
  const [loadError, setLoadError] = useState("");

  const dirtyRef = useRef(null);
  const timerRef = useRef(null);
  const editingRef = useRef(false);
  editingRef.current = editing;

  useEffect(() => {
    setLesson(null);
    dirtyRef.current = null;
    setEditing(false);
    load();
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  useRealtimeRefresh(["lessons"], load, () => editingRef.current && !!dirtyRef.current);

  async function load() {
    try {
      setLoadError("");
      const l = await withRetry(() => fetchLesson(lessonId));
      const anc = await withRetry(() => fetchAncestors(l.folder_id));
      setLesson(l);
      setAncestors(anc);
    } catch {
      setLoadError("Couldn't load this lesson. Check your connection.");
    }
  }

  const doSave = useCallback(async () => {
    if (!dirtyRef.current || !lesson) return;
    const payload = dirtyRef.current;
    setStatus("saving");
    try {
      const updated = await saveLessonContent(lesson.id, payload);
      setLesson(updated);
      dirtyRef.current = null;
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }, [lesson]);

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
    router.refresh();
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

  if (!lesson) {
    return (
      <div className="min-h-screen pt-20">
        <ListSkeleton />
      </div>
    );
  }

  const lc = colorFor(lesson.color);
  const trail = [
    { href: "/home", label: "Home" },
    ...ancestors.map((a) => ({ href: `/folder/${a.id}`, label: a.name })),
    { href: `/lesson/${lesson.id}`, label: lesson.title },
  ];

  return (
    <div className="min-h-screen pb-16 relative">
      <PremiumBackground />
      <div className={`fixed inset-0 -z-10 ${lc.bg}`} />
      <Breadcrumbs trail={trail} isOwner={isOwner} onLogout={handleLogout} variant="premium" />

      <div className="max-w-2xl mx-auto px-4 pt-4 flex items-center justify-between">
        <h1 className={`text-lg font-semibold truncate pr-3 ${lc.text}`}>{lesson.title}</h1>
        {isOwner && (
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
                className="text-sm font-medium bg-white/70 text-violet-600 px-4 py-2 rounded-xl"
              >
                ✏️ Edit
              </button>
            )}
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-4">
        {editing ? (
          <>
            <LessonEditor key={lesson.id} content={lesson.content} onChange={handleChange} />
            <button
              onClick={handleManualSave}
              className="mt-4 w-full rounded-xl bg-violet-500 text-white py-3 text-sm font-medium"
            >
              Save now
            </button>
          </>
        ) : lesson.content ? (
          <div
            key={lesson.id}
            className="lesson-content bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm p-5"
            dangerouslySetInnerHTML={{ __html: lesson.content }}
          />
        ) : (
          <div className={`text-center py-16 ${lc.text}/70`}>
            <p className="mb-4">No content yet{isOwner ? " — start writing your lesson." : "."}</p>
            {isOwner && (
              <button
                onClick={() => setEditing(true)}
                className="bg-violet-500 text-white px-5 py-3 rounded-xl text-sm font-medium"
              >
                Start writing
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
