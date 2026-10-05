"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Library,
  UserRoundPen,
  ClipboardCheck,
  Building2,
  Tags,
  LayoutTemplate,
  ShieldCheck,
  BarChart3,
  ScrollText,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

/** Which optional sections this viewer may see — computed on the server from the real permission model. */
export interface SopNavFlags {
  mySops: boolean;
  templates: boolean;
  compliance: boolean;
  reports: boolean;
  audit: boolean;
  settings: boolean;
  /** Number of assignments still awaiting the viewer's acknowledgement. */
  assignedOpen: number;
}

function NavLink({
  href,
  label,
  icon: Icon,
  exact = false,
  collapsed = false,
  badge,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  collapsed?: boolean;
  badge?: string | number;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname?.startsWith(href);

  const link = (
    <Link
      href={href}
      onClick={onNavigate}
      aria-label={collapsed ? label : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        collapsed && "justify-center px-0",
        active ? "text-primary" : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
      )}
    >
      {active && (
        <motion.span
          layoutId="sop-nav-active"
          className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/15 to-secondary/10"
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      )}
      <Icon className="relative size-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
      {!collapsed && <span className="relative truncate">{label}</span>}
      {!collapsed && badge !== undefined && badge !== 0 && (
        <span className="relative ml-auto rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">{badge}</span>
      )}
    </Link>
  );

  if (!collapsed) return link;
  return (
    <Tooltip>
      <TooltipTrigger render={link} />
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

function SectionLabel({ children, collapsed }: { children: React.ReactNode; collapsed?: boolean }) {
  if (collapsed) return <div className="mt-4 mb-1 border-t border-border/50" />;
  return <div className="mt-4 mb-1 px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{children}</div>;
}

export default function SopSidebar({ flags, onNavigate, collapsed = false }: { flags: SopNavFlags; onNavigate?: () => void; collapsed?: boolean }) {
  const nav = (props: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; exact?: boolean; badge?: string | number }) => (
    <NavLink {...props} collapsed={collapsed} onNavigate={onNavigate} />
  );

  return (
    <nav className="flex h-full flex-col gap-1 p-3">
      {nav({ href: "/sop", label: "Dashboard", icon: LayoutDashboard, exact: true })}

      <SectionLabel collapsed={collapsed}>Library</SectionLabel>
      {nav({ href: "/sop/library", label: "SOP Library", icon: Library })}
      {flags.mySops && nav({ href: "/sop/my", label: "My SOPs", icon: UserRoundPen })}
      {nav({ href: "/sop/assigned", label: "Assigned SOPs", icon: ClipboardCheck, badge: flags.assignedOpen })}

      <SectionLabel collapsed={collapsed}>Structure</SectionLabel>
      {nav({ href: "/sop/departments", label: "Departments", icon: Building2 })}
      {nav({ href: "/sop/categories", label: "Categories", icon: Tags })}
      {flags.templates && nav({ href: "/sop/templates", label: "Templates", icon: LayoutTemplate })}
    </nav>
  );
}
