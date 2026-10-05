"use client";

import { PanelHeading } from "@/components/platform/PanelsProvider";
import HelpLauncher from "@/components/support/HelpLauncher";
import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Sparkles, Bell } from "lucide-react";
import CmsMobileSidebar from "@/components/cms/CmsMobileSidebar";
import CmsCommandSearch from "@/components/cms/CmsCommandSearch";
import ThemeToggle from "@/components/lms/ThemeToggle";
import { useAskAiOpen } from "@/lib/ai/use-ask-ai-open";
import AskAiDrawer from "@/components/platform/AskAiDrawer";
import type { CmsNavFlags } from "@/components/cms/CmsSidebar";

export default function CmsTopbar({ roles: _roles, flags }: { roles: string[]; flags: CmsNavFlags }) {
  const [aiOpen, setAiOpen] = useAskAiOpen();
  const [bellOpen, setBellOpen] = useState(false);
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 px-3 sm:gap-3 sm:px-4">
      <CmsMobileSidebar flags={flags} />
      <PanelHeading panel="cms" className="hidden min-w-0 lg:block" fallbackTitle="Website" fallbackDescription="Your public website, pages and content" />
      <div className="flex min-w-0 flex-1 justify-center">
        <CmsCommandSearch />
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
          href="/cms/notifications"
          title="Notifications"
          aria-label="Notifications"
          className="flex size-9 items-center justify-center rounded-full border border-border/60 bg-muted/30 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
        >
          <Bell className="size-4" />
        </Link>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary sm:inline-flex"
        >
          <ExternalLink className="size-3.5" /> View website
        </a>
        <ThemeToggle />
      </div>
      <AskAiDrawer
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        panelId="cms"
        panelTitle="Content Management System"
        panelDescription="Pages, blogs & website content"
        roles={_roles}
      />
    </header>
  );
}
