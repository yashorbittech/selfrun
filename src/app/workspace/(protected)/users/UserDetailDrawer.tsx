"use client";

import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import {
  User,
  Shield,
  KeyRound,
  Activity,
  UserCheck,
  UserX,
  RefreshCw,
  AlertTriangle,
  Mail,
  Calendar,
  Lock,
  FileText,
  BadgeCheck,
  Briefcase,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PERMISSION_GROUPS } from "@/lib/workspace/permission-catalog";
import type { AdminUserRow } from "@/lib/workspace/admin-users-shared";
import PanelAccessMatrix from "./PanelAccessMatrix";
import UserActivityTab from "./UserActivityTab";
import {
  setUserTypeAndNotesAction,
  resetAdminUserPasswordAction,
  deactivateAdminUserAction,
  reactivateAdminUserAction,
  updateAdminUserPermissionOverridesAction,
} from "./actions";

type OverrideState = "default" | "allow" | "deny";

const OVERRIDE_STATE_ITEMS = { default: "Default", allow: "Always Allow", deny: "Always Deny" };

function toState(value: boolean | undefined): OverrideState {
  if (value === true) return "allow";
  if (value === false) return "deny";
  return "default";
}

function toOverrides(state: Record<string, OverrideState>): Record<string, boolean> {
  const overrides: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(state)) {
    if (value === "allow") overrides[key] = true;
    else if (value === "deny") overrides[key] = false;
  }
  return overrides;
}

