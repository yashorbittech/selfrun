import { redirect } from "next/navigation";
import WorkspaceShell from "@/components/hub/WorkspaceShell";
import { brandedMetadata } from "@/lib/platform/branding/metadata";
import { getWorkspaceNav } from "@/lib/products/commandos/access";
import { mustSetUpTwoFactor } from "@/lib/security/two-factor";

export const generateMetadata = () => brandedMetadata("{brand} {product:workspace}", { robots: { index: false, follow: false } });

export default async function ProtectedHubLayout({ children }: { children: React.ReactNode }) {
  const session = await getWorkspaceNav();
  if (!session) redirect("/commandos/login");
  if (session.user.mustChangePassword) redirect("/commandos/change-password");
  // Super Admins must use two-step sign-in: until it is on, every protected page sends them to set it up.
  if (await mustSetUpTwoFactor(session.user)) redirect("/commandos/two-factor-setup");

  return (
    <WorkspaceShell user={session.user} nav={session.nav}>
      {children}
    </WorkspaceShell>
  );
}
