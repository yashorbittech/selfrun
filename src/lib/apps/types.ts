/** Client-safe types for the apps a company gets: the PWA (all devices), the mobile apps (Android, iOS) and the desktop apps (Windows, macOS, Linux). */

export const DESKTOP_PLATFORMS = ["win", "mac", "linux"] as const;
export const MOBILE_PLATFORMS = ["android", "ios"] as const;
export const APP_PLATFORMS = [...DESKTOP_PLATFORMS, ...MOBILE_PLATFORMS] as const;
export type DesktopPlatform = (typeof DESKTOP_PLATFORMS)[number];
export type MobilePlatform = (typeof MOBILE_PLATFORMS)[number];
export type AppPlatform = (typeof APP_PLATFORMS)[number];

/** What a generation covers. The PWA needs no build, so it isn't a scope. */
export type GenerationScope = "all" | "desktop" | "mobile";
export const SCOPE_PLATFORMS: Record<GenerationScope, readonly AppPlatform[]> = { all: APP_PLATFORMS, desktop: DESKTOP_PLATFORMS, mobile: MOBILE_PLATFORMS };

export const PLATFORM_META: Record<AppPlatform, { label: string; hint: string }> = {
  win: { label: "Windows", hint: "Windows 10 and 11" },
  mac: { label: "macOS", hint: "macOS 11 or newer" },
  linux: { label: "Linux", hint: "AppImage for any distribution, .deb for Debian and Ubuntu" },
  android: { label: "Android", hint: "Android 7 or newer: an installable APK and the Android Studio project" },
  ios: { label: "iOS", hint: "iPhone and iPad: the Xcode project, ready to sign with your Apple Developer account" },
};

/** `skipped`: this build was started for other platforms only. */
export type PlatformStatus = "queued" | "building" | "ready" | "failed" | "skipped";

export interface BuildFile {
  name: string;
  url: string;
  size: number | null;
}

export interface PlatformState {
  status: PlatformStatus;
  files: BuildFile[];
  error: string | null;
  finishedAt: string | null;
}

export type BuildTrigger = "onboarding" | "manual" | "branding" | "retry" | "cron";

export interface BuildView {
  id: string;
  version: string;
  trigger: BuildTrigger;
  scope: GenerationScope;
  /** queued: waiting to be handed to the build service; building: handed over; ready; failed. */
  status: "queued" | "building" | "ready" | "failed";
  platforms: Record<AppPlatform, PlatformState>;
  requestedAt: string;
  finishedAt: string | null;
  runUrl: string | null;
  error: string | null;
  attempts: number;
}

/** Why the manual "Generate" button is, or isn't, available for a group of apps. */
export type ManualState =
  /** Nothing is running: generate whenever you like. */
  | { kind: "ready" }
  /** Automatic generation is running right now. */
  | { kind: "auto-running"; since: string }
  /** Automatic generation is on but isn't producing anything (no build service, or it failed): generate by hand. */
  | { kind: "auto-stalled"; reason: string }
  /** Automatic generation is switched off for this company. */
  | { kind: "auto-off" }
  /** A manual build is running. */
  | { kind: "manual-running"; since: string };

/** What the Apps page shows. */
export interface AppsOverview {
  /** A build service is connected (builds can run). */
  configured: boolean;
  /** The company's name or icon changed since the installers were built. */
  outdated: boolean;
  /** "Generate automatically": on onboarding, after a rename, and daily housekeeping. */
  automatic: boolean;
  onboardingDone: boolean;
  active: BuildView | null;
  /** The newest build, whatever its state (to show per-platform failures). */
  latest: BuildView | null;
  downloads: Record<AppPlatform, { version: string; builtAt: string; files: BuildFile[] } | null>;
  manual: Record<"desktop" | "mobile", ManualState>;
  /** Where the generic desktop installer is, when the platform provides one. */
  genericUrl: string | null;
  appAddress: string;
  lastError: string | null;
}
