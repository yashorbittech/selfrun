/**
 * First start of a new deployment: when `SAAS_ADMIN_EMAIL` is set and the platform has no operator yet, create it (and
 * its first staff account) so sign-up and the Platform Panel work without any setup command. Runs in the background and
 * never stops the server from starting.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const email = process.env.SAAS_ADMIN_EMAIL?.trim();
  if (!email) return;
  // The dev server runs this once per compiler; one run per process is enough.
  const g = globalThis as { __saasBootstrapped?: boolean };
  if (g.__saasBootstrapped) return;
  g.__saasBootstrapped = true;
  void import("@/lib/saas/bootstrap")
    .then(({ ensureOperator }) => ensureOperator({ email, password: process.env.SAAS_ADMIN_PASSWORD?.trim() || undefined }))
    .then((res) => {
      if (!res.created) return;
      console.log(`[saas] Platform operator "${res.companyName}" created with ${res.panelsAdded} panels. Staff sign-in: ${res.email}`);
      if (res.temporaryPassword) console.log(`[saas] Temporary password (shown once, change it at first sign-in): ${res.temporaryPassword}`);
    })
    .catch((err) => console.error("[saas] could not set up the platform operator", err));
}