export default function UserDetailDrawer({
  user,
  open,
  onOpenChange,
  onOpenRoleEditor,
}: {
  user: AdminUserRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenRoleEditor: (user: AdminUserRow) => void;
}) {
  const [activeTab, setActiveTab] = useState("profile");
  const [isPending, startTransition] = useTransition();

  // Profile metadata local state
  const [userType, setUserType] = useState<"employee" | "contractor" | "partner" | "system">("employee");
  const [notes, setNotes] = useState("");

  // Permission Overrides state
  const [overrideState, setOverrideState] = useState<Record<string, OverrideState>>({});

  useEffect(() => {
    if (user) {
      setUserType(user.userType ?? "employee");
      setNotes(user.notes ?? "");

      const initial: Record<string, OverrideState> = {};
      for (const g of PERMISSION_GROUPS) {
        for (const p of g.permissions) initial[p.key] = toState(user.permissionOverrides[p.key]);
      }
      setOverrideState(initial);
    }
  }, [user]);

  if (!user) return null;

  const isSuperAdmin = user.roles.includes("super_admin");
  const isActive = user.status === "active";

  const handleSaveProfile = () => {
    startTransition(async () => {
      const res = await setUserTypeAndNotesAction(user._id, userType, notes);
      if (!res.ok) toast.error(res.error ?? "Failed to update user profile.");
      else toast.success("User profile metadata saved.");
    });
  };

  const handleResetPassword = () => {
    if (!confirm(`Generate a new temporary password for ${user.email}?`)) return;
    startTransition(async () => {
      const res = await resetAdminUserPasswordAction(user._id);
      if (!res.ok) toast.error(res.error ?? "Could not reset password.");
      else {
        toast.success(`New temporary password: ${res.tempPassword}`, { duration: 15000 });
      }
    });
  };

  const handleToggleActive = () => {
    startTransition(async () => {
      if (isActive) {
        if (!confirm(`Deactivate ${user.email}? All active sessions across all panels will be immediately revoked.`))
          return;
        const res = await deactivateAdminUserAction(user._id);
        if (!res.ok) toast.error(res.error ?? "Could not deactivate account.");
        else toast.success("Account deactivated and sessions revoked everywhere.");
      } else {
        const res = await reactivateAdminUserAction(user._id);
        if (!res.ok) toast.error(res.error ?? "Could not reactivate account.");
        else toast.success("Account reactivated. Previous roles restored.");
      }
    });
  };

  const handleSavePermissions = () => {
    startTransition(async () => {
      const res = await updateAdminUserPermissionOverridesAction(user._id, toOverrides(overrideState));
      if (!res.ok) toast.error(res.error ?? "Could not update permissions.");
      else toast.success("Permission overrides saved successfully.");
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl md:max-w-2xl flex flex-col p-0 gap-0">
        <SheetHeader className="p-6 border-b border-border bg-muted/20">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                {user.email.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <SheetTitle className="text-lg font-semibold">{user.email}</SheetTitle>
                <SheetDescription className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-xs text-muted-foreground">ID: {user._id}</span>
                  {user.employeeId && (
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <BadgeCheck className="size-3 text-primary" />
                      Employee #{user.employeeId}
                    </Badge>
                  )}
                </SheetDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant={isActive ? "default" : "destructive"}
                className={
                  isActive
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-medium"
                    : "bg-rose-500/10 text-rose-600 border-rose-500/20 font-medium"
                }
              >
                {isActive ? "Active" : "Deactivated"}
              </Badge>
              <Badge variant="outline" className="capitalize font-normal text-xs">
                {user.userType || "Employee"}
              </Badge>
            </div>
          </div>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="border-b border-border/40 px-6 py-3">
            <TabsList>
              <TabsTrigger value="profile">
                <User className="size-3.5" />
                Profile & Meta
              </TabsTrigger>
              <TabsTrigger value="access">
                <Shield className="size-3.5" />
                Panel Access
              </TabsTrigger>
              <TabsTrigger value="permissions">
                <KeyRound className="size-3.5" />
                Permissions
              </TabsTrigger>
              <TabsTrigger value="activity">
                <Activity className="size-3.5" />
                Activity Trail
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <TabsContent value="profile" className="mt-0 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border p-4 bg-card">
                <div className="flex items-center gap-3">
                  <Mail className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-[11px] text-muted-foreground">Email Address</p>
                    <p className="text-xs font-medium text-foreground">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-[11px] text-muted-foreground">Created On</p>
                    <p className="text-xs font-medium text-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-[11px] text-muted-foreground">Last Login</p>
                    <p className="text-xs font-medium text-foreground">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never logged in"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Lock className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-[11px] text-muted-foreground">Security Status</p>
                    <p className="text-xs font-medium text-foreground">
                      {user.mustChangePassword ? "Must change password" : "Password active"}
                      {user.locked ? " (Locked)" : ""}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-xl border p-4 bg-card">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <FileText className="size-4 text-primary" />
                  User Classification & Notes
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1.5 block">User Type Category</label>
                    <Select
                      value={userType}
                      onValueChange={(val: string | null) => { if (val) setUserType(val as "employee" | "contractor" | "partner" | "system"); }}
                    >
                      <SelectTrigger className="w-full text-xs h-10 bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="w-full min-w-[var(--radix-select-trigger-width)] max-w-none">
                        <SelectItem value="employee" className="py-2.5 w-full">
                          <div className="flex items-start gap-2.5 w-full">
                            <div className="mt-0.5 p-1 rounded-md border shrink-0 text-primary bg-primary/10 border-primary/20">
                              <User className="size-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-foreground">Employee (Full Internal)</p>
                              <p className="text-[11px] text-muted-foreground leading-snug">Full internal team member with standard panel access</p>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="contractor" className="py-2.5 w-full">
                          <div className="flex items-start gap-2.5 w-full">
                            <div className="mt-0.5 p-1 rounded-md border shrink-0 text-amber-500 bg-amber-500/10 border-amber-500/20">
                              <Briefcase className="size-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-foreground">Contractor / Freelancer</p>
                              <p className="text-[11px] text-muted-foreground leading-snug">External consultant or temporary project worker</p>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="partner" className="py-2.5 w-full">
                          <div className="flex items-start gap-2.5 w-full">
                            <div className="mt-0.5 p-1 rounded-md border shrink-0 text-emerald-500 bg-emerald-500/10 border-emerald-500/20">
                              <Shield className="size-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-foreground">External Partner</p>
                              <p className="text-[11px] text-muted-foreground leading-snug">Third-party vendor, auditor, or affiliate partner</p>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="system" className="py-2.5 w-full">
                          <div className="flex items-start gap-2.5 w-full">
                            <div className="mt-0.5 p-1 rounded-md border shrink-0 text-brand-deep bg-brand-deep/10 border-brand-deep/20">
                              <KeyRound className="size-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-foreground">System Service Account</p>
                              <p className="text-[11px] text-muted-foreground leading-snug">Automated API bot, webhook worker, or background process</p>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Admin Notes / Audit Context</label>
                    <Textarea
                      placeholder="Add administrative notes regarding this user's roles or employment..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="text-xs resize-none"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveProfile}
                      disabled={isPending}
                      className="h-8 text-xs"
                    >
                      Save Profile Metadata
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-destructive/20 p-4 bg-destructive/5">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Shield className="size-4 text-destructive" />
                  Security & Access Management
                </h4>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div>
                    <p className="text-xs font-medium text-foreground">Reset Password</p>
                    <p className="text-[11px] text-muted-foreground">
                      Generates a temporary password and forces password reset on next sign-in.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResetPassword}
                    disabled={isPending}
                    className="h-8 text-xs gap-1.5"
                  >
                    <RefreshCw className="size-3.5" />
                    Reset Password
                  </Button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/50">
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      {isActive ? "Deactivate Account" : "Reactivate Account"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {isActive
                        ? "Revokes all roles and immediately terminates active sessions everywhere."
                        : "Restores saved roles and grants access to configured panels."}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant={isActive ? "destructive" : "default"}
                    size="sm"
                    onClick={handleToggleActive}
                    disabled={isPending}
                    className="h-8 text-xs gap-1.5"
                  >
                    {isActive ? (
                      <>
                        <UserX className="size-3.5" />
                        Deactivate User
                      </>
                    ) : (
                      <>
                        <UserCheck className="size-3.5" />
                        Reactivate User
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="access" className="mt-0">
              <PanelAccessMatrix user={user} onEditRoles={() => onOpenRoleEditor(user)} />
            </TabsContent>

            <TabsContent value="permissions" className="mt-0 space-y-4">
              {isSuperAdmin && (
                <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <p className="text-xs">
                    This account holds Super Admin — overrides never apply, since Super Admin automatically bypasses
                    every capability check.
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {PERMISSION_GROUPS.map((g) => (
                  <div key={g.module} className="rounded-xl border p-4 bg-card space-y-3">
                    <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">{g.module}</p>
                    <div className="space-y-2">
                      {g.permissions.map((p) => (
                        <div
                          key={p.key}
                          className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-foreground">{p.label}</p>
                            <p className="text-[11px] text-muted-foreground">{p.description}</p>
                          </div>
                          <Select
                            items={OVERRIDE_STATE_ITEMS}
                            value={overrideState[p.key] ?? "default"}
                            onValueChange={(v: string | null) => {
                              if (!v) return;
                              setOverrideState((prev) => ({ ...prev, [p.key]: v as OverrideState }));
                            }}
                          >
                            <SelectTrigger size="sm" className="w-32 shrink-0 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="default">Default</SelectItem>
                              <SelectItem value="allow">Always Allow</SelectItem>
                              <SelectItem value="deny">Always Deny</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    onClick={handleSavePermissions}
                    disabled={isPending}
                    size="sm"
                    className="h-8 text-xs"
                  >
                    {isPending ? "Saving..." : "Save Permission Overrides"}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="mt-0">
              <UserActivityTab userEmail={user.email} />
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
