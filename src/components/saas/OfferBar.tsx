import Link from "next/link";
import { ArrowRight, BadgePercent } from "lucide-react";
import Countdown from "@/components/saas/Countdown";


/**
 * The strip above the header: what the offer is, how long is left (when the offer has an end date) and a way to claim it.
 */
export default function OfferBar({ headline, sub, endsAt, cta, href }: { headline: string; sub: string; endsAt: number | null; cta: string; href: string }) {
  return (
    <div className="sr-band relative z-[60] text-white" role="region" aria-label="Current offer">
      <div className="sr-container relative flex flex-wrap items-center justify-center gap-x-5 gap-y-2 py-2.5 text-sm">
        <span className="inline-flex items-center gap-2 font-black"><BadgePercent className="h-4 w-4 flex-none" /><span>{headline}</span></span>
        <span className="hidden text-white/80 md:inline">{sub}</span>
        {endsAt && <span className="inline-flex items-center gap-2"><span className="hidden text-xs font-bold uppercase tracking-wider text-white/75 sm:inline">Ends in</span><Countdown endsAt={endsAt} variant="bar" /></span>}
        <Link href={href} className="group inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-black text-[var(--primary)] shadow-lg transition-transform hover:scale-105">{cta}<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></Link>
      </div>
    </div>
  );
}
