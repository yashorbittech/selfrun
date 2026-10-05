"use client";

import { CalendarClock, ScrollText, Settings } from "lucide-react";
import UnifiedProfileMenu from "@/components/platform/panel/UnifiedProfileMenu";
import { dlmsLogoutAction } from "@/app/dlms/(protected)/actions";
import { primaryDlmsRoleLabel } from "@/lib/dlms-roles";

export default function DlmsProfileMenu({
  email,
  roles,
  createdAt,
  lastLoginAt,
  flags,
}: {
  email: string;
  roles: string[];
  createdAt: string;
  lastLoginAt: string | null;
  flags?: { audit?: boolean; settings?: boolean; expired?: number };
}) {
  const roleLabel = primaryDlmsRoleLabel(roles);

  const governanceItems = [
    { label: "Expiry & Alerts", href: "/dlms/expiry", icon: CalendarClock, badge: flags?.expired },
    ...(flags?.audit ? [{ label: "Activity Logs", href: "/dlms/audit-logs", icon: ScrollText }] : []),
    ...(flags?.settings ? [{ label: "Settings", href: "/dlms/settings", icon: Settings }] : []),
  ];

  return (
    <UnifiedProfileMenu
      email={email}
      roleLabel={roleLabel}
      roles={roles}
      createdAt={createdAt}
      lastLoginAt={lastLoginAt}
      governanceItems={governanceItems}
      onLogout={() => dlmsLogoutAction()}
      panelName="Document Lifecycle Management"
    />
  );
}
