import { redirect } from "next/navigation";
import WorkspaceShell from "@/components/hub/WorkspaceShell";
import { brandedMetadata } from "@/lib/platform/branding/metadata";
import { getWorkspaceNav } from "@/lib/products/commandos/access";

export const generateMetadata = () => brandedMetadata("{brand} {product:workspace}", { robots: { index: false, follow: false } });

export default async function ProtectedHubLayout({ children }: { children: React.ReactNode }) {
  const session = await getWorkspaceNav();
  if (!session) redirect("/commandos/login");
  if (session.user.mustChangePassword) redirect("/commandos/change-password");

  return (
    <WorkspaceShell user={session.user} nav={session.nav}>
      {children}
    </WorkspaceShell>
  );
}
