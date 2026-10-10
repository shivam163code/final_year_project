"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true); setError(null);
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Invalid email or password.");
      router.replace("/dashboard");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Login is currently unavailable.");
    } finally { setLoading(false); }
  };

  return <main className="auth-page"><section className="auth-panel"><Link className="brand" href="/"><span className="brand-mark" aria-hidden="true">R</span><span>Research<span className="brand-accent">Lens</span></span></Link><p className="dashboard-kicker">Your research workspace</p><h1>Welcome back.</h1><p className="auth-copy">Sign in to continue organizing the research that matters to you.</p><form className="auth-form" onSubmit={submit}><label htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /><label htmlFor="password">Password</label><div className="password-field"><input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" required /><button className="password-toggle" type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? "Hide" : "Show"}</button></div>{error && <p className="search-error" role="alert">{error}</p>}<button type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button></form><p className="auth-footnote">New to ResearchLens? <Link href="/signup">Create an account</Link></p></section></main>;
}
