"use client";

import { BarChart3, ScrollText, Settings } from "lucide-react";
import UnifiedProfileMenu from "@/components/platform/panel/UnifiedProfileMenu";
import { pmsLogoutAction } from "@/app/pms/(protected)/actions";
import { primaryPmsRoleLabel, canManageSettings, canViewActivityLog, type PmsRole } from "@/lib/pms-roles";

export default function PmsProfileMenu({
  email,
  roles,
  permissionOverrides,
  createdAt,
  lastLoginAt,
}: {
  email: string;
  roles: PmsRole[];
  permissionOverrides?: Record<string, boolean>;
  createdAt: string;
  lastLoginAt: string | null;
}) {
  const roleCtx = { roles, permissionOverrides };
  const roleLabel = primaryPmsRoleLabel(roles);

  const governanceItems = [
    { label: "Analytics", href: "/pms/analytics", icon: BarChart3 },
    ...(canManageSettings(roleCtx) ? [{ label: "Settings", href: "/pms/settings", icon: Settings }] : []),
    ...(canViewActivityLog(roleCtx) ? [{ label: "Audit Log", href: "/pms/activity", icon: ScrollText }] : []),
  ];

  return (
    <UnifiedProfileMenu
      email={email}
      roleLabel={roleLabel}
      roles={roles as string[]}
      createdAt={createdAt}
      lastLoginAt={lastLoginAt}
      governanceItems={governanceItems}
      onLogout={() => pmsLogoutAction()}
      panelName="Project Management"
    />
  );
}
