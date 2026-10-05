"use client";

import { PanelHeading } from "@/components/platform/PanelsProvider";
import HelpLauncher from "@/components/support/HelpLauncher";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import DlmsMobileSidebar from "@/components/dlms/DlmsMobileSidebar";
import DlmsNotificationsBell from "@/components/dlms/DlmsNotificationsBell";
import PanelSearch from "@/components/platform/PanelSearch";
import ThemeToggle from "@/components/lms/ThemeToggle";
import { useAskAiOpen } from "@/lib/ai/use-ask-ai-open";
import AskAiDrawer from "@/components/platform/AskAiDrawer";
import type { DlmsNavFlags } from "@/components/dlms/DlmsSidebar";
import type { DlmsBellItem } from "@/lib/dlms/notifications";

export default function DlmsTopbar({
  roles,
  flags,
  notifications,
  unread,
}: {
  roles: string[];
  flags: DlmsNavFlags;
  notifications: DlmsBellItem[];
  unread: number;
}) {
  const [aiOpen, setAiOpen] = useAskAiOpen();
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 px-3 sm:gap-3 sm:px-4">
      <DlmsMobileSidebar flags={flags} />
      <PanelHeading panel="dlms" fallbackTitle="Digi Locker" fallbackDescription="Securely store & manage digital documents" />
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
        <DlmsNotificationsBell items={notifications} unread={unread} />
        <ThemeToggle />
      </div>
      <AskAiDrawer
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        panelId="dlms"
        panelTitle="Document Lifecycle Management"
        panelDescription="Securely store & manage digital documents"
        roles={roles}
      />
    </header>
  );
}
