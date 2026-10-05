import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import { listPanels } from "@/lib/platform/panels/store";
import Link from "next/link";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import { countSeatsUsed } from "@/lib/platform/billing/enforce";
import { getEntitlements } from "@/lib/platform/billing/entitlements";
import { requireWorkspaceAccess } from "@/lib/workspace/access";
import { searchAdminUsers, type AdminUserRow } from "@/lib/workspace/admin-users";
import { ALL_KNOWN_ROLES } from "@/lib/workspace/role-catalog";
import { Badge } from "@/components/ui/badge";
import UsersFilterBar from "./UsersFilterBar";
import UsersGrid from "./UsersGrid";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    search?: string;
    role?: string;
    panel?: string;
    status?: "active" | "deactivated";
    userType?: "employee" | "contractor" | "partner" | "system";
    sortBy?: string;
    sortDir?: string;
  }>;
}) {
  const panelCount = (await listPanels()).length;
  const admin = await requireWorkspaceAccess("company.users");
  const sp = await searchParams;
  const page = Math.max(Number(sp.page) || 1, 1);
  const role = sp.role && ALL_KNOWN_ROLES.includes(sp.role) ? sp.role : undefined;
  const panel = sp.panel ?? undefined;
  const status = sp.status === "active" || sp.status === "deactivated" ? sp.status : undefined;
  const userType = sp.userType;
  const sortBy = sp.sortBy === "email" || sp.sortBy === "lastLoginAt" ? sp.sortBy : "createdAt";
  const sortDir = sp.sortDir === "asc" ? "asc" : "desc";

  const { items, total, activeCount, deactivatedCount, totalPages } = await searchAdminUsers({
    page,
    pageSize: 20,
    search: sp.search,
    role,
    panel,
    status,
    userType,
    sortBy,
    sortDir,
  });

  const rows: AdminUserRow[] = items;
  // Seats against the plan — the same count and limit that creating a user is checked against.
  const [seatsUsed, entitlements] = await Promise.all([countSeatsUsed(), getEntitlements()]);
  const seatLimit = entitlements.limits.seats;
  const hasActiveFilters = Boolean(sp.search || role || panel || status || userType);

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[{ label: "Workspace", href: "/workspace" }, { label: "Centralized User & Access Management" }]}
        title={<>Centralized User &amp; Role Management</>}
        description={<>Complete identity control &amp; panel-wise user roster across all {panelCount} platform panels.</>}
        actions={<><div className="flex flex-wrap items-center gap-2">
          <Link href="/workspace/settings/usage" id="users-seats" title="Seats used against your plan">
            <Badge variant="outline" className="px-3 py-1 text-xs gap-1.5 bg-primary/10 text-primary border-primary/20">
              <span className="font-semibold">
                {seatsUsed} / {seatLimit === null ? "Unlimited" : seatLimit}
              </span>{" "}
              seats
            </Badge>
          </Link>
          <Badge variant="outline" className="px-3 py-1 text-xs gap-1.5 bg-card">
            <span className="font-semibold text-foreground">{total}</span> accounts shown
          </Badge>
          <Badge variant="outline" className="px-3 py-1 text-xs gap-1.5 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
            <span className="font-semibold">{activeCount}</span> Active
          </Badge>
          <Badge variant="outline" className="px-3 py-1 text-xs gap-1.5 bg-rose-500/10 text-rose-600 border-rose-500/20">
            <span className="font-semibold">{deactivatedCount}</span> Deactivated
          </Badge>
        </div></>}
      />

      <UsersGrid
        rows={rows}
        total={total}
        page={page}
        totalPages={totalPages}
        sortBy={sortBy}
        sortDir={sortDir}
        hasActiveFilters={hasActiveFilters}
        currentAdminId={admin.id}
        filters={
          <UsersFilterBar
            initialSearch={sp.search ?? ""}
            initialRole={role ?? ""}
            initialPanel={panel ?? ""}
            initialStatus={status ?? ""}
            initialUserType={userType ?? ""}
          />
        }
      />
    </div>
  );
}
