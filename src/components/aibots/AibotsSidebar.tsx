"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, MessageSquarePlus, Plus, Bot, MessagesSquare, ScrollText, Settings, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import BotAvatar from "@/components/aibots/BotAvatar";
import { GENERAL_BOT_ID } from "@/lib/aibots/constants";

/** Which optional sections this viewer may see — computed on the server from the real permission model. */
export interface AibotsNavFlags {
  createBot: boolean;
  manageBots: boolean;
  allChats: boolean;
  audit: boolean;
  settings: boolean;
}

/** One bot as the sidebar needs it — loaded from the database, never hardcoded. */
export interface SidebarBot {
  _id: string;
  name: string;
  icon: string;
  color: string;
}

function NavLink({
  href,
  label,
  icon,
  exact = false,
  collapsed = false,
  onNavigate,
  highlight = false,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  exact?: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
  highlight?: boolean;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname?.startsWith(`${href}/`);

  const link = (
    <Link
      href={href}
      onClick={onNavigate}
      aria-label={collapsed ? label : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        collapsed && "justify-center px-0",
        highlight && !active && "bg-primary/8 text-primary hover:bg-primary/12",
        !highlight && !active && "text-muted-foreground hover:bg-primary/5 hover:text-primary",
        active && "text-primary"
      )}
    >
      {active && (
        <motion.span
          layoutId="aibots-nav-active"
          className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/15 to-secondary/10"
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      )}
      <span className="relative flex shrink-0 items-center transition-transform duration-200 group-hover:scale-110">{icon}</span>
      {!collapsed && <span className="relative truncate">{label}</span>}
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

export default function AibotsSidebar({ flags, bots, onNavigate, collapsed = false }: { flags: AibotsNavFlags; bots: SidebarBot[]; onNavigate?: () => void; collapsed?: boolean }) {
  const [filter, setFilter] = useState("");
  const shown = filter ? bots.filter((b) => b.name.toLowerCase().includes(filter.toLowerCase())) : bots;
  const common = { collapsed, onNavigate };

  return (
    <nav className="flex h-full flex-col gap-1 p-3">
      <NavLink {...common} href="/aibots" label="Dashboard" icon={<LayoutDashboard className="size-4" />} exact />

      <SectionLabel collapsed={collapsed}>Create</SectionLabel>
      <NavLink {...common} href={`/aibots/b/${GENERAL_BOT_ID}`} label="Start New Chat" icon={<MessageSquarePlus className="size-4" />} highlight />
      {flags.createBot && <NavLink {...common} href="/aibots/bots/new" label="Create Bot" icon={<Plus className="size-4" />} exact />}

      <SectionLabel collapsed={collapsed}>AI Bots</SectionLabel>
      {!collapsed && bots.length > 8 && (
        <label className="mb-1 flex items-center gap-2 rounded-lg border border-border/50 bg-background/60 px-2.5 py-1.5 text-xs text-muted-foreground focus-within:border-primary/40">
          <Search className="size-3.5 shrink-0" />
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Find a bot" aria-label="Find a bot" className="w-full bg-transparent text-foreground outline-none placeholder:text-muted-foreground" />
        </label>
      )}
      {shown.map((b) => (
        <NavLink key={b._id} {...common} href={`/aibots/b/${b._id}`} label={b.name} icon={<BotAvatar icon={b.icon} color={b.color} size="sm" />} />
      ))}
      {bots.length === 0 && !collapsed && (
        <p className="px-3 py-2 text-xs text-muted-foreground">{flags.createBot ? "No bots yet — create the first one." : "No bots have been shared with you yet."}</p>
      )}
      {filter && shown.length === 0 && !collapsed && <p className="px-3 py-2 text-xs text-muted-foreground">No bot matches “{filter}”.</p>}

      {(flags.manageBots || flags.allChats || flags.audit || flags.settings) && <SectionLabel collapsed={collapsed}>Manage</SectionLabel>}
      {flags.manageBots && <NavLink {...common} href="/aibots/bots" label="Manage Bots" icon={<Bot className="size-4" />} exact />}
      {flags.allChats && <NavLink {...common} href="/aibots/chats" label="All Chats" icon={<MessagesSquare className="size-4" />} />}
      {flags.audit && <NavLink {...common} href="/aibots/audit-logs" label="Activity Log" icon={<ScrollText className="size-4" />} />}
      {flags.settings && <NavLink {...common} href="/aibots/settings" label="Settings" icon={<Settings className="size-4" />} />}
    </nav>
  );
}
