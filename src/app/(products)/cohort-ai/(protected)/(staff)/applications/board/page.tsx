import PanelListFilters from "@/components/platform/panel/PanelListFilters";
import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import Link from "next/link";
import { List } from "lucide-react";
import { CardContent } from "@/components/ui/card";
import GlassCard from "@/components/products/dealflow-ai/GlassCard";
import Breadcrumbs from "@/components/products/dealflow-ai/Breadcrumbs";
import { buttonVariants } from "@/components/ui/button";
import ApplicationsBoard from "@/components/products/cohort-ai/ApplicationsBoard";
import { getApplicationsBoard, serializeApplication } from "@/lib/products/cohort-ai/applications";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/products/cohort-ai/constants";
import type { BoardCard } from "@/components/products/cohort-ai/ApplicationsBoard";

export default async function ApplicationsBoardPage() {
  const board = await getApplicationsBoard();
  const serialized = {} as Record<ApplicationStatus, BoardCard[]>;
  for (const s of APPLICATION_STATUSES) {
    serialized[s.value] = board[s.value].map((a) => ({ ...serializeApplication(a), programName: a.programName }));
  }

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[{ label: "TMS", href: "/cohort-ai" }, { label: "Applications", href: "/cohort-ai/applications" }, { label: "Board" }]}
        title={<>Application Pipeline</>}
        description={<>Drag cards to move applicants through the pipeline.</>}
        actions={<><Link href="/cohort-ai/applications" className={buttonVariants({ variant: "outline", size: "sm" })}>
          <List className="size-3.5" data-icon="inline-start" />
          List view
        </Link></>}
      />

      <PanelListFilters>
<GlassCard interactive={false}>
        <CardContent className="py-4">
          <ApplicationsBoard board={serialized} />
        </CardContent>
      </GlassCard>
</PanelListFilters>
    </div>
  );
}
