"use client";

import { History, Lock } from "lucide-react";
import UnifiedProfileMenu from "@/components/platform/panel/UnifiedProfileMenu";
import { hubLogoutAction } from "@/app/workspace/(protected)/actions";

export default function HubProfileMenu({
  email,
  roles = ["super_admin"],
  lastLoginAt,
}: {
  email: string;
  roles?: string[];
  lastLoginAt: string | null;
  links?: { href: string; label: string }[];
}) {
  const governanceItems = [
    { label: "Audit log", href: "/workspace/settings/audit-log", icon: History },
    { label: "Security", href: "/workspace/settings/security", icon: Lock },
  ];

  return (
    <UnifiedProfileMenu
      email={email}
      roleLabel="Super Admin"
      roles={roles}
      createdAt={new Date().toISOString()}
      lastLoginAt={lastLoginAt}
      governanceItems={governanceItems}
      onLogout={() => hubLogoutAction()}
      panelName="Workspace Hub"
    />
  );
}
