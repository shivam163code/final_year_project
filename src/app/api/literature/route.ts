import { NextResponse } from "next/server";
import { addLiteratureEntry, importLiteratureEntry, listLiteratureEntries } from "@/features/literature/literature.service";
import type { Paper } from "@/features/papers/paper.types";
import { OpenAlexError } from "@/lib/openalex";

function isPaper(value: unknown): value is Paper {
  if (!value || typeof value !== "object") return false;
  const paper = value as Partial<Paper>;
  return typeof paper.id === "string" && typeof paper.title === "string" && Array.isArray(paper.authors);
}

export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams.get("q") ?? "";
    return NextResponse.json({ entries: await listLiteratureEntries(query) });
  } catch (error) {
    console.error("Literature entries could not be loaded:", error);
    return NextResponse.json({ error: "Literature entries could not be loaded." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "A paper or identifier is required." }, { status: 400 });
  const payload = body as { identifier?: unknown; paper?: unknown };
  try {
    if (typeof payload.identifier === "string" && payload.identifier.trim()) {
      return NextResponse.json({ entry: await importLiteratureEntry(payload.identifier) }, { status: 201 });
    }
    if (isPaper(payload.paper)) return NextResponse.json({ entry: await addLiteratureEntry(payload.paper) }, { status: 201 });
    return NextResponse.json({ error: "Provide a paper from search results or a valid OpenAlex identifier." }, { status: 400 });
  } catch (error) {
    console.error("Literature entry could not be added:", error);
    if (error instanceof OpenAlexError) {
      if (error.kind === "invalid-identifier") return NextResponse.json({ error: error.message }, { status: 400 });
      if (error.kind === "not-found") return NextResponse.json({ error: "OpenAlex could not find that work. Check the identifier and try again." }, { status: 404 });
      if (error.kind === "rate-limited") return NextResponse.json({ error: "OpenAlex rate limit reached. Please wait and try again." }, { status: 429 });
      if (error.kind === "network-error") return NextResponse.json({ error: "OpenAlex could not be reached. The paper was not added." }, { status: 502 });
      return NextResponse.json({ error: "OpenAlex returned an error. The paper was not added." }, { status: 502 });
    }
    return NextResponse.json({ error: "The paper could not be added because of an unexpected server error." }, { status: 500 });
  }
}
