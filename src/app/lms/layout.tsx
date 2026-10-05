import { brandedMetadata } from "@/lib/platform/branding/metadata";

// The tab title carries the panel's name from the Panel Registry.
export const generateMetadata = () => brandedMetadata("{brand} {panel:lms}", { robots: { index: false, follow: false, googleBot: { index: false, follow: false } } });

export default function LmsLayout({ children }: { children: React.ReactNode }) {
  return <div className="lms-shell min-h-screen bg-background text-foreground">{children}</div>;
}
