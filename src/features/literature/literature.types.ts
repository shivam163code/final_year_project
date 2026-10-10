import type { Paper } from "@/features/papers/paper.types";

export type LiteratureEntry = {
  id: string;
  paperId: string;
  title: string;
  authors: string[];
  publicationYear: number | null;
  doi: string | null;
  sourceUrl: string | null;
  abstract: string | null;
  methodology: string;
  findings: string;
  limitations: string;
  researchGaps: string;
  createdAt: string;
  updatedAt: string;
};

export type LiteratureNotes = Pick<LiteratureEntry, "methodology" | "findings" | "limitations" | "researchGaps">;

export function literatureEntryFromPaper(paper: Paper, notes: Partial<LiteratureNotes> = {}): LiteratureEntry {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    paperId: paper.id,
    title: paper.title,
    authors: paper.authors,
    publicationYear: paper.publicationYear,
    doi: paper.doi,
    sourceUrl: paper.sourceUrl,
    abstract: paper.abstract,
    methodology: notes.methodology ?? "",
    findings: notes.findings ?? "",
    limitations: notes.limitations ?? "",
    researchGaps: notes.researchGaps ?? "",
    createdAt: now,
    updatedAt: now,
  };
}
