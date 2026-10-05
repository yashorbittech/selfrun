import { redirect } from "next/navigation";
import WorkspaceShell from "@/components/hub/WorkspaceShell";
import { brandedMetadata } from "@/lib/platform/branding/metadata";
import { getWorkspaceNav } from "@/lib/workspace/access";

export const generateMetadata = () => brandedMetadata("{brand} {panel:workspace}", { robots: { index: false, follow: false } });

export default async function ProtectedHubLayout({ children }: { children: React.ReactNode }) {
  const session = await getWorkspaceNav();
  if (!session) redirect("/workspace/login");
  if (session.user.mustChangePassword) redirect("/workspace/change-password");

  return (
    <WorkspaceShell user={session.user} nav={session.nav}>
      {children}
    </WorkspaceShell>
  );
}
