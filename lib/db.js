"use client";

import { supabase } from "./supabaseClient";

export async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user?.id ?? null;
}

// FOLDERS ---------------------------------------------------------------

export async function fetchFolders() {
  const { data, error } = await supabase
    .from("folders")
    .select("*")
    .order("position", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createFolder({ name, color, icon }) {
  const owner_id = await getCurrentUserId();
  const { data: existing } = await supabase
    .from("folders")
    .select("position")
    .order("position", { ascending: false })
    .limit(1);
  const position = existing?.[0]?.position != null ? existing[0].position + 1 : 0;

  const { data, error } = await supabase
    .from("folders")
    .insert({ owner_id, name, color, icon, position })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateFolder(id, patch) {
  const { data, error } = await supabase
    .from("folders")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteFolder(id) {
  const { error } = await supabase.from("folders").delete().eq("id", id);
  if (error) throw error;
}

export async function reorderFolders(orderedIds) {
  await Promise.all(
    orderedIds.map((id, position) =>
      supabase.from("folders").update({ position }).eq("id", id)
    )
  );
}

export async function fetchFolder(id) {
  const { data, error } = await supabase.from("folders").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

// ITEMS -------------------------------------------------------------------

export async function fetchItems(folderId) {
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("folder_id", folderId)
    .order("position", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createItem({ folderId, name }) {
  const owner_id = await getCurrentUserId();
  const { data: existing } = await supabase
    .from("items")
    .select("position")
    .eq("folder_id", folderId)
    .order("position", { ascending: false })
    .limit(1);
  const position = existing?.[0]?.position != null ? existing[0].position + 1 : 0;

  const { data: item, error } = await supabase
    .from("items")
    .insert({ owner_id, folder_id: folderId, name, position })
    .select()
    .single();
  if (error) throw error;

  const { error: lessonError } = await supabase
    .from("lessons")
    .insert({ owner_id, item_id: item.id, title: name, content: "", content_text: "" });
  if (lessonError) throw lessonError;

  return item;
}

export async function updateItem(id, patch) {
  const { data, error } = await supabase
    .from("items")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteItem(id) {
  const { error } = await supabase.from("items").delete().eq("id", id);
  if (error) throw error;
}

export async function reorderItems(orderedIds) {
  await Promise.all(
    orderedIds.map((id, position) =>
      supabase.from("items").update({ position }).eq("id", id)
    )
  );
}

export async function fetchItem(id) {
  const { data, error } = await supabase.from("items").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

// LESSONS -------------------------------------------------------------------

export async function fetchLessonByItem(itemId) {
  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("item_id", itemId)
    .single();
  if (error) throw error;
  return data;
}

export async function saveLesson(id, { title, content, content_text }) {
  const { data, error } = await supabase
    .from("lessons")
    .update({ title, content, content_text })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// SEARCH -------------------------------------------------------------------

export async function searchEverything(query) {
  const q = query.trim();
  if (!q) return { folders: [], items: [], lessons: [] };

  const [folders, items, lessons] = await Promise.all([
    supabase.from("folders").select("*").ilike("name", `%${q}%`),
    supabase.from("items").select("*").ilike("name", `%${q}%`),
    supabase
      .from("lessons")
      .select("id, item_id, title, content_text")
      .or(`title.ilike.%${q}%,content_text.ilike.%${q}%`),
  ]);

  if (folders.error) throw folders.error;
  if (items.error) throw items.error;
  if (lessons.error) throw lessons.error;

  return { folders: folders.data, items: items.data, lessons: lessons.data };
  }
