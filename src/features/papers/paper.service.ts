import { getOpenAlexWork, searchOpenAlex, type OpenAlexWork } from "@/lib/openalex";
import type { Paper, PaperSearchResponse } from "./paper.types";

const DEFAULT_PER_PAGE = 10;
const MAX_PER_PAGE = 20;

function reconstructAbstract(index: OpenAlexWork["abstract_inverted_index"]): string | null {
  if (!index) return null;
  const words = Object.entries(index).flatMap(([word, positions]) => positions.map((position) => ({ word, position })));
  if (words.length === 0) return null;
  words.sort((first, second) => first.position - second.position);
  return words.map(({ word }) => word).join(" ");
}

function safeExternalUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function normalizePaper(work: OpenAlexWork, index: number): Paper {
  const doi = work.doi ?? null;
  const sourceUrl = safeExternalUrl(work.primary_location?.landing_page_url) ?? safeExternalUrl(doi) ?? safeExternalUrl(work.id);
  return {
    id: work.id ?? `openalex-result-${index}`,
    title: work.title?.trim() || "Untitled paper",
    authors: (work.authorships ?? []).map((authorship) => authorship.author?.display_name?.trim() ?? "").filter(Boolean),
    publicationYear: work.publication_year ?? null,
    abstract: reconstructAbstract(work.abstract_inverted_index),
    citationCount: work.cited_by_count ?? 0,
    doi: safeExternalUrl(doi),
    sourceUrl,
    sourceName: work.primary_location?.source?.display_name?.trim() || null,
  };
}

export async function searchPapers(query: string, page = 1, perPage = DEFAULT_PER_PAGE): Promise<PaperSearchResponse> {
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const safePerPage = Number.isInteger(perPage) ? Math.min(Math.max(perPage, 1), MAX_PER_PAGE) : DEFAULT_PER_PAGE;
  const response = await searchOpenAlex(query, safePage, safePerPage);
  const totalCount = response.meta?.count ?? 0;
  return {
    papers: (response.results ?? []).map(normalizePaper),
    meta: { page: safePage, perPage: safePerPage, totalCount, lastPage: Math.max(1, Math.ceil(totalCount / safePerPage)) },
  };
}

export async function getPaperByIdentifier(identifier: string): Promise<Paper> {
  const work = await getOpenAlexWork(identifier);
  return normalizePaper(work, 0);
}
