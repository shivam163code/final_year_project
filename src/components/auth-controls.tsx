"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PublicUser } from "@/features/auth/auth.types";

export default function AuthControls({ user }: { user?: PublicUser | null }) {
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (!user) return <span className="flex gap-3"><Link className="dashboard-account" href="/login">Sign in</Link><Link className="dashboard-account" href="/signup">Sign up</Link></span>;
  return <span className="flex items-center gap-3"><span className="hidden text-xs text-[var(--muted)] sm:inline">{user.email}</span><button className="dashboard-account cursor-pointer border-0 bg-transparent p-0" type="button" onClick={() => void logout()}>Sign out</button></span>;
}
