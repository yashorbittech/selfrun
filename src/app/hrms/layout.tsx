import { brandedMetadata } from "@/lib/platform/branding/metadata";

// The tab title carries the panel's name from the Panel Registry.
export const generateMetadata = () => brandedMetadata("{brand} {panel:hrms}", { robots: { index: false, follow: false, googleBot: { index: false, follow: false } } });

// `lms-shell` is the shared dashboard design-system class (palette tokens,
// card treatment, ambient background, control nudges) — reused verbatim so the
// HRMS panel is visually identical to the LMS panel.
export default function HrmsLayout({ children }: { children: React.ReactNode }) {
  return <div className="lms-shell min-h-screen bg-background text-foreground">{children}</div>;
}
