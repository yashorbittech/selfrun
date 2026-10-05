import CmsPageView from "@/components/cms/CmsPageView";
import { CollectionsProvider } from "@/components/cms/CollectionsContext";
import { cmsPageMetadata, requirePublicPage } from "@/lib/cms/page-route";
import { getRecords } from "@/lib/cms/collections/store";

const path = "/services/our-saas-product";

export const generateMetadata = () => cmsPageMetadata(path);

/** The product catalogue page: provides the products collection (only this page needs it) around the CMS sections. */
export default async function OurSaasProductPage() {
  const [page, productRecords] = await Promise.all([requirePublicPage(path), getRecords("products")]);
  return <CmsPageView page={page} wrapSections={(node) => <CollectionsProvider snapshot={{ products: productRecords }}>{node}</CollectionsProvider>} />;
}
