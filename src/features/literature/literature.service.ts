import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getOpenAlexWork } from "@/lib/openalex";
import { normalizePaper } from "@/features/papers/paper.service";
import type { Paper } from "@/features/papers/paper.types";
import { literatureEntryFromPaper, type LiteratureEntry, type LiteratureNotes } from "./literature.types";

const DATA_FILE = path.join(process.cwd(), "data", "literature.json");

async function readEntries(): Promise<LiteratureEntry[]> {
  try {
    const content = await readFile(DATA_FILE, "utf8");
    const parsed: unknown = JSON.parse(content);
    return Array.isArray(parsed) ? parsed as LiteratureEntry[] : [];
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return [];
    throw error;
  }
}

async function writeEntries(entries: LiteratureEntry[]) {
  await mkdir(path.dirname(DATA_FILE), { recursive: true });
  await writeFile(DATA_FILE, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
}

export async function listLiteratureEntries(query = "") {
  const entries = await readEntries();
  const normalizedQuery = query.trim().toLowerCase();
  return normalizedQuery
    ? entries.filter((entry) => [entry.title, ...entry.authors, entry.methodology, entry.findings, entry.limitations, entry.researchGaps].join(" ").toLowerCase().includes(normalizedQuery))
    : entries;
}

export async function addLiteratureEntry(paper: Paper, notes?: Partial<LiteratureNotes>) {
  const entries = await readEntries();
  const existing = entries.find((entry) => entry.paperId === paper.id);
  if (existing) return existing;
  const entry = literatureEntryFromPaper(paper, notes);
  await writeEntries([entry, ...entries]);
  return entry;
}

export async function importLiteratureEntry(identifier: string) {
  const work = await getOpenAlexWork(identifier);
  return addLiteratureEntry(normalizePaper(work, 0));
}

export async function updateLiteratureEntry(id: string, notes: Partial<LiteratureNotes>) {
  const entries = await readEntries();
  const index = entries.findIndex((entry) => entry.id === id);
  if (index < 0) return null;
  const updated = { ...entries[index], ...notes, updatedAt: new Date().toISOString() };
  entries[index] = updated;
  await writeEntries(entries);
  return updated;
}

export async function removeLiteratureEntry(id: string) {
  const entries = await readEntries();
  const nextEntries = entries.filter((entry) => entry.id !== id);
  if (nextEntries.length === entries.length) return false;
  await writeEntries(nextEntries);
  return true;
}
