const OPENALEX_URL = "https://api.openalex.org/works";

export type OpenAlexErrorKind = "invalid-identifier" | "not-found" | "rate-limited" | "api-error" | "network-error";

export class OpenAlexError extends Error {
  public readonly kind: OpenAlexErrorKind;
  public readonly status?: number;

  constructor(
    message: string,
    kind: OpenAlexErrorKind,
    status?: number,
  ) {
    super(message);
    this.name = "OpenAlexError";
    this.kind = kind;
    this.status = status;
  }
}

export type OpenAlexAuthor = {
  author?: { display_name?: string | null } | null;
};

export type OpenAlexWork = {
  id?: string | null;
  title?: string | null;
  publication_year?: number | null;
  cited_by_count?: number | null;
  doi?: string | null;
  abstract_inverted_index?: Record<string, number[]> | null;
  authorships?: OpenAlexAuthor[] | null;
  primary_location?: { landing_page_url?: string | null; source?: { display_name?: string | null } | null } | null;
};

export type OpenAlexResponse = {
  meta?: { count?: number | null } | null;
  results?: OpenAlexWork[] | null;
};

export function parseOpenAlexWorkId(identifier: string): string {
  const value = identifier.trim();
  const rawMatch = /^W\d+$/i.exec(value);
  if (rawMatch) return rawMatch[0].toUpperCase();

  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname.toLowerCase() !== "openalex.org") {
      throw new Error("Unsupported URL");
    }
    const parts = url.pathname.split("/").filter(Boolean);
    const id = parts.length === 1 ? parts[0] : parts.length === 2 && parts[0].toLowerCase() === "works" ? parts[1] : null;
    if (id && /^W\d+$/i.test(id)) return id.toUpperCase();
  } catch {
    // The invalid identifier error below is the public validation result.
  }
  throw new OpenAlexError("OpenAlex work identifiers must be a W-prefixed ID or supported OpenAlex URL.", "invalid-identifier");
}

export async function searchOpenAlex(query: string, page: number, perPage: number): Promise<OpenAlexResponse> {
  const params = new URLSearchParams({ search: query, page: String(page), per_page: String(perPage) });
  const response = await fetch(`${OPENALEX_URL}?${params.toString()}`, {
    headers: { Accept: "application/json", "User-Agent": "ResearchLens/1.0" },
    next: { revalidate: 300 },
  });

  if (!response.ok) throw new Error(`OpenAlex request failed with status ${response.status}`);
  return response.json() as Promise<OpenAlexResponse>;
}

export async function getOpenAlexWork(identifier: string): Promise<OpenAlexWork> {
  const normalizedIdentifier = parseOpenAlexWorkId(identifier);
  let response: Response;
  try {
    response = await fetch(`${OPENALEX_URL}/${normalizedIdentifier}`, {
      headers: { Accept: "application/json", "User-Agent": "ResearchLens/1.0" },
      next: { revalidate: 300 },
    });
  } catch {
    throw new OpenAlexError("OpenAlex could not be reached.", "network-error", undefined);
  }

  if (response.status === 404) throw new OpenAlexError("OpenAlex work was not found.", "not-found", 404);
  if (response.status === 429) throw new OpenAlexError("OpenAlex rate limit reached.", "rate-limited", 429);
  if (!response.ok) throw new OpenAlexError(`OpenAlex request failed with status ${response.status}.`, "api-error", response.status);
  try {
    return await response.json() as OpenAlexWork;
  } catch {
    throw new OpenAlexError("OpenAlex returned an invalid response.", "api-error", response.status);
  }
}
