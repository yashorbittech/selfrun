"use server";

import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import { getCurrentCmsUser } from "@/lib/cms-auth";
import { destroySessionsEverywhere } from "@/lib/cross-module-sso";
import { displayTitle } from "@/lib/cms/site-areas";

/** Logs out of EVERY panel (single sign-off), like every other panel. */
export async function cmsLogoutAction(): Promise<void> {
  const user = await getCurrentCmsUser();
  if (user && ObjectId.isValid(user.id)) await destroySessionsEverywhere(new ObjectId(user.id));
  redirect("/workspace/login");
}

export interface CmsSearchEntry {
  kind: "page" | "record" | "screen";
  title: string;
  subtitle: string;
  href: string;
  status?: "published" | "draft" | "archived";
}

/** Everything the CMS search (⌘K) can jump to: pages, collection records and CMS screens. */
export async function cmsSearchIndexAction(): Promise<CmsSearchEntry[]> {
  const { getViewer } = await import("@/lib/cms/viewer");
  if (!(await getViewer())) return [];
  const [{ listPages }, { listAdminRecords }, { COLLECTIONS }] = await Promise.all([
    import("@/lib/cms/pages"),
    import("@/lib/cms/collections/store"),
    import("@/lib/cms/collections/registry"),
  ]);
  const pages = await listPages();
  const keys = Object.keys(COLLECTIONS) as (keyof typeof COLLECTIONS)[];
  const records = await Promise.all(keys.map(async (k) => [k, await listAdminRecords(k)] as const));
  return [
    ...pages.map((p) => ({ kind: "page" as const, title: displayTitle(p.title, p.path), subtitle: p.path, href: `/cms/pages/${p._id}`, status: p.status })),
    ...records.flatMap(([k, rows]) =>
      rows.map((r) => ({ kind: "record" as const, title: r.title || r.slug, subtitle: `${COLLECTIONS[k].label} · ${r.slug}`, href: `/cms/collections/${k}/${r.slug}`, status: r.state }))
    ),
  ];
}
