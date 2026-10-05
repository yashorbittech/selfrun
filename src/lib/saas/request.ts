import { headers } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { isSaasHost, saasCanonicalHost } from "@/lib/saas/hosts";

/** The Host of the current request, or null outside a request (static build, script). */
export async function requestHostOrNull(): Promise<string | null> {
  try {
    return (await headers()).get("host");
  } catch (err) {
    unstable_rethrow(err);
    return null;
  }
}

/** Whether the current request is for the SaaS product's own website rather than a customer's domain. */
export async function onSaasHost(): Promise<boolean> {
  return isSaasHost(await requestHostOrNull());
}

/** `https://selfrunbusiness.ai`-style origin of the SaaS product for the current request. */
export async function saasOrigin(): Promise<string> {
  const host = await requestHostOrNull();
  const bare = saasCanonicalHost(host);
  const local = bare === "localhost" || bare.endsWith(".localhost");
  const port = local && host?.includes(":") ? `:${host.split(":")[1]}` : "";
  return `${local ? "http" : "https"}://${bare}${port}`;
}
