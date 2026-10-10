import { NextResponse } from "next/server";
import { findUserByEmail } from "@/features/auth/auth.repository";
import { validateLogin } from "@/features/auth/auth.validation";
import { isLoginRateLimited } from "@/lib/auth-rate-limit";
import { startSession, verifyPassword } from "@/lib/auth";

export async function POST(request: Request) {
  let input: unknown;
  try { input = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
  const result = validateLogin(input && typeof input === "object" ? input : {});
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isLoginRateLimited(`${address}:${result.email}`)) return NextResponse.json({ error: "Too many login attempts. Try again later." }, { status: 429 });
  try {
    const user = await findUserByEmail(result.email);
    const valid = user ? await verifyPassword(result.password, user.passwordHash) : false;
    if (!user || !valid) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    await startSession(user._id.toHexString());
    return NextResponse.json({ user: { id: user._id.toHexString(), name: user.name, email: user.email } });
  } catch (error) {
    console.error("Login failed:", error instanceof Error ? { name: error.name, message: error.message.replace(/mongodb(?:\+srv)?:\/\/\S+/gi, "mongodb://[redacted]") } : { name: "UnknownError" });
    return NextResponse.json({ error: "Login is currently unavailable." }, { status: 503 });
  }
}
