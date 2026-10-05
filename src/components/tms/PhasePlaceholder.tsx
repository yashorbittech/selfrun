import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import { Hammer } from "lucide-react";
import { CardContent } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import type { BreadcrumbItemData } from "@/components/lms/Breadcrumbs";

/**
 * Shared "this module ships in a later phase" surface. Keeps the full TMS
 * navigation structure visible without dead 404 links while the panel is built
 * out phase-by-phase (see `~/.claude/plans/tingly-chasing-wand.md`).
 */
export default function PhasePlaceholder({
  title,
  description,
  phase,
  breadcrumbs,
}: {
  title: string;
  description: string;
  phase: string;
  breadcrumbs: BreadcrumbItemData[];
}) {
  return (
    <div className="space-y-4">
      <PanelPageHeader breadcrumbs={breadcrumbs} title={<>{title}</>} description={<>{description}</>} />
      <GlassCard interactive={false}>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-brand-accent text-white">
            <Hammer className="size-5" />
          </div>
          <p className="text-base font-semibold text-foreground">Coming in {phase}</p>
          <p className="max-w-md text-sm text-muted-foreground">
            This module is part of the phased TMS rollout. The foundation, dashboard and program
            catalogue are live now; {title.toLowerCase()} lands in {phase}.
          </p>
        </CardContent>
      </GlassCard>
    </div>
  );
}
