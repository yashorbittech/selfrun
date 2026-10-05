"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { AlertTriangle, Check, CheckCircle2, Clock, Copy, Download, ExternalLink, Globe, Laptop, Loader2, Monitor, PackageOpen, RefreshCw, Smartphone, Terminal, Wand2 } from "lucide-react";
import GlassCard from "@/components/lms/GlassCard";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { InstallCard } from "@/components/pwa/InstallApp";
import { DESKTOP_PLATFORMS, MOBILE_PLATFORMS, PLATFORM_META, type AppPlatform, type AppsOverview, type GenerationScope, type ManualState } from "@/lib/apps/types";

export interface AppsBrand {
  name: string;
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  /** Changes whenever the look changes: appended to asset URLs so previews follow the settings. */
  version: string;
  logoUrl: string | null;
  initials: string;
  primary: string;
  primaryForeground: string;
}

type Actions = {
  build: (scope: GenerationScope) => Promise<{ ok: true; message: string } | { ok: false; error: string }>;
  setAutomatic: (on: boolean) => Promise<{ ok: true }>;
};

const TABS = [
  { key: "pwa", label: "PWA Application", sub: "For all devices", icon: Globe },
  { key: "mobile", label: "Mobile Application", sub: "Android & iOS", icon: Smartphone },
  { key: "desktop", label: "Desktop Application", sub: "Windows, Linux, macOS", icon: Monitor },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const PLATFORM_ICON: Record<AppPlatform, typeof Monitor> = { win: Monitor, mac: Laptop, linux: Terminal, android: Smartphone, ios: Smartphone };

function fileLabel(name: string): string {
  if (/\.exe$/i.test(name)) return "Windows installer (.exe)";
  if (/\.dmg$/i.test(name)) return "macOS disk image (.dmg)";
  if (/\.AppImage$/i.test(name)) return "AppImage (any Linux)";
  if (/\.deb$/i.test(name)) return "Debian / Ubuntu (.deb)";
  if (/\.apk$/i.test(name)) return "Android app (.apk): install directly";
  if (/android-studio-project\.zip$/i.test(name)) return "Android Studio project (.zip)";
  if (/xcode-project\.zip$/i.test(name)) return "Xcode project (.zip)";
  return name;
}
const size = (b: number | null) => (!b ? "" : b > 1_048_576 ? `${(b / 1_048_576).toFixed(0)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

// ── previews ────────────────────────────────────────────────────────────────

/** The company's artwork as it will look: from the generated assets themselves, so a change in settings shows here at once. */
function Art({ brand, id, className, alt = "" }: { brand: AppsBrand; id: string; className?: string; alt?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/api/apps/assets/file/${id}.png?v=${brand.version}`} alt={alt} className={className} loading="lazy" />;
}

function PhoneFrame({ children, bg }: { children: React.ReactNode; bg: string }) {
  return (
    <div className="mx-auto w-[150px] rounded-[26px] border-[5px] border-slate-800 bg-slate-800 shadow-lg dark:border-slate-600">
      <div className="relative h-[290px] overflow-hidden rounded-[20px]" style={{ background: bg }}>
        <div className="absolute left-1/2 top-1.5 h-2 w-12 -translate-x-1/2 rounded-full bg-slate-800/80" />
        {children}
      </div>
    </div>
  );
}

function HomeScreenPreview({ brand, shape }: { brand: AppsBrand; shape: "round" | "squircle" }) {
  return (
    <PhoneFrame bg="linear-gradient(160deg,#cbd5e1,#94a3b8)">
      <div className="grid h-full grid-cols-3 content-start gap-x-1 gap-y-3 px-3 pt-9">
        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="mx-auto size-8 rounded-[10px] bg-white/40" />)}
        <div className="flex flex-col items-center gap-0.5">
          <Art brand={brand} id={shape === "round" ? "android-round-xxxhdpi" : "ios-180"} className={`size-9 ${shape === "round" ? "rounded-full" : "rounded-[9px]"} object-cover shadow`} />
          <span className="max-w-[44px] truncate text-[7px] font-medium text-slate-900">{brand.shortName}</span>
        </div>
      </div>
    </PhoneFrame>
  );
}

function SplashPreview({ brand, id }: { brand: AppsBrand; id: string }) {
  return (
    <PhoneFrame bg={brand.backgroundColor}>
      <Art brand={brand} id={id} className="size-full scale-[1.25] object-cover" />
    </PhoneFrame>
  );
}

