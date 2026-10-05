"use client";

import { usePanelLabel, usePanels } from "@/components/platform/PanelsProvider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Wallet,
  FileText,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  RotateCcw,
  FileCheck2,
  ArrowLeftRight,
  ShoppingCart,
  FolderKanban,
  Users,
  GraduationCap,
  Landmark,
  CreditCard,
  Building2,
  Scale,
  BarChart3,
  Settings,
  ScrollText,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import type { FmsRole } from "@/lib/fms-roles";
import { canManageAccounts, canViewAuditLog } from "@/lib/fms-roles";

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

  const inner = (
    <>
      {active && (
        <motion.span
          layoutId="fms-nav-active"
          className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/15 to-secondary/10"
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      )}
      <Icon className="relative size-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
      {!collapsed && <span className="relative truncate">{label}</span>}
      {!collapsed && badge !== undefined && (
        <span className="relative ml-auto rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
          {badge}
        </span>
      )}
    </>
  );

  const link = (
    <Link
      href={href}
      onClick={onNavigate}
      aria-label={collapsed ? label : undefined}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        collapsed && "justify-center px-0",
        active ? "text-primary" : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
      )}
    >
      {inner}
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
  return (
    <div className="mt-4 mb-1 px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{children}</div>
  );
}

export default function FmsSidebar({
  roles,
  permissionOverrides,
  onNavigate,
  collapsed = false,
}: {
  roles: FmsRole[];
  permissionOverrides?: Record<string, boolean>;
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const panels = usePanels();
  const panelLabel = usePanelLabel();
  const roleCtx = { roles, permissionOverrides };
  const nav = (props: {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    exact?: boolean;
    badge?: string | number;
  }) => <NavLink {...props} collapsed={collapsed} onNavigate={onNavigate} />;

  return (
    <nav className="flex h-full flex-col gap-1 p-3">
      {/* ── MAIN ── */}
      {nav({ href: "/fms", label: "Dashboard", icon: LayoutDashboard, exact: true })}

      {/* ── PANELS ── */}
      <SectionLabel collapsed={collapsed}>Panels</SectionLabel>
      {panels.prms?.available !== false && nav({ href: "/fms/panels/prms", label: panelLabel("prms", "PRMS Panel"), icon: ShoppingCart })}
      {panels.pms?.available !== false && nav({ href: "/fms/panels/pms", label: panelLabel("pms", "PMS Panel"), icon: FolderKanban })}
      {panels.hrms?.available !== false && nav({ href: "/fms/panels/hrms", label: panelLabel("hrms", "HRMS Panel"), icon: Users })}
      {panels.tms?.available !== false && nav({ href: "/fms/panels/tms", label: panelLabel("tms", "TMS Panel"), icon: GraduationCap })}

      {/* ── FINANCE DESK ── */}
      <SectionLabel collapsed={collapsed}>Finance Desk</SectionLabel>
      {nav({ href: "/fms/receivables", label: "Receivables", icon: ArrowDownLeft })}
      {nav({ href: "/fms/payouts", label: "Payouts", icon: Send })}
      {nav({ href: "/fms/beneficiaries", label: "Bank Directory", icon: Building2 })}
      {nav({ href: "/fms/transactions", label: "Transactions", icon: ArrowLeftRight })}
    </nav>
  );
}
