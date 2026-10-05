"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { LayoutGrid, LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import BrandMark from "@/components/BrandMark";
import PlatformSidebar, { type PlatformNavFlags } from "@/components/platform/panel/PlatformSidebar";
import { useSidebarCollapse } from "@/components/lms/SidebarCollapseContext";
import { BrandName } from "@/components/platform/BrandProvider";
import { hubLogoutAction } from "@/app/workspace/(protected)/actions";
import { cn } from "@/lib/utils";

const EXPANDED_WIDTH = 248;
const COLLAPSED_WIDTH = 68;

export default function PlatformSidebarShell({ email, flags }: { email: string; flags: PlatformNavFlags }) {
  const { collapsed, toggle, hydrated } = useSidebarCollapse();

  return (
    <motion.aside
      animate={{ width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH }}
      initial={false}
      transition={hydrated ? { type: "spring", stiffness: 320, damping: 32 } : { duration: 0 }}
      className="lms-surface hidden shrink-0 flex-col overflow-hidden rounded-3xl border border-border/40 bg-background/95 shadow-none backdrop-blur-md md:flex dark:bg-card/85"
    >
      <div className={cn("sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-border/60 bg-background/70 px-4 backdrop-blur-md dark:bg-card/60", collapsed ? "justify-center gap-1.5 px-2" : "justify-between")}>
        <div className="flex min-w-0 items-center gap-2">
          <BrandMark className="size-6 shrink-0" />
          {!collapsed && (
            <span className="truncate text-sm font-bold">
              <BrandName />
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-primary/8 hover:text-primary"
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <PlatformSidebar flags={flags} collapsed={collapsed} />
      </div>

      <div className={cn("shrink-0 border-t border-border/60 p-3", collapsed && "px-2")}>
        {!collapsed && <p className="mb-2 truncate px-1 text-xs text-muted-foreground" title={email}>{email}</p>}
        <div className={cn("flex gap-1", collapsed ? "flex-col items-center" : "items-center")}>
          <Link href="/workspace" aria-label="Workspace" className="flex flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-primary/5 hover:text-primary">
            <LayoutGrid className="size-4 shrink-0" />
            {!collapsed && "Workspace"}
          </Link>
          <form action={hubLogoutAction}>
            <button type="submit" aria-label="Sign out" className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
              <LogOut className="size-4 shrink-0" />
              {!collapsed && "Sign out"}
            </button>
          </form>
        </div>
      </div>
    </motion.aside>
  );
}
