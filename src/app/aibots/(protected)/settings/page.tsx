import { redirect } from "next/navigation";
import { Check, Minus } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { PageHeader, SectionCard, Notice } from "@/components/aibots/AibotsUi";
import SettingsForm from "@/components/aibots/SettingsForm";
import { getViewer, can } from "@/lib/aibots/viewer";
import { getSettings } from "@/lib/aibots/settings";
import { isOpenAIConfigured } from "@/lib/openai";
import { AIBOTS_PERMISSIONS, AIBOTS_PERMISSION_META, AIBOTS_ROLE_META, AIBOTS_ROLE_PERMISSIONS } from "@/lib/aibots-roles";
import { formatDateTime } from "@/lib/utils";

const ROLES = ["aibots_user", "aibots_manager", "aibots_admin"] as const;

export default async function AibotsSettingsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/aibots/login");
  if (!can(viewer, "MANAGE_SETTINGS")) redirect("/aibots");
  const settings = await getSettings();
  const ready = await isOpenAIConfigured();

  return (
    <div className="space-y-4">
      <PageHeader title="Settings" crumbs={[{ label: "Settings" }]} description="OpenAI models, cost estimates, usage limits and the Start New Chat assistant." />

      <SectionCard title="OpenAI connection" description="All AI runs through OpenAI from this server — the key never reaches a browser.">
        <ul className="space-y-1.5 text-sm">
          <li className="flex items-center gap-2">{ready ? <Check className="size-4 text-emerald-600" /> : <Minus className="size-4 text-rose-600" />}OPENAI_API_KEY {ready ? "is set on the server" : "is NOT set — bots can't reply or index files"}</li>
          <li className="flex items-center gap-2"><Check className="size-4 text-emerald-600" />Each bot has its own OpenAI vector store; file search is bound to that store only</li>
          <li className="flex items-center gap-2"><Check className="size-4 text-emerald-600" />Each chat is its own OpenAI Conversation; transcripts are read from OpenAI, not copied into the database</li>
        </ul>
      </SectionCard>

      <SectionCard title="Models & limits" description={settings.updatedAt.getTime() > 0 ? `Last changed ${formatDateTime(settings.updatedAt)}.` : "Using defaults — prices are estimates; check openai.com/api/pricing and adjust."}>
        <SettingsForm models={settings.models} defaultModel={settings.defaultModel} maxOutputTokens={settings.maxOutputTokens} dailyMessageLimit={settings.dailyMessageLimit} generalInstructions={settings.generalInstructions} />
      </SectionCard>

      <SectionCard title="Role permissions" description="Defaults per role. The Super Admin can override individual capabilities per person under Admin → Users.">
        <Notice tone="info">Roles are assigned in Admin → Users. Which bots a person sees is set per bot under “Access”.</Notice>
        <div className="mt-3 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Capability</TableHead>
                {ROLES.map((r) => (
                  <TableHead key={r} className="text-center">{AIBOTS_ROLE_META[r].label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {AIBOTS_PERMISSIONS.map((p) => (
                <TableRow key={p}>
                  <TableCell>
                    <p className="text-sm font-medium">{AIBOTS_PERMISSION_META[p].label}</p>
                    <p className="text-[11px] text-muted-foreground">{AIBOTS_PERMISSION_META[p].description}</p>
                  </TableCell>
                  {ROLES.map((r) => (
                    <TableCell key={r} className="text-center">{AIBOTS_ROLE_PERMISSIONS[r].includes(p) ? <Check className="mx-auto size-4 text-emerald-600" aria-label="Allowed" /> : <Minus className="mx-auto size-4 text-muted-foreground/50" aria-label="Not allowed" />}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </div>
  );
}
