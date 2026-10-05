"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LoaderCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import OptionSelect, { type Option } from "@/components/sop/OptionSelect";
import MultiPicker, { type PickerOption } from "@/components/sop/MultiPicker";
import Link from "next/link";
import { SectionCard } from "@/components/aibots/AibotsUi";
import KnowledgeQueueFields, { useKnowledgeQueue } from "@/components/aibots/KnowledgeQueue";
import { AnswerModeNotice } from "@/components/aibots/KnowledgeBase";
import BotAvatar, { BotIconGlyph, BOT_COLOR_CLASSES } from "@/components/aibots/BotAvatar";
import { cn } from "@/lib/utils";
import { saveBotAction } from "@/app/aibots/(protected)/actions";
import { BOT_CATEGORY_SUGGESTIONS, BOT_COLORS, BOT_ICONS, LIMITS, type BotColor, type BotIcon } from "@/lib/aibots/constants";

export interface BotFormValues {
  name: string;
  icon: BotIcon;
  color: BotColor;
  description: string;
  category: string;
  instructions: string;
  model: string;
  temperature: string;
  allowAttachments: boolean;
  starterPrompts: string[];
  accessMode: "all" | "restricted";
  accessRoles: string[];
  accessUserIds: string[];
  status: "active" | "inactive";
}

