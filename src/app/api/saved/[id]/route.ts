import { NextResponse } from "next/server";
import { unsavePaper } from "@/features/papers/saved.service";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^https?:\/\/openalex\.org\/(?:works\/)?W\d+$/i.test(id)) {
    return NextResponse.json({ error: "A valid OpenAlex paper ID is required." }, { status: 400 });
  }
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    return await unsavePaper(user.id, id)
      ? NextResponse.json({ success: true })
      : NextResponse.json({ error: "Saved paper not found." }, { status: 404 });
  } catch (error) {
    console.error("Paper could not be removed from saved papers:", error);
    return NextResponse.json({ error: "Paper could not be removed from saved papers." }, { status: 500 });
  }
}
