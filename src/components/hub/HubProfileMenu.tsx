"use client";

import { History, Lock, ShieldCheck } from "lucide-react";
import UnifiedProfileMenu from "@/components/platform/panel/UnifiedProfileMenu";
import { hubLogoutAction } from "@/app/workspace/(protected)/actions";

export default function HubProfileMenu({
  email,
  roles = ["super_admin"],
  lastLoginAt,
  links,
}: {
  email: string;
  roles?: string[];
  lastLoginAt: string | null;
  links?: { href: string; label: string }[];
}) {
  // The workspace's nav lists the Platform Panel only for people who have platform access, so its link shows up here for them alone.
  const platform = links?.find((l) => l.href === "/platform");
  const governanceItems = [
    ...(platform ? [{ label: platform.label || "Platform Panel", href: platform.href, icon: ShieldCheck }] : []),
    { label: "Audit log", href: "/workspace/settings/audit-log", icon: History },
    { label: "Security", href: "/workspace/settings/security", icon: Lock },
    { label: "Sessions & devices", href: "/workspace/account/sessions", icon: History },
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
