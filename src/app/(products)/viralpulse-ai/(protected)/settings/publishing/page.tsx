import { redirect } from "next/navigation";
import { PageHeader, SectionCard } from "@/components/products/viralpulse-ai/SmmsUi";
import PublishingSettingsForm from "@/components/products/viralpulse-ai/PublishingSettingsForm";
import { getViewer, can } from "@/lib/products/viralpulse-ai/viewer";
import { getPublishSettings } from "@/lib/products/viralpulse-ai/publishers/publish-settings";

export const metadata = { title: "Publishing settings" };

export default async function PublishingSettingsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/viralpulse-ai/login");
  if (!can(viewer, "MANAGE_INTEGRATIONS")) redirect("/viralpulse-ai");
  const settings = await getPublishSettings();
  return (
    <div className="space-y-4">
      <PageHeader title="Publishing" crumbs={[{ label: "Settings", href: "/viralpulse-ai/settings" }, { label: "Publishing" }]} description="Company-wide switches that apply to every post." />
      <SectionCard title="Publishing switches" description="These apply to the whole company and are recorded in the audit log.">
        <PublishingSettingsForm initial={settings} />
      </SectionCard>
    </div>
  );
}
