"use client";

import { PanelHeading } from "@/components/platform/PanelsProvider";
import HelpLauncher from "@/components/support/HelpLauncher";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import AibotsMobileSidebar from "@/components/aibots/AibotsMobileSidebar";
import AibotsNotificationsBell from "@/components/aibots/AibotsNotificationsBell";
import PanelSearch from "@/components/platform/PanelSearch";
import ThemeToggle from "@/components/lms/ThemeToggle";
import { useAskAiOpen } from "@/lib/ai/use-ask-ai-open";
import AskAiDrawer from "@/components/platform/AskAiDrawer";
import type { AibotsNavFlags, SidebarBot } from "@/components/aibots/AibotsSidebar";
import type { AibotsBellItem } from "@/lib/aibots/notifications";

export default function AibotsTopbar({
  roles,
  flags,
  bots,
  notifications,
  unread,
}: {
  roles: string[];
  flags: AibotsNavFlags;
  bots: SidebarBot[];
  notifications: AibotsBellItem[];
  unread: number;
}) {
  const [aiOpen, setAiOpen] = useAskAiOpen();
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 px-3 sm:gap-3 sm:px-4">
      <AibotsMobileSidebar flags={flags} bots={bots} />
      <PanelHeading panel="aibots" fallbackTitle="AI Bots" fallbackDescription="Build, train & deploy AI-powered chatbots" />
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
        <AibotsNotificationsBell items={notifications} unread={unread} />
        <ThemeToggle />
      </div>
      <AskAiDrawer
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        panelId="aibots"
        panelTitle="AI Bots Management"
        panelDescription="Build, train & deploy AI-powered chatbots"
        roles={roles}
      />
    </header>
  );
}
