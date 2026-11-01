import { redirect } from "next/navigation";
import { PageHeader, Notice } from "@/components/products/viralpulse-ai/SmmsUi";
import UgcSettingsPanel from "@/components/products/viralpulse-ai/ugc/UgcSettingsPanel";
import { getViewer, can } from "@/lib/products/viralpulse-ai/viewer";
import * as api from "@/lib/products/viralpulse-ai/ugc/api";

export const metadata = { title: "AI UGC Studio settings" };

export default async function UgcSettingsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/viralpulse-ai/login");
  if (!can(viewer, "MANAGE_INTEGRATIONS")) redirect("/viralpulse-ai/ugc");
  const [ov, conn] = await Promise.all([api.overview(), api.connections()]);
  return (
    <div className="space-y-4">
      <PageHeader title="Studio settings" crumbs={[{ label: "AI UGC Studio", href: "/viralpulse-ai/ugc" }, { label: "Settings" }]} description="Spend limits, approval rules, your own price per second and what the studio is connected to." />
      {!ov.ok || !conn.ok ? <Notice tone="error">{!ov.ok ? ov.error : !conn.ok ? conn.error : "Couldn't load the settings."}</Notice> : <UgcSettingsPanel settings={ov.overview.settings} connections={conn.connections} spentTodayUsd={ov.overview.spentTodayUsd} spentMonthUsd={ov.overview.spentMonthUsd} />}
    </div>
  );
}
