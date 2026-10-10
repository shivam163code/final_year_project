import { NextResponse } from "next/server";
import { listSavedPapers, savePaper } from "@/features/papers/saved.service";
import type { Paper } from "@/features/papers/paper.types";
import { getCurrentUser } from "@/lib/auth";

function isPaper(value: unknown): value is Paper {
  if (!value || typeof value !== "object") return false;
  const paper = value as Partial<Paper>;
  return typeof paper.id === "string"
    && /^https?:\/\/openalex\.org\/(?:works\/)?W\d+$/i.test(paper.id)
    && typeof paper.title === "string"
    && Array.isArray(paper.authors)
    && paper.authors.every((author) => typeof author === "string")
    && (paper.publicationYear === null || typeof paper.publicationYear === "number")
    && (paper.abstract === null || typeof paper.abstract === "string")
    && typeof paper.citationCount === "number"
    && (paper.doi === null || typeof paper.doi === "string")
    && (paper.sourceUrl === null || typeof paper.sourceUrl === "string");
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    return NextResponse.json({ papers: await listSavedPapers(user.id) });
  } catch (error) {
    console.error("Saved papers could not be loaded:", error);
    return NextResponse.json({ error: "Saved papers could not be loaded." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || !isPaper((body as { paper?: unknown }).paper)) {
    return NextResponse.json({ error: "A valid paper is required." }, { status: 400 });
  }
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    return NextResponse.json({ paper: await savePaper(user.id, (body as { paper: Paper }).paper) }, { status: 201 });
  } catch (error) {
    console.error("Paper could not be saved:", error);
    return NextResponse.json({ error: "Paper could not be saved." }, { status: 500 });
  }
}
