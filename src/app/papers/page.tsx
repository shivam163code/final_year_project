"use client";

import Link from "next/link";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Paper, PaperSearchResponse } from "@/features/papers/paper.types";

function PapersContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryFromUrl = searchParams.get("q")?.trim() ?? "";
  const pageFromUrl = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const [query, setQuery] = useState(queryFromUrl);
  const [results, setResults] = useState<PaperSearchResponse | null>(null);
  const [settledRequest, setSettledRequest] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savedLoading, setSavedLoading] = useState(true);
  const requestKey = `${queryFromUrl}:${pageFromUrl}`;
  const isLoading = Boolean(queryFromUrl) && settledRequest !== requestKey;

  useEffect(() => {
    fetch("/api/saved")
      .then(async (response) => {
        const body = await response.json() as { papers?: Paper[] };
        if (response.ok) setSavedIds(new Set((body.papers ?? []).map((paper) => paper.id)));
      })
      .catch(() => undefined)
      .finally(() => setSavedLoading(false));
  }, []);

  useEffect(() => {
    if (!queryFromUrl) {
      return;
    }

    const controller = new AbortController();
    fetch(`/api/papers?q=${encodeURIComponent(queryFromUrl)}&page=${pageFromUrl}`, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json() as PaperSearchResponse & { error?: string };
        if (!response.ok) throw new Error(body.error ?? "Unable to search papers.");
        return body;
      })
      .then((body) => {
        setResults(body);
        setError(null);
        setSettledRequest(requestKey);
      })
      .catch((fetchError: unknown) => {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;
        setError(fetchError instanceof Error ? fetchError.message : "Unable to search papers.");
        setResults(null);
        setSettledRequest(requestKey);
      })

    return () => controller.abort();
  }, [pageFromUrl, queryFromUrl, requestKey, retryToken]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setError("Enter a research topic, title, or question to search.");
      setResults(null);
      return;
    }
    setSettledRequest(null);
    setError(null);
    router.push(`${pathname}?q=${encodeURIComponent(trimmedQuery)}`);
  };

  const changePage = (page: number) => router.push(`${pathname}?q=${encodeURIComponent(queryFromUrl)}&page=${page}`);
  const retrySearch = () => {
    setSettledRequest(null);
    setError(null);
    setRetryToken((token) => token + 1);
  };

  return <div className="dashboard-layout"><aside className="dashboard-sidebar"><Link className="dashboard-brand" href="/"><span className="brand-mark" aria-hidden="true">R</span> Research<span className="brand-accent">Lens</span></Link><nav aria-label="Dashboard navigation"><Link href="/dashboard">Dashboard</Link><Link className="current" href="/papers">Explore Papers</Link><Link href="/recommendations">Recommendations</Link><Link href="/literature">Literature Review</Link><Link href="/saved">Saved Papers</Link></nav><Link className="sidebar-home" href="/">Back to home</Link></aside><main className="dashboard-main"><header className="dashboard-header"><div><p className="dashboard-kicker">Research workspace</p><h1>Explore Papers</h1></div><Link className="dashboard-account" href="/login">Sign in</Link></header><section className="papers-search-panel"><p className="dashboard-kicker">OpenAlex paper discovery</p><h2>Find the thread worth following.</h2><p>Search real scholarly works indexed by OpenAlex. Results are fetched through the ResearchLens server.</p><form className="papers-search-form" onSubmit={submitSearch}><label className="sr-only" htmlFor="paper-query">Search papers</label><input id="paper-query" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by topic, title, or question..." /><button type="submit" disabled={isLoading}>Search papers</button></form>{error && <p className="search-error" role="alert">{error}</p>}</section>{isLoading ? <section className="paper-empty-state" aria-live="polite"><span className="workspace-icon">⌕</span><h2>Searching OpenAlex...</h2><p>Looking for scholarly works matching “{queryFromUrl}”.</p></section> : error ? <section className="paper-empty-state" aria-live="polite"><span className="workspace-icon">!</span><h2>We couldn&apos;t load those papers.</h2><p>{error}</p><button className="retry-button" type="button" onClick={retrySearch}>Try again</button></section> : !queryFromUrl ? <section className="paper-empty-state" aria-live="polite"><span className="workspace-icon">⌕</span><h2>Your paper search starts here.</h2><p>Enter a research topic above to search OpenAlex.</p></section> : results && results.papers.length === 0 ? <section className="paper-empty-state" aria-live="polite"><span className="workspace-icon">⌕</span><h2>No papers found.</h2><p>Try a broader topic or a different research question.</p></section>   : results && <section className="paper-results" aria-live="polite"><div className="results-heading"><div><p className="dashboard-kicker">Search results</p><h2>Works related to “{queryFromUrl}”</h2></div><span>{results.meta.totalCount.toLocaleString()} indexed works</span></div>{results.papers.map((paper) => <PaperCard key={paper.id} paper={paper} saved={savedIds.has(paper.id)} savedLoading={savedLoading} onSavedChange={(id, nextSaved) => setSavedIds((current) => { const next = new Set(current); if (nextSaved) next.add(id); else next.delete(id); return next; })} />)}{results.meta.lastPage > 1 && <div className="pagination"><button type="button" disabled={results.meta.page <= 1} onClick={() => changePage(results.meta.page - 1)}>← Previous</button><span>Page {results.meta.page} of {results.meta.lastPage}</span><button type="button" disabled={results.meta.page >= results.meta.lastPage} onClick={() => changePage(results.meta.page + 1)}>Next →</button></div>}</section>}</main></div>;
}

  function PaperCard({ paper, saved, savedLoading, onSavedChange }: { paper: Paper; saved: boolean; savedLoading: boolean; onSavedChange: (id: string, saved: boolean) => void }) {
  const [status, setStatus] = useState<string | null>(null);
    const [working, setWorking] = useState(false);
  const addToReview = async () => {
    setStatus("Adding...");
    const response = await fetch("/api/literature", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paper }) });
    const body = await response.json() as { error?: string };
    setStatus(response.ok ? "Added to literature review" : body.error ?? "Could not add paper");
  };
  const toggleSaved = async () => {
    setWorking(true);
    setStatus(null);
    try {
      const response = await fetch(saved ? `/api/saved/${encodeURIComponent(paper.id)}` : "/api/saved", saved ? { method: "DELETE" } : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paper }) });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not update saved papers.");
      onSavedChange(paper.id, !saved);
      setStatus(saved ? "Removed from saved papers" : "Saved for later");
    } catch (cause) {
      setStatus(cause instanceof Error ? cause.message : "Could not update saved papers.");
    } finally {
      setWorking(false);
    }
  };
  return <article className="paper-card"><div className="paper-card-meta"><span>{paper.publicationYear ?? "Year unavailable"}</span><span>{paper.citationCount.toLocaleString()} citations</span></div><h2>{paper.title}</h2><p className="paper-authors">{paper.authors.length > 0 ? paper.authors.join(", ") : "Authors unavailable"}</p><p className="paper-abstract">{paper.abstract ?? "Abstract unavailable for this work."}</p><div className="paper-card-links">{paper.doi && <a href={paper.doi} target="_blank" rel="noopener noreferrer">DOI <span aria-hidden="true">↗</span></a>}{paper.sourceUrl && <a href={paper.sourceUrl} target="_blank" rel="noopener noreferrer">Open source <span aria-hidden="true">↗</span></a>}<button className="paper-add-button" type="button" onClick={() => void addToReview()}>Add to review</button><button className="paper-add-button" type="button" onClick={() => void toggleSaved()} disabled={savedLoading || working}>{working ? "Saving..." : saved ? "Unsave paper" : "Save paper"}</button>{status && <span className="paper-action-status" role="status">{status}</span>}</div></article>;
}

export default function PapersPage() {
  return <Suspense fallback={<main className="loading-state">Loading paper search...</main>}><PapersContent /></Suspense>;
}