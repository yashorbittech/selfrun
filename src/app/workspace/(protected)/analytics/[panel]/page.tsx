import { notFound, redirect } from "next/navigation";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import { getCurrentHubUser } from "@/lib/hub-auth";
import { isPanelKey, panelConfigs } from "@/lib/workspace/panel-analytics";
import { PanelAnalyticsBlock } from "./PanelAnalyticsBlock";

export default async function WorkspacePanelAnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ panel: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentHubUser();
  if (!user) redirect("/workspace/login");

  const { panel } = await params;
  const sp = await searchParams;
  if (!isPanelKey(panel)) notFound();
  const configs = await panelConfigs();

  return (
    <div className="relative space-y-6">
      <PanelAnalyticsBlock panel={panel} user={user} sp={sp} />
    </div>
  );
}
