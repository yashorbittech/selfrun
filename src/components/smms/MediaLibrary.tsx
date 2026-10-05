"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Upload, Sparkles, Save, Trash2, Download, RefreshCw, Wand2, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import OptionSelect from "@/components/sop/OptionSelect";
import { Field, MediaThumb, PlatformChip, formatBytes, mediaSrc } from "@/components/smms/SmmsBits";
import MediaPicker from "@/components/smms/MediaPicker";
import { useMediaUpload } from "@/components/smms/useMediaUpload";
import { deleteMediaAction, generateLibraryImageAction, generateMediaPromptAction, mediaUsageAction, updateMediaMetaAction } from "@/app/smms/(protected)/actions";
import { PLATFORMS, PLATFORM_META } from "@/lib/smms/constants";
import type { MediaCard } from "@/lib/smms/media";
import { formatDateTime } from "@/lib/utils";

export interface LibraryItem extends MediaCard {
  description: string;
  tags: string[];
  platform: string | null;
  creativePrompt: string;
  script: string;
  caption: string;
  createdAt: string;
  versions: number;
  thumbnail: MediaCard | null;
}

function Detail({ item, canManage, canGenerate, onClose }: { item: LibraryItem; canManage: boolean; canGenerate: boolean; onClose: () => void }) {
  const router = useRouter();
  const [f, setF] = useState({ name: item.name, description: item.description, altText: item.altText, tags: item.tags.join(", "), platform: item.platform ?? "", creativePrompt: item.creativePrompt, script: item.script, caption: item.caption });
  const [thumb, setThumb] = useState<MediaCard | null>(item.thumbnail);
  const [usage, setUsage] = useState<{ ads: { _id: string; name: string; campaignId: string }[]; posts: { _id: string; title: string }[]; videos: { _id: string; name: string }[] } | null>(null);
  const [pending, start] = useTransition();
  const [ai, startAi] = useTransition();
  const { uploadFile, progress } = useMediaUpload();
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));

  useEffect(() => {
    let live = true;
    mediaUsageAction(item._id).then((r) => live && r.ok && setUsage(r.usage));
    return () => {
      live = false;
    };
  }, [item._id]);

  const inUse = usage ? usage.ads.length + usage.posts.length + usage.videos.length : 0;
  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4">
      <div className="overflow-hidden rounded-xl border border-border/50 bg-muted">
        {item.kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element -- private authenticated media
          <img src={mediaSrc(item._id, item.updatedAt)} alt={item.altText || item.name} className="max-h-80 w-full object-contain" />
        ) : (
          <video src={mediaSrc(item._id, item.updatedAt)} controls preload="metadata" poster={thumb ? mediaSrc(thumb._id) : undefined} className="max-h-80 w-full" />
        )}
      </div>
      <p className="text-[11px] text-muted-foreground">{`${item.contentType} · ${formatBytes(item.size)}${item.width && item.height ? ` · ${item.width}×${item.height}` : ""}${item.durationSec ? ` · ${item.durationSec}s` : ""} · ${item.source === "ai" ? "AI generated" : "Uploaded"} ${formatDateTime(item.createdAt)}${item.versions ? ` · ${item.versions} earlier file version(s)` : ""}`}</p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" nativeButton={false} render={<a href={`${mediaSrc(item._id)}?download=1`} />}><Download className="size-3.5" /> Download</Button>
        {canManage && (
          <>
            <input ref={fileRef} type="file" hidden accept={item.kind === "video" ? "video/mp4,video/quicktime,video/webm" : "image/jpeg,image/png,image/webp,image/gif"} onChange={async (e) => { const file = e.target.files?.[0]; if (file && (await uploadFile(file, { replaceId: item._id, accept: item.kind }))) { onClose(); router.refresh(); } }} />
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={progress !== null}>{progress !== null ? <><Loader2 className="size-3.5 animate-spin" />{`${progress}%`}</> : <><RefreshCw className="size-3.5" /> Replace file</>}</Button>
          </>
        )}
      </div>

      <div className="grid gap-3">
        <Field label="Name" htmlFor="md-name"><Input id="md-name" value={f.name} disabled={!canManage} onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label="Alt text" htmlFor="md-alt"><Input id="md-alt" value={f.altText} disabled={!canManage} onChange={(e) => set("altText", e.target.value)} placeholder="Describe it for screen readers" /></Field>
        <Field label="Description" htmlFor="md-desc"><Textarea id="md-desc" rows={2} value={f.description} disabled={!canManage} onChange={(e) => set("description", e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tags" htmlFor="md-tags"><Input id="md-tags" value={f.tags} disabled={!canManage} onChange={(e) => set("tags", e.target.value)} placeholder="diwali, product" /></Field>
          <Field label="Intended platform"><OptionSelect value={f.platform} disabled={!canManage} onChange={(v) => set("platform", v)} options={PLATFORMS.map((p) => ({ value: p, label: PLATFORM_META[p].label }))} noneLabel="Any" aria-label="Platform" /></Field>
        </div>
        <Field label="Caption" htmlFor="md-cap"><Textarea id="md-cap" rows={2} value={f.caption} disabled={!canManage} onChange={(e) => set("caption", e.target.value)} /></Field>
        {item.kind === "video" && (
          <>
            <Field label="Script" htmlFor="md-script"><Textarea id="md-script" rows={5} value={f.script} disabled={!canManage} onChange={(e) => set("script", e.target.value)} /></Field>
            <Field label="Thumbnail">
              <div className="flex items-center gap-2">
                {thumb ? <MediaThumb media={thumb} className="size-16" /> : <span className="text-xs text-muted-foreground">None</span>}
                {canManage && <MediaPicker kind="image" multiple={false} canUpload onPick={(x) => setThumb(x[0] ?? null)} trigger={<Button type="button" size="xs" variant="outline"><ImagePlus className="size-3" /> Choose</Button>} />}
                {canManage && thumb && <Button type="button" size="icon-xs" variant="ghost" aria-label="Remove thumbnail" onClick={() => setThumb(null)}><X className="size-3" /></Button>}
              </div>
            </Field>
          </>
        )}
        <Field label="Creative prompt" htmlFor="md-prompt" hint="Reusable AI image prompt for this creative.">
          <Textarea id="md-prompt" rows={4} value={f.creativePrompt} disabled={!canManage} onChange={(e) => set("creativePrompt", e.target.value)} />
        </Field>
      </div>

      {canManage && (
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" disabled={pending} onClick={() => start(async () => {
            const res = await updateMediaMetaAction(item._id, { ...f, thumbnailId: item.kind === "video" ? (thumb?._id ?? "") : undefined });
            if (!res.ok) return void toast.error(res.error);
            toast.success("Saved.");
            router.refresh();
          })}>{pending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />} Save details</Button>
          {canGenerate && (
            <Button type="button" size="sm" variant="outline" disabled={ai} onClick={() => startAi(async () => {
              const res = await generateMediaPromptAction(item._id);
              if (!res.ok) return void toast.error(res.error);
              set("creativePrompt", res.prompt);
              toast.success("Creative prompt generated and saved.");
            })}>{ai ? <Loader2 className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5" />} Generate creative prompt</Button>
          )}
          {canGenerate && f.creativePrompt.trim() && (
            <Button type="button" size="sm" variant="outline" disabled={ai} onClick={() => startAi(async () => {
              const res = await generateLibraryImageAction({ prompt: f.creativePrompt, platform: f.platform, formatKey: "", name: `${f.name} — AI variant` });
              if (!res.ok) return void toast.error(res.error);
              toast.success("New AI image added to the library.");
              router.refresh();
            })}><Sparkles className="size-3.5" /> Generate image from prompt</Button>
          )}
        </div>
      )}

      <div className="rounded-xl border border-border/50 p-3 text-xs">
        <p className="mb-1 font-semibold">Used in</p>
        {usage === null ? <Loader2 className="size-3.5 animate-spin" /> : inUse === 0 ? <p className="text-muted-foreground">Not attached to anything.</p> : (
          <ul className="space-y-0.5">
            {usage.posts.map((x) => <li key={x._id}><Link className="text-primary hover:underline" href={`/smms/posts/${x._id}`}>{`Post: ${x.title}`}</Link></li>)}
            {usage.ads.map((x) => <li key={x._id}><Link className="text-primary hover:underline" href={`/smms/campaigns/${x.campaignId}/ads/${x._id}`}>{`Ad: ${x.name}`}</Link></li>)}
            {usage.videos.map((x) => <li key={x._id}>{`Thumbnail of video: ${x.name}`}</li>)}
          </ul>
        )}
      </div>
      {canManage && (
        <Button type="button" size="sm" variant="destructive" disabled={pending || inUse > 0} title={inUse > 0 ? "Detach it first" : undefined} onClick={() => { if (!confirm(`Delete “${item.name}” from the library?`)) return; start(async () => { const res = await deleteMediaAction(item._id); if (!res.ok) return void toast.error(res.error); toast.success("Deleted."); onClose(); router.refresh(); }); }}>
          <Trash2 className="size-3.5" /> Delete
        </Button>
      )}
    </div>
  );
}

function GenerateImageDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("");
  const [formatKey, setFormatKey] = useState("");
  const [pending, start] = useTransition();
  const formats = platform ? PLATFORM_META[platform as keyof typeof PLATFORM_META].formats.filter((x) => x.kind !== "video") : [];
  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}><Sparkles className="size-4" /> Generate image</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate an image with OpenAI</DialogTitle>
            <DialogDescription>The result is saved to the media library, sized to the nearest supported aspect for the chosen format.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Field label="Prompt" htmlFor="gi-p"><Textarea id="gi-p" rows={5} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="A clean, modern flat illustration of…" /></Field>
            <Field label="Name" htmlFor="gi-n"><Input id="gi-n" value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Platform"><OptionSelect value={platform} onChange={(v) => { setPlatform(v); setFormatKey(""); }} options={PLATFORMS.map((p) => ({ value: p, label: PLATFORM_META[p].label }))} noneLabel="Any (square)" aria-label="Platform" /></Field>
              <Field label="Format"><OptionSelect value={formatKey} onChange={setFormatKey} disabled={!platform} options={formats.map((x) => ({ value: x.key, label: `${x.label}` }))} noneLabel="Square" aria-label="Format" /></Field>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" disabled={pending || prompt.trim().length < 10} onClick={() => start(async () => {
              const res = await generateLibraryImageAction({ prompt, platform, formatKey, name: name || prompt.slice(0, 60) });
              if (!res.ok) return void toast.error(res.error);
              toast.success("Image generated.");
              setOpen(false);
              setPrompt("");
              router.refresh();
            })}>{pending ? <><Loader2 className="size-4 animate-spin" /> Generating…</> : <><Sparkles className="size-4" /> Generate</>}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function MediaLibrary({ items, canManage, canGenerate, openId }: { items: LibraryItem[]; canManage: boolean; canGenerate: boolean; openId: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState<LibraryItem | null>(() => items.find((i) => i._id === openId) ?? null);
  const { uploadFile, progress } = useMediaUpload();
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFiles(files: FileList | null) {
    let any = false;
    for (const f of Array.from(files ?? [])) if (await uploadFile(f)) any = true;
    if (fileRef.current) fileRef.current.value = "";
    if (any) router.refresh();
  }

  return (
    <div className="space-y-3">
      {(canManage || canGenerate) && (
        <div className="flex flex-wrap gap-2">
          {canManage && (
            <>
              <input ref={fileRef} type="file" hidden multiple accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm" onChange={(e) => onFiles(e.target.files)} />
              <Button type="button" onClick={() => fileRef.current?.click()} disabled={progress !== null}>{progress !== null ? <><Loader2 className="size-4 animate-spin" />{`Uploading ${progress}%`}</> : <><Upload className="size-4" /> Upload images / videos</>}</Button>
            </>
          )}
          {canManage && canGenerate && <GenerateImageDialog />}
        </div>
      )}
      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/60 py-12 text-center text-sm text-muted-foreground">No media yet. Upload images and videos (up to 20 MB / 500 MB) or generate images with AI.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
          {items.map((m) => (
            <button key={m._id} type="button" onClick={() => setOpen(m)} className="group rounded-xl border border-border/50 bg-card/70 p-1.5 text-left transition hover:border-primary/40">
              <MediaThumb media={m.thumbnail && m.kind === "video" ? { ...m, thumbnailId: m.thumbnail._id } : m} className="aspect-square w-full" />
              <p className="mt-1 truncate px-0.5 text-xs font-medium group-hover:text-primary">{m.name}</p>
              <div className="flex items-center gap-1 px-0.5 text-[10px] text-muted-foreground">
                {m.source === "ai" && <Sparkles className="size-3 text-violet-500" aria-label="AI generated" />}
                <span className="truncate">{`${m.width && m.height ? `${m.width}×${m.height} · ` : ""}${formatBytes(m.size)}`}</span>
                {m.platform && <PlatformChip platform={m.platform} className="ml-auto" />}
              </div>
            </button>
          ))}
        </div>
      )}
      <Sheet open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="flex w-full flex-col sm:max-w-lg">
          <SheetHeader className="border-b border-border/60">
            <SheetTitle>{open?.name ?? "Media"}</SheetTitle>
            <SheetDescription>{open?.kind === "video" ? "Video" : "Image"} in the media library</SheetDescription>
          </SheetHeader>
          {open && <Detail key={open._id} item={open} canManage={canManage} canGenerate={canGenerate} onClose={() => setOpen(null)} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}
