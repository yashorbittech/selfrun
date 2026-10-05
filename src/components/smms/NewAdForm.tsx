"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import OptionSelect from "@/components/sop/OptionSelect";
import { Field } from "@/components/smms/SmmsBits";
import { createAdAction } from "@/app/smms/(protected)/actions";
import { PLATFORM_META, type AdPlatform } from "@/lib/smms/constants";

export default function NewAdForm({ campaignId, platforms }: { campaignId: string; platforms: AdPlatform[] }) {
  const router = useRouter();
  const [platform, setPlatform] = useState<string>(platforms[0] ?? "");
  const [format, setFormat] = useState<"image" | "video">("image");
  const [formatKey, setFormatKey] = useState("");
  const [name, setName] = useState("");
  const [pending, start] = useTransition();
  const sizes = platform ? PLATFORM_META[platform as AdPlatform].formats.filter((f) => f.kind === "both" || f.kind === format) : [];

  function create() {
    start(async () => {
      const res = await createAdAction(campaignId, { name, platform, format, formatKey }, null);
      if (!res.ok) toast.error(res.error);
      else router.push(`/smms/campaigns/${campaignId}/ads/${res.id}`);
    });
  }

  return (
    <div className="grid items-end gap-3 sm:grid-cols-[1fr_10rem_8rem_12rem_auto]">
      <Field label="Ad name" htmlFor="na-name"><Input id="na-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Auto-named if empty" /></Field>
      <Field label="Platform"><OptionSelect value={platform} onChange={(v) => { setPlatform(v); setFormatKey(""); }} options={platforms.map((p) => ({ value: p, label: PLATFORM_META[p].label }))} aria-label="Platform" /></Field>
      <Field label="Format"><OptionSelect value={format} onChange={(v) => { setFormat(v === "video" ? "video" : "image"); setFormatKey(""); }} options={[{ value: "image", label: "Image ad" }, { value: "video", label: "Video ad" }]} aria-label="Format" /></Field>
      <Field label="Size / placement"><OptionSelect value={formatKey} onChange={setFormatKey} options={sizes.map((f) => ({ value: f.key, label: `${f.label} · ${f.width}×${f.height}` }))} noneLabel="Choose later" aria-label="Size" /></Field>
      <Button type="button" onClick={create} disabled={pending || !platform}>{pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Add ad</Button>
    </div>
  );
}
