import ProductDetailPage, { generateProductMetadata } from "@/components/saas/ProductDetailPage";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  return generateProductMetadata("contractflow-ai");
}

export default function ProductRoute() {
  return <ProductDetailPage productSlug="contractflow-ai" />;
}
