import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { BarChart3, CalendarClock, FolderKanban, ListTodo, Target, Users, Wallet } from "lucide-react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import KpiCard from "@/components/lms/KpiCard";
import ExecutiveSection from "@/components/workspace/ExecutiveSection";
import { getCompanyKpis, getRecentActivity, type CompanyKpi } from "@/lib/platform/dashboard";
import type { EventView } from "@/lib/platform/events";
import { eventLabel } from "@/lib/platform/events/catalog";
import { formatDateTime } from "@/lib/utils";
import AskBusiness from "@/components/platform/hub/AskBusiness";

const ICONS: Record<CompanyKpi["key"], React.ReactNode> = {
  open_leads: <Target className="size-4" />,
  active_projects: <FolderKanban className="size-4" />,
  tasks_due: <ListTodo className="size-4" />,
  unpaid_invoices: <Wallet className="size-4" />,
  employees: <Users className="size-4" />,
  pending_leave: <CalendarClock className="size-4" />,
};

/**
 * The Staff Hub's company strip: "Ask about your business", the company
 * numbers this person may see, and recent activity. Everything here fails
 * soft — if the data can't be loaded the hub renders without this part.
 */
export default async function CompanyToday({ user }: { user: { id: string; email: string; roles: string[] } }) {
  let kpis: CompanyKpi[] = [];
  let activity: EventView[] = [];
  try {
    [kpis, activity] = await Promise.all([getCompanyKpis(user), getRecentActivity(user, 10)]);
  } catch (err) {
    unstable_rethrow(err);
    console.error("[hub] company overview failed", err);
  }

  return (
    <ExecutiveSection title="Your company today">
      <div className="space-y-3" id="company-today">
        <AskBusiness />

        {kpis.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" id="company-kpis">
            {kpis.map((k) => (
              <Link key={k.key} href={k.href} className="block min-w-0" data-kpi={k.key}>
                <KpiCard label={k.label} value={k.value} format={k.format} icon={ICONS[k.key]} />
              </Link>
            ))}
          </div>
        )}

        {activity.length > 0 && (
          <GlassCard interactive={false}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <BarChart3 className="size-4 text-primary" /> Recent activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y" id="company-activity">
                {activity.map((e) => (
                  <li key={e.id} className="flex flex-col gap-0.5 py-2 text-sm sm:flex-row sm:items-baseline sm:gap-3">
                    <span className="min-w-0 flex-1 break-words">
                      <span className="font-medium">{eventLabel(e.type)}</span>
                      {e.label && (
                        <>
                          {": "}
                          {e.url ? (
                            <Link href={e.url} className="text-primary underline-offset-4 hover:underline">
                              {e.label}
                            </Link>
                          ) : (
                            e.label
                          )}
                        </>
                      )}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {e.actorEmail ? `${e.actorEmail} · ` : ""}
                      {formatDateTime(e.at)}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </GlassCard>
        )}
      </div>
    </ExecutiveSection>
  );
}
