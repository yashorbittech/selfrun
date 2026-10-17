import ProductDetailPage, { generateProductMetadata } from "@/components/saas/ProductDetailPage";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  return generateProductMetadata("playbook-ai");
}

export default function ProductRoute() {
  return <ProductDetailPage productSlug="playbook-ai" />;
}
