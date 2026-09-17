"use client";

import { supabase } from "./supabaseClient";

/* Public visitors can read everything (RLS "select using (true)").
 * Only a signed-in user (the owner) can insert/update/delete — enforced by RLS. */

export async function getCurrentUserId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

async function nextPosition(table, column, value) {
  let q = supabase.from(table).select("position").order("position", { ascending: false }).limit(1);
  q = value === null || value === undefined ? q.is(column, null) : q.eq(column, value);
  const { data } = await q;
  return data?.[0]?.position != null ? data[0].position + 1 : 0;
}

// FOLDERS ---------------------------------------------------------------

export async function fetchFolders(parentId) {
  let query = supabase.from("folders").select("*").order("position", { ascending: true });
  query = parentId ? query.eq("parent_id", parentId) : query.is("parent_id", null);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Number of direct children (sub-folders + lessons) inside a folder — shown as a badge on its card.
export async function fetchFolderItemCounts(folderIds) {
  if (!folderIds.length) return {};
  const [{ data: subfolders }, { data: lessons }] = await Promise.all([
    supabase.from("folders").select("parent_id").in("parent_id", folderIds),
    supabase.from("lessons").select("folder_id").in("folder_id", folderIds),
  ]);
  const counts = Object.fromEntries(folderIds.map((id) => [id, 0]));
  (subfolders || []).forEach((f) => { counts[f.parent_id] = (counts[f.parent_id] || 0) + 1; });
  (lessons || []).forEach((l) => { counts[l.folder_id] = (counts[l.folder_id] || 0) + 1; });
  return counts;
}

// Every folder, flat — used by the "move to…" picker.
export async function fetchAllFolders() {
  const { data, error } = await supabase.from("folders").select("*").order("name", { ascending: true });
  if (error) throw error;
  return data;
}

export async function fetchFolder(id) {
  const { data, error } = await supabase.from("folders").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

// Returns [root, ..., parent-of-current] ancestor chain for breadcrumbs.
export async function fetchAncestors(folderId) {
  const chain = [];
  let currentId = folderId;
  while (currentId) {
    const folder = await fetchFolder(currentId);
    chain.unshift(folder);
    currentId = folder.parent_id;
  }
  return chain;
}

export async function createFolder({ name, color, icon, parentId }) {
  const owner_id = await getCurrentUserId();
  const position = await nextPosition("folders", "parent_id", parentId || null);
  const { data, error } = await supabase
    .from("folders")
    .insert({ owner_id, name, color, icon, position, parent_id: parentId || null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateFolder(id, patch) {
  const { data, error } = await supabase.from("folders").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteFolder(id) {
  const { error } = await supabase.from("folders").delete().eq("id", id);
  if (error) throw error;
}

export async function reorderFolders(orderedIds) {
  await Promise.all(orderedIds.map((id, position) => supabase.from("folders").update({ position }).eq("id", id)));
}

// Moves a folder under a new parent (null = top level / Home).
export async function moveFolder(folderId, newParentId) {
  const position = await nextPosition("folders", "parent_id", newParentId || null);
  const { error } = await supabase
    .from("folders")
    .update({ parent_id: newParentId || null, position })
    .eq("id", folderId);
  if (error) throw error;
}

// A folder cannot be moved into itself or into one of its own descendants.
// Returns the set of folder ids that are invalid drop targets for `folderId`.
export function invalidMoveTargets(allFolders, folderId) {
  const excluded = new Set([folderId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const f of allFolders) {
      if (f.parent_id && excluded.has(f.parent_id) && !excluded.has(f.id)) {
        excluded.add(f.id);
        changed = true;
      }
    }
  }
  return excluded;
}

// Recursively duplicates a folder (and everything inside it) as a sibling.
export async function duplicateFolder(folderId) {
  const owner_id = await getCurrentUserId();
  const original = await fetchFolder(folderId);

  async function clone(sourceId, newParentId, isTopClone) {
    const source = await fetchFolder(sourceId);
    const position = await nextPosition("folders", "parent_id", newParentId || null);
    const { data: newFolder, error } = await supabase
      .from("folders")
      .insert({
        owner_id,
        parent_id: newParentId || null,
        name: isTopClone ? `${source.name} (Copy)` : source.name,
        color: source.color,
        icon: source.icon,
        position,
      })
      .select()
      .single();
    if (error) throw error;

    const [childFolders, childLessons] = await Promise.all([fetchFolders(sourceId), fetchLessons(sourceId)]);

    for (const cf of childFolders) {
      await clone(cf.id, newFolder.id, false);
    }
    for (const cl of childLessons) {
      const lp = await nextPosition("lessons", "folder_id", newFolder.id);
      await supabase.from("lessons").insert({
        owner_id,
        folder_id: newFolder.id,
        title: cl.title,
        content: cl.content,
        content_text: cl.content_text,
        color: cl.color,
        position: lp,
      });
    }
    return newFolder;
  }

  return clone(folderId, original.parent_id, true);
}

// LESSONS -------------------------------------------------------------------

export async function fetchLessons(folderId) {
  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("folder_id", folderId)
    .order("position", { ascending: true });
  if (error) throw error;
  return data;
}

export async function fetchLesson(id) {
  const { data, error } = await supabase.from("lessons").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function createLesson({ folderId, title, color }) {
  const owner_id = await getCurrentUserId();
  const position = await nextPosition("lessons", "folder_id", folderId);
  const { data, error } = await supabase
    .from("lessons")
    .insert({ owner_id, folder_id: folderId, title, color, content: "", content_text: "", position })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateLessonMeta(id, patch) {
  const { data, error } = await supabase.from("lessons").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function saveLessonContent(id, { content, content_text }) {
  const { data, error } = await supabase
    .from("lessons")
    .update({ content, content_text })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteLesson(id) {
  const { error } = await supabase.from("lessons").delete().eq("id", id);
  if (error) throw error;
}

export async function reorderLessons(orderedIds) {
  await Promise.all(orderedIds.map((id, position) => supabase.from("lessons").update({ position }).eq("id", id)));
}

export async function moveLesson(lessonId, newFolderId) {
  const position = await nextPosition("lessons", "folder_id", newFolderId);
  const { error } = await supabase.from("lessons").update({ folder_id: newFolderId, position }).eq("id", lessonId);
  if (error) throw error;
}

export async function duplicateLesson(lessonId) {
  const owner_id = await getCurrentUserId();
  const lesson = await fetchLesson(lessonId);
  const position = await nextPosition("lessons", "folder_id", lesson.folder_id);
  const { data, error } = await supabase
    .from("lessons")
    .insert({
      owner_id,
      folder_id: lesson.folder_id,
      title: `${lesson.title} (Copy)`,
      content: lesson.content,
      content_text: lesson.content_text,
      color: lesson.color,
      position,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// SEARCH -------------------------------------------------------------------

export async function searchEverything(query) {
  const q = query.trim();
  if (!q) return { folders: [], lessons: [] };

  const [folders, lessons] = await Promise.all([
    supabase.from("folders").select("*").ilike("name", `%${q}%`),
    supabase
      .from("lessons")
      .select("id, folder_id, title, content_text")
      .or(`title.ilike.%${q}%,content_text.ilike.%${q}%`),
  ]);

  if (folders.error) throw folders.error;
  if (lessons.error) throw lessons.error;
  return { folders: folders.data, lessons: lessons.data };
}
