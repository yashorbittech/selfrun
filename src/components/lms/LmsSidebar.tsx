"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Briefcase,
  Bot,
  MessagesSquare,
  BookOpen,
  SlidersHorizontal,
  AudioLines,
  Mic,
  Settings2,
  Users,
  Gift,
  TicketPercent,
  ClipboardList,
  BarChart3,
  Settings,
  ScrollText,
  Coins,
  Sparkles,
  BookText,
  Share2,
  Megaphone,
  SlidersVertical,
  WalletCards,
  BellRing,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

function NavLink({
  href,
  label,
  icon: Icon,
  exact = false,
  collapsed = false,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname?.startsWith(href);

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
      {active && (
        <motion.span
          layoutId="lms-nav-active"
          className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/15 to-secondary/10"
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      )}
      <Icon className="relative size-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
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
  return (
    <div className="mt-4 mb-1 px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
      {children}
    </div>
  );
}

export default function LmsSidebar({ onNavigate, collapsed = false }: { onNavigate?: () => void; collapsed?: boolean }) {
  return (
    <nav className="flex h-full flex-col gap-1 p-3">
      <NavLink href="/lms" label="Dashboard" icon={LayoutDashboard} exact collapsed={collapsed} onNavigate={onNavigate} />

      <SectionLabel collapsed={collapsed}>Lead Management</SectionLabel>
      <NavLink href="/lms/leads" label="Leads" icon={Users} collapsed={collapsed} onNavigate={onNavigate} />
      <NavLink href="/lms/messages" label="Messages" icon={Inbox} collapsed={collapsed} onNavigate={onNavigate} />
      <NavLink href="/lms/careers" label="Applicants" icon={Briefcase} collapsed={collapsed} onNavigate={onNavigate} />

      <SectionLabel collapsed={collapsed}>Festival Offers</SectionLabel>
      <NavLink href="/lms/offers" label="Campaigns" icon={Gift} collapsed={collapsed} onNavigate={onNavigate} />
      <NavLink href="/lms/offers/coupons" label="Coupons" icon={TicketPercent} collapsed={collapsed} onNavigate={onNavigate} />
      <NavLink href="/lms/offers/claims" label="Claims" icon={ClipboardList} collapsed={collapsed} onNavigate={onNavigate} />
      <NavLink href="/lms/offers/subscribers" label="Subscribers" icon={BellRing} collapsed={collapsed} onNavigate={onNavigate} />

      <SectionLabel collapsed={collapsed}>Wallet & Credits</SectionLabel>
      <NavLink href="/lms/wallet" label="Overview" icon={Coins} exact collapsed={collapsed} onNavigate={onNavigate} />
      <NavLink href="/lms/wallet/rules" label="Reward Rules" icon={Sparkles} collapsed={collapsed} onNavigate={onNavigate} />
      <NavLink href="/lms/wallet/referrals" label="Referrals" icon={Share2} collapsed={collapsed} onNavigate={onNavigate} />
      <NavLink href="/lms/wallet/campaigns" label="Referral Campaigns" icon={Megaphone} collapsed={collapsed} onNavigate={onNavigate} />
      <NavLink href="/lms/wallet/usage-rules" label="Usage Rules" icon={SlidersVertical} collapsed={collapsed} onNavigate={onNavigate} />
      <NavLink href="/lms/wallet/wallets" label="Balances" icon={WalletCards} collapsed={collapsed} onNavigate={onNavigate} />
      <NavLink href="/lms/wallet/ledger" label="Ledger" icon={BookText} collapsed={collapsed} onNavigate={onNavigate} />

      <SectionLabel collapsed={collapsed}>AI Chatbot</SectionLabel>
      <NavLink href="/lms/chatbot" label="Dashboard" icon={Bot} exact collapsed={collapsed} onNavigate={onNavigate} />
      <NavLink href="/lms/chatbot/conversations" label="Conversations" icon={MessagesSquare} collapsed={collapsed} onNavigate={onNavigate} />
      <NavLink href="/lms/chatbot/knowledge-base" label="Knowledge Base" icon={BookOpen} collapsed={collapsed} onNavigate={onNavigate} />
      <NavLink href="/lms/chatbot/config" label="AI Config" icon={SlidersHorizontal} exact collapsed={collapsed} onNavigate={onNavigate} />

      <SectionLabel collapsed={collapsed}>Conversation AI</SectionLabel>
      <NavLink href="/lms/chatbot/voice" label="Voice Dashboard" icon={AudioLines} exact collapsed={collapsed} onNavigate={onNavigate} />
      <NavLink href="/lms/chatbot/voice/conversations" label="Voice Conversations" icon={Mic} collapsed={collapsed} onNavigate={onNavigate} />
      <NavLink href="/lms/chatbot/voice/config" label="ElevenLabs Config" icon={Settings2} collapsed={collapsed} onNavigate={onNavigate} />
    </nav>
  );
}
