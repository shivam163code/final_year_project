"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/layout/dashboard-header";
import DashboardSidebar from "@/components/layout/dashboard-sidebar";
import type { Paper } from "@/features/papers/paper.types";

export default function SavedPage() {
  const router = useRouter();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/saved")
      .then(async (response) => {
        const body = await response.json() as { papers?: Paper[]; error?: string };
        if (response.status === 401) { router.replace("/login"); return; }
        if (!response.ok) throw new Error(body.error ?? "Unable to load saved papers.");
        if (active) { setPapers(body.papers ?? []); setError(null); }
      })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Unable to load saved papers."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [router]);

  const removePaper = async (paper: Paper) => {
    if (!window.confirm(`Remove "${paper.title}" from saved papers?`)) return;
    setRemovingId(paper.id);
    setError(null);
    try {
      const response = await fetch(`/api/saved/${encodeURIComponent(paper.id)}`, { method: "DELETE" });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Unable to remove saved paper.");
      setPapers((current) => current.filter((savedPaper) => savedPaper.id !== paper.id));
      setSuccess("Paper removed from saved papers.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to remove saved paper.");
    } finally {
      setRemovingId(null);
    }
  };

  return <div className="dashboard-layout"><DashboardSidebar /><main className="dashboard-main !max-w-none"><DashboardHeader title="Saved Papers" />
    {error && <p className="mt-6 max-w-5xl rounded-md bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{error}</p>}
    {success && <p className="mt-6 max-w-5xl rounded-md bg-[var(--mint)] px-4 py-3 text-sm text-[var(--navy)]" role="status">{success}</p>}
    {loading ? <section className="mt-10 max-w-5xl rounded-lg border border-[var(--line)] bg-white p-8 text-center"><p className="text-sm text-[var(--muted)]">Loading saved papers...</p></section> : papers.length === 0 ? <section className="mt-10 max-w-2xl rounded-lg border border-dashed border-[var(--line)] bg-white p-8 text-center"><span className="text-3xl text-[var(--teal)]" aria-hidden="true">♡</span><h2 className="!mb-2 !mt-3 !text-2xl !tracking-tight">Your reading list starts here.</h2><p className="mx-auto max-w-md text-sm leading-6 text-[var(--muted)]">Save papers from Explore Papers to keep their metadata and abstracts available for later.</p><Link className="mt-5 inline-flex rounded-md bg-[var(--navy)] px-4 py-2.5 text-xs font-bold text-white hover:bg-[var(--teal)]" href="/papers">Explore papers</Link></section> : <section className="mt-10 grid max-w-5xl gap-4 sm:grid-cols-2" aria-label="Saved papers">{papers.map((paper) => <SavedPaperCard key={paper.id} paper={paper} removing={removingId === paper.id} onRemove={removePaper} />)}</section>}
  </main></div>;
}

function SavedPaperCard({ paper, removing, onRemove }: { paper: Paper; removing: boolean; onRemove: (paper: Paper) => Promise<void> }) {
  const source = paper.doi ?? paper.sourceUrl;
  return <article className="flex h-full flex-col rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm"><div className="mb-3 flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-[.12em] text-[var(--teal)]"><span>{paper.publicationYear ?? "Year unavailable"}</span><span>{paper.citationCount.toLocaleString()} citations</span></div><h2 className="!mb-3 !text-xl !leading-6 !tracking-tight">{paper.title}</h2><p className="mb-2 text-xs font-bold leading-5 text-[var(--navy)]">{paper.authors.length ? paper.authors.join(", ") : "Authors unavailable"}</p>{paper.sourceName && <p className="mb-3 text-xs leading-5 text-[var(--muted)]"><span className="font-bold text-[var(--navy)]">Source:</span> {paper.sourceName}</p>}<p className="mb-5 line-clamp-4 text-sm leading-6 text-[var(--muted)]">{paper.abstract ?? "Abstract unavailable for this work."}</p><div className="mt-auto flex flex-wrap items-center gap-4 border-t border-[var(--line)] pt-4">{source && <a className="text-xs font-bold text-[var(--teal)] hover:underline" href={source} target="_blank" rel="noopener noreferrer">Open paper ↗</a>}<button className="text-xs font-bold text-red-700 hover:underline disabled:cursor-wait disabled:opacity-60" type="button" onClick={() => void onRemove(paper)} disabled={removing}>{removing ? "Removing..." : "Remove"}</button></div></article>;
}
