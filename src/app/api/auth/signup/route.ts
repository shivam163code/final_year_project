import { NextResponse } from "next/server";
import { createUser, isDuplicateKeyError } from "@/features/auth/auth.repository";
import { validateSignup } from "@/features/auth/auth.validation";
import { hashPassword, startSession } from "@/lib/auth";

export async function POST(request: Request) {
  let input: unknown;
  try { input = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
  const result = validateSignup(input && typeof input === "object" ? input : {});
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  try {
    const user = await createUser(result.name, result.email, await hashPassword(result.password));
    await startSession(user.id);
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (isDuplicateKeyError(error)) return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
    console.error("Signup failed:", error instanceof Error ? { name: error.name, message: error.message.replace(/mongodb(?:\+srv)?:\/\/\S+/gi, "mongodb://[redacted]") } : { name: "UnknownError" });
    return NextResponse.json({ error: "Account creation is currently unavailable." }, { status: 503 });
  }
}
