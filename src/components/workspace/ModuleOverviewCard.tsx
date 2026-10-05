import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import type { LabelledValue } from "@/lib/workspace/command-center";

/**
 * One glass card per aggregated module (spec section 3). Shows a handful of
 * live numbers plus a "View Details" deep-link into that module's own staff
 * panel — this is deliberately a summary, not a rebuild of each module's UI.
 * `href` is omitted for modules with no dedicated internal staff view yet
 * (the External Portal today).
 */
export default function ModuleOverviewCard({
  label,
  icon,
  href,
  stats,
}: {
  label: string;
  icon: React.ReactNode;
  href?: string;
  stats: LabelledValue[];
}) {
  return (
    <GlassCard>
      <CardHeader className="flex-row items-center gap-3 space-y-0 pb-2">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-brand-accent text-white">
          {icon}
        </div>
        <CardTitle className="text-base">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <dl className="grid grid-cols-3 gap-2">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border border-border/50 px-2 py-2 text-center">
              <dd className="text-lg font-bold tabular-nums text-foreground">{s.value.toLocaleString("en-IN")}</dd>
              <dt className="mt-0.5 truncate text-[11px] text-muted-foreground">{s.label}</dt>
            </div>
          ))}
        </dl>
        {href ? (
          <Link href={href} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            View Details <ArrowUpRight className="size-3.5" />
          </Link>
        ) : (
          <p className="text-xs text-muted-foreground">No dedicated staff view yet.</p>
        )}
      </CardContent>
    </GlassCard>
  );
}
