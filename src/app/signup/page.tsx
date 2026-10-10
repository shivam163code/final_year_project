"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true); setError(null);
    try {
      const response = await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Account creation is currently unavailable.");
      router.replace("/dashboard");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Account creation is currently unavailable.");
    } finally { setLoading(false); }
  };

  return <main className="auth-page"><section className="auth-panel"><Link className="brand" href="/"><span className="brand-mark" aria-hidden="true">R</span><span>Research<span className="brand-accent">Lens</span></span></Link><p className="dashboard-kicker">Start your workspace</p><h1>Create an account.</h1><p className="auth-copy">Save papers and keep your research work organized.</p><form className="auth-form" onSubmit={submit}><label htmlFor="name">Full name</label><input id="name" autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /><label htmlFor="signup-email">Email address</label><input id="signup-email" type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /><label htmlFor="signup-password">Password</label><div className="password-field"><input id="signup-password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required /><button className="password-toggle" type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? "Hide" : "Show"}</button></div><label htmlFor="confirm-password">Confirm password</label><div className="password-field"><input id="confirm-password" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} required /><button className="password-toggle" type="button" aria-label={showConfirmPassword ? "Hide password" : "Show password"} onClick={() => setShowConfirmPassword((visible) => !visible)}>{showConfirmPassword ? "Hide" : "Show"}</button></div>{error && <p className="search-error" role="alert">{error}</p>}<button type="submit" disabled={loading}>{loading ? "Creating account..." : "Create account"}</button></form><p className="auth-footnote">Already have an account? <Link href="/login">Sign in</Link></p></section></main>;
}
