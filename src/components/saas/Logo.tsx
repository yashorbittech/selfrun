import Link from "next/link";
import { SAAS_BRAND } from "@/lib/saas/brand";

/** The product logo as drawn in /public/selfrun/logo.svg: the mark on the left, "SelfRun" above "BUSINESS". */
export default function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5" aria-label={`${SAAS_BRAND.name} — home`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={SAAS_BRAND.assets.mark} alt="" width={40} height={40} className="size-10 rounded-[11px]" />
      <span className="flex flex-col leading-none">
        <span className="text-[16px] font-extrabold tracking-tight text-foreground">{SAAS_BRAND.namePrimary}</span>
        <span className="mt-0.5 text-[15px] font-bold uppercase tracking-[0.14em] text-primary">{SAAS_BRAND.nameAccent}</span>
      </span>
    </Link>
  );
}
