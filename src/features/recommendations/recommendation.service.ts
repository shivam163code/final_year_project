import { getOpenAlexWork } from "@/lib/openalex";
import { normalizePaper, searchPapers } from "@/features/papers/paper.service";
import type { Paper } from "@/features/papers/paper.types";

const CANDIDATE_LIMIT = 20;
const RESULT_LIMIT = 10;
const STOP_WORDS = new Set("a an and are as at be by for from has in is it of on or that the their this to was were with within".split(" "));

export type Recommendation = Paper & { relevanceScore: number; explanation: string };
export type RecommendationResponse = { recommendations: Recommendation[]; sourcePaper: Paper | null; query: string };

type RecommendationInput = { query?: string; source?: string };

function terms(text: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const token of text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/)) {
    if (token.length < 3 || STOP_WORDS.has(token)) continue;
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  return counts;
}

function paperText(paper: Paper): string {
  return `${paper.title} ${paper.abstract ?? ""}`;
}

function rankPaper(candidate: Paper, sourceText: string): Recommendation | null {
  const sourceTerms = terms(sourceText);
  const candidateTerms = terms(paperText(candidate));
  const matchingTerms = [...sourceTerms.keys()].filter((term) => candidateTerms.has(term));
  if (matchingTerms.length === 0) return null;

  let dotProduct = 0;
  let sourceMagnitude = 0;
  let candidateMagnitude = 0;
  for (const [term, count] of sourceTerms) {
    const candidateCount = candidateTerms.get(term) ?? 0;
    dotProduct += count * candidateCount;
    sourceMagnitude += count ** 2;
  }
  for (const count of candidateTerms.values()) candidateMagnitude += count ** 2;
  const cosine = dotProduct / (Math.sqrt(sourceMagnitude) * Math.sqrt(candidateMagnitude) || 1);
  const overlap = matchingTerms.length / Math.max(sourceTerms.size, 1);
  const relevanceScore = Math.round((cosine * 70 + overlap * 30) * 100) / 100;
  const explanation = `Matches terms: ${matchingTerms.slice(0, 5).join(", ")}. Score reflects textual similarity, not scientific quality.`;

  return { ...candidate, relevanceScore, explanation };
}

function isOpenAlexId(value: string): boolean {
  return /^(?:https?:\/\/openalex\.org\/)?W\d+$/i.test(value.trim());
}

async function resolveSource(source: string): Promise<Paper> {
  if (isOpenAlexId(source)) return normalizePaper(await getOpenAlexWork(source), 0);
  const result = await searchPapers(source, 1, 1);
  const sourcePaper = result.papers[0];
  if (!sourcePaper) throw new Error("No OpenAlex source paper was found for that title.");
  return sourcePaper;
}

export async function getRecommendations(input: RecommendationInput): Promise<RecommendationResponse> {
  const query = input.query?.trim() ?? "";
  const sourceValue = input.source?.trim() ?? "";
  const sourcePaper = sourceValue ? await resolveSource(sourceValue) : null;
  const searchQuery = sourcePaper ? sourcePaper.title : query;
  const sourceText = sourcePaper ? paperText(sourcePaper) : query;
  const candidates = (await searchPapers(searchQuery, 1, CANDIDATE_LIMIT)).papers;
  const seen = new Set<string>();
  const recommendations = candidates
    .filter((candidate) => candidate.id !== sourcePaper?.id && !seen.has(candidate.id) && seen.add(candidate.id))
    .map((candidate) => rankPaper(candidate, sourceText))
    .filter((candidate): candidate is Recommendation => candidate !== null)
    .sort((first, second) => second.relevanceScore - first.relevanceScore || first.title.localeCompare(second.title))
    .slice(0, RESULT_LIMIT);

  return { recommendations, sourcePaper, query: searchQuery };
}
