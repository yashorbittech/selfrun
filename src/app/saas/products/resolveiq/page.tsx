import ProductDetailPage, { generateProductMetadata } from "@/components/saas/ProductDetailPage";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  return generateProductMetadata("resolveiq");
}

export default function ProductRoute() {
  return <ProductDetailPage productSlug="resolveiq" />;
}
