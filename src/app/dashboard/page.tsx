import Link from "next/link";
import DashboardHeader from "@/components/layout/dashboard-header";
import DashboardSidebar from "@/components/layout/dashboard-sidebar";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";

async function DashboardContent() {
  let user;
  try { user = await getCurrentUser(); } catch { redirect("/login?error=unavailable"); }
  if (!user) redirect("/login");
  return <div className="dashboard-layout"><DashboardSidebar /><main className="dashboard-main"><DashboardHeader title={`Good morning, ${user.name}.`} user={user} /><div className="dashboard-intro"><p className="dashboard-kicker">Your overview</p><h2>A workspace for your next breakthrough.</h2><p>Search and review scholarly sources in one focused space.</p></div><div className="dashboard-cards"><article><span>01</span><h3>Explore papers</h3><p>Search and review scholarly sources in one focused space.</p><Link href="/papers">Open papers →</Link></article><article><span>02</span><h3>Shape a review</h3><p>Collect the ideas and themes that matter to your question.</p><Link href="/literature">Open literature →</Link></article></div></main></div>;
}

export default function DashboardPage() {
  return <Suspense fallback={<main className="loading-state">Checking your session...</main>}><DashboardContent /></Suspense>;
}
