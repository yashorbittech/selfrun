import type { Metadata } from "next";
import { Globe } from "lucide-react";

/**
 * Shown (404) by the proxy for a host that no company owns — an unverified
 * custom domain, a mistyped subdomain, or a suspended workspace. Deliberately
 * reads nothing from the database: there is no company to read it for.
 */
export const metadata: Metadata = {
  title: "Workspace not found",
  robots: { index: false, follow: false },
};

export default function WorkspaceNotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10">
          <Globe className="size-7 text-primary" />
        </div>
        <h1 className="mb-3 text-3xl font-black tracking-tight text-foreground">No workspace here</h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          This address isn&apos;t connected to an active workspace. If you own it, finish connecting the domain from your workspace settings, or check that the address is spelled correctly.
        </p>
        {process.env.NODE_ENV !== "production" && (
          <p className="mt-6 rounded-lg border border-dashed border-border p-3 text-left text-sm text-muted-foreground">
            <strong className="text-foreground">Development:</strong> a database that predates multi-tenancy has no companies yet — run{" "}
            <code className="rounded bg-muted px-1 py-0.5">npm run db:migrate-tenancy -- --apply</code>. Other hosts need a company slug subdomain (
            <code className="rounded bg-muted px-1 py-0.5">&lt;slug&gt;.localhost</code>) or a verified domain.
          </p>
        )}
      </div>
    </main>
  );
}
