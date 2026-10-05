"use client";

import { BarChart3, Settings, ScrollText } from "lucide-react";
import UnifiedProfileMenu from "@/components/platform/panel/UnifiedProfileMenu";
import { hrmsLogoutAction } from "@/app/hrms/(protected)/actions";
import { primaryRoleLabel, type HrmsRole, canManageSettings, canViewAuditLog } from "@/lib/hrms-roles";

export default function HrmsProfileMenu({
  email,
  roles,
  permissionOverrides,
  createdAt,
  lastLoginAt,
}: {
  email: string;
  roles: HrmsRole[];
  permissionOverrides?: Record<string, boolean>;
  createdAt: string;
  lastLoginAt: string | null;
}) {
  const roleLabel = primaryRoleLabel(roles);
  const roleCtx = { roles, permissionOverrides };

  const governanceItems = [
    { label: "Analytics", href: "/hrms/analytics", icon: BarChart3 },
    ...(canManageSettings(roleCtx) ? [{ label: "Settings", href: "/hrms/settings", icon: Settings }] : []),
    ...(canViewAuditLog(roleCtx) ? [{ label: "Audit Log", href: "/hrms/audit", icon: ScrollText }] : []),
  ];

  return (
    <UnifiedProfileMenu
      email={email}
      roleLabel={roleLabel}
      roles={roles}
      createdAt={createdAt}
      lastLoginAt={lastLoginAt}
      governanceItems={governanceItems}
      onLogout={() => hrmsLogoutAction()}
      panelName="Human Resource Management"
    />
  );
}
