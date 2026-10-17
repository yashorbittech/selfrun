import ProductDetailPage, { generateProductMetadata } from "@/components/saas/ProductDetailPage";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  return generateProductMetadata("cybervault");
}

export default function ProductRoute() {
  return <ProductDetailPage productSlug="cybervault" />;
}
