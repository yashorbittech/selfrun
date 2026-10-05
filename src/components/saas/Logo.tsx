import Link from "next/link";
import { SAAS_BRAND } from "@/lib/saas/brand";

export default function Logo({ light = false, href = "/" }: { light?: boolean; href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5" aria-label={`${SAAS_BRAND.name} — home`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={SAAS_BRAND.assets.mark} alt="" width={36} height={36} className="size-9 rounded-[10px]" />
      <span className="sr-display text-[19px] font-extrabold leading-none" style={{ color: light ? "#fff" : "var(--sr-ink)" }}>
        {SAAS_BRAND.namePrimary}
        <span className="ml-1 font-semibold" style={{ color: light ? "#a7f3d0" : "var(--sr-primary)" }}>{SAAS_BRAND.nameAccent}</span>
      </span>
    </Link>
  );
}
