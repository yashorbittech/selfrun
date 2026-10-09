import { notFound, permanentRedirect } from "next/navigation";

/** Pages of earlier versions of the website, sent to where their content lives now. Only these paths are routed here (see lib/saas/routes.ts). */
const MOVED: Record<string, string> = {
  modules: "/features",
  ai: "/features",
  automation: "/features",
  integrations: "/features",
  security: "/features",
  "how-it-works": "/docs",
  "use-cases": "/about#stories",
  industries: "/about#what-we-do",
  resources: "/docs",
  changelog: "/about",
  roadmap: "/about#growth",
  help: "/docs",
  faq: "/pricing#faq",
  tutorials: "/docs#walkthroughs",
  blog: "/about",
  mission: "/about#mission",
  "what-we-do": "/about#what-we-do",
  "success-stories": "/about#stories",
};

export default async function LegacyRedirect({ params }: { params: Promise<{ legacy: string[] }> }) {
  const [first, second] = (await params).legacy;
  if (first === "modules" && second) permanentRedirect(`/features/${second}`);
  if (first === "resources" && second) permanentRedirect(`/docs/${second}`);
  if (first === "tutorials" && second) permanentRedirect(`/docs/walkthroughs/${second}`);
  if (first === "blog" && second) permanentRedirect("/about");
  const to = MOVED[first];
  if (!to) notFound();
  permanentRedirect(to);
}
