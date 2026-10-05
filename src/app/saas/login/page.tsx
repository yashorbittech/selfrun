import type { Metadata } from "next";
import Link from "next/link";
import FindWorkspaceForm from "@/components/saas/FindWorkspaceForm";

export const metadata: Metadata = {
  title: "Log in",
  description: "Sign in to your SelfRun Business workspace.",
  alternates: { canonical: "/login" },
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <section className="sr-section">
      <div className="sr-container max-w-lg space-y-8">
        <div className="space-y-3 text-center">
          <span className="sr-eyebrow">Log in</span>
          <h1 className="sr-h2">Sign in to your workspace</h1>
          <p className="sr-muted">Every company has its own workspace address. Enter yours and we&apos;ll take you to its sign-in page.</p>
        </div>
        <FindWorkspaceForm />
        <p className="text-center sr-muted">New to SelfRun Business? <Link href="/signup" className="font-bold" style={{ color: "var(--sr-primary)" }}>Start your free trial</Link></p>
      </div>
    </section>
  );
}
