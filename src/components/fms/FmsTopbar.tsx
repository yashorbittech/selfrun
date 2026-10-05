"use client";

import { PanelHeading } from "@/components/platform/PanelsProvider";
import HelpLauncher from "@/components/support/HelpLauncher";
import { useState } from "react";
import Link from "next/link";
import { Sparkles, Bell } from "lucide-react";
import FmsMobileSidebar from "@/components/fms/FmsMobileSidebar";
import PanelSearch from "@/components/platform/PanelSearch";
import ThemeToggle from "@/components/lms/ThemeToggle";
import { useAskAiOpen } from "@/lib/ai/use-ask-ai-open";
import AskAiDrawer from "@/components/platform/AskAiDrawer";
import type { FmsRole } from "@/lib/fms-roles";

export default function FmsTopbar({
  roles,
  permissionOverrides,
}: {
  roles: FmsRole[];
  permissionOverrides?: Record<string, boolean>;
}) {
  const [aiOpen, setAiOpen] = useAskAiOpen();
  const [bellOpen, setBellOpen] = useState(false);
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 px-3 sm:gap-3 sm:px-4">
      <FmsMobileSidebar roles={roles} permissionOverrides={permissionOverrides} />
      <PanelHeading panel="fms" fallbackTitle="Finance Management" fallbackDescription="Budgets, invoices, expenses & financial reports" />
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
          href="/fms/notifications"
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
        panelId="fms"
        panelTitle="Financial Management System"
        panelDescription="Budgets, invoices, expenses & financial reports"
        roles={roles}
      />
    </header>
  );
}
