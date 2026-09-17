"use client";

import { useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";

// Calls `onChange` whenever any row in the given tables changes.
// Pass a `skip` function if you need to ignore updates at certain moments
// (e.g. while the admin is actively typing in the lesson editor).
export function useRealtimeRefresh(tables, onChange, skip) {
  const skipRef = useRef(skip);
  skipRef.current = skip;

  useEffect(() => {
    const channel = supabase.channel(`rt-${tables.join("-")}-${Math.random().toString(36).slice(2)}`);
    tables.forEach((table) => {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, () => {
        if (!skipRef.current || !skipRef.current()) onChange();
      });
    });
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tables.join(",")]);
}
