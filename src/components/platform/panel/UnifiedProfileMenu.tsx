"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePanelMeta } from "@/components/platform/PanelsProvider";
import { LogOut, Settings, ShieldCheck, UserRound, Clock } from "lucide-react";
import { useSidebarCollapse } from "@/components/lms/SidebarCollapseContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { formatDateTime, cn } from "@/lib/utils";

export interface GovernanceLinkItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

export interface UnifiedProfileMenuProps {
  email?: string;
  name?: string;
  roleLabel?: string;
  roles?: string[];
  createdAt?: string;
  lastLoginAt?: string | null;
  governanceItems?: GovernanceLinkItem[];
  onLogout?: () => void;
  panelName?: string;
}

function nameFromEmail(email: string): string {
  const local = email.split("@")[0] || "user";
  const words = local.replace(/[._-]+/g, " ").replace(/\d+/g, " ").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "Info";
  return words.map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

function initialsFor(emailOrName: string) {
  const clean = emailOrName.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
  return (clean.slice(0, 2) || "IN").toUpperCase();
}

export default function UnifiedProfileMenu({
  email = "",
  name,
  roleLabel = "Administrator",
  roles = ["admin"],
  createdAt = new Date().toISOString(),
  lastLoginAt = null,
  governanceItems = [],
  onLogout,
  panelName: fallbackPanelName = "Workspace",
}: UnifiedProfileMenuProps) {
  // The panel is named by the Panel Registry (the panel this profile menu sits in), like every other listing.
  const panelName = usePanelMeta(usePathname().split("/")[1] ?? "")?.name ?? fallbackPanelName;
  const { collapsed } = useSidebarCollapse();
  const [isPending, startTransition] = useTransition();
  const [profileOpen, setProfileOpen] = useState(false);

  const displayName = name || nameFromEmail(email);
  const initials = initialsFor(email);

  const isSuperAdmin =
    !roleLabel ||
    roleLabel === "Workspace User" ||
    roleLabel.toLowerCase().includes("super") ||
    roleLabel.toLowerCase().includes("admin") ||
    roles?.some((r) =>
      ["super_admin", "admin", "owner", "user"].includes(String(r).toLowerCase()) ||
      String(r).toLowerCase().includes("admin")
    );
  const finalRoleLabel = isSuperAdmin ? "Super Admin" : (roleLabel || "Super Admin");

  const handleLogout = () => {
    if (onLogout) {
      startTransition(() => {
        onLogout();
      });
    }
  };

  return (
    <div className="shrink-0 border-t border-border/60 p-2">
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "flex w-full items-center gap-2.5 rounded-xl p-2 text-left transition-all hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            collapsed && "justify-center px-0"
          )}
        >
          <Avatar className="size-8.5 shrink-0 ring-2 ring-primary/20">
            <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-sm font-semibold text-foreground">
                {displayName}
              </span>
              <span className="block truncate text-[11px] text-muted-foreground">
                {finalRoleLabel}
              </span>
            </span>
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" side="top" className="w-68 p-1.5 shadow-2xl backdrop-blur-xl">
          {/* Section 1: User Information Header */}
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex items-center gap-3 p-2 font-normal">
              <Avatar className="size-10 shrink-0 ring-2 ring-primary/20">
                <AvatarFallback className="bg-primary/15 text-sm font-bold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground leading-tight">
                  {displayName}
                </p>
                <p className="truncate text-xs text-muted-foreground leading-tight">
                  {email}
                </p>
                <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-primary">
                  <ShieldCheck className="size-3.5" />
                  <span>{finalRoleLabel}</span>
                </div>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>

          {/* Section 2: Menu Items */}
          <DropdownMenuSeparator className="my-1" />
          {governanceItems.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <DropdownMenuItem
                key={idx}
                className="cursor-pointer py-1.5"
                render={
                  <Link href={item.href} className="flex items-center gap-2.5 text-xs font-medium w-full">
                    <IconComponent className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="ml-auto rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                }
              />
            );
          })}
          <DropdownMenuItem onClick={() => setProfileOpen(true)} className="cursor-pointer py-1.5 text-xs font-medium">
            <UserRound className="size-4 shrink-0 text-muted-foreground" />
            <span>Profile</span>
          </DropdownMenuItem>

          {/* Section 3: Logout */}
          <DropdownMenuSeparator className="my-1" />
          <DropdownMenuItem
            variant="destructive"
            disabled={isPending}
            onClick={handleLogout}
            className="cursor-pointer py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 focus:bg-rose-500/10"
          >
            <LogOut className="size-4 shrink-0" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Profile Detail Sheet */}
      <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader className="border-b border-border/60 pb-4">
            <SheetTitle className="text-lg font-bold">{panelName} Profile</SheetTitle>
            <SheetDescription className="text-xs">
              User session and security credentials for {panelName}.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-6 pt-6 text-xs sm:text-sm">
            <div className="flex items-center gap-4">
              <Avatar className="size-14 ring-2 ring-primary/20">
                <AvatarFallback className="bg-primary/10 text-lg font-bold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-foreground">{displayName}</p>
                <p className="truncate text-xs text-muted-foreground">{email}</p>
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  <ShieldCheck className="size-3" /> {finalRoleLabel}
                </span>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/20 p-4">
              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground">Assigned Roles:</span>
                <span className="font-semibold text-foreground">{roles.join(", ")}</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground">Member Since:</span>
                <span className="font-semibold text-foreground">{formatDateTime(createdAt)}</span>
              </div>
              {lastLoginAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Session:</span>
                  <span className="font-semibold text-foreground">{formatDateTime(lastLoginAt)}</span>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
