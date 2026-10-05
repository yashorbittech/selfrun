/**
 * The SaaS product's own identity — the product that is sold, not any customer of it. Nothing here belongs to a
 * company running on the platform; customers' brands live in `lib/platform/branding`.
 */

export const SAAS_BRAND = {
  /** Wordmark parts: "SelfRun" + "Business". */
  namePrimary: "SelfRun",
  nameAccent: "Business",
  name: "SelfRun Business",
  tagline: "The AI business platform that runs itself",
  /** One line for search results and link previews. */
  description:
    "SelfRun Business is one AI-powered platform that automates sales, HR, finance, projects, procurement, training and your website — so your business keeps running without you chasing it.",
  /** The palette of the product. Customers' themes never touch these. */
  colors: {
    primary: "#4338ca",
    primaryDark: "#312e81",
    accent: "#10b981",
    ink: "#0b1020",
    muted: "#5b6478",
    surface: "#f7f8fc",
    line: "#e4e7f0",
  },
  /** The company that operates the product and is the contracting party in its legal terms — set `SAAS_OPERATOR_NAME`; empty = not shown. */
  operator: process.env.SAAS_OPERATOR_NAME || "",
  /** Static assets under /public/selfrun. */
  assets: {
    logo: "/selfrun/logo.svg",
    mark: "/selfrun/mark.svg",
    favicon: "/selfrun/favicon.svg",
  },
} as const;

/** Where visitors land to start: the registration flow every customer uses. */
export const SAAS_PATHS = {
  register: "/signup",
  login: "/login",
  demo: "/demo",
  pricing: "/pricing",
  contact: "/contact",
} as const;

/** Public contact addresses of the product, from the deployment's environment; derived from the domain when unset. */
export function saasContact(host: string): { hello: string; support: string; sales: string; security: string } {
  const domain = host.replace(/^www\./, "");
  return {
    hello: process.env.SAAS_HELLO_EMAIL || `hello@${domain}`,
    support: process.env.SAAS_SUPPORT_EMAIL || `support@${domain}`,
    sales: process.env.SAAS_SALES_EMAIL || `sales@${domain}`,
    security: process.env.SAAS_SECURITY_EMAIL || `security@${domain}`,
  };
}
