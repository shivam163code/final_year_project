import { NextResponse } from "next/server";
import { removeLiteratureEntry, updateLiteratureEntry } from "@/features/literature/literature.service";

const noteKeys = ["methodology", "findings", "limitations", "researchGaps"] as const;

function notesFrom(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  const notes: Record<string, string> = {};
  for (const key of noteKeys) {
    if (input[key] !== undefined && typeof input[key] !== "string") return null;
    if (typeof input[key] === "string") notes[key] = input[key].trim();
  }
  return notes;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
  const notes = notesFrom(body);
  if (!notes) return NextResponse.json({ error: "Analytical notes must be text." }, { status: 400 });
  try {
    const entry = await updateLiteratureEntry(id, notes);
    return entry ? NextResponse.json({ entry }) : NextResponse.json({ error: "Literature entry not found." }, { status: 404 });
  } catch (error) {
    console.error("Literature entry could not be updated:", error);
    return NextResponse.json({ error: "Literature entry could not be updated." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    return await removeLiteratureEntry(id)
      ? NextResponse.json({ success: true })
      : NextResponse.json({ error: "Literature entry not found." }, { status: 404 });
  } catch (error) {
    console.error("Literature entry could not be removed:", error);
    return NextResponse.json({ error: "Literature entry could not be removed." }, { status: 500 });
  }
}
