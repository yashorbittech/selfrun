"use client";

import { BarChart3, ScrollText, Settings } from "lucide-react";
import UnifiedProfileMenu from "@/components/platform/panel/UnifiedProfileMenu";
import { tmsLogoutAction } from "@/app/tms/(protected)/actions";
import { primaryTmsRoleLabel, canManageSettings, canViewAuditLog, canManageTraining, type TmsRole } from "@/lib/tms-roles";

export default function TmsProfileMenu({
  email,
  roles,
  permissionOverrides,
  createdAt,
  lastLoginAt,
}: {
  email: string;
  roles: TmsRole[];
  permissionOverrides?: Record<string, boolean>;
  createdAt: string;
  lastLoginAt: string | null;
}) {
  const roleCtx = { roles, permissionOverrides };
  const roleLabel = primaryTmsRoleLabel(roles);

  const governanceItems = [
    ...(canManageTraining(roleCtx) ? [{ label: "Analytics", href: "/tms/reports", icon: BarChart3 }] : []),
    ...(canManageSettings(roleCtx) ? [{ label: "Settings", href: "/tms/settings", icon: Settings }] : []),
    ...(canViewAuditLog(roleCtx) ? [{ label: "Audit Log", href: "/tms/activity", icon: ScrollText }] : []),
  ];

  return (
    <UnifiedProfileMenu
      email={email}
      roleLabel={roleLabel}
      roles={roles as string[]}
      createdAt={createdAt}
      lastLoginAt={lastLoginAt}
      governanceItems={governanceItems}
      onLogout={() => tmsLogoutAction()}
      panelName="Training Management"
    />
  );
}
