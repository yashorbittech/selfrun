import PanelListFilters from "@/components/platform/panel/PanelListFilters";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import { guardPortalPage } from "@/lib/portal/guard";
import { getActivePortalLead } from "@/lib/portal/lead";
import { HiringTimeline, PortalPageHeader } from "@/components/portal/widgets";
import LeadJourney from "@/components/portal/LeadJourney";
import EmptyPortalState from "@/components/portal/EmptyPortalState";
import { brandedMetadata } from "@/lib/platform/branding/metadata";

export const dynamic = "force-dynamic";
export const generateMetadata = () => brandedMetadata("My Journey · {brand} {panel:portal}");

export default async function JourneyPage() {
  const user = await guardPortalPage();
  const view = await getActivePortalLead(user);
  if (!view) return <EmptyPortalState title="No activity yet" body="Your journey appears here once your request is in our system." />;

  return (
    <div className="space-y-5">
      <PortalPageHeader
        title="My Journey"
        subtitle={`${view.lead.code} · currently: ${view.currentStagePortalLabel}`}
      />

      <PanelListFilters>
<GlassCard>
        <CardHeader>
          <CardTitle className="text-base">Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <HiringTimeline steps={view.stageTimeline} rejected={view.lead.status === "lost"} />
        </CardContent>
      </GlassCard>

      <GlassCard>
        <CardHeader>
          <CardTitle className="text-base">Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <LeadJourney events={view.events} />
        </CardContent>
      </GlassCard>
</PanelListFilters>
    </div>
  );
}
