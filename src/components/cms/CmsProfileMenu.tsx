"use client";

import { ScrollText, Settings } from "lucide-react";
import UnifiedProfileMenu from "@/components/platform/panel/UnifiedProfileMenu";
import { cmsLogoutAction } from "@/app/cms/(protected)/actions";
import { primaryCmsRoleLabel, CMS_ROLE_META, normalizeCmsRoles } from "@/lib/cms-roles";

export default function CmsProfileMenu({
  email,
  roles,
  flags = {},
  createdAt,
  lastLoginAt,
}: {
  email: string;
  roles: string[];
  flags?: any;
  createdAt: string;
  lastLoginAt: string | null;
}) {
  const roleLabel = primaryCmsRoleLabel(roles);
  const roleNames = (roles.includes("super_admin") ? ["super_admin" as const] : normalizeCmsRoles(roles)).map((r) => CMS_ROLE_META[r].label);

  const governanceItems = [
    ...(flags?.settings ? [{ label: "Settings", href: "/cms/settings", icon: Settings }] : []),
    ...(flags?.audit ? [{ label: "Audit Logs", href: "/cms/audit-logs", icon: ScrollText }] : []),
  ];

  return (
    <UnifiedProfileMenu
      email={email}
      roleLabel={roleLabel}
      roles={roleNames}
      createdAt={createdAt}
      lastLoginAt={lastLoginAt}
      governanceItems={governanceItems}
      onLogout={() => cmsLogoutAction()}
      panelName="Content Management"
    />
  );
}
