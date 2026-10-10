import Link from "next/link";

const links = [
  ["Dashboard", "/dashboard"],
  ["Explore Papers", "/papers"],
  ["Recommendations", "/recommendations"],
  ["Literature Review", "/literature"],
  ["Saved Papers", "/saved"],
] as const;

export default function DashboardSidebar() {
  return <aside className="dashboard-sidebar"><Link className="dashboard-brand" href="/"><span className="brand-mark" aria-hidden="true">R</span> Research<span className="brand-accent">Lens</span></Link><nav aria-label="Dashboard navigation">{links.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}</nav><Link className="sidebar-home" href="/">Back to home</Link></aside>;
}
