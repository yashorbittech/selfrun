import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, Minus, ExternalLink } from "lucide-react";
import { CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import GlassCard from "@/components/lms/GlassCard";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import SettingsForm from "@/components/sop/SettingsForm";
import { getViewer } from "@/lib/sop/viewer";
import { getSettings } from "@/lib/sop/settings";
import { ACCEPT_ATTR } from "@/lib/sop/files";
import { CONFIDENTIALITY_LEVELS, LIMITS } from "@/lib/sop/constants";
import { SOP_PERMISSIONS, SOP_PERMISSION_META, SOP_ROLES, SOP_ROLE_META, SOP_ROLE_PERMISSIONS, sopCan } from "@/lib/sop-roles";

export default async function SopSettingsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/sop/login");
  if (!sopCan({ roles: viewer.roles, permissionOverrides: viewer.overrides }, "MANAGE_PERMISSIONS")) redirect("/sop");
  const settings = await getSettings();
  const isSuper = viewer.roles.includes("super_admin");

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[{ label: "SOP", href: "/sop" }, { label: "Settings" }]}
        title={<>Settings</>}
        description={<>Operational defaults, and how access to the SOP panel is granted.</>}
      />

      <GlassCard interactive={false}>
        <CardHeader className="pb-1"><CardTitle className="text-sm font-bold">Lifecycle & reminders</CardTitle></CardHeader>
        <CardContent>
          <SettingsForm initial={{ expiringSoonDays: settings.expiringSoonDays, defaultReviewMonths: settings.defaultReviewMonths, defaultDueDays: settings.defaultDueDays, reackOnNewVersion: settings.reackOnNewVersion, reminderRepeatDays: settings.reminderRepeatDays, defaultAllowDownload: settings.defaultAllowDownload }} />
        </CardContent>
      </GlassCard>

      <GlassCard interactive={false}>
        <CardHeader className="pb-1">
          <CardTitle className="text-sm font-bold">Roles & permissions</CardTitle>
          <CardDescription className="text-xs">
            The default capabilities of each role. There is no review or approval permission — publishing is direct. Roles are assigned, and individual capabilities overridden, per person in the Admin panel
            {isSuper ? <> — <Link href="/workspace/users" className="inline-flex items-center gap-0.5 text-primary hover:underline">open Users & Access <ExternalLink className="size-3" /></Link></> : " by a Super Admin"}.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Capability</TableHead>
                {SOP_ROLES.filter((r) => r !== "super_admin").map((r) => <TableHead key={r} className="text-center">{SOP_ROLE_META[r].label}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {SOP_PERMISSIONS.map((p) => (
                <TableRow key={p}>
                  <TableCell>
                    <span className="font-medium">{SOP_PERMISSION_META[p].label}</span>
                    <span className="block font-mono text-[10px] text-muted-foreground">{p}</span>
                  </TableCell>
                  {SOP_ROLES.filter((r) => r !== "super_admin").map((r) => (
                    <TableCell key={r} className="text-center">
                      {SOP_ROLE_PERMISSIONS[r].includes(p) ? <Check className="mx-auto size-4 text-green-600" aria-label="Allowed" /> : <Minus className="mx-auto size-4 text-muted-foreground/40" aria-label="Not allowed" />}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="mt-3 text-xs text-muted-foreground">
            HRMS roles imply an SOP tier: <strong>Employee</strong> → SOP Reader, <strong>Manager</strong> and <strong>HR</strong> → SOP Manager. Managers act on SOPs of their own department (and departments they head in HRMS); authors on SOPs they own or wrote; SOP Admins and Super Admins on everything.
          </p>
        </CardContent>
      </GlassCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard interactive={false}>
          <CardHeader className="pb-1"><CardTitle className="text-sm font-bold">Confidentiality levels</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-sm">
              {CONFIDENTIALITY_LEVELS.map((c) => (
                <li key={c.value}><span className="font-medium">{c.label}</span> <span className="text-muted-foreground">— {c.description}</span></li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">Assigned people and anyone in an SOP&apos;s explicit-access list can always read its published version.</p>
          </CardContent>
        </GlassCard>
        <GlassCard interactive={false}>
          <CardHeader className="pb-1"><CardTitle className="text-sm font-bold">Uploads & limits</CardTitle></CardHeader>
          <CardContent className="space-y-1.5 text-sm text-muted-foreground">
            <p>Allowed types: <span className="font-mono text-xs">{ACCEPT_ATTR.replaceAll(".", "")}</span></p>
            <p>Max file size: {Math.round(LIMITS.fileBytes / 1024 / 1024)} MB. Files are checked by type and content, stored privately, and only served to people who can read the SOP.</p>
            <p>Limits per SOP: {LIMITS.sections} sections, {LIMITS.blocksPerSection} blocks per section.</p>
          </CardContent>
        </GlassCard>
      </div>
    </div>
  );
}
