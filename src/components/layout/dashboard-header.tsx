import AuthControls from "@/components/auth-controls";
import type { PublicUser } from "@/features/auth/auth.types";

export default function DashboardHeader({ title, user }: { title: string; user?: PublicUser | null }) {
  return <header className="dashboard-header"><div><p className="dashboard-kicker">Research workspace</p><h1>{title}</h1></div><AuthControls user={user} /></header>;
}
