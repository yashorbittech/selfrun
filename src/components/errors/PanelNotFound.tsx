"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";
import BrandSplashMark from "@/components/ui/BrandSplashMark";
import BrandSplashName from "@/components/ui/BrandSplashName";
import BrandBackdrop from "@/components/ui/BrandBackdrop";
import RunnerLoader from "@/components/ui/RunnerLoader";
import { buttonVariants } from "@/components/ui/button";

/**
 * The 404 of a panel: the same moving stage as the website's 404 (the company's own logo and name, the lost cartoon runner at a
 * leaning "404" signpost), but drawn inside the panel so the sidebar and top bar stay and the person can simply carry on. The way back
 * is the panel's own start page (the first part of the address).
 */
export default function PanelNotFound() {
  const pathname = usePathname() ?? "/";
  const first = pathname.split("/")[1] ?? "";
  const home = first ? `/${first}` : "/workspace";
  return (
    <div className="relative flex min-h-[70vh] flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl px-4 py-10 text-center" role="status">
      <BrandBackdrop />
      <BrandSplashMark size="md" />
      <BrandSplashName className="app-rise text-xl font-black tracking-tight" />
      <div className="app-rise mt-6" style={{ animationDelay: "200ms" }}>
        <RunnerLoader scene="lost" sign="404" width="20rem" />
      </div>
      <div className="app-rise max-w-md space-y-2" style={{ animationDelay: "320ms" }}>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">404</p>
        <h1 className="text-balance text-2xl font-black tracking-tight text-foreground sm:text-3xl">This page can’t be found</h1>
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">The address may be mistyped, or the page may have been moved, renamed or removed.</p>
      </div>
      <div className="app-rise mt-3" style={{ animationDelay: "420ms" }}>
        <Link href={home} className={buttonVariants({ size: "lg" })}>
          Back to dashboard <ArrowRight className="size-4" data-icon="inline-end" />
        </Link>
      </div>
    </div>
  );
}
