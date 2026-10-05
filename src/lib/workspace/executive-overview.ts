import "server-only";
import { getCommandCenterStats, type CommandCenterStats } from "@/lib/workspace/command-center";
import { runAdminNotificationSweeps } from "@/lib/workspace/module-notifications";
import { canViewCommandCenter } from "@/lib/workspace/nav";
import type { RoleContext } from "@/lib/permission-overrides";

/**
 * The one loader behind the executive sections of the dashboard (`/workspace`,
 * the former Command Center page): company-wide financial position, KPIs by
 * area and the panel performance matrix.
 *
 * Returns `null` — without querying anything — for a viewer who does not hold
 * the Command Center permission (`workspace.viewCommandCenter`), so the
 * dashboard cannot render company-wide figures for them even by mistake.
 */
export interface ExecutiveFilters {
  dateFrom?: string;
  dateTo?: string;
  granularity?: string;
}

export async function loadExecutiveOverview(user: RoleContext, filters: ExecutiveFilters = {}): Promise<CommandCenterStats | null> {
  if (!canViewCommandCenter(user)) return null;
  // Keeps the panels' time-based notifications fresh for the bell (each panel throttles itself to once an hour).
  await runAdminNotificationSweeps();
  return getCommandCenterStats({ dateFrom: filters.dateFrom, dateTo: filters.dateTo, granularity: filters.granularity as never });
}
