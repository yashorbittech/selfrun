import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import BrandMark from "@/components/BrandMark";
import { isPlatformOwnerContext } from "@/lib/platform/tenancy/context";
import { getSignupMode } from "@/lib/platform/settings";
import { platformRootDomain } from "@/lib/platform/tenancy/provisioning";
import SignupForm from "./SignupForm";
import { BrandName } from "@/components/platform/BrandProvider";

export const metadata: Metadata = {
  title: "Start your free trial",
  description: "Create your SelfRun Business workspace and run sales, HR, finance, projects and your website from one AI-powered platform.",
};

const POINTS = [
  "CRM, HR, finance, projects, procurement and training in one platform",
  "AI that answers from your data, and automations that run on their own",
  "Your own workspace address, website and client portal",
  "Invite your team — one login for every module",
];

export default async function SignupPage() {
  // Sign-up belongs to the platform's own site, not to a company's workspace.
  if (!(await isPlatformOwnerContext())) notFound();
  const mode = await getSignupMode();

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/20 p-10 lg:flex">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-[20%] -left-[10%] h-[60%] w-[60%] rounded-full bg-primary/15 blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-blob" />
          <div className="absolute -bottom-[20%] left-[20%] h-[70%] w-[70%] rounded-full bg-brand-accent/15 blur-[140px] mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-4000" />
        </div>
        <div className="relative z-10 flex items-center gap-2 text-lg font-bold">
          <BrandMark className="size-7 shrink-0" />
          <BrandName />
        </div>
        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-black tracking-tight text-foreground">
            The business that{" "}
            <span className="bg-gradient-to-r from-primary to-brand-accent bg-clip-text text-transparent">runs itself.</span>
          </h1>
          <ul className="mt-6 space-y-3">
            {POINTS.map((p) => (
              <li key={p} className="flex gap-2.5 text-muted-foreground">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative z-10 text-xs text-muted-foreground">Your data is isolated to your company&apos;s workspace.</p>
      </div>

      <div className="flex w-full flex-col items-center justify-center px-4 py-12 lg:w-1/2">
        {mode === "closed" ? (
          <p className="max-w-sm text-center text-muted-foreground">New sign-ups are paused right now. Please check back soon.</p>
        ) : (
          <SignupForm rootDomain={platformRootDomain()} approval={mode === "approval"} />
        )}
      </div>
    </div>
  );
}
