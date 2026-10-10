import { NextResponse } from "next/server";
import { searchPapers } from "@/features/papers/paper.service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const pageValue = Number(searchParams.get("page") ?? "1");
  const perPageValue = Number(searchParams.get("perPage") ?? "10");

  if (!query) return NextResponse.json({ error: "A search query is required." }, { status: 400 });
  if (!Number.isInteger(pageValue) || pageValue < 1) return NextResponse.json({ error: "Page must be a positive integer." }, { status: 400 });

  try {
    const result = await searchPapers(query, pageValue, perPageValue);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Paper search failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Paper search is temporarily unavailable." }, { status: 502 });
  }
}
