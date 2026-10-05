"use client";

import { PanelHeading } from "@/components/platform/PanelsProvider";
import HelpLauncher from "@/components/support/HelpLauncher";
import { useState } from "react";
import Link from "next/link";
import { Sparkles, Bell } from "lucide-react";
import IntelligenceMobileSidebar from "@/components/intelligence/IntelligenceMobileSidebar";
import ThemeToggle from "@/components/lms/ThemeToggle";
import PanelSearch from "@/components/platform/PanelSearch";
import { useAskAiOpen } from "@/lib/ai/use-ask-ai-open";
import AskAiDrawer from "@/components/platform/AskAiDrawer";

export default function IntelligenceTopbar({ roles: _roles }: { roles: string[] }) {
  const [aiOpen, setAiOpen] = useAskAiOpen();
  const [bellOpen, setBellOpen] = useState(false);
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 px-3 sm:gap-3 sm:px-4">
      <IntelligenceMobileSidebar />
      <PanelHeading panel="intelligence" fallbackTitle="AI Intelligence" fallbackDescription="Data analytics, insights & AI reports" />
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
        <Link
          href="/intelligence/notifications"
          title="Notifications"
          aria-label="Notifications"
          className="flex size-9 items-center justify-center rounded-full border border-border/60 bg-muted/30 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
        >
          <Bell className="size-4" />
        </Link>
        <ThemeToggle />
      </div>
      <AskAiDrawer
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        panelId="intelligence"
        panelTitle="Business Intelligence"
        panelDescription="Data analytics, insights & AI reports"
        roles={_roles}
      />
    </header>
  );
}
