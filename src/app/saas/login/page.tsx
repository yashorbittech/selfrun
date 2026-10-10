import FaqSection from "@/components/saas/FaqSection";
import type { Metadata } from "next";
import Link from "next/link";
import FindWorkspaceForm from "@/components/saas/FindWorkspaceForm";
import { PageHero } from "@/components/saas/blocks";

export const metadata: Metadata = {
  title: "Log in",
  description: "Sign in to your SelfRun AI workspace.",
  alternates: { canonical: "/login" },
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <>
    <PageHero art="login" photo="team-desk" shot="workspace" shotName="Workspace" eyebrow="Log in" title="Sign in to" accent="your workspace." lead={<>Every company has its own workspace address. Enter yours and we&apos;ll take you to its sign-in page. New here? <Link href="/signup" className="font-bold text-primary">Get started free</Link>.</>}>
      <div className="w-full max-w-md"><FindWorkspaceForm /></div>
    </PageHero>
    <FaqSection topics={["Setup", "Data & security", "General"]} limit={5} />
    </>
  );
}
