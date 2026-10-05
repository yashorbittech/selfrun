"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  MoreHorizontal,
  ShieldCheck,
  KeyRound,
  UserX,
  UserCheck,
  Plus,
  Lock,
  SlidersHorizontal,
  Eye,
  CheckCircle2,
  XCircle,
  BadgeCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import AdminDataGrid, { type AdminDataGridColumn, type BulkActionsContext } from "@/components/workspace/data-grid/AdminDataGrid";
import { formatDate, formatDateTime } from "@/lib/utils";
import { roleLabelsForRoles } from "@/lib/workspace/role-catalog";
import { getPanelAccessSummary, type AdminUserRow } from "@/lib/workspace/admin-users-shared";
import {
  resetAdminUserPasswordAction,
  deactivateAdminUserAction,
  reactivateAdminUserAction,
  bulkDeactivateAdminUsersAction,
  bulkReactivateAdminUsersAction,
} from "./actions";
import RoleEditorSheet from "./RoleEditorSheet";
import PermissionOverridesSheet from "./PermissionOverridesSheet";
import CreateUserSheet from "./CreateUserSheet";
import TempPasswordDialog from "./TempPasswordDialog";
import UserDetailDrawer from "./UserDetailDrawer";

function RowActions({
  row,
  currentAdminId,
  onViewDetail,
  onEditRoles,
  onEditPermissions,
  onTempPassword,
}: {
  row: AdminUserRow;
  currentAdminId: string;
  onViewDetail: (row: AdminUserRow) => void;
  onEditRoles: (row: AdminUserRow) => void;
  onEditPermissions: (row: AdminUserRow) => void;
  onTempPassword: (info: { email: string; tempPassword: string }) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isSelf = row._id === currentAdminId;
  const isActive = row.status === "active";

  function resetPassword() {
    startTransition(async () => {
      const result = await resetAdminUserPasswordAction(row._id);
      if (!result.ok || !result.tempPassword) toast.error(result.error ?? "Could not reset password.");
      else onTempPassword({ email: row.email, tempPassword: result.tempPassword });
    });
  }

  function handleDeactivate() {
    startTransition(async () => {
      const result = await deactivateAdminUserAction(row._id);
      if (!result.ok) toast.error(result.error ?? "Could not deactivate account.");
      else toast.success("Account deactivated & sessions revoked");
      setConfirmOpen(false);
    });
  }

  function handleReactivate() {
    startTransition(async () => {
      const result = await reactivateAdminUserAction(row._id);
      if (!result.ok) toast.error(result.error ?? "Could not reactivate account.");
      else toast.success("Account reactivated. Roles restored.");
    });
  }

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Row actions">
              <MoreHorizontal className="size-4" />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onViewDetail(row)}>
            <Eye className="size-3.5" />
            View User Details
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onEditRoles(row)}>
            <ShieldCheck className="size-3.5" />
            Edit roles
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEditPermissions(row)}>
            <SlidersHorizontal className="size-3.5" />
            Edit permissions
          </DropdownMenuItem>
          <DropdownMenuItem onClick={resetPassword} disabled={isPending}>
            <KeyRound className="size-3.5" />
            Reset password
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {isActive ? (
            <DropdownMenuItem variant="destructive" onClick={() => setConfirmOpen(true)} disabled={isSelf || isPending}>
              <UserX className="size-3.5" />
              Deactivate
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={handleReactivate} disabled={isPending}>
              <UserCheck className="size-3.5 text-emerald-500" />
              Reactivate Account
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate {row.email}?</AlertDialogTitle>
            <AlertDialogDescription>
              Clears every role and immediately revokes all active sessions across every panel. Roles can be restored anytime by reactivating.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeactivate} disabled={isPending}>
              {isPending ? "Deactivating…" : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BulkActions({ ctx, currentAdminId }: { ctx: BulkActionsContext; currentAdminId: string }) {
  const [pending, setPending] = useState(false);
  const includesSelf = ctx.selectedIds.includes(currentAdminId);

  async function handleBulkDeactivate() {
    setPending(true);
    const result = await bulkDeactivateAdminUsersAction(ctx.selectedIds);
    setPending(false);
    if (result.skipped > 0) {
      toast.warning(`${result.deactivated} deactivated. ${result.skipped} skipped (your own account can't be deactivated).`);
    } else {
      toast.success(`Deactivated ${result.deactivated} account${result.deactivated === 1 ? "" : "s"}`);
    }
    ctx.clearSelection();
    ctx.refresh();
  }

  async function handleBulkReactivate() {
    setPending(true);
    const result = await bulkReactivateAdminUsersAction(ctx.selectedIds);
    setPending(false);
    toast.success(`Reactivated ${result.reactivated} account${result.reactivated === 1 ? "" : "s"}`);
    ctx.clearSelection();
    ctx.refresh();
  }

  return (
    <>
      <a
        href={`/api/workspace/users/export?ids=${encodeURIComponent(ctx.selectedIds.join(","))}`}
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium hover:bg-muted"
      >
        Export
      </a>
      <Button type="button" variant="outline" size="sm" onClick={handleBulkReactivate} disabled={pending} className="h-8 text-xs gap-1.5">
        <UserCheck className="size-3.5 text-emerald-500" />
        Reactivate Selected
      </Button>
      <AlertDialog>
        <AlertDialogTrigger
          render={
            <Button type="button" variant="destructive" size="sm" disabled={pending} className="h-8 text-xs">
              <UserX className="size-3.5" data-icon="inline-start" />
              Deactivate Selected
            </Button>
          }
        />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate {ctx.selectedIds.length} account{ctx.selectedIds.length === 1 ? "" : "s"}?</AlertDialogTitle>
            <AlertDialogDescription>
              Clears every role and terminates active sessions everywhere for each selected account.
              {includesSelf && " Your own account is selected — it will be skipped."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDeactivate}>Deactivate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function UsersGrid({
  rows,
  total,
  page,
  totalPages,
  sortBy,
  sortDir,
  filters,
  hasActiveFilters,
  currentAdminId,
}: {
  rows: AdminUserRow[];
  total: number;
  page: number;
  totalPages: number;
  sortBy: string;
  sortDir: "asc" | "desc";
  filters?: React.ReactNode;
  hasActiveFilters?: boolean;
  currentAdminId: string;
}) {
  const [detailUser, setDetailUser] = useState<AdminUserRow | null>(null);
  const [editRolesFor, setEditRolesFor] = useState<AdminUserRow | null>(null);
  const [editPermissionsFor, setEditPermissionsFor] = useState<AdminUserRow | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [tempPasswordInfo, setTempPasswordInfo] = useState<{ email: string; tempPassword: string } | null>(null);

  const columns: AdminDataGridColumn<AdminUserRow>[] = [
    {
      key: "email",
      label: "Account",
      render: (row) => (
        <div
          className="flex items-center gap-2 cursor-pointer hover:underline"
          onClick={() => setDetailUser(row)}
        >
          <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
            {row.email.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-medium text-foreground text-xs">{row.email}</p>
              {row.locked && <Lock className="size-3 text-destructive" />}
              {row._id === currentAdminId && <Badge variant="outline" className="h-4 px-1 text-[9px]">You</Badge>}
            </div>
            {row.employeeId && (
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <BadgeCheck className="size-2.5 text-primary" /> Emp #{row.employeeId}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Badge
          variant={row.status === "active" ? "default" : "secondary"}
          className={`text-[10px] font-medium ${
            row.status === "active"
              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
              : "bg-rose-500/10 text-rose-600 border-rose-500/20"
          }`}
        >
          {row.status === "active" ? (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="size-3 text-emerald-500" /> Active
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <XCircle className="size-3 text-rose-500" /> Deactivated
            </span>
          )}
        </Badge>
      ),
    },
    {
      key: "userType",
      label: "Category",
      render: (row) => (
        <Badge variant="outline" className="capitalize text-[10px] font-normal">
          {row.userType || "employee"}
        </Badge>
      ),
    },
    {
      key: "roles",
      label: "Panel Access & Roles",
      render: (row) => {
        if (row.roles.length === 0) {
          return <span className="text-xs text-muted-foreground italic">No Active Roles</span>;
        }
        const panels = getPanelAccessSummary(row);
        const activePanels = panels.filter((p) => p.hasAccess);
        const overrideCount = Object.keys(row.permissionOverrides).length;

        return (
          <div className="space-y-1">
            <div className="flex flex-wrap gap-1">
              {activePanels.map((p) => (
                <Badge key={p.key} variant="secondary" className="text-[10px] py-0 px-1.5 font-normal">
                  {p.name.replace(" Panel", "")}
                </Badge>
              ))}
              {overrideCount > 0 && (
                <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-amber-600 dark:text-amber-400">
                  +{overrideCount} override{overrideCount > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            <div className="text-[10px] text-muted-foreground truncate max-w-xs">
              {roleLabelsForRoles(row.roles).slice(0, 3).join(", ")}
              {row.roles.length > 3 && ` +${row.roles.length - 3} more`}
            </div>
          </div>
        );
      },
    },
    {
      key: "mustChangePassword",
      label: "Password",
      render: (row) => (row.mustChangePassword ? <Badge variant="outline" className="text-[10px]">Temp</Badge> : <span className="text-xs text-muted-foreground">Set</span>),
    },
    { key: "createdAt", label: "Created", sortable: true, render: (row) => formatDate(row.createdAt) },
    {
      key: "lastLoginAt",
      label: "Last login",
      sortable: true,
      render: (row) => (row.lastLoginAt ? formatDateTime(row.lastLoginAt) : <span className="text-muted-foreground text-xs">Never</span>),
    },
  ];

  return (
    <>
      <AdminDataGrid
        columns={columns}
        rows={rows}
        getRowId={(row) => row._id}
        total={total}
        page={page}
        totalPages={totalPages}
        sortBy={sortBy}
        sortDir={sortDir}
        emptyLabel="No accounts match these filters."
        filters={filters}
        filterTitle="User Directory Filters"
        filterSubtitle="Search and narrow the platform-wide user roster"
        filterIcon={Users}
        hasActiveFilters={hasActiveFilters}
        toolbarExtra={
          <Button type="button" size="sm" onClick={() => setCreateOpen(true)} className="h-8 text-xs gap-1.5">
            <Plus className="size-3.5" data-icon="inline-start" />
            New User Account
          </Button>
        }
        rowActions={(row) => (
          <RowActions
            row={row}
            currentAdminId={currentAdminId}
            onViewDetail={setDetailUser}
            onEditRoles={setEditRolesFor}
            onEditPermissions={setEditPermissionsFor}
            onTempPassword={setTempPasswordInfo}
          />
        )}
        renderBulkActions={(ctx) => <BulkActions ctx={ctx} currentAdminId={currentAdminId} />}
      />

      <UserDetailDrawer
        user={detailUser}
        open={detailUser !== null}
        onOpenChange={(open) => !open && setDetailUser(null)}
        onOpenRoleEditor={(u) => {
          setDetailUser(null);
          setEditRolesFor(u);
        }}
      />

      <RoleEditorSheet
        key={`roles-${editRolesFor?._id ?? "none"}`}
        userId={editRolesFor?._id ?? null}
        userEmail={editRolesFor?.email ?? null}
        initialRoles={editRolesFor?.roles ?? []}
        currentAdminId={currentAdminId}
        open={editRolesFor !== null}
        onOpenChange={(open) => !open && setEditRolesFor(null)}
      />

      <PermissionOverridesSheet
        key={`permissions-${editPermissionsFor?._id ?? "none"}`}
        userId={editPermissionsFor?._id ?? null}
        userEmail={editPermissionsFor?.email ?? null}
        userRoles={editPermissionsFor?.roles ?? []}
        initialOverrides={editPermissionsFor?.permissionOverrides ?? {}}
        open={editPermissionsFor !== null}
        onOpenChange={(open) => !open && setEditPermissionsFor(null)}
      />

      <CreateUserSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(email, tempPassword) => setTempPasswordInfo({ email, tempPassword })}
      />

      <TempPasswordDialog info={tempPasswordInfo} onClose={() => setTempPasswordInfo(null)} />
    </>
  );
}
