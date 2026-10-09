"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Files, Image as ImageIcon, Menu as MenuIcon, PanelBottom, ClipboardList, Palette, Settings, BadgeInfo, Layers, Newspaper, Briefcase, Users, Boxes, SearchCheck, Paintbrush, BellRing,
  Bot, MessagesSquare, BookOpen, SlidersHorizontal, AudioLines, Mic, Settings2, Gift, TicketPercent, Coins, Sparkles, BookText,
  Share2, Megaphone, SlidersVertical, WalletCards,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

/** Which optional sections this viewer may see (and small counts) — computed on the server from the real permission model. */
export interface CmsNavFlags {
  settings: boolean;
  audit: boolean;
  /** Pages with unpublished changes — shown as a count on "Pages". */
  pendingPages?: number;
  /** Key of the active theme, for the Appearance → Customize shortcut. */
  activeTheme?: string;
}

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }>; exact?: boolean; count?: number };

function NavLink({
  href,
  label,
  icon: Icon,
  exact = false,
  count,
  collapsed = false,
  onNavigate,
}: NavItem & {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const search = useSearchParams();
  // Links with a query (e.g. /cms/pages?area=services) are active only for that exact filter;
  // their bare path (/cms/pages) is active only without it.
  const [base, query] = href.split("?");
  const area = search?.get("area") ?? null;
  const wantArea = query ? new URLSearchParams(query).get("area") : null;
  const pathMatch = exact || query ? pathname === base : pathname === base || pathname?.startsWith(base + "/");
  // A filtered link (Services) is active only on its filter; "Pages" is active everywhere else under /cms/pages.
  const active = pathMatch && (query ? area === wantArea : !(pathname === base && area));

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
          layoutId="cms-nav-active"
          className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/15 to-secondary/10"
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      )}
      <Icon className="relative size-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
      {!collapsed && <span className="relative truncate">{label}</span>}
      {!collapsed && count ? (
        <span className="relative ml-auto rounded-full bg-amber-500/15 px-1.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400" title={`${count} with unpublished changes`}>
          {count}
        </span>
      ) : null}
      {collapsed && count ? <span className="absolute right-2 top-1.5 size-1.5 rounded-full bg-amber-500" /> : null}
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

export default function CmsSidebar({ flags, onNavigate, collapsed = false }: { flags: CmsNavFlags; onNavigate?: () => void; collapsed?: boolean }) {
  const groups: { label: string | null; items: NavItem[] }[] = [
    { label: null, items: [{ href: "/cms", label: "Dashboard", icon: LayoutDashboard, exact: true }] },
    {
      label: "Content",
      items: [
        { href: "/cms/pages", label: "Pages", icon: Files, count: flags.pendingPages },
        { href: "/cms/pages?area=services", label: "Services", icon: Layers },
        { href: "/cms/collections/blog", label: "Blog Posts", icon: Newspaper },
        { href: "/cms/collections/jobs", label: "Careers", icon: Briefcase },
        { href: "/cms/collections/engagement", label: "Hiring Models", icon: Users },
        { href: "/cms/collections/products", label: "Products", icon: Boxes },
      ],
    },
    {
      label: "Assets",
      items: [
        { href: "/cms/media", label: "Media Library", icon: ImageIcon },
        { href: "/cms/forms", label: "Forms", icon: ClipboardList },
      ],
    },
    {
      label: "Appearance",
      items: [
        { href: "/cms/theme", label: "Themes", icon: Palette },
        { href: `/cms/customize/${flags.activeTheme ?? "default"}`, label: "Customize", icon: Paintbrush },
        { href: "/cms/navigation", label: "Menus", icon: MenuIcon },
        { href: "/cms/footer", label: "Footer", icon: PanelBottom },
        { href: "/cms/site-identity", label: "Site Identity", icon: BadgeInfo },
      ],
    },
    {
      label: "Search",
      items: [{ href: "/cms/seo", label: "SEO Overview", icon: SearchCheck }],
    },
    {
      label: "Applicants",
      items: [{ href: "/lms/careers", label: "Applicants", icon: Briefcase }],
    },
    {
      label: "Festival Offers",
      items: [
        { href: "/cms/offers", label: "Campaigns", icon: Gift },
        { href: "/cms/offers/coupons", label: "Coupons", icon: TicketPercent },
        { href: "/cms/offers/claims", label: "Claims", icon: ClipboardList },
        { href: "/cms/offers/subscribers", label: "Subscribers", icon: BellRing },
      ],
    },
    {
      label: "Wallet & Credits",
      items: [
        { href: "/cms/wallet", label: "Overview", icon: Coins, exact: true },
        { href: "/cms/wallet/rules", label: "Reward Rules", icon: Sparkles },
        { href: "/cms/wallet/referrals", label: "Referrals", icon: Share2 },
        { href: "/cms/wallet/campaigns", label: "Referral Campaigns", icon: Megaphone },
        { href: "/cms/wallet/usage-rules", label: "Usage Rules", icon: SlidersVertical },
        { href: "/cms/wallet/wallets", label: "Balances", icon: WalletCards },
        { href: "/cms/wallet/ledger", label: "Ledger", icon: BookText },
      ],
    },
    {
      label: "AI Chatbot",
      items: [
        { href: "/cms/chatbot", label: "Dashboard", icon: Bot, exact: true },
        { href: "/cms/chatbot/conversations", label: "Conversations", icon: MessagesSquare },
        { href: "/cms/chatbot/knowledge-base", label: "Knowledge Base", icon: BookOpen },
        { href: "/cms/chatbot/config", label: "AI Config", icon: SlidersHorizontal, exact: true },
      ],
    },
    {
      label: "Conversation AI",
      items: [
        { href: "/cms/chatbot/voice", label: "Voice Dashboard", icon: AudioLines, exact: true },
        { href: "/cms/chatbot/voice/conversations", label: "Voice Conversations", icon: Mic },
        { href: "/cms/chatbot/voice/config", label: "ElevenLabs Config", icon: Settings2 },
      ],
    },
    ...(flags.settings ? [{ label: "Engagement", items: [{ href: "/cms/push", label: "Push notifications", icon: BellRing }] }] : []),
    {
      label: "Settings",
      items: [
        ...(flags.settings ? [{ href: "/cms/settings", label: "Settings", icon: Settings }] : []),
      ],
    },
  ];

  return (
    <nav className="flex h-full flex-col gap-0.5 p-3" aria-label="CMS">
      {groups
        .filter((g) => g.items.length > 0)
        .map((g, i) => (
          <div key={g.label ?? i} className="flex flex-col gap-0.5">
            {g.label && <SectionLabel collapsed={collapsed}>{g.label}</SectionLabel>}
            {g.items.map((item) => (
              <NavLink key={item.href} {...item} collapsed={collapsed} onNavigate={onNavigate} />
            ))}
          </div>
        ))}
    </nav>
  );
}
