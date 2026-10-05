import { redirect } from "next/navigation";
import { getCurrentPortalUser } from "@/lib/portal-auth";
import PortalAuthShell from "@/components/portal/PortalAuthShell";
import ChangePasswordForm from "@/components/portal/ChangePasswordForm";
import { brandedMetadata } from "@/lib/platform/branding/metadata";

export const generateMetadata = () => brandedMetadata("Change password · {brand} {panel:portal}", { robots: { index: false } });

export default async function PortalChangePasswordPage() {
  const user = await getCurrentPortalUser();
  if (!user) redirect("/login");
  return (
    <PortalAuthShell headline={<>Secure your account</>} sub="Choose a password you don't use anywhere else.">
      <ChangePasswordForm forced={user.mustChangePassword} />
    </PortalAuthShell>
  );
}
