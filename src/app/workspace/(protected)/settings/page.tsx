import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, Building, Building2, CreditCard, FileUp, Gauge, Globe, Globe2, History, Landmark, Lock, Palette, Plug, ReceiptText, Users, Zap, type LucideIcon } from "lucide-react";
import GlassCard from "@/components/lms/GlassCard";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getCurrentHubUser } from "@/lib/hub-auth";
import { getCompanyBrand } from "@/lib/platform/branding";
import { getWorkspaceNav } from "@/lib/workspace/access";

export const metadata: Metadata = { title: "Company settings", robots: { index: false, follow: false } };

/** Card icons for the Company items of the Workspace navigation (`src/lib/workspace/nav.ts`). */
const ICONS: Record<string, LucideIcon> = {
  "company.setup": Building2,
  "company.profile": Building,
  "company.users": Users,
  "company.billing": CreditCard,
  "company.invoices": ReceiptText,
  "company.usage": Gauge,
  "company.domains": Globe,
  "company.branding": Palette,
  "company.payments": Landmark,
  "company.integrations": Plug,
  "company.automations": Zap,
  "company.import": FileUp,
  "company.activity": History,
  "company.security": Lock,
  "platform.panel": Globe2,
};

/**
 * The company's settings hub. The cards are the "Company" section of the
 * Workspace navigation, so they always match the sidebar; the Platform Panel
 * card appears only for people the Platform Panel's own access check accepts.
 */
export default async function CompanySettingsPage() {
  const user = await getCurrentHubUser();
  if (!user) redirect("/workspace/login");
  if (!user.roles.includes("super_admin")) redirect("/workspace");
  const [brand, session] = await Promise.all([getCompanyBrand(), getWorkspaceNav()]);
  const sections = (session?.nav.sections ?? []).filter((s) => s.key === "company" || s.key === "platform").flatMap((s) => s.items);

  return (
    <div className="min-h-screen bg-muted/70 px-4 py-10 dark:bg-background">
      <div className="space-y-4">
<PanelPageHeader
          title={<>{brand.name} settings</>}
          description={<>Company-wide configuration. Only Super Admins see this.</>}
        />
<div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2">
          {sections.map(({ key, href, title, description }) => {
            const Icon = ICONS[key] ?? Building2;
            return (
            <Link key={key} href={href} className="group" data-settings-card={key}>
              <GlassCard className="h-full transition-colors group-hover:border-primary/40">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Icon className="size-5 text-primary" />
                    <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <CardTitle className="text-base">{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
              </GlassCard>
            </Link>
            );
          })}
        </div>
      </div>
</div>
    </div>
  );
}
