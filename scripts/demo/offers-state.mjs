// Flip the demo /offers page between its four states — handy for demos without opening the LMS.
//   node --env-file=.env scripts/demo/offers-state.mjs active|coming|future|none
// Only touches the demo campaigns (demo-camp-*) and only changes their dates/status, exactly what an admin would do in the LMS.
import { MongoClient } from "mongodb";

const state = process.argv[2];
const DAY = 86400000;
const at = (days) => new Date(Date.now() + days * DAY);
const plans = {
  active: { diwali: [-10, 20, "active"], republic: [2.5, 16, "scheduled"], newyear: [70, 100, "scheduled"] },
  coming: { diwali: [-40, -1, "expired"], republic: [2, 16, "scheduled"], newyear: [70, 100, "scheduled"] },
  future: { diwali: [-40, -1, "expired"], republic: [30, 44, "scheduled"], newyear: [70, 100, "scheduled"] },
  none: { diwali: [-40, -1, "expired"], republic: [30, 44, "draft"], newyear: [70, 100, "draft"] },
};
if (!plans[state]) {
  console.error("Usage: offers-state.mjs active | coming | future | none");
  process.exit(1);
}

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is not set");
const client = new MongoClient(uri);
try {
  await client.connect();
  const db = client.db(process.env.SEED_DB || undefined);
  for (const [key, [start, end, status]] of Object.entries(plans[state])) {
    const res = await db.collection("offer_campaigns").updateOne(
      { _id: `demo-camp-${key}` },
      { $set: { startDate: at(start), endDate: at(end), status, updatedAt: new Date() }, $unset: { startNotifiedAt: "" } }
    );
    if (res.matchedCount === 0) console.warn(`  ! demo-camp-${key} not found — run the demo seeder first`);
  }
  // demo offers of the campaigns that just moved should follow the campaign window
  await db.collection("offers").updateMany({ campaignId: "demo-camp-diwali" }, { $set: { validFrom: at(plans[state].diwali[0]), status: state === "active" ? "active" : "expired" } });
  console.log(`✓ /offers demo state → ${state}`);
} finally {
  await client.close();
}
