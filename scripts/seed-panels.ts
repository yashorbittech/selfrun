/**
 * Seeds the Panel Registry (`platform_panels`): the name, description, icon, route, order and on/off state of every
 * panel. Safe to run any time — existing panels are left exactly as the Platform Panel has them.
 *
 *   npm run db:seed-panels              add any panel that is missing
 *   npm run db:seed-panels -- --reset   also put every default panel back to its original name / description / order / on
 *
 * Custom panels you created in Platform Panel → Panels are never touched.
 */

import { clientPromise } from "@/lib/platform/tenancy/platform-db";
import { seedPanels } from "@/lib/platform/panels/store";
import { DEFAULT_PANELS } from "@/lib/platform/panels/types";

async function main() {
  const reset = process.argv.includes("--reset");
  const r = await seedPanels({ reset });
  console.log(`✓ Panel Registry: ${r.inserted} added, ${r.reset} reset, ${r.kept} kept (of ${DEFAULT_PANELS.length} defaults).`);
  (await clientPromise).close();
}

main().catch((err) => {
  console.error("✗ Seeding the Panel Registry failed:", err);
  process.exit(1);
});
