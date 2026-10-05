"use client";

import { useState, useTransition, useMemo } from "react";
import { toast } from "sonner";
import {
  User,
  Briefcase,
  Handshake,
  Cpu,
  Search,
  Filter,
  CheckCircle2,
  ShieldAlert,
  UserPlus,
  Sparkles,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ROLE_GROUPS } from "@/lib/workspace/role-catalog";
import { usePanels } from "@/components/platform/PanelsProvider";
import { createAdminUserAction } from "./actions";

const USER_TYPE_META = [
  {
    value: "employee",
    label: "Employee",
    description: "Full internal team member with standard panel access",
    icon: User,
    color: "text-primary bg-primary/10 border-primary/20",
  },
  {
    value: "contractor",
    label: "Contractor / Freelancer",
    description: "External consultant or temporary project worker",
    icon: Briefcase,
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  },
  {
    value: "partner",
    label: "External Partner",
    description: "Third-party vendor, auditor, or affiliate partner",
    icon: Handshake,
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    value: "system",
    label: "System Service Account",
    description: "Automated API bot, webhook worker, or background process",
    icon: Cpu,
    color: "text-brand-deep bg-brand-deep/10 border-brand-deep/20",
  },
];

export default function CreateUserSheet({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (email: string, tempPassword: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [userType, setUserType] = useState<"employee" | "contractor" | "partner" | "system">("employee");
  const [notes, setNotes] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  // Panel names come from the Panel Registry, like every other listing.
  const panels = usePanels();
  const [roleSearch, setRoleSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggle(role: string) {
    setRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  }

  function reset() {
    setEmail("");
    setUserType("employee");
    setNotes("");
    setRoles([]);
    setModuleFilter("all");
    setRoleSearch("");
    setError(null);
  }

  function handleCreate() {
    setError(null);
    if (roles.length === 0) {
      setError("Please select at least one role to grant access.");
      return;
    }
    startTransition(async () => {
      const result = await createAdminUserAction(email, roles, userType, notes);
      if (!result.ok || !result.tempPassword) {
        setError(result.error ?? "Could not create user account.");
        return;
      }
      toast.success("User account created successfully!");
      onCreated(email.trim().toLowerCase(), result.tempPassword);
      reset();
      onOpenChange(false);
    });
  }

  const superAdmin = roles.includes("super_admin");

  const filteredGroups = useMemo(() => {
    return ROLE_GROUPS.map((g) => {
      const matchesModule = moduleFilter === "all" || g.panel === moduleFilter;
      if (!matchesModule) return null;

      const filteredRoles = g.roles.filter((r) =>
        r.label.toLowerCase().includes(roleSearch.toLowerCase()) ||
        r.description.toLowerCase().includes(roleSearch.toLowerCase()) ||
        r.value.toLowerCase().includes(roleSearch.toLowerCase())
      );

      if (filteredRoles.length === 0) return null;

      return {
        ...g,
        roles: filteredRoles,
      };
    }).filter(Boolean);
  }, [moduleFilter, roleSearch]);

  const activeCategoryMeta = USER_TYPE_META.find((t) => t.value === userType) ?? USER_TYPE_META[0];
  const CategoryIcon = activeCategoryMeta.icon;

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <SheetContent side="right" className="w-full sm:max-w-lg md:max-w-xl flex flex-col p-0 gap-0">
        <SheetHeader className="p-5 border-b border-border bg-gradient-to-r from-muted/50 to-muted/20">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <UserPlus className="size-5" />
            </div>
            <div>
              <SheetTitle className="text-base font-semibold">New User Account</SheetTitle>
              <SheetDescription className="text-xs">
                Create a central identity & assign access across all {Object.keys(panels).length || 10} platform panels.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {/* Account Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Email Address</span>
              <span className="text-[10px] text-muted-foreground font-normal">Primary Login</span>
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. employee@company.com"
              className="text-xs h-9"
            />
          </div>

          {/* User Type Category Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>User Type Category</span>
              <Badge variant="outline" className={`text-[10px] gap-1 px-2 ${activeCategoryMeta.color}`}>
                <CategoryIcon className="size-3" />
                {activeCategoryMeta.label}
              </Badge>
            </label>
            <Select
              value={userType}
              onValueChange={(v) => { if (v) setUserType(v as "employee" | "contractor" | "partner" | "system"); }}
            >
              <SelectTrigger className="w-full text-xs h-10 bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="w-full min-w-[var(--radix-select-trigger-width)] max-w-none">
                {USER_TYPE_META.map((item) => {
                  const IconComp = item.icon;
                  return (
                    <SelectItem key={item.value} value={item.value} className="py-2.5 w-full">
                      <div className="flex items-start gap-2.5 w-full">
                        <div className={`mt-0.5 p-1 rounded-md border shrink-0 ${item.color}`}>
                          <IconComp className="size-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-foreground">
                            {item.label}
                          </p>
                          <p className="text-[11px] text-muted-foreground leading-snug">{item.description}</p>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Optional Admin Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Admin Notes &amp; Context (Optional)</label>
            <Textarea
              placeholder="Add internal details regarding department, manager, or employment status..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="text-xs resize-none bg-card"
            />
          </div>

          {/* Role Assignments Section */}
          <div className="space-y-3 pt-3 border-t border-border">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-primary" />
                Role &amp; Panel Access Assignment
              </label>
              <Badge variant="secondary" className="text-[10px] font-normal">
                {roles.length} selected
              </Badge>
            </div>

            {/* Super Admin Checkbox Banner */}
            <label
              className={`flex items-start gap-3 rounded-xl border p-3.5 transition-all cursor-pointer ${
                superAdmin
                  ? "border-amber-500/50 bg-amber-500/10 shadow-sm"
                  : "border-border/70 bg-card hover:border-primary/40"
              }`}
            >
              <Checkbox
                checked={superAdmin}
                onCheckedChange={() => toggle("super_admin")}
                className="mt-0.5"
              />
              <div>
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldAlert className="size-3.5 text-amber-500" />
                  Super Admin (Executive Full Access)
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Grants unrestricted access across all {Object.keys(panels).length || 10} platform panels and Super Admin Command Center. Bypasses panel role gates.
                </p>
              </div>
            </label>

            {!superAdmin && (
              <div className="space-y-3">
                {/* Module Filter & Search Bar */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search roles..."
                      value={roleSearch}
                      onChange={(e) => setRoleSearch(e.target.value)}
                      className="pl-8 text-xs h-8 bg-card"
                    />
                  </div>

                  <Select value={moduleFilter} onValueChange={(val: string | null) => { if (val) setModuleFilter(val); }}>
                    <SelectTrigger className="w-40 text-xs h-8 bg-card">
                      <Filter className="size-3 mr-1 text-muted-foreground" />
                      <SelectValue placeholder="All Panels" />
                    </SelectTrigger>
                    <SelectContent align="end">
                      <SelectItem value="all">All Panels</SelectItem>
                    {ROLE_GROUPS.map((g) => (
                      <SelectItem key={g.panel} value={g.panel}>
                        {panels[g.panel]?.name ?? g.module}
                      </SelectItem>
                    ))}
                  </SelectContent>
                  </Select>
                </div>

                {/* Role Groups List */}
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {filteredGroups.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground border rounded-xl bg-muted/10">
                      <p className="text-xs font-medium">No roles match your search criteria</p>
                    </div>
                  ) : (
                    filteredGroups.map((g) => {
                      if (!g) return null;
                      const selectedCountInGroup = g.roles.filter((r) => roles.includes(r.value)).length;

                      return (
                        <div key={g.module} className="rounded-xl border border-border/70 bg-card p-3 space-y-2">
                          <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                              {panels[g.panel]?.name ?? g.module}
                            </span>
                            {selectedCountInGroup > 0 && (
                              <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-primary border-primary/30">
                                {selectedCountInGroup} assigned
                              </Badge>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            {g.roles.map((r) => {
                              const isChecked = roles.includes(r.value);
                              return (
                                <label
                                  key={r.value}
                                  className={`flex items-start gap-2.5 rounded-lg border p-2.5 transition-colors cursor-pointer ${
                                    isChecked
                                      ? "border-primary/40 bg-primary/5"
                                      : "border-border/50 hover:bg-muted/30"
                                  }`}
                                >
                                  <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={() => toggle(r.value)}
                                    className="mt-0.5"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1">
                                      <p className="text-xs font-medium text-foreground">{r.label}</p>
                                      {isChecked && <CheckCircle2 className="size-3 text-primary shrink-0" />}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground leading-snug">{r.description}</p>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {error && <p className="text-xs text-destructive font-medium bg-destructive/10 p-2.5 rounded-lg border border-destructive/20">{error}</p>}
        </div>

        <SheetFooter className="p-4 border-t border-border bg-card flex items-center justify-between">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending} className="h-8 text-xs">
            Cancel
          </Button>
          <Button type="button" onClick={handleCreate} disabled={isPending || !email.trim()} className="h-8 text-xs gap-1.5">
            {isPending ? "Creating Account…" : "Create User Account"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
