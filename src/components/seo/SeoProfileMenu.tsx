"use client";

import { ScrollText, Settings } from "lucide-react";
import UnifiedProfileMenu from "@/components/platform/panel/UnifiedProfileMenu";
import { seoLogoutAction } from "@/app/seo/(protected)/actions";
import { primarySeoRoleLabel, normalizeSeoRoles, SEO_ROLE_META } from "@/lib/seo-roles";

export default function SeoProfileMenu({
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
  const roleLabel = primarySeoRoleLabel(roles);
  const roleNames = (roles.includes("super_admin") ? ["super_admin" as const] : normalizeSeoRoles(roles)).map((r) => SEO_ROLE_META[r].label);

  const governanceItems = [
    ...(flags.settings ? [{ label: "SEO Settings", href: "/seo/settings", icon: Settings }] : []),
    ...(flags.audit ? [{ label: "Audit Logs", href: "/seo/audit-logs", icon: ScrollText }] : []),
  ];

  return (
    <UnifiedProfileMenu
      email={email}
      roleLabel={roleLabel}
      roles={roleNames}
      createdAt={createdAt}
      lastLoginAt={lastLoginAt}
      governanceItems={governanceItems}
      onLogout={() => seoLogoutAction()}
      panelName="SEO Management"
    />
  );
}
