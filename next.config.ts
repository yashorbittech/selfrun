import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Dev only: Next's gzip stream gets one 'drain' listener per concurrent response, and the Workspace/panel pages fire many
  // parallel RSC requests, which trips Node's MaxListenersExceededWarning. Production (Vercel) compresses at the edge.
  compress: process.env.NODE_ENV === "production",
  // Node-only libs used inside route handlers — keep them out of the bundler.
  serverExternalPackages: ["exceljs"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  // The separate admin panel moved into the Workspace. Old links, bookmarks and
  // URLs stored in notifications keep working. Order matters: first match wins.
  async redirects() {
    return [
      // Festival Offers, Wallet & Credits, AI Chatbot, Conversation AI moved from the LMS panel to the CMS panel.
      { source: "/lms/:section(offers|wallet|chatbot)", destination: "/cms/:section", permanent: true },
      { source: "/lms/:section(offers|wallet|chatbot)/:path*", destination: "/cms/:section/:path*", permanent: true },

      // Every panel's own audit log moved into the one central Audit log of the Workspace.
      { source: "/lpms/audit-logs", destination: "/workspace/settings/audit-log?source=panels&module=lpms", permanent: true },
      { source: "/sop/audit-logs", destination: "/workspace/settings/audit-log?source=panels&module=sop", permanent: true },
      { source: "/fms/audit-logs", destination: "/workspace/settings/audit-log?source=panels&module=fms", permanent: true },
      { source: "/aibots/audit-logs", destination: "/workspace/settings/audit-log?source=panels&module=aibots", permanent: true },
      { source: "/cms/audit-logs", destination: "/workspace/settings/audit-log?source=panels&module=cms", permanent: true },
      { source: "/dlms/audit-logs", destination: "/workspace/settings/audit-log?source=panels&module=dlms", permanent: true },
      { source: "/seo/audit-logs", destination: "/workspace/settings/audit-log?source=panels&module=seo", permanent: true },
      { source: "/hrms/audit", destination: "/workspace/settings/audit-log?source=panels&module=hrms", permanent: true },
      { source: "/prms/activity", destination: "/workspace/settings/audit-log?source=panels&module=prms", permanent: true },
      { source: "/tms/activity", destination: "/workspace/settings/audit-log?source=panels&module=tms", permanent: true },
      { source: "/pms/activity", destination: "/workspace/settings/audit-log?source=panels&module=pms", permanent: true },
      { source: "/ots/activity", destination: "/workspace/settings/audit-log?source=panels&module=ots", permanent: true },
      { source: "/smms/activity", destination: "/workspace/settings/audit-log?source=panels&module=smms", permanent: true },

      { source: "/admin", destination: "/workspace", permanent: true },
      { source: "/admin/login", destination: "/workspace/login", permanent: true },
      { source: "/admin/change-password", destination: "/workspace/change-password", permanent: true },
      // Everything else kept its path: /admin/users → /workspace/users, /admin/analytics/fms → /workspace/analytics/fms, …
      { source: "/admin/:path*", destination: "/workspace/:path*", permanent: true },

      // Everything workspace-specific lives under /workspace. Old links, bookmarks, e-mails and URLs stored in the
      // database keep working; the request's query string is carried over by Next. These patterns are anchored at the
      // start and name exact prefixes, so they never touch /api/*, /platform/*, a business panel's own /<panel>/settings
      // or the public site.
      { source: "/settings/activity", destination: "/workspace/settings/audit-log?source=workspace", permanent: true }, // company activity log → the merged Audit log
      { source: "/settings/:path*", destination: "/workspace/settings/:path*", permanent: true }, // also matches /settings itself
      { source: "/onboarding", destination: "/workspace/onboarding", permanent: true },
      { source: "/upgrade", destination: "/workspace/upgrade", permanent: true },
      // One dashboard (the Command Center became its executive sections), one Audit log, Documents under Account.
      { source: "/workspace/command-center", destination: "/workspace", permanent: true },
      { source: "/workspace/activity-log", destination: "/workspace/settings/audit-log?source=panels", permanent: true }, // management activity log → Audit log, panel activity
      { source: "/workspace/documents", destination: "/workspace/account/documents", permanent: true },
    ];
  },
  // Baseline security headers on every response. (No site-wide Content-Security-Policy: companies add their own
  // tracking scripts and chat widgets in CMS → Settings, which a fixed policy would block.)
  async headers() {
    return [
      // The service worker must always be re-checked, and may control the whole origin.
      {
        source: "/web-sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Only this site may frame itself (the theme customizer previews the site in a same-origin frame).
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), geolocation=(), payment=(self), microphone=(self)" },
          { key: "Strict-Transport-Security", value: "max-age=63072000" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
    ];
  },
  // Verification / well-known text files (Search Console "HTML file", Bing, ads.txt …) come from the company's own
  // CMS → Settings → Tracking, served at the site root where search engines look for them. Any such file name works;
  // the platform's own root files (robots, sitemaps, manifest) are excluded, and the route 404s for names the
  // company hasn't defined.
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/:file((?!robots\\.txt$|sitemap[^/]*\\.xml$|manifest\\.json$|sw\\.js$|web-sw\\.js$|offline\\.html$)[A-Za-z0-9][A-Za-z0-9._-]*\\.(?:html?|xml|txt|json|js|csv))", destination: "/api/site-verification/:file" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  allowedDevOrigins: ['viminal-susann-calorimetric.ngrok-free.dev'],
};

export default nextConfig;