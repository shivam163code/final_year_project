"use client";

import Link from "next/link";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Recommendation, RecommendationResponse } from "@/features/recommendations/recommendation.service";

function RecommendationsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const topicFromUrl = searchParams.get("q")?.trim() ?? "";
  const sourceFromUrl = searchParams.get("source")?.trim() ?? "";
  const requestKey = `${topicFromUrl}:${sourceFromUrl}`;
  const [topic, setTopic] = useState(topicFromUrl);
  const [source, setSource] = useState(sourceFromUrl);
  const [results, setResults] = useState<RecommendationResponse | null>(null);
  const [settledRequest, setSettledRequest] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const isLoading = Boolean(requestKey !== ":") && settledRequest !== requestKey;

  useEffect(() => {
    if (requestKey === ":") return;
    const controller = new AbortController();
    const params = new URLSearchParams(sourceFromUrl ? { source: sourceFromUrl } : { q: topicFromUrl });
    fetch(`/api/recommendations?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json() as RecommendationResponse & { error?: string };
        if (!response.ok) throw new Error(body.error ?? "Unable to load recommendations.");
        return body;
      })
      .then((body) => {
        setResults(body);
        setError(null);
        setSettledRequest(requestKey);
      })
      .catch((fetchError: unknown) => {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;
        setResults(null);
        setError(fetchError instanceof Error ? fetchError.message : "Unable to load recommendations.");
        setSettledRequest(requestKey);
      });
    return () => controller.abort();
  }, [requestKey, retryToken, sourceFromUrl, topicFromUrl]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTopic = topic.trim();
    const trimmedSource = source.trim();
    if (!trimmedTopic && !trimmedSource) {
      setError("Enter a research topic or a source paper ID/title.");
      return;
    }
    if (trimmedTopic && trimmedSource) {
      setError("Use either a research topic or a source paper, not both.");
      return;
    }
    setError(null);
    setSettledRequest(null);
    const params = new URLSearchParams(trimmedSource ? { source: trimmedSource } : { q: trimmedTopic });
    router.push(`${pathname}?${params.toString()}`);
  };

  const retry = () => {
    setSettledRequest(null);
    setError(null);
    setRetryToken((token) => token + 1);
  };

  return <div className="dashboard-layout"><aside className="dashboard-sidebar"><Link className="dashboard-brand" href="/"><span className="brand-mark" aria-hidden="true">R</span> Research<span className="brand-accent">Lens</span></Link><nav aria-label="Dashboard navigation"><Link href="/dashboard">Dashboard</Link><Link href="/papers">Explore Papers</Link><Link className="current" href="/recommendations">Recommendations</Link><Link href="/literature">Literature Review</Link><Link href="/saved">Saved Papers</Link></nav><Link className="sidebar-home" href="/">Back to home</Link></aside><main className="dashboard-main"><header className="dashboard-header"><div><p className="dashboard-kicker">Research workspace</p><h1>Recommendations</h1></div><Link className="dashboard-account" href="/login">Sign in</Link></header><section className="recommendation-search-panel"><p className="dashboard-kicker">Content-based discovery</p><h2>Find research that connects.</h2><p>Compare real OpenAlex works by textual similarity. Scores describe overlap in titles and abstracts, not scientific quality.</p><form className="recommendation-form" onSubmit={submitSearch}><div><label htmlFor="recommendation-topic">Research topic</label><input id="recommendation-topic" type="search" value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="e.g. machine learning in healthcare" /></div><span className="form-divider">or</span><div><label htmlFor="recommendation-source">Source paper ID or title</label><input id="recommendation-source" type="search" value={source} onChange={(event) => setSource(event.target.value)} placeholder="OpenAlex ID or paper title" /></div><button type="submit" disabled={isLoading}>Find recommendations</button></form>{error && <p className="search-error" role="alert">{error}</p>}</section>{isLoading ? <section className="paper-empty-state" aria-live="polite"><span className="workspace-icon">✦</span><h2>Finding related OpenAlex works...</h2><p>Ranking papers by textual similarity.</p></section> : error && (topicFromUrl || sourceFromUrl) ? <section className="paper-empty-state" aria-live="polite"><span className="workspace-icon">!</span><h2>Recommendations are unavailable.</h2><p>{error}</p><button className="retry-button" type="button" onClick={retry}>Try again</button></section> : results && results.recommendations.length === 0 ? <section className="paper-empty-state" aria-live="polite"><span className="workspace-icon">⌕</span><h2>No related works found.</h2><p>Try a broader topic or a source paper with a more descriptive title.</p></section> : results ? <section className="paper-results recommendation-results" aria-live="polite"><div className="results-heading"><div><p className="dashboard-kicker">Ranked results</p><h2>Research related to “{results.query}”</h2></div><span>{results.recommendations.length} recommendations</span></div>{results.sourcePaper && <p className="source-context">Source paper: <strong>{results.sourcePaper.title}</strong></p>}{results.recommendations.map((recommendation) => <RecommendationCard key={recommendation.id} recommendation={recommendation} />)}</section> : <section className="paper-empty-state" aria-live="polite"><span className="workspace-icon">✦</span><h2>Find your next connection.</h2><p>Enter a research topic or source paper to rank real OpenAlex works.</p></section>}</main></div>;
}

function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  return <article className="paper-card"><div className="paper-card-meta"><span>{recommendation.publicationYear ?? "Year unavailable"}</span><span>{recommendation.relevanceScore}% text similarity</span></div><h2>{recommendation.title}</h2><p className="paper-authors">{recommendation.authors.length > 0 ? recommendation.authors.join(", ") : "Authors unavailable"}</p><p className="paper-abstract">{recommendation.abstract ?? "Abstract unavailable for this work."}</p><p className="recommendation-explanation">{recommendation.explanation}</p><div className="paper-card-links">{recommendation.doi && <a href={recommendation.doi} target="_blank" rel="noopener noreferrer">DOI <span aria-hidden="true">↗</span></a>}{recommendation.sourceUrl && <a href={recommendation.sourceUrl} target="_blank" rel="noopener noreferrer">Open source <span aria-hidden="true">↗</span></a>}</div></article>;
}

export default function RecommendationsPage() {
  return <Suspense fallback={<main className="loading-state">Loading recommendations...</main>}><RecommendationsContent /></Suspense>;
}