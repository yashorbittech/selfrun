"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import OptionSelect from "@/components/products/playbook-ai/OptionSelect";
import AiField from "@/components/products/viralpulse-ai/shared/AiField";
import { Field } from "@/components/products/viralpulse-ai/SmmsBits";
import { generateLibraryImageAction } from "@/app/(products)/viralpulse-ai/(protected)/actions";
import { PLATFORMS, PLATFORM_META } from "@/lib/products/viralpulse-ai/constants";
import type { MediaCard } from "@/lib/products/viralpulse-ai/media";

/**
 * Text prompt -> image saved to the media library (OpenAI). Used inline in the AI Image Studio and inside the Library's
 * "Generate image" dialog. The prompt and the name each have an AI button that reads the other fields.
 */
export default function ImageGenerateForm({ onDone, idPrefix = "gi", canUseAi = true }: { onDone?: (media: MediaCard) => void; idPrefix?: string; canUseAi?: boolean }) {
  const [prompt, setPrompt] = useState("");
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("");
  const [formatKey, setFormatKey] = useState("");
  const [pending, start] = useTransition();
  const formats = platform ? PLATFORM_META[platform as keyof typeof PLATFORM_META].formats.filter((x) => x.kind !== "video") : [];
  const formatLabel = formats.find((f) => f.key === formatKey)?.label ?? "";
  const ctx = () => ({ name, platform, formatKey: formatLabel || formatKey, prompt });

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await generateLibraryImageAction({ prompt, platform, formatKey, name: name || prompt.slice(0, 60) });
          if (!res.ok) return void toast.error(res.error);
          toast.success("Image generated and saved to the library.");
          setPrompt("");
          setName("");
          onDone?.(res.media);
        });
      }}
    >
      <AiField fieldKey="image.prompt" label="Prompt" id={`${idPrefix}-p`} as="textarea" rows={5} value={prompt} onChange={(v) => setPrompt(String(v))} getContext={ctx} placeholder="A clean, modern flat illustration of…" aiDisabled={!canUseAi} aiDisabledReason="OpenAI isn't connected, or you can't use AI here." />
      <AiField fieldKey="image.name" label="Name" id={`${idPrefix}-n`} value={name} onChange={(v) => setName(String(v))} getContext={() => ({ prompt, platform })} aiDisabled={!canUseAi} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Platform"><OptionSelect value={platform} onChange={(v) => { setPlatform(v); setFormatKey(""); }} options={PLATFORMS.map((p) => ({ value: p, label: PLATFORM_META[p].label }))} noneLabel="Any (square)" aria-label="Platform" /></Field>
        <Field label="Format"><OptionSelect value={formatKey} onChange={setFormatKey} disabled={!platform} options={formats.map((x) => ({ value: x.key, label: `${x.label}` }))} noneLabel="Square" aria-label="Format" /></Field>
      </div>
      <p className="text-[11px] text-muted-foreground">The result is saved to the Library, sized to the nearest supported aspect for the chosen format.</p>
      <Button type="submit" disabled={pending || prompt.trim().length < 10}>{pending ? <><Loader2 className="size-4 animate-spin" /> Generating…</> : <><Sparkles className="size-4" /> Generate image</>}</Button>
    </form>
  );
}
