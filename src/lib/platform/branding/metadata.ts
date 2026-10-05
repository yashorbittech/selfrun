import "server-only";
import type { Metadata } from "next";
import { getCompanyBrand } from "@/lib/platform/branding";
import { listPanels } from "@/lib/platform/panels/store";

/**
 * `{panel:hrms}` is replaced by that panel's name from the Panel Registry, so browser tab titles match every other listing.
 *
 * Page metadata whose title carries the current company's name — `{brand}`
 * in the title is replaced per request ("Attendance · {brand} Portal" →
 * "Attendance · Acme Labs Portal"). Use as
 * `export const generateMetadata = () => brandedMetadata("…", { robots })`.
 */
export async function brandedMetadata(title: string, extra: Omit<Metadata, "title"> = {}): Promise<Metadata> {
  const { name } = await getCompanyBrand();
  let text = title;
  if (text.includes("{panel:")) {
    const panels = new Map((await listPanels().catch(() => [])).map((p) => [p.key, p.name]));
    text = text.replace(/\{panel:([a-z0-9-]+)\}/g, (_, key: string) => panels.get(key) ?? key);
  }
  return { ...extra, title: text.replaceAll("{brand}", name).replace(/\s{2,}/g, " ").replace(/^ · | · $/g, "").trim() };
}
