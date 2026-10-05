"use client";

import { BarChart3, ScrollText, Settings } from "lucide-react";
import UnifiedProfileMenu from "@/components/platform/panel/UnifiedProfileMenu";
import { messengerLogoutAction } from "@/app/messenger/(protected)/actions";
import { primaryChatRoleLabel, CHAT_ROLE_META, type ChatRole } from "@/lib/messenger-roles";

export default function MessengerProfileMenu({
  email,
  displayName,
  roles,
  createdAt,
  lastLoginAt,
}: {
  email: string;
  displayName?: string;
  roles: ChatRole[];
  createdAt: string;
  lastLoginAt: string | null;
}) {
  const roleLabel = primaryChatRoleLabel(roles);
  const roleNames = roles.map((r) => CHAT_ROLE_META[r].label);

  const governanceItems = [
    { label: "Analytics", href: "/messenger", icon: BarChart3 },
    { label: "Settings", href: "/messenger/settings", icon: Settings },
    { label: "Audit Log", href: "/messenger/announcements", icon: ScrollText },
  ];

  return (
    <UnifiedProfileMenu
      email={email}
      name={displayName}
      roleLabel={roleLabel}
      roles={roleNames}
      createdAt={createdAt}
      lastLoginAt={lastLoginAt}
      governanceItems={governanceItems}
      onLogout={() => messengerLogoutAction()}
      panelName="Team Messenger"
    />
  );
}
