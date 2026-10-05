import { createElement } from "react";
import type { LucideProps } from "lucide-react";
import { resolveIcon } from "@/lib/cms/icon-map";

/** An icon-map key as an icon (an unknown key falls back to a neutral icon). */
export default function ProductIcon({ name, ...props }: { name: string } & LucideProps) {
  return createElement(resolveIcon(name), props);
}
