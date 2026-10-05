"use client";

import { BarChart3, ScrollText, Settings } from "lucide-react";
import UnifiedProfileMenu from "@/components/platform/panel/UnifiedProfileMenu";
import { prmsLogoutAction } from "@/app/prms/(protected)/actions";
import { primaryPrmsRoleLabel, canManageSettings, canViewAuditLog, type PrmsRole } from "@/lib/prms-roles";

export default function PrmsProfileMenu({
  email,
  roles,
  permissionOverrides,
  createdAt,
  lastLoginAt,
}: {
  email: string;
  roles: PrmsRole[];
  permissionOverrides?: Record<string, boolean>;
  createdAt: string;
  lastLoginAt: string | null;
}) {
  const roleCtx = { roles, permissionOverrides };
  const roleLabel = primaryPrmsRoleLabel(roles);

  const governanceItems = [
    { label: "Analytics", href: "/prms/analytics", icon: BarChart3 },
    ...(canManageSettings(roleCtx) ? [{ label: "Settings", href: "/prms/settings", icon: Settings }] : []),
    ...(canViewAuditLog(roleCtx) ? [{ label: "Audit Log", href: "/prms/activity", icon: ScrollText }] : []),
  ];

  return (
    <UnifiedProfileMenu
      email={email}
      roleLabel={roleLabel}
      roles={roles as string[]}
      createdAt={createdAt}
      lastLoginAt={lastLoginAt}
      governanceItems={governanceItems}
      onLogout={() => prmsLogoutAction()}
      panelName="Procurement Management"
    />
  );
}
