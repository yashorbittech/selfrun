"use client";

import { PanelHeading } from "@/components/platform/PanelsProvider";
import HelpLauncher from "@/components/support/HelpLauncher";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import HrmsMobileSidebar from "@/components/hrms/HrmsMobileSidebar";
import HrmsNotificationsBell, { type BellItem } from "@/components/hrms/HrmsNotificationsBell";
import PanelSearch from "@/components/platform/PanelSearch";
import ThemeToggle from "@/components/lms/ThemeToggle";
import { useAskAiOpen } from "@/lib/ai/use-ask-ai-open";
import AskAiDrawer from "@/components/platform/AskAiDrawer";
import type { HrmsRole } from "@/lib/hrms-roles";

export default function HrmsTopbar({
  roles,
  permissionOverrides,
  employeeId,
  notifications,
  unread = 0,
}: {
  roles: HrmsRole[];
  allRoles: string[];
  permissionOverrides?: Record<string, boolean>;
  employeeId: string | null;
  notifications: BellItem[];
  unread: number;
}) {
  const [aiOpen, setAiOpen] = useAskAiOpen();
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 px-3 sm:gap-3 sm:px-4">
      <HrmsMobileSidebar roles={roles} permissionOverrides={permissionOverrides} employeeId={employeeId} />
      <PanelHeading panel="hrms" fallbackTitle="Human Resources" fallbackDescription="Manage employees, attendance & payroll" />
      <div className="flex min-w-0 flex-1 justify-center">
        <PanelSearch />
      </div>
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <HelpLauncher />
        <button
          type="button"
          onClick={() => setAiOpen(!aiOpen)}
          title="Ask AI Assistant"
          aria-label="Ask AI Assistant"
          className="flex size-9 items-center justify-center rounded-full border border-border/60 bg-muted/30 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
        >
          <Sparkles className="size-4" />
        </button>
        <HrmsNotificationsBell items={notifications} unread={unread} basePath="/hrms" />
        <ThemeToggle />
      </div>
      <AskAiDrawer
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        panelId="hrms"
        panelTitle="Human Resource Management"
        panelDescription="Manage employees, attendance & payroll"
        roles={roles}
      />
    </header>
  );
}
