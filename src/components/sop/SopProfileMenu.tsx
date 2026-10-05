"use client";

import { BarChart3, ScrollText, Settings } from "lucide-react";
import UnifiedProfileMenu from "@/components/platform/panel/UnifiedProfileMenu";
import { sopLogoutAction } from "@/app/sop/(protected)/actions";
import { primarySopRoleLabel, effectiveSopRoles, SOP_ROLE_META } from "@/lib/sop-roles";

export default function SopProfileMenu({
  email,
  roles,
  flags,
  createdAt,
  lastLoginAt,
}: {
  email: string;
  roles: string[];
  flags: { compliance?: boolean; reports?: boolean; audit?: boolean; settings?: boolean };
  createdAt: string;
  lastLoginAt: string | null;
}) {
  const roleLabel = primarySopRoleLabel(roles);
  const roleNames = (roles.includes("super_admin") ? ["super_admin" as const] : effectiveSopRoles(roles)).map((r) => SOP_ROLE_META[r].label);

  const governanceItems = [
    ...(flags.reports ? [{ label: "Reports & Analytics", href: "/sop/reports", icon: BarChart3 }] : []),
    ...(flags.audit ? [{ label: "Audit Logs", href: "/sop/audit-logs", icon: ScrollText }] : []),
    ...(flags.settings ? [{ label: "Settings", href: "/sop/settings", icon: Settings }] : []),
  ];

  return (
    <UnifiedProfileMenu
      email={email}
      roleLabel={roleLabel}
      roles={roleNames}
      createdAt={createdAt}
      lastLoginAt={lastLoginAt}
      governanceItems={governanceItems}
      onLogout={() => sopLogoutAction()}
      panelName="Standard Operating Procedures"
    />
  );
}