function AssetGrid({ brand, items, pack }: { brand: AppsBrand; items: { id: string; label: string; w: number; h: number }[]; pack: { href: string; label: string } }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">Generated assets</h3>
          <p className="text-xs text-muted-foreground">Drawn automatically from your name, logo and colours. They update when you change them.</p>
        </div>
        <a href={pack.href} className={buttonVariants({ variant: "outline", size: "sm" })}><PackageOpen className="size-4" data-icon="inline-start" /> {pack.label}</a>
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((a) => (
          <li key={a.id} className="space-y-1.5 rounded-xl border border-border bg-muted/30 p-2.5">
            <div className="flex h-24 items-center justify-center overflow-hidden rounded-lg bg-[repeating-conic-gradient(#e5e7eb_0%_25%,#f8fafc_0%_50%)] bg-[length:12px_12px]">
              <Art brand={brand} id={a.id} className="max-h-24 max-w-full object-contain" alt={a.label} />
            </div>
            <p className="truncate text-[11px] font-medium text-foreground" title={a.label}>{a.label}</p>
            <p className="text-[10px] text-muted-foreground">{a.w}×{a.h}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── generation: automatic and manual ────────────────────────────────────────

function ago(iso: string): string {
  const m = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`;
}

function GenerationBar({ scope, o, actions, onChanged, packHref }: { scope: Exclude<GenerationScope, "all">; o: AppsOverview; actions: Actions; onChanged: () => void; packHref: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const m: ManualState = o.manual[scope];

  const run = () =>
    start(async () => {
      setMsg(null);
      const r = await actions.build(scope);
      setMsg(r.ok ? { kind: "ok", text: r.message } : { kind: "error", text: r.error });
      onChanged();
    });
  const toggle = (on: boolean) => start(async () => { await actions.setAutomatic(on); onChanged(); });

  // The automatic side, in words.
  let auto: { tone: "ok" | "run" | "warn" | "off"; text: string };
  if (!o.automatic) auto = { tone: "off", text: "Switched off. Your apps are only generated when you press the button." };
  else if (m.kind === "auto-running") auto = { tone: "run", text: `Running now (started ${ago(m.since)}). This usually takes 10 to 20 minutes and this page updates by itself.` };
  else if (m.kind === "auto-stalled") auto = { tone: "warn", text: `Not generating: ${m.reason}` };
  else if (m.kind === "manual-running") auto = { tone: "run", text: "Waiting: a manual build is running." };
  else auto = { tone: "ok", text: o.onboardingDone ? "On. Your apps are rebuilt when your name or icon changes, and checked daily." : "On. Your apps are generated automatically the moment you finish setup." };

  // The manual side: always shown, with a message that says why it is or isn't available.
  let manual: { enabled: boolean; text: string };
  if (m.kind === "auto-running") manual = { enabled: false, text: "Automatic generation is running, so manual generation is paused. If it never finishes, this button becomes available again." };
  else if (m.kind === "manual-running") manual = { enabled: false, text: `A manual build is running (started ${ago(m.since)}).` };
  else if (m.kind === "auto-stalled") manual = { enabled: o.configured, text: o.configured ? "Automatic generation isn't producing your apps. Generate them manually now." : "Automatic generation can't run because the platform's build service isn't connected yet. You can still download all the assets." };
  else if (m.kind === "auto-off") manual = { enabled: o.configured, text: o.configured ? "Generate your apps now." : "The build service isn't connected yet, so apps can't be built here. You can still download all the assets." };
  else manual = { enabled: o.configured, text: o.configured ? "Don't want to wait? Generate your apps now." : "The build service isn't connected yet; your apps will be built automatically once it is." };

  const dot = { ok: "bg-emerald-500", run: "bg-primary animate-pulse", warn: "bg-amber-500", off: "bg-muted-foreground/40" }[auto.tone];
  return (
    <GlassCard containerClassName="h-auto" className="p-0">
      <div className="grid divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0">
        <div className="space-y-2 p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold"><span className={`size-2 rounded-full ${dot}`} /> Automatic generation</h3>
            <label className="flex items-center gap-2 text-xs text-muted-foreground"><Checkbox checked={o.automatic} onCheckedChange={(v) => toggle(v === true)} disabled={pending} /> {o.automatic ? "On" : "Off"}</label>
          </div>
          <p className="text-sm text-muted-foreground">{auto.text}</p>
        </div>
        <div className="space-y-2 p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold"><Wand2 className="size-4 text-primary" /> Manual generation</h3>
          <p className="text-sm text-muted-foreground">{manual.text}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" onClick={run} disabled={!manual.enabled || pending}>
              {pending ? <Loader2 className="size-4 animate-spin" data-icon="inline-start" /> : <RefreshCw className="size-4" data-icon="inline-start" />} Generate manually
            </Button>
            {!manual.enabled && !o.configured ? <a href={packHref} className={buttonVariants({ variant: "outline", size: "sm" })}><PackageOpen className="size-4" data-icon="inline-start" /> Download assets</a> : null}
          </div>
          {msg ? <p role="status" className={`text-xs ${msg.kind === "error" ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}`}>{msg.text}</p> : null}
        </div>
      </div>
    </GlassCard>
  );
}

// ── one platform card ───────────────────────────────────────────────────────

function PlatformCard({ p, o, extra }: { p: AppPlatform; o: AppsOverview; extra?: React.ReactNode }) {
  const meta = PLATFORM_META[p];
  const Icon = PLATFORM_ICON[p];
  const ready = o.downloads[p];
  const st = o.latest?.platforms[p];
  const status = st && !["ready", "skipped"].includes(st.status) ? st.status : null;
  const building = o.active !== null && o.active.platforms[p].status !== "skipped";
  return (
    <GlassCard containerClassName="h-auto" className="space-y-3 p-5">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold">{meta.label}</h3>
            {ready ? <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">Ready · v{ready.version}</span> : null}
            {status === "building" ? <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"><Loader2 className="size-3 animate-spin" /> Building</span> : null}
            {status === "queued" && building ? <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">Queued</span> : null}
            {status === "failed" ? <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">Failed</span> : null}
          </div>
          <p className="text-sm text-muted-foreground">{meta.hint}</p>
        </div>
      </div>
      {ready ? (
        <div className="space-y-2">
          {ready.files.map((f) => (
            <a key={f.url} href={f.url} rel="noopener noreferrer" className={buttonVariants({ variant: "outline", size: "sm", className: "w-full justify-between" })}>
              <span className="inline-flex items-center gap-2"><Download className="size-4" /> {fileLabel(f.name)}</span>
              <span className="text-xs text-muted-foreground">{size(f.size)}</span>
            </a>
          ))}
          <p className="text-xs text-muted-foreground" suppressHydrationWarning>Built {new Date(ready.builtAt).toLocaleDateString()}{status === "building" ? " · a newer version is being built" : status === "failed" ? " · the latest build failed" : ""}</p>
        </div>
      ) : status === "failed" ? (
        <p className="text-sm text-destructive">{st?.error ?? "This build failed."}</p>
      ) : (
        <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">{building ? "Being generated for you…" : "Not generated yet."}</p>
      )}
      {extra}
    </GlassCard>
  );
}

// ── tabs ────────────────────────────────────────────────────────────────────

const INSTALL_STEPS: { title: string; where: string; steps: string }[] = [
  { title: "Android", where: "Chrome, Samsung Internet, Edge", steps: "Open the address, tap the menu (⋮), then Install app (or Add to Home screen)." },
  { title: "iPhone and iPad", where: "Safari", steps: "Open the address in Safari, tap Share, then Add to Home Screen. (Notifications work from the installed app.)" },
  { title: "Windows, Linux, ChromeOS", where: "Chrome, Edge, Brave", steps: "Open the address and click the install icon in the address bar, or the menu, then Install." },
  { title: "macOS", where: "Safari, Chrome, Edge", steps: "Safari: File, then Add to Dock. Chrome and Edge: the install icon in the address bar." },
];

export default function AppsTabs({ initial, brand, qr, actions }: { initial: AppsOverview; brand: AppsBrand; qr: string; actions: Actions }) {
  const [o, setO] = useState(initial);
  const [tab, setTab] = useState<TabKey>("pwa");
  const [copied, setCopied] = useState(false);
  const building = o.active !== null;

  // Remember the tab in the address (#mobile) so a link or refresh keeps it.
  useEffect(() => {
    const h = window.location.hash.replace("#", "") as TabKey;
    if (TABS.some((t) => t.key === h)) setTab(h);
  }, []);
  const choose = (k: TabKey) => { setTab(k); history.replaceState(null, "", `#${k}`); };

  const refresh = async () => {
    const res = await fetch("/api/apps/builds", { credentials: "same-origin", cache: "no-store" }).catch(() => null);
    if (res?.ok) setO(await res.json());
  };
  useEffect(() => {
    if (!building) return;
    const id = setInterval(refresh, 8000);
    return () => clearInterval(id);
  }, [building]);

  const address = `https://${o.appAddress}`;
  const copy = async () => { try { await navigator.clipboard.writeText(address); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ } };

  const desktopAssets = useMemo(() => [{ id: "desktop-256", label: "Icon 256", w: 256, h: 256 }, { id: "desktop-64", label: "Icon 64", w: 64, h: 64 }, { id: "desktop-32", label: "Tray icon 32", w: 32, h: 32 }, { id: "desktop-1024", label: "Installer icon 1024", w: 1024, h: 1024 }], []);
  const pwaAssets = useMemo(() => [{ id: "pwa-512", label: "Icon 512", w: 512, h: 512 }, { id: "pwa-192", label: "Icon 192", w: 192, h: 192 }, { id: "pwa-maskable-512", label: "Maskable 512", w: 512, h: 512 }, { id: "pwa-apple-180", label: "Apple touch 180", w: 180, h: 180 }, { id: "pwa-favicon-32", label: "Favicon 32", w: 32, h: 32 }], []);
  const androidAssets = useMemo(() => [{ id: "android-xxxhdpi", label: "Launcher 192", w: 192, h: 192 }, { id: "android-round-xxxhdpi", label: "Round 192", w: 192, h: 192 }, { id: "android-fg-xxxhdpi", label: "Adaptive foreground", w: 432, h: 432 }, { id: "android-playstore", label: "Play Store icon", w: 512, h: 512 }, { id: "android-feature", label: "Feature graphic", w: 1024, h: 500 }, { id: "android-splash", label: "Splash screen", w: 1080, h: 1920 }], []);
  const iosAssets = useMemo(() => [{ id: "ios-180", label: "iPhone icon 180", w: 180, h: 180 }, { id: "ios-120", label: "Icon 120", w: 120, h: 120 }, { id: "ios-1024", label: "App Store icon", w: 1024, h: 1024 }, { id: "ios-splash", label: "Launch screen", w: 2732, h: 2732 }], []);

  return (
    <div className="space-y-4">
      {/* tabs */}
      <div role="tablist" aria-label="Apps" className="grid gap-2 sm:grid-cols-3">
        {TABS.map((t) => {
          const on = tab === t.key;
          return (
            <button key={t.key} type="button" role="tab" aria-selected={on} onClick={() => choose(t.key)} className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-colors ${on ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:bg-muted/50"}`}>
              <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${on ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}><t.icon className="size-5" /></span>
              <span className="min-w-0"><span className="block text-sm font-semibold">{t.label}</span><span className="block text-xs text-muted-foreground">{t.sub}</span></span>
            </button>
          );
        })}
      </div>

      {/* 1. PWA */}
      {tab === "pwa" ? (
        <div role="tabpanel" className="space-y-4">
          <GlassCard containerClassName="h-auto" className="p-5">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto_auto]">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold">PWA application</h2>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">Ready · always up to date</span>
                </div>
                <p className="text-sm text-muted-foreground">One app for every device: phones, tablets, Windows, macOS, Linux and Chromebooks. It installs straight from the browser with no download, works full screen with your name, icon and colours, and keeps itself up to date. Nothing to generate: it exists as soon as your workspace does.</p>
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2">
                  <Globe className="size-4 text-primary" />
                  <strong className="min-w-0 flex-1 truncate text-sm">{o.appAddress}</strong>
                  <Button type="button" variant="ghost" size="sm" onClick={copy}>{copied ? <Check className="size-4" data-icon="inline-start" /> : <Copy className="size-4" data-icon="inline-start" />} {copied ? "Copied" : "Copy"}</Button>
                  <a href={address} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", size: "sm" })}><ExternalLink className="size-4" data-icon="inline-start" /> Open</a>
                </div>
                <InstallCard />
              </div>
              <div className="flex flex-col items-center gap-2">
                <p className="text-xs font-medium text-muted-foreground">Home screen</p>
                <HomeScreenPreview brand={brand} shape="squircle" />
              </div>
              <div className="flex flex-col items-center gap-2">
                <p className="text-xs font-medium text-muted-foreground">Scan to open</p>
                <div className="size-[150px] rounded-2xl bg-white p-1.5 shadow-sm [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: qr }} />
                <p className="max-w-[150px] text-center text-[11px] text-muted-foreground">Point a phone camera here, then install.</p>
              </div>
            </div>
          </GlassCard>
          <div className="grid gap-3 md:grid-cols-2">
            {INSTALL_STEPS.map((s) => (
              <GlassCard key={s.title} containerClassName="h-auto" className="space-y-1 p-4">
                <p className="text-sm font-semibold">{s.title} <span className="text-xs font-normal text-muted-foreground">· {s.where}</span></p>
                <p className="text-sm text-muted-foreground">{s.steps}</p>
              </GlassCard>
            ))}
          </div>
          <GlassCard containerClassName="h-auto" className="p-5"><AssetGrid brand={brand} items={pwaAssets} pack={{ href: "/api/apps/assets/pack/pwa", label: "Download PWA assets (.zip)" }} /></GlassCard>
        </div>
      ) : null}

      {/* 2. Mobile */}
      {tab === "mobile" ? (
        <div role="tabpanel" className="space-y-4">
          <GenerationBar scope="mobile" o={o} actions={actions} onChanged={refresh} packHref="/api/apps/assets/pack/all" />
          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <div className="grid gap-4 md:grid-cols-2">
              {MOBILE_PLATFORMS.map((p) => (
                <PlatformCard key={p} p={p} o={o} extra={p === "ios" ? <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">iPhone apps must be signed with your own Apple Developer account. Open the project in Xcode, pick your team and submit to the App Store. For a one-tap install without the App Store, use the PWA.</p> : <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">The APK installs directly on Android (allow &ldquo;unknown apps&rdquo; once). For Google Play, open the Android Studio project, sign with your key and upload.</p>} />
              ))}
              <GlassCard containerClassName="h-auto" className="p-4 md:col-span-2"><p className="text-sm text-muted-foreground">These apps open your live workspace, so they are always current and need no update when your data or colours change. For push notifications on a phone, install the PWA: it supports them on Android and on iPhone (from the Home Screen).</p></GlassCard>
            </div>
            <div className="flex items-start justify-center gap-4">
              <div className="flex flex-col items-center gap-2"><p className="text-xs font-medium text-muted-foreground">Android</p><HomeScreenPreview brand={brand} shape="round" /></div>
              <div className="flex flex-col items-center gap-2"><p className="text-xs font-medium text-muted-foreground">Opening screen</p><SplashPreview brand={brand} id="android-splash" /></div>
            </div>
          </div>
          <GlassCard containerClassName="h-auto" className="p-5"><AssetGrid brand={brand} items={androidAssets} pack={{ href: "/api/apps/assets/pack/android", label: "Download Android assets (.zip)" }} /></GlassCard>
          <GlassCard containerClassName="h-auto" className="p-5"><AssetGrid brand={brand} items={iosAssets} pack={{ href: "/api/apps/assets/pack/ios", label: "Download iOS assets (.zip)" }} /></GlassCard>
        </div>
      ) : null}

      {/* 3. Desktop */}
      {tab === "desktop" ? (
        <div role="tabpanel" className="space-y-4">
          <GenerationBar scope="desktop" o={o} actions={actions} onChanged={refresh} packHref="/api/apps/assets/pack/desktop" />
          <div className="grid gap-4 md:grid-cols-3">
            {DESKTOP_PLATFORMS.map((p) => <PlatformCard key={p} p={p} o={o} />)}
          </div>
          <GlassCard containerClassName="h-auto" className="space-y-2 p-4">
            <p className="text-sm text-muted-foreground">Desktop apps have their own window, a tray icon and native notifications, and open straight into your workspace. Colours, shortcuts and the start page reach every installed app without a new download.</p>
            {o.genericUrl ? <a href={o.genericUrl} className="text-sm underline-offset-2 hover:underline" target="_blank" rel="noopener noreferrer">Need it right now? Get the generic desktop app and enter {o.appAddress}</a> : null}
          </GlassCard>
          <GlassCard containerClassName="h-auto" className="p-5"><AssetGrid brand={brand} items={desktopAssets} pack={{ href: "/api/apps/assets/pack/desktop", label: "Download desktop assets (.zip)" }} /></GlassCard>
        </div>
      ) : null}

      {o.outdated && tab !== "pwa" ? (
        <p className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-sm"><AlertTriangle className="size-4 text-amber-600" /> Your name or icon changed since these apps were built. {o.automatic ? "They will be rebuilt automatically." : "Generate them again to update."}</p>
      ) : null}
      {o.lastError && !building && tab !== "pwa" ? (
        <p className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm"><AlertTriangle className="size-4 text-destructive" /> {o.lastError}</p>
      ) : null}
      {building && tab !== "pwa" ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="size-4" /> A build is in progress{o.active?.runUrl ? <> · <a href={o.active.runUrl} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">Build log</a></> : null}</p>
      ) : tab !== "pwa" && Object.values(o.downloads).some(Boolean) && !o.outdated ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="size-4 text-emerald-600" /> Everything is up to date.</p>
      ) : null}
    </div>
  );
}
