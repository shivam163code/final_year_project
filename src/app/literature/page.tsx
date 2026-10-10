"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import DashboardHeader from "@/components/layout/dashboard-header";
import DashboardSidebar from "@/components/layout/dashboard-sidebar";
import type { LiteratureEntry, LiteratureNotes } from "@/features/literature/literature.types";

const noteFields: { key: keyof LiteratureNotes; label: string }[] = [
  { key: "methodology", label: "Research methodology notes" },
  { key: "findings", label: "Main findings notes" },
  { key: "limitations", label: "Limitations" },
  { key: "researchGaps", label: "Potential research gaps" },
];

function csvCell(value: string | number | null) {
  const text = value === null ? "" : String(value);
  return `"${text.replaceAll("\"", "\"\"")}"`;
}

function exportCsv(entries: LiteratureEntry[]) {
  const headers = ["Paper title", "Authors", "Publication year", "Research methodology notes", "Main findings notes", "Limitations", "Potential research gaps", "Source URL or DOI"];
  const rows = entries.map((entry) => [entry.title, entry.authors.join("; "), entry.publicationYear, entry.methodology, entry.findings, entry.limitations, entry.researchGaps, entry.doi ?? entry.sourceUrl]);
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "researchlens-literature-matrix.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function LiteraturePage() {
  const [entries, setEntries] = useState<LiteratureEntry[]>([]);
  const [query, setQuery] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/literature");
      const body = await response.json() as { entries?: LiteratureEntry[]; error?: string };
      if (!response.ok) throw new Error(body.error ?? "Unable to load the review workspace.");
      setEntries(body.entries ?? []);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load the review workspace.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetch("/api/literature")
      .then(async (response) => {
        const body = await response.json() as { entries?: LiteratureEntry[]; error?: string };
        if (!response.ok) throw new Error(body.error ?? "Unable to load the review workspace.");
        if (active) { setEntries(body.entries ?? []); setError(null); }
      })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Unable to load the review workspace."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const visibleEntries = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized ? entries.filter((entry) => [entry.title, ...entry.authors, entry.methodology, entry.findings, entry.limitations, entry.researchGaps].join(" ").toLowerCase().includes(normalized)) : entries;
  }, [entries, query]);

  const addByIdentifier = async (event: FormEvent) => {
    event.preventDefault();
    if (!identifier.trim()) { setError("Enter an OpenAlex ID or OpenAlex work URL."); return; }
    setWorking(true); setError(null); setSuccess(null);
    try {
      const response = await fetch("/api/literature", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identifier }) });
      const body = await response.json() as { entry?: LiteratureEntry; error?: string };
      if (!response.ok) throw new Error(body.error ?? "The paper could not be imported.");
      setIdentifier(""); setSuccess(body.entry ? `"${body.entry.title}" added to your matrix.` : "Paper added.");
      await loadEntries();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The paper could not be imported."); } finally { setWorking(false); }
  };

  const saveNotes = async (id: string, notes: LiteratureNotes) => {
    const response = await fetch(`/api/literature/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(notes) });
    const body = await response.json() as { entry?: LiteratureEntry; error?: string };
    if (!response.ok) throw new Error(body.error ?? "Notes could not be saved.");
    setEntries((current) => current.map((entry) => entry.id === id ? body.entry ?? entry : entry));
    setSuccess("Analytical notes saved.");
  };

  const removeEntry = async (id: string) => {
    if (!window.confirm("Remove this paper from the literature matrix?")) return;
    setWorking(true); setError(null);
    try {
      const response = await fetch(`/api/literature/${encodeURIComponent(id)}`, { method: "DELETE" });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "The entry could not be removed.");
      setEntries((current) => current.filter((entry) => entry.id !== id)); setSuccess("Literature entry removed.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The entry could not be removed."); } finally { setWorking(false); }
  };

  return <div className="dashboard-layout"><DashboardSidebar /><main className="dashboard-main !max-w-none"><DashboardHeader title="Literature Review" />
    <section className="mt-10 max-w-5xl rounded-xl border border-[var(--line)] bg-white p-5 shadow-sm sm:mt-12 sm:p-7">
      <p className="dashboard-kicker !mb-2">Evidence workspace</p><h2 className="!mb-2 !text-3xl !tracking-tight sm:!text-4xl">Build your comparison matrix.</h2><p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">Import bibliographic metadata from OpenAlex, then add your own analysis. Imported fields and analytical notes are kept separate; no methodology, finding, limitation, or gap is inferred.</p>
      <form className="mt-6" onSubmit={addByIdentifier}><label className="mb-2 block text-xs font-bold text-[var(--navy)]" htmlFor="literature-identifier">Add an OpenAlex identifier</label><div className="flex flex-col gap-2 sm:flex-row"><input className="min-w-0 flex-1 rounded-md border border-[var(--line)] px-3 py-3 text-sm outline-none transition focus:border-[var(--teal)] focus:ring-2 focus:ring-[var(--mint)]" id="literature-identifier" value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="W2741809807 or https://openalex.org/W..." /><button className="rounded-md bg-[var(--navy)] px-5 py-3 text-xs font-bold text-white transition hover:bg-[var(--teal)] disabled:cursor-wait disabled:opacity-60" type="submit" disabled={working}>{working ? "Importing..." : "Import paper"}</button></div></form>
      <p className="mt-4 text-xs leading-5 text-[var(--muted)]">Demo storage: entries are saved in <code className="text-[var(--navy)]">data/literature.json</code> on this server. There is no authentication, so this workspace is shared by the demo user.</p>
    </section>
    {error && <p className="mt-4 max-w-5xl rounded-md bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{error}</p>}{success && <p className="mt-4 max-w-5xl rounded-md bg-[var(--mint)] px-4 py-3 text-sm text-[var(--navy)]" role="status">{success}</p>}
    <section className="mt-7 flex max-w-5xl flex-col gap-3 rounded-lg border border-[var(--line)] bg-white p-4 shadow-sm sm:flex-row sm:items-end"><div className="min-w-0 flex-1"><label className="mb-2 block text-xs font-bold text-[var(--navy)]" htmlFor="literature-filter">Filter matrix</label><input className="w-full rounded-md border border-[var(--line)] px-3 py-2.5 text-sm outline-none transition focus:border-[var(--teal)] focus:ring-2 focus:ring-[var(--mint)]" id="literature-filter" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search titles, authors, or notes..." /></div><button className="rounded-md border border-[var(--navy)] px-5 py-2.5 text-xs font-bold text-[var(--navy)] transition hover:bg-[var(--navy)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50" type="button" onClick={() => exportCsv(visibleEntries)} disabled={visibleEntries.length === 0}>Export CSV</button></section>
    {loading ? <section className="mt-5 rounded-lg border border-[var(--line)] bg-white p-8 text-center"><p className="text-sm text-[var(--muted)]">Loading your matrix...</p></section> : visibleEntries.length === 0 ? <section className="mt-5 rounded-lg border border-dashed border-[var(--line)] bg-white p-8 text-center"><span className="text-2xl text-[var(--teal)]" aria-hidden="true">⌁</span><h2 className="!mb-2 !mt-3 !text-2xl !tracking-tight">{entries.length === 0 ? "Your matrix is empty." : "No matching entries."}</h2><p className="mx-auto max-w-md text-sm leading-6 text-[var(--muted)]">{entries.length === 0 ? "Import a real OpenAlex work above to start comparing papers." : "Try a different filter."}</p>{entries.length === 0 && <button className="mt-5 rounded-md bg-[var(--navy)] px-4 py-2.5 text-xs font-bold text-white hover:bg-[var(--teal)]" type="button" onClick={() => document.getElementById("literature-identifier")?.focus()}>Import a paper</button>}</section> : <section className="mt-5 space-y-4" aria-label="Literature comparison matrix">{visibleEntries.map((entry) => <LiteratureRow key={entry.id} entry={entry} onSave={saveNotes} onRemove={removeEntry} disabled={working} />)}</section>}
  </main></div>;
}

function LiteratureRow({ entry, onSave, onRemove, disabled }: { entry: LiteratureEntry; onSave: (id: string, notes: LiteratureNotes) => Promise<void>; onRemove: (id: string) => Promise<void>; disabled: boolean }) {
  const [notes, setNotes] = useState<LiteratureNotes>({ methodology: entry.methodology, findings: entry.findings, limitations: entry.limitations, researchGaps: entry.researchGaps });
  const [saving, setSaving] = useState(false);
  const update = (key: keyof LiteratureNotes, value: string) => setNotes((current) => ({ ...current, [key]: value }));
  const [error, setError] = useState<string | null>(null);
  const save = async () => { setSaving(true); setError(null); try { await onSave(entry.id, notes); } catch (cause) { setError(cause instanceof Error ? cause.message : "Notes could not be saved."); } finally { setSaving(false); } };
  return <article className="grid gap-5 rounded-lg border border-[var(--line)] bg-white p-4 shadow-sm lg:grid-cols-[minmax(220px,.8fr)_minmax(0,1.5fr)_auto] lg:p-5"><div><p className="mb-2 text-[10px] font-bold uppercase tracking-[.14em] text-[var(--teal)]">Imported metadata</p><h3 className="mb-3 text-lg font-semibold leading-6 text-[var(--navy)]">{entry.title}</h3><dl className="space-y-2 text-xs leading-5 text-[var(--muted)]"><div><dt className="inline font-bold text-[var(--navy)]">Authors: </dt><dd className="inline">{entry.authors.length ? entry.authors.join(", ") : "Unavailable"}</dd></div><div><dt className="inline font-bold text-[var(--navy)]">Year: </dt><dd className="inline">{entry.publicationYear ?? "Unavailable"}</dd></div><div><dt className="inline font-bold text-[var(--navy)]">Source: </dt><dd className="inline break-all">{entry.doi || entry.sourceUrl ? <a className="text-[var(--teal)] underline" href={entry.doi ?? entry.sourceUrl ?? "#"} target="_blank" rel="noopener noreferrer">{entry.doi ?? entry.sourceUrl}</a> : "Unavailable"}</dd></div></dl>{entry.abstract && <details className="mt-4 text-xs leading-5 text-[var(--muted)]"><summary className="cursor-pointer font-bold text-[var(--teal)]">Imported abstract</summary><p className="mt-2">{entry.abstract}</p></details>}</div><div><p className="mb-3 text-[10px] font-bold uppercase tracking-[.14em] text-[var(--teal)]">Your analytical notes</p><div className="grid gap-3 sm:grid-cols-2">{noteFields.map(({ key, label }) => <label className="grid gap-1.5 text-xs font-bold leading-4 text-[var(--navy)]" key={key}>{label}<textarea className="min-h-20 w-full resize-y rounded-md border border-[var(--line)] px-3 py-2 text-xs font-normal leading-5 text-[var(--navy)] outline-none focus:border-[var(--teal)] focus:ring-2 focus:ring-[var(--mint)]" value={notes[key]} onChange={(event) => update(key, event.target.value)} placeholder="Add notes supported by your review..." rows={3} /></label>)}</div></div><div className="flex gap-2 lg:flex-col"><button className="rounded-md bg-[var(--navy)] px-3 py-2 text-xs font-bold text-white hover:bg-[var(--teal)] disabled:cursor-wait disabled:opacity-60" type="button" onClick={save} disabled={saving || disabled}>{saving ? "Saving..." : "Save notes"}</button><button className="rounded-md border border-red-300 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-60" type="button" onClick={() => void onRemove(entry.id)} disabled={disabled}>Remove</button>{error && <p className="text-xs text-red-700" role="alert">{error}</p>}</div></article>;
}
