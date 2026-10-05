"use client";

import { PanelHeading } from "@/components/platform/PanelsProvider";
import HelpLauncher from "@/components/support/HelpLauncher";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import OtsMobileSidebar from "@/components/ots/OtsMobileSidebar";
import OtsNotificationsBell from "@/components/ots/OtsNotificationsBell";
import PanelSearch from "@/components/platform/PanelSearch";
import ThemeToggle from "@/components/lms/ThemeToggle";
import { useAskAiOpen } from "@/lib/ai/use-ask-ai-open";
import AskAiDrawer from "@/components/platform/AskAiDrawer";
import type { OtsNavFlags } from "@/components/ots/OtsSidebar";
import type { OtsBellItem } from "@/lib/ots/notifications";

export default function OtsTopbar({
  roles,
  flags,
  notifications,
  unread,
}: {
  roles: string[];
  flags: OtsNavFlags;
  notifications: OtsBellItem[];
  unread: number;
}) {
  const [aiOpen, setAiOpen] = useAskAiOpen();
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 px-3 sm:gap-3 sm:px-4">
      <OtsMobileSidebar flags={flags} />
      <PanelHeading panel="ots" fallbackTitle="Online Test System" fallbackDescription="Create exams, quizzes & evaluate candidates" />
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
        <OtsNotificationsBell items={notifications} unread={unread} />
        <ThemeToggle />
      </div>
      <AskAiDrawer
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        panelId="ots"
        panelTitle="Online Test System"
        panelDescription="Create exams, quizzes & evaluate candidates"
        roles={roles}
      />
    </header>
  );
}
