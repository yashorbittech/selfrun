import CmsPageView from "@/components/cms/CmsPageView";
import { cmsPageMetadata, requirePublicPage } from "@/lib/cms/page-route";

/** The homepage — content, SEO and structured data from the CMS page "/". */
export const generateMetadata = () => cmsPageMetadata("/");

export default async function HomePage() {
  return <CmsPageView page={await requirePublicPage("/")} />;
}
