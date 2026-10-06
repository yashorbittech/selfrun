"use client";

import { PanelHeading } from "@/components/platform/PanelsProvider";
import HelpLauncher from "@/components/support/HelpLauncher";
import { useState } from "react";
import Link from "next/link";
import { LayoutGrid, LogOut, Menu, Sparkles } from "lucide-react";
import { hubLogoutAction } from "@/app/workspace/(protected)/actions";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import ThemeToggle from "@/components/lms/ThemeToggle";
import BrandMark from "@/components/BrandMark";
import { BrandName } from "@/components/platform/BrandProvider";
import PlatformSidebar, { type PlatformNavFlags } from "@/components/platform/panel/PlatformSidebar";
import { useAskAiOpen } from "@/lib/ai/use-ask-ai-open";
import PanelBellLink from "@/components/platform/PanelBellLink";
import AskAiDrawer from "@/components/platform/AskAiDrawer";

export default function PlatformTopbar({ flags, email }: { flags: PlatformNavFlags; email: string }) {
  const [open, setOpen] = useState(false);
  const [aiOpen, setAiOpen] = useAskAiOpen();
  const [bellOpen, setBellOpen] = useState(false);
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 px-3 sm:gap-3 sm:px-4">
      <Button type="button" variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(true)} aria-label="Open navigation menu">
        <Menu className="size-5" />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="flex w-72 flex-col p-0 sm:max-w-72">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">Platform Panel navigation menu</SheetDescription>
          <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border/60 px-4">
            <BrandMark className="size-6 shrink-0" />
            <span className="text-sm font-bold">
              <BrandName />
            </span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <PlatformSidebar flags={flags} onNavigate={() => setOpen(false)} />
          </div>
          {/* The signed-in person, as in the desktop sidebar's footer. */}
          <div className="shrink-0 border-t border-border/60 p-3">
            <p className="mb-2 truncate px-1 text-xs text-muted-foreground" title={email}>{email}</p>
            <div className="flex items-center gap-1">
              <Link href="/workspace" onClick={() => setOpen(false)} className="flex flex-1 items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-primary/5 hover:text-primary">
                <LayoutGrid className="size-4 shrink-0" /> Workspace
              </Link>
              <form action={hubLogoutAction}>
                <button type="submit" className="flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                  <LogOut className="size-4 shrink-0" /> Sign out
                </button>
              </form>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      <PanelHeading panel="platform" fallbackTitle="Platform Panel" fallbackDescription="Every company, plan and setting of the SaaS platform" />
      <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
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
        <PanelBellLink href="/platform/notifications" unread={flags.unreadNotifications ?? 0} />
        <ThemeToggle />
      </div>
      <AskAiDrawer
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        panelId="platform"
        panelTitle="Platform Administration"
        panelDescription="Every company, plan and setting of the SaaS platform"
      />
    </header>
  );
}
