import { cn } from "@/lib/utils";

/**
 * A titled group on a dashboard (heading + its KPIs / charts). In light mode it sits on a soft gray panel so the
 * white cards inside stand out; dark mode keeps the plain page surface. The cards, KPI tiles and tables inside are unchanged.
 */
export default function DashboardSection({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <section className={cn("rounded-3xl border border-border/50 bg-muted/70 p-5 sm:p-6 dark:border-border/40 dark:bg-transparent", className)}>
      {children}
    </section>
  );
}
