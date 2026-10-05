"use client";

import { BarChart3, Settings, ScrollText } from "lucide-react";
import UnifiedProfileMenu from "@/components/platform/panel/UnifiedProfileMenu";
import { fmsLogoutAction } from "@/app/fms/(protected)/actions";
import { primaryFmsRoleLabel, type FmsRole, canManageAccounts, canViewAuditLog } from "@/lib/fms-roles";

export default function FmsProfileMenu({
  email,
  roles,
  permissionOverrides,
  createdAt,
  lastLoginAt,
}: {
  email: string;
  roles: FmsRole[];
  permissionOverrides?: Record<string, boolean>;
  createdAt: string;
  lastLoginAt: string | null;
}) {
  const roleLabel = primaryFmsRoleLabel(roles);
  const roleCtx = { roles, permissionOverrides };

  const governanceItems = [
    { label: "Analytics", href: "/fms/reports/financial-summary", icon: BarChart3 },
    ...(canManageAccounts(roleCtx) ? [{ label: "Settings", href: "/fms/settings/accounts", icon: Settings }] : []),
    ...(canViewAuditLog(roleCtx) ? [{ label: "Audit Log", href: "/fms/audit-logs", icon: ScrollText }] : []),
  ];

  return (
    <UnifiedProfileMenu
      email={email}
      roleLabel={roleLabel}
      roles={roles}
      createdAt={createdAt}
      lastLoginAt={lastLoginAt}
      governanceItems={governanceItems}
      onLogout={() => fmsLogoutAction()}
      panelName="Financial Management System"
    />
  );
}
