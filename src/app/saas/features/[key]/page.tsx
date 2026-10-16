import { permanentRedirect } from "next/navigation";

export default async function FeatureDetailRedirect({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  permanentRedirect(`/products/${key}`);
}
