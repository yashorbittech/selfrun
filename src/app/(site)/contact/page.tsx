import CmsPageView from "@/components/cms/CmsPageView";
import { cmsPageMetadata, requirePublicPage } from "@/lib/cms/page-route";
import { getSubServices, isValidCategory, type CategorySlug } from "@/lib/categories";
import { getContactFormFields } from "@/lib/cms/forms";

export const generateMetadata = () => cmsPageMetadata("/contact");

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; subService?: string }>;
}) {
  const { category, subService } = await searchParams;
  const initialCategory: CategorySlug | undefined = category && isValidCategory(category) ? category : undefined;
  const initialSubService: string | undefined =
    initialCategory && subService && getSubServices(initialCategory).some((s) => s.slug === subService)
      ? subService
      : undefined;
  const formFields = await getContactFormFields();
  return <CmsPageView page={await requirePublicPage("/contact")} runtimeProps={{ "contact-form": { initialCategory, initialSubService, formFields } }} />;
}
