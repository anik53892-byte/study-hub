"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabaseClient";
import { fetchLesson, fetchAncestors, saveLessonContent } from "@/lib/db";
import { withRetry } from "@/lib/retry";
import { useRealtimeRefresh } from "@/lib/useRealtimeRefresh";
import { useAuth } from "@/lib/useAuth";
import Breadcrumbs from "@/components/Breadcrumbs";
import SaveStatus from "@/components/SaveStatus";
import { ListSkeleton } from "@/components/EmptyState";

const LessonEditor = dynamic(
  () => import("@/components/LessonEditor"),
  { ssr: false }
);

const AUTOSAVE_DELAY_MS = 1500;

/* =========================
   PURE DARK READING THEME
   ========================= */

const READING_BG = "#0B0B0D";
const READING_CARD = "#111113";
const READING_BORDER = "#242428";
const TEXT_PRIMARY = "#FFFFFF";
const TEXT_SECONDARY = "#B8B8C0";
const ACCENT = "#8B7CFF";

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

  /* =========================
     LOAD LESSON
     ========================= */

  useEffect(() => {
    setLesson(null);
    dirtyRef.current = null;
    setEditing(false);

    load();

    return () => clearTimeout(timerRef.current);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  useRealtimeRefresh(
    ["lessons"],
    load,
    () => editingRef.current && !!dirtyRef.current
  );

  async function load() {
    try {
      setLoadError("");

      const l = await withRetry(() => fetchLesson(lessonId));
      const anc = await withRetry(() => fetchAncestors(l.folder_id));

      setLesson(l);
      setAncestors(anc);
    } catch {
      setLoadError(
        "Couldn't load this lesson. Check your connection."
      );
    }
  }

  /* =========================
     SAVE
     ========================= */

  const doSave = useCallback(async () => {
    if (!dirtyRef.current || !lesson) return;

    const payload = dirtyRef.current;

    setStatus("saving");

    try {
      const updated = await saveLessonContent(
        lesson.id,
        payload
      );

      setLesson(updated);
      dirtyRef.current = null;
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }, [lesson]);

  function handleChange(html, text) {
    dirtyRef.current = {
      content: html,
      content_text: text,
    };

    setStatus("saving");

    clearTimeout(timerRef.current);

    timerRef.current = setTimeout(
      doSave,
      AUTOSAVE_DELAY_MS
    );
  }

  async function handleManualSave() {
    clearTimeout(timerRef.current);
    await doSave();
  }

  /* =========================
     PREVENT DATA LOSS
     ========================= */

  useEffect(() => {
    function beforeUnload(e) {
      if (dirtyRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    }

    window.addEventListener(
      "beforeunload",
      beforeUnload
    );

    return () =>
      window.removeEventListener(
        "beforeunload",
        beforeUnload
      );
  }, []);

  /* =========================
     LOGOUT
     ========================= */

  async function handleLogout() {
    if (dirtyRef.current) {
      await doSave();
    }

    await supabase.auth.signOut();
    router.refresh();
  }

  /* =========================
     EXIT EDITING
     ========================= */

  async function exitEditing() {
    if (dirtyRef.current) {
      await doSave();
    }

    setEditing(false);
  }

  /* =========================
     ERROR SCREEN
     ========================= */

  if (loadError) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6"
        style={{
          background: READING_BG,
          color: TEXT_PRIMARY,
        }}
      >
        <p
          className="text-sm"
          style={{ color: "#FF7B8A" }}
        >
          {loadError}
        </p>
      </div>
    );
  }

  /* =========================
     LOADING SCREEN
     ========================= */

  if (!lesson) {
    return (
      <div
        className="min-h-screen pt-20"
        style={{
          background: READING_BG,
        }}
      >
        <ListSkeleton />
      </div>
    );
  }

  /* =========================
     BREADCRUMB
     ========================= */

  const trail = [
    {
      href: "/home",
      label: "Home",
    },

    ...ancestors.map((a) => ({
      href: `/folder/${a.id}`,
      label: a.name,
    })),

    {
      href: `/lesson/${lesson.id}`,
      label: lesson.title,
    },
  ];

  /* =========================
     MAIN
     ========================= */

  return (
    <div
      className="min-h-screen pb-16"
      style={{
        background: READING_BG,
        color: TEXT_PRIMARY,
      }}
    >
      {/* =========================
          BREADCRUMBS
         ========================= */}

      <Breadcrumbs
        trail={trail}
        isOwner={isOwner}
        onLogout={handleLogout}
        variant="premium"
      />

      {/* =========================
          TITLE + ACTIONS
         ========================= */}

      <div className="max-w-2xl mx-auto px-4 pt-4 flex items-center justify-between">
        <h1
          className="text-lg font-semibold truncate pr-3"
          style={{
            color: TEXT_PRIMARY,
          }}
        >
          {lesson.title}
        </h1>

        {isOwner && (
          <div className="flex items-center gap-3 shrink-0">
            {editing && (
              <SaveStatus status={status} />
            )}

            {editing ? (
              <button
                onClick={exitEditing}
                className="text-sm font-medium px-4 py-2 rounded-xl"
                style={{
                  background: ACCENT,
                  color: "#FFFFFF",
                }}
              >
                Done
              </button>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="text-sm font-medium px-4 py-2 rounded-xl"
                style={{
                  background: "#18181C",
                  border: `1px solid ${READING_BORDER}`,
                  color: "#BDB4FF",
                }}
              >
                ✏️ Edit
              </button>
            )}
          </div>
        )}
      </div>

      {/* =========================
          LESSON AREA
         ========================= */}

      <div className="max-w-2xl mx-auto px-4 mt-4">
        {editing ? (
          <>
            <LessonEditor
              key={lesson.id}
              content={lesson.content}
              onChange={handleChange}
            />

            <button
              onClick={handleManualSave}
              className="mt-4 w-full rounded-xl py-3 text-sm font-medium"
              style={{
                background: ACCENT,
                color: "#FFFFFF",
              }}
            >
              Save now
            </button>
          </>
        ) : lesson.content ? (
          <div
            key={lesson.id}
            className="lesson-content rounded-2xl p-5 sm:p-6"
            style={{
              background: READING_CARD,
              border: `1px solid ${READING_BORDER}`,
              color: TEXT_PRIMARY,

              /*
               * Very soft shadow.
               * Pure black reading background-এর উপর
               * card যেন অতিরিক্ত উজ্জ্বল না লাগে।
               */
              boxShadow:
                "0 8px 30px rgba(0, 0, 0, 0.35)",
            }}
            dangerouslySetInnerHTML={{
              __html: lesson.content,
            }}
          />
        ) : (
          <div
            className="text-center py-16"
            style={{
              color: TEXT_SECONDARY,
            }}
          >
            <p className="mb-4">
              No content yet
              {isOwner
                ? " — start writing your lesson."
                : "."}
            </p>

            {isOwner && (
              <button
                onClick={() => setEditing(true)}
                className="px-5 py-3 rounded-xl text-sm font-medium"
                style={{
                  background: ACCENT,
                  color: "#FFFFFF",
                }}
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