function Field({ label, htmlFor, hint, children, className }: { label: string; htmlFor?: string; hint?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

/**
 * Create / edit any bot. Everything a bot is lives in these fields — saving
 * writes a database row, and the sidebar picks it up on the next render.
 */
export default function BotForm({
  botId,
  initial,
  models,
  roleOptions,
  userOptions,
  assignedFiles = 0,
  canUpload = false,
  openAIReady = true,
}: {
  botId: string | null;
  initial: BotFormValues;
  models: Option[];
  roleOptions: PickerOption[];
  userOptions: PickerOption[];
  /** Edit mode: how many knowledge files are assigned (decides the answer mode). */
  assignedFiles?: number;
  /** Create mode: may the user upload knowledge files with the new bot? */
  canUpload?: boolean;
  openAIReady?: boolean;
}) {
  const router = useRouter();
  const [v, setV] = useState<BotFormValues>(initial);
  const [pending, start] = useTransition();
  const queue = useKnowledgeQueue();
  const busy = pending || queue.running;
  const set = <K extends keyof BotFormValues>(k: K, value: BotFormValues[K]) => setV((p) => ({ ...p, [k]: value }));
  const prompts = [...v.starterPrompts, ...Array(LIMITS.starterPromptsMax).fill("")].slice(0, LIMITS.starterPromptsMax);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await saveBotAction(botId, {
        ...v,
        temperature: v.temperature.trim() === "" ? null : v.temperature,
        starterPrompts: v.starterPrompts.filter((p) => p.trim()),
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      if (botId) {
        toast.success("Bot saved — changes apply to the next message in every chat.");
        router.refresh();
      } else {
        // The bot exists now, so its own vector store can take the queued files.
        if (queue.pending > 0) {
          const up = await queue.uploadAll(res.botId);
          if (up.failed > 0) toast.error(`${v.name} was created, but ${up.failed} file${up.failed === 1 ? "" : "s"} failed to upload — retry them on the Knowledge Base tab.`);
          else toast.success(`${v.name} created with ${up.ok} knowledge file${up.ok === 1 ? "" : "s"} — it answers only from them.`);
        } else {
          toast.success(`${v.name} created. It answers from its instructions until you add knowledge files.`);
        }
        router.push(`/aibots/bots/${res.botId}?tab=knowledge`);
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <SectionCard title="Identity" description="How the bot appears in the sidebar and chat.">
        <div className="grid gap-4 md:grid-cols-[auto_1fr]">
          <div className="flex flex-col items-center gap-2">
            <BotAvatar icon={v.icon} color={v.color} size="lg" />
            <span className="text-[11px] text-muted-foreground">Preview</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Bot name" htmlFor="b-name">
              <Input id="b-name" required maxLength={LIMITS.nameMax} value={v.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. ProposalGPT" />
            </Field>
            <Field label="Category" htmlFor="b-cat" hint="Shown with the bot in chats and on Manage Bots.">
              <Input id="b-cat" list="b-cat-list" maxLength={40} value={v.category} onChange={(e) => set("category", e.target.value)} placeholder="e.g. Pre-sales" />
              <datalist id="b-cat-list">
                {BOT_CATEGORY_SUGGESTIONS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <Field label="Description" htmlFor="b-desc" className="sm:col-span-2">
              <Textarea id="b-desc" rows={2} maxLength={LIMITS.descriptionMax} value={v.description} onChange={(e) => set("description", e.target.value)} placeholder="What this bot is for — shown to users before they start a chat." />
            </Field>
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Icon">
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Bot icon">
              {BOT_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  role="radio"
                  aria-checked={v.icon === icon}
                  aria-label={icon}
                  onClick={() => set("icon", icon)}
                  className={cn("flex size-8 items-center justify-center rounded-lg border transition-colors", v.icon === icon ? "border-primary bg-primary/10 text-primary" : "border-border/50 text-muted-foreground hover:border-primary/40 hover:text-primary")}
                >
                  <BotIconGlyph icon={icon} className="size-4" />
                </button>
              ))}
            </div>
          </Field>
          <Field label="Colour">
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Bot colour">
              {BOT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={v.color === c}
                  aria-label={c}
                  onClick={() => set("color", c)}
                  className={cn("flex size-8 items-center justify-center rounded-lg border-2", BOT_COLOR_CLASSES[c], v.color === c ? "border-primary" : "border-transparent")}
                >
                  <BotIconGlyph icon={v.icon} className="size-4" />
                </button>
              ))}
            </div>
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Behaviour" description="The OpenAI model and the system instructions every chat with this bot uses.">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="OpenAI model" htmlFor="b-model" hint="Admins manage this list in Settings.">
            <OptionSelect id="b-model" value={v.model} options={models} onChange={(x) => set("model", x)} />
          </Field>
          <Field label="Temperature" htmlFor="b-temp" hint="0 = focused, 1 = creative. Leave blank for the model default (required for reasoning models).">
            <Input id="b-temp" type="number" min={0} max={2} step={0.1} value={v.temperature} onChange={(e) => set("temperature", e.target.value)} placeholder="Model default" />
          </Field>
          <Field label="Status" htmlFor="b-status" hint="Inactive bots disappear from the sidebar.">
            <OptionSelect
              id="b-status"
              value={v.status}
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
              onChange={(x) => set("status", x === "inactive" ? "inactive" : "active")}
            />
          </Field>
        </div>
        <Field label="System instructions" htmlFor="b-instr" className="mt-4" hint={`${v.instructions.length.toLocaleString()} / ${LIMITS.instructionsMax.toLocaleString()} characters. Edits apply to the next message in every chat; earlier replies stay as they were.`}>
          <Textarea
            id="b-instr"
            required
            rows={10}
            maxLength={LIMITS.instructionsMax}
            value={v.instructions}
            onChange={(e) => set("instructions", e.target.value)}
            className="font-mono text-xs"
            placeholder={"You are ProposalGPT, our company's proposal writer.\n\n- Use the company profile, services and case studies in your knowledge base.\n- Structure proposals as: Executive summary, Scope, Approach, Timeline, Commercials.\n- Ask for the client name, industry and goals if they're missing."}
          />
        </Field>
        <Field label="Starter prompts" className="mt-4" hint="Optional one-click questions shown on a new chat.">
          <div className="grid gap-2 sm:grid-cols-2">
            {prompts.map((p, i) => (
              <Input
                key={i}
                value={p}
                maxLength={200}
                aria-label={`Starter prompt ${i + 1}`}
                placeholder={`Starter prompt ${i + 1}`}
                onChange={(e) => {
                  const next = [...prompts];
                  next[i] = e.target.value;
                  set("starterPrompts", next);
                }}
              />
            ))}
          </div>
        </Field>
        <label className="mt-4 flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-0.5 size-4 accent-[var(--primary)]" checked={v.allowAttachments} onChange={(e) => set("allowAttachments", e.target.checked)} />
          <span>
            Allow file attachments in chats
            <span className="block text-[11px] text-muted-foreground">Users can attach PDFs, images, text, CSV or Excel files to a message (sent to OpenAI for that chat only — not added to the knowledge base).</span>
          </span>
        </label>
      </SectionCard>

      <SectionCard
        title="Knowledge base"
        description={botId ? "This bot's own knowledge files. Manage them on the Knowledge Base tab." : "Optional. Files uploaded here go to this bot's own OpenAI vector store — no other bot can search them."}
      >
        <div className="space-y-3">
          <AnswerModeNotice assigned={botId ? assignedFiles : queue.pending} />
          {botId ? (
            <Button type="button" variant="outline" size="sm" nativeButton={false} render={<Link href={`/aibots/bots/${botId}?tab=knowledge`} />}>
              Manage knowledge files ({assignedFiles} assigned)
            </Button>
          ) : canUpload ? (
            <>
              <KnowledgeQueueFields queue={queue} disabled={!openAIReady || pending} idPrefix="new-kb" />
              {!openAIReady && <p className="text-[11px] text-muted-foreground">OpenAI isn&apos;t connected for this workspace (Settings → Integrations), so files can&apos;t be uploaded yet.</p>}
            </>
          ) : (
            <p className="text-xs text-muted-foreground">You don&apos;t have permission to upload knowledge files. Someone with that permission can add them after the bot is created.</p>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Access" description="Who sees this bot in their sidebar and can chat with it. AI Bots managers can always open every bot.">
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Access mode">
          {(
            [
              ["all", "Everyone with AI Bots access"],
              ["restricted", "Only selected roles and people"],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={v.accessMode === mode}
              onClick={() => set("accessMode", mode)}
              className={cn("rounded-xl border px-3 py-2 text-sm transition-colors", v.accessMode === mode ? "border-primary bg-primary/10 font-medium text-primary" : "border-border/60 text-muted-foreground hover:border-primary/40")}
            >
              {label}
            </button>
          ))}
        </div>
        {v.accessMode === "restricted" && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Roles" hint="Anyone holding one of these roles (and an AI Bots role to sign in).">
              <MultiPicker options={roleOptions} value={v.accessRoles} onChange={(x) => set("accessRoles", x)} placeholder="Search roles" />
            </Field>
            <Field label="People" hint="Specific AI Bots users. They get a notification when added.">
              <MultiPicker options={userOptions} value={v.accessUserIds} onChange={(x) => set("accessUserIds", x)} placeholder="Search people" emptyLabel="No AI Bots users yet." />
            </Field>
          </div>
        )}
      </SectionCard>

      <div className="flex justify-end">
        <Button type="submit" disabled={busy}>
          {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
          {botId ? "Save changes" : queue.running ? "Uploading knowledge…" : queue.pending > 0 ? `Create bot & upload ${queue.pending} file${queue.pending === 1 ? "" : "s"}` : "Create bot"}
        </Button>
      </div>
    </form>
  );
}
