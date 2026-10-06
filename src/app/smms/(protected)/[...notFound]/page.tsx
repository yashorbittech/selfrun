import { notFound } from "next/navigation";

/** Any address under this panel that no page claims: shown as the panel's own 404 (inside its sidebar and top bar). */
export default function UnknownPage() {
  notFound();
}
