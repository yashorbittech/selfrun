"use client";

import { PanelHeading } from "@/components/platform/PanelsProvider";
import HelpLauncher from "@/components/support/HelpLauncher";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import MobileSidebar from "@/components/lms/MobileSidebar";
import PanelSearch from "@/components/platform/PanelSearch";
import ThemeToggle from "@/components/lms/ThemeToggle";
import NotificationsBell from "@/components/lms/NotificationsBell";
import { useAskAiOpen } from "@/lib/ai/use-ask-ai-open";
import AskAiDrawer from "@/components/platform/AskAiDrawer";
import type { SerializedLead, SerializedCareerApplication } from "@/components/lms/types";

export default function LmsTopbar({
  roles,
  staleLeads,
  staleLeadsCount = 0,
  staleApplications,
  staleApplicationsCount = 0,
  recentLeads,
  recentApplications,
}: {
  roles: string[];
  userEmail: string;
  staleLeads: SerializedLead[];
  staleLeadsCount: number;
  staleApplications: SerializedCareerApplication[];
  staleApplicationsCount: number;
  recentLeads: SerializedLead[];
  recentApplications: SerializedCareerApplication[];
}) {
  const [aiOpen, setAiOpen] = useAskAiOpen();
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 px-3 sm:gap-3 sm:px-4">
      <MobileSidebar />
      <PanelHeading panel="lms" fallbackTitle="Lead Management" fallbackDescription="Track leads, pipeline & career applications" />
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
        <NotificationsBell
          staleLeads={staleLeads}
          staleLeadsCount={staleLeadsCount}
          staleApplications={staleApplications}
          staleApplicationsCount={staleApplicationsCount}
          recentLeads={recentLeads}
          recentApplications={recentApplications}
        />
        <ThemeToggle />
      </div>
      <AskAiDrawer
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        panelId="lms"
        panelTitle="Lead Management System"
        panelDescription="Track leads, pipeline & career applications"
        roles={roles}
      />
    </header>
  );
}
