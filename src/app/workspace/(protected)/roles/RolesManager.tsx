"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, Copy, ShieldCheck, Users, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { usePanels } from "@/components/platform/PanelsProvider";
import { ROLE_GROUPS } from "@/lib/workspace/role-catalog";
import type { CustomRoleView } from "@/lib/workspace/custom-roles-shared";
import type { AccessAuditRow } from "@/lib/workspace/custom-roles";
import { deleteCustomRoleAction } from "./actions";
import RoleBuilderSheet from "./RoleBuilderSheet";

export default function RolesManager({ roles, audit }: { roles: CustomRoleView[]; audit: AccessAuditRow[] }) {
  const panels = usePanels();
  const [builder, setBuilder] = useState<{ role: CustomRoleView | null; duplicate: boolean } | null>(null);
  const [toDelete, setToDelete] = useState<CustomRoleView | null>(null);
  const [pending, startTransition] = useTransition();

  const panelsOf = (r: CustomRoleView) =>
    ROLE_GROUPS.filter((g) => g.roles.some((x) => r.baseRoles.includes(x.value))).map((g) => panels[g.panel]?.name ?? g.module);

  function confirmDelete() {
    if (!toDelete) return;
    startTransition(async () => {
      const res = await deleteCustomRoleAction(toDelete.id);
      if (res.ok) toast.success(res.affected > 0 ? `Role deleted — ${res.affected} ${res.affected === 1 ? "person" : "people"} lost the access it gave.` : "Role deleted.");
      else toast.error(res.error);
      setToDelete(null);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{roles.length === 0 ? "No custom roles yet." : `${roles.length} custom role${roles.length === 1 ? "" : "s"}`}</p>
        <Button size="sm" onClick={() => setBuilder({ role: null, duplicate: false })}>
          <Plus className="mr-1 size-3.5" /> New role
        </Button>
      </div>

      {roles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-card p-10 text-center">
          <ShieldCheck className="mx-auto mb-3 size-8 text-primary" />
          <p className="text-sm font-medium">Create your first role</p>
          <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">For example “Sales lead”: the CRM panel, with exports on and wallet adjustments off. Anyone you give it to gets exactly that — nothing more.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {roles.map((r) => {
            const rules = Object.keys(r.permissions).length;
            return (
              <div key={r.id} className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{r.name}</p>
                    {r.description && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{r.description}</p>}
                  </div>
                  <Badge variant="outline" className="shrink-0 gap-1 text-[10px]"><Users className="size-3" />{r.userCount}</Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {panelsOf(r).map((n) => <Badge key={n} variant="secondary" className="text-[10px]">{n}</Badge>)}
                </div>
                <p className="text-[11px] text-muted-foreground">{r.baseRoles.length} panel role{r.baseRoles.length === 1 ? "" : "s"} · {rules} permission rule{rules === 1 ? "" : "s"}</p>
                <div className="mt-auto flex gap-1.5">
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setBuilder({ role: r, duplicate: false })}><Pencil className="mr-1 size-3" />Edit</Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setBuilder({ role: r, duplicate: true })}><Copy className="mr-1 size-3" />Duplicate</Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => setToDelete(r)}><Trash2 className="mr-1 size-3" />Delete</Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-2xl border border-border/70 bg-card">
        <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
          <History className="size-4 text-muted-foreground" />
          <p className="text-sm font-semibold">Access changes</p>
          <span className="text-xs text-muted-foreground">Who changed roles and permissions, and when</span>
        </div>
        {audit.length === 0 ? (
          <p className="p-4 text-xs text-muted-foreground">Nothing yet.</p>
        ) : (
          <ul className="divide-y divide-border/50">
            {audit.map((a) => (
              <li key={a.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 px-4 py-2 text-xs">
                <span className="w-36 shrink-0 text-muted-foreground">{new Date(a.at).toLocaleString()}</span>
                <span className="font-medium">{a.action.replace(/[._]/g, " ")}</span>
                <span>{a.target}</span>
                {a.detail && <span className="text-muted-foreground">— {a.detail}</span>}
                <span className="ml-auto text-muted-foreground">{a.actorEmail ?? "system"}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <RoleBuilderSheet
        key={builder ? `${builder.role?.id ?? "new"}-${builder.duplicate}` : "closed"}
        open={builder !== null}
        onOpenChange={(o) => !o && setBuilder(null)}
        role={builder?.role ?? null}
        duplicate={builder?.duplicate ?? false}
      />

      <AlertDialog open={toDelete !== null} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{toDelete?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete && toDelete.userCount > 0 ? `${toDelete.userCount} ${toDelete.userCount === 1 ? "person has" : "people have"} this role. They keep any other roles they hold but lose everything this role gave them, immediately.` : "No one holds this role."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={pending}>{pending ? "Deleting…" : "Delete role"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
