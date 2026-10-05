import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import { getCurrentHubUser } from "@/lib/hub-auth";
import { listCompanyDomains, MAX_CUSTOM_DOMAINS } from "@/lib/platform/domains/custom";
import DomainsManager from "@/components/platform/DomainsManager";
import { addDomainAction, removeDomainAction, setPrimaryDomainAction, verifyDomainAction } from "./actions";

export const metadata: Metadata = { title: "Domains", robots: { index: false, follow: false } };

export default async function DomainsSettingsPage() {
  const user = await getCurrentHubUser();
  if (!user) redirect("/workspace/login");
  if (!user.roles.includes("super_admin")) redirect("/workspace");
  const domains = await listCompanyDomains();

  return (
    <div className="min-h-screen bg-muted/70 px-4 py-10 dark:bg-background">
      <div className="space-y-4">
<PanelPageHeader
          breadcrumbs={[{ label: "Company settings", href: "/workspace/settings" }, { label: "Domains" }]}
          title={<>Domains</>}
          description={<>Serve your workspace and website on your own domain. SSL certificates are issued automatically once DNS is in place.</>}
        />
<div className="space-y-4">
        <GlassCard>
          <CardContent>
            <DomainsManager
              initial={domains}
              maxCustom={MAX_CUSTOM_DOMAINS}
              actions={{ add: addDomainAction, verify: verifyDomainAction, makePrimary: setPrimaryDomainAction, remove: removeDomainAction }}
            />
          </CardContent>
        </GlassCard>
      </div>
</div>
    </div>
  );
}
