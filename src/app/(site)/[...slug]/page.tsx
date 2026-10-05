import CmsPageView from "@/components/cms/CmsPageView";
import { cmsPageMetadata, requirePublicPage } from "@/lib/cms/page-route";

/**
 * Every CMS page without a dedicated route — i.e. almost the whole site, and
 * any new page created in the CMS. The page's content, SEO and structured
 * data all come from the CMS (see src/lib/cms/public.ts); routes that need
 * request data (/login, /contact, …) have their own route files and take
 * precedence over this one.
 */

type Props = { params: Promise<{ slug: string[] }> };

const pathOf = (slug: string[]) => `/${slug.map(decodeURIComponent).join("/")}`;

// The same path is a different page on every company's domain, so this route
// can't be pre-rendered per path: it renders per request, reading page content
// through the per-company cache (see src/lib/platform/tenancy/cache.ts).
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props) {
  return cmsPageMetadata(pathOf((await params).slug));
}

export default async function CmsCatchAllPage({ params }: Props) {
  const page = await requirePublicPage(pathOf((await params).slug));
  return <CmsPageView page={page} />;
}
