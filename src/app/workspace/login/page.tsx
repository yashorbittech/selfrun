import { listPanels } from "@/lib/platform/panels/store";
import { PanelName } from "@/components/platform/PanelsProvider";
import { redirect } from "next/navigation";
import { getCurrentHubUser } from "@/lib/hub-auth";
import BrandMark from "@/components/BrandMark";
import LoginForm from "./LoginForm";
import { safeNextPath } from "@/lib/workspace-session";
import { loginLanding } from "@/lib/platform/onboarding/state";
import { BrandName } from "@/components/platform/BrandProvider";

export default async function HubLoginPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  // The headline panels come from the Panel Registry (the first few active, non-core business panels).
  const panelList = (await listPanels().catch(() => [])).filter((p) => p.active && !p.core && !(["website", "support", "portal"] as string[]).includes(p.key)).slice(0, 5).map((p) => p.name).join(", ");
  // Where to go after sign-in: only a same-origin path survives `safeNextPath` (no open redirect).
  const next = safeNextPath((await searchParams).next);
  const user = await getCurrentHubUser();
  // Already signed in (including the moment right after the login action sets the cookie and this page
  // refreshes): the same landing rule as the login action, so an owner with open setup is never sent past
  // the onboarding wizard by this redirect.
  if (user) redirect(user.mustChangePassword ? "/workspace/change-password" : await loginLanding(user.roles, next));

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/20 p-10 lg:flex">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-[20%] -left-[10%] h-[60%] w-[60%] rounded-full bg-primary/15 blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-blob" />
          <div className="absolute top-[10%] right-[5%] h-[50%] w-[50%] rounded-full bg-secondary/15 blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-2000" />
          <div className="absolute -bottom-[20%] left-[20%] h-[70%] w-[70%] rounded-full bg-brand-accent/15 blur-[140px] mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-4000" />
          <div className="absolute inset-0 bg-grid-slate-900/[0.02] dark:bg-grid-slate-400/[0.02] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        </div>

        <div className="relative z-10 flex items-center gap-2 text-lg font-bold">
          <BrandMark className="size-7 shrink-0" />
          <BrandName /> <span className="text-foreground"><PanelName panel="workspace" fallback="Workspace" /></span>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-black tracking-tight text-foreground">
            One login,{" "}
            <span className="bg-gradient-to-r from-primary to-brand-accent bg-clip-text text-transparent">every panel you need.</span>
          </h1>
          <p className="mt-4 text-muted-foreground">
            Sign in once and reach {panelList} and more — only the panels
            your role gives you access to, no separate login for each one.
          </p>
        </div>

        <p className="relative z-10 text-xs text-muted-foreground">Access is logged and rate-limited.</p>
      </div>

      <div className="flex w-full flex-col items-center justify-center px-4 py-12 lg:w-1/2">
        <LoginForm next={next} />
      </div>
    </div>
  );
}
