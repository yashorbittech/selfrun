/**
 * Every scheduled job the platform runs (pure; the one list). `vercel.json` is generated from it (`npm run cron:sync`), the in-app scheduler
 * reads it, the Platform Console's Scheduled jobs page shows it, and a test fails if any of them disagree with the routes on disk.
 * Times are UTC. To add a job: add it here, add its runner in `jobs.ts` and a route that is `cronRoute("<key>")`, then run the sync.
 */

export interface CronJob {
  key: string;
  name: string;
  description: string;
  /** The route that runs it (called by Vercel Cron with `Authorization: Bearer $CRON_SECRET`). */
  path: string;
  /** Five-field cron expression, UTC. */
  schedule: string;
  /** The product it belongs to (panel key), or "platform" for SelfRun's own jobs. */
  product: string;
  scope: "platform" | "each company";
  /** The longest it is allowed to run, in seconds (also how long its lock is held). */
  maxDurationSec: number;
  /** Other things that also run it, so it keeps working if the schedule is late. */
  alsoRunsOn?: string;
  /** Where a company changes what this job does for it, if it can. */
  configure?: { label: string; href: string };
  /** Runs more often than daily: Vercel's Hobby plan only accepts daily schedules, so this needs Pro (or the in-app scheduler). */
  frequent?: boolean;
}

export const CRON_JOBS: CronJob[] = [
  {
    key: "backups", name: "Backups & data lifecycle", product: "workspace", scope: "each company", path: "/api/backup/cron", schedule: "30 1 * * *", maxDurationSec: 300,
    description: "Makes the weekly backup for each company that is due, removes old backups, and deletes the companies whose 30-day deletion period has ended.",
    configure: { label: "Backups & data", href: "/commandos/settings/backups" },
  },
  {
    key: "wallet-expiry", name: "Wallet expiry", product: "lms", scope: "each company", path: "/api/wallet/expiry-sweep", schedule: "30 2 * * *", maxDurationSec: 60,
    description: "Expires reward credits that have passed their date and warns people whose credits are about to expire.",
    alsoRunsOn: "Every wallet read or spend (expiry is also settled then); a signed-in manager can run it for their own company.",
  },
  {
    key: "playbook", name: "Procedure reminders", product: "sop", scope: "each company", path: "/api/playbook-ai/cron", schedule: "0 3 * * *", maxDurationSec: 60,
    description: "Moves procedures through their date-driven statuses (review due, expired) and sends acknowledgement reminders.",
    configure: { label: "PlayBook settings", href: "/playbook-ai/settings" },
  },
  {
    key: "rankmax", name: "SEO housekeeping", product: "seo", scope: "each company", path: "/api/rankmax-ai/cron", schedule: "30 3 * * *", maxDurationSec: 300,
    description: "Syncs Search Console and Analytics, runs the scheduled website audit, re-checks backlinks on Mondays and flags big ranking drops, for the companies that turned those on.",
    configure: { label: "RankMax settings", href: "/rankmax-ai/settings" },
  },
  {
    key: "cybervault", name: "Vault expiry alerts", product: "dlms", scope: "each company", path: "/api/cybervault/cron", schedule: "0 4 * * *", maxDurationSec: 60,
    description: "Tells the vault's owners about credentials and documents that have expired or are about to.",
    configure: { label: "CyberVault settings", href: "/cybervault/settings" },
  },
  {
    key: "viralpulse", name: "Scheduled posts", product: "smms", scope: "each company", path: "/api/viralpulse-ai/cron", schedule: "30 4 * * *", maxDurationSec: 300,
    description: "Publishes approved scheduled posts that are due and reminds publishers about due posts nobody approved and ads due to go live.",
    alsoRunsOn: "Page loads in ViralPulse (throttled).",
    configure: { label: "ViralPulse settings", href: "/viralpulse-ai/settings" },
  },
  {
    key: "evaliq", name: "Test deadlines", product: "ots", scope: "each company", path: "/api/evaliq/cron", schedule: "0 5 * * *", maxDurationSec: 300,
    description: "Finishes timed-out test attempts, expires missed assignments, sends opens-soon / due-soon / expired notices and releases results after a test closes.",
    alsoRunsOn: "Page loads in EvalIQ (throttled).",
    configure: { label: "EvalIQ settings", href: "/evaliq/settings" },
  },
  {
    key: "domains", name: "Custom domain re-check", product: "platform", scope: "each company", path: "/api/platform/domains/cron", schedule: "30 5 * * *", maxDurationSec: 60,
    description: "Re-checks every company's pending custom domains so they go live as soon as their DNS is right.",
    configure: { label: "Custom domains", href: "/commandos/settings/domains" },
  },
  {
    key: "trials", name: "Trial reminders & expiry", product: "platform", scope: "platform", path: "/api/platform/billing/trials/cron", schedule: "0 6 * * *", maxDurationSec: 120,
    description: "Emails trial reminders at the platform's reminder days and moves ended trials on (the workspace locks until a plan is subscribed).",
    configure: { label: "Plan & billing", href: "/commandos/settings/billing" },
  },
  {
    key: "subscriptions", name: "Subscription renewals & dunning", product: "platform", scope: "platform", path: "/api/platform/billing/subscriptions/cron", schedule: "0 6 * * *", maxDurationSec: 120,
    description: "Moves past-due subscriptions through grace to suspended, handles missed renewals and closes expired trials.",
    configure: { label: "Plan & billing", href: "/commandos/settings/billing" },
  },
  {
    key: "notifications", name: "Time-based notifications", product: "workspace", scope: "each company", path: "/api/notify/cron", schedule: "15 6 * * *", maxDurationSec: 300,
    description: "Overdue invoices, stale leads, expiring documents, ending offers and HR, project, procurement and training deadlines: tells people even if nobody opened the product. Also sends announcements a company scheduled that have come due.",
    alsoRunsOn: "Opening the product (each product runs its own sweep, throttled; every notification dedupes per day). Scheduled announcements are sent the moment anyone opens the workspace, and by this job at least once a day.",
    configure: { label: "Notification center", href: "/commandos/settings/notifications" },
  },
  {
    key: "apps", name: "App builds", product: "platform", scope: "platform", path: "/api/apps/builds/cron", schedule: "0 7 * * *", maxDurationSec: 60,
    description: "Hands over desktop-app builds that were requested while no build service was connected, and fails builds that never finished. It never starts a build by itself.",
    configure: { label: "Apps & downloads", href: "/commandos/settings/apps" },
  },
];

export const CRON_BY_KEY = new Map(CRON_JOBS.map((j) => [j.key, j]));

/** What `vercel.json` should hold, in registry order. */
export const vercelCrons = (): { path: string; schedule: string }[] => CRON_JOBS.map((j) => ({ path: j.path, schedule: j.schedule }));
