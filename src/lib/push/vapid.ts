import "server-only";
import webpush from "web-push";

/**
 * Web Push needs a VAPID key pair (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`; generate once with `npx web-push generate-vapid-keys`).
 * Without them push is simply switched off: the app, the in-app bells and everything else keep working.
 * `VAPID_SUBJECT` (a `mailto:` or https URL the push services can contact) defaults to the platform staff email.
 */
let configured: boolean | null = null;

export function pushConfigured(): boolean {
  if (configured !== null) return configured;
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  if (!publicKey || !privateKey) return (configured = false);
  const subject = process.env.VAPID_SUBJECT?.trim() || (process.env.SAAS_ADMIN_EMAIL ? `mailto:${process.env.SAAS_ADMIN_EMAIL}` : "mailto:support@localhost.invalid");
  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    return (configured = true);
  } catch (err) {
    console.error("[push] invalid VAPID configuration; push is disabled", err);
    return (configured = false);
  }
}

export const vapidPublicKey = () => process.env.VAPID_PUBLIC_KEY?.trim() ?? "";
export { webpush };
