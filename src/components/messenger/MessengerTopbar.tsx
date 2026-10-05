"use client";

import { PanelHeading } from "@/components/platform/PanelsProvider";
import HelpLauncher from "@/components/support/HelpLauncher";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import MessengerMobileSidebar from "@/components/messenger/MessengerMobileSidebar";
import MessengerNotificationsBell, { type BellItem } from "@/components/messenger/MessengerNotificationsBell";
import { ConnectionPill } from "@/components/messenger/ConnectionPill";
import ThemeToggle from "@/components/lms/ThemeToggle";
import PanelSearch from "@/components/platform/PanelSearch";
import { useAskAiOpen } from "@/lib/ai/use-ask-ai-open";
import AskAiDrawer from "@/components/platform/AskAiDrawer";
import type { ChatRole } from "@/lib/messenger-roles";

export default function MessengerTopbar({
  roles,
  notifications,
  unread,
  unreadDms,
  unreadChannels,
}: {
  roles: ChatRole[];
  allRoles: string[];
  notifications: BellItem[];
  unread: number;
  unreadDms: number;
  unreadChannels: number;
}) {
  const [aiOpen, setAiOpen] = useAskAiOpen();
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 px-3 sm:gap-3 sm:px-4">
      <MessengerMobileSidebar
        roles={roles}
        unreadDms={unreadDms}
        unreadChannels={unreadChannels}
        unreadNotifications={unread}
      />
      <PanelHeading panel="messenger" fallbackTitle="Team Communication" fallbackDescription="Messages, channels & team collaboration" />
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
        <ConnectionPill />
        <MessengerNotificationsBell items={notifications} unread={unread} />
        <ThemeToggle />
      </div>
      <AskAiDrawer
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        panelId="messenger"
        panelTitle="Team Messenger"
        panelDescription="Messages, channels & team collaboration"
        roles={roles}
      />
    </header>
  );
}
