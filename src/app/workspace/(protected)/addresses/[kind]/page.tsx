import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Globe } from "lucide-react";
import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import CompanyAddresses from "@/components/hub/CompanyAddresses";
import { requireWorkspaceAccess } from "@/lib/workspace/access";

export const metadata: Metadata = { title: "Website & app domain", robots: { index: false, follow: false } };

const KINDS = { website: "company.website-domain", app: "company.app-domain" } as const;

/** Website domain / App domain: the same screen, with the address asked for in the sidebar highlighted. */
export default async function AddressesPage({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  if (kind !== "website" && kind !== "app") notFound();
  await requireWorkspaceAccess(KINDS[kind]);

  return (
    <div className="min-h-screen bg-muted/70 px-4 py-10 dark:bg-background">
      <div className="space-y-6">
        <PanelPageHeader
          title={kind === "website" ? <>Website domain</> : <>App domain</>}
          description={<>Your company&apos;s two addresses: the public website and the app where your team signs in.</>}
        />
        <CompanyAddresses focus={kind} />
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Globe className="size-4 text-primary" />Want your own domain, like yourcompany.com? Add it in{" "}
          <Link href="/workspace/settings/domains" className="font-semibold text-primary hover:underline">Settings → Domains</Link>.
        </p>
      </div>
    </div>
  );
}
