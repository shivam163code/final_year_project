import { NextResponse } from "next/server";
import { getRecommendations } from "@/features/recommendations/recommendation.service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const source = searchParams.get("source")?.trim() ?? "";

  if ((!query && !source) || (query && source)) {
    return NextResponse.json({ error: "Provide either a research topic or a source paper ID/title." }, { status: 400 });
  }

  try {
    return NextResponse.json(await getRecommendations({ query, source }));
  } catch (error) {
    console.error("Recommendation search failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Recommendations are temporarily unavailable." }, { status: 502 });
  }
}
