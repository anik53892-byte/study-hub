"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { searchEverything } from "@/lib/db";
import Breadcrumbs from "@/components/Breadcrumbs";
import { EmptyState } from "@/components/EmptyState";
import { useRequireAuth } from "@/lib/useRequireAuth";

export default function SearchPage() {
  useRequireAuth();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  async function runSearch(e) {
    e?.preventDefault();
    if (!q.trim()) return setResults(null);
    setLoading(true);
    try {
      const r = await searchEverything(q);
      setResults(r);
    } finally {
      setLoading(false);
    }
  }

  const empty =
    results && results.folders.length === 0 && results.items.length === 0 && results.lessons.length === 0;

  return (
    <div className="min-h-screen pb-16">
      <Breadcrumbs trail={[{ href: "/home", label: "Home" }, { href: "/search", label: "Search" }]} />

      <div className="max-w-2xl mx-auto px-4 pt-6">
        <form onSubmit={runSearch} className="flex gap-2 mb-6">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search folders, items, lessons…"
            className="flex-1 rounded-xl border border-violet-100 bg-violet-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-300"
          />
          <button className="rounded-xl bg-violet-500 text-white px-4 text-sm font-medium">
            {loading ? "…" : "Go"}
          </button>
        </form>

        {empty && <EmptyState emoji="🔍" title="No results" subtitle="Try a different search term" />}

        {results && results.folders.length > 0 && (
          <ResultSection title="Folders">
            {results.folders.map((f) => (
              <ResultRow key={f.id} label={f.name} onClick={() => router.push(`/folder/${f.id}`)} />
            ))}
          </ResultSection>
        )}

        {results && results.items.length > 0 && (
          <ResultSection title="Items">
            {results.items.map((i) => (
              <ResultRow key={i.id} label={i.name} onClick={() => router.push(`/lesson/${i.id}`)} />
            ))}
          </ResultSection>
        )}

        {results && results.lessons.length > 0 && (
          <ResultSection title="Lesson content">
            {results.lessons.map((l) => (
              <ResultRow
                key={l.id}
                label={l.title || "Untitled lesson"}
                sub={l.content_text?.slice(0, 80)}
                onClick={() => router.push(`/lesson/${l.item_id}`)}
              />
            ))}
          </ResultSection>
        )}
      </div>
    </div>
  );
}

function ResultSection({ title, children }) {
  return (
    <div className="mb-5">
      <h2 className="text-xs uppercase tracking-wide text-ink/40 mb-2 px-1">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function ResultRow({ label, sub, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl shadow-sm px-4 py-3 text-sm"
    >
      <div className="font-medium truncate">{label}</div>
      {sub && <div className="text-xs text-ink/40 truncate mt-0.5">{sub}</div>}
    </button>
  );
}
