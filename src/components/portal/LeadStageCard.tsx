import Link from "next/link";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import { HiringTimeline } from "@/components/portal/widgets";
import type { PortalLeadView } from "@/lib/portal/lead";
import { cn } from "@/lib/utils";

/**
 * The lead-lifecycle hero shown on every portal dashboard. The stage stepper is
 * driven entirely by Lead Management — advancing a lead in `/lms/leads` moves
 * this on the person's next refresh.
 */
export default function LeadStageCard({ view, compact = false }: { view: PortalLeadView; compact?: boolean }) {
  const lost = view.lead.status === "lost";
  const won = view.lead.status === "won";
  return (
    <GlassCard>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-base">Where things stand</CardTitle>
          <p className="text-xs text-muted-foreground">
            {view.lead.code} ·{" "}
            <span
              className={cn(
                "font-medium",
                lost ? "text-destructive" : won ? "text-green-600 dark:text-green-400" : "text-primary"
              )}
            >
              {view.currentStagePortalLabel}
            </span>
          </p>
        </div>
        <Link href="/portal/journey" className="shrink-0 text-sm font-medium text-primary hover:underline">
          Full journey →
        </Link>
      </CardHeader>
      <CardContent>
        <HiringTimeline steps={compact ? view.stageTimeline.slice(-5) : view.stageTimeline} rejected={lost} />
      </CardContent>
    </GlassCard>
  );
}
