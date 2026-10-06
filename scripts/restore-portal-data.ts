/**
 * Brings a company's PORTAL data (candidate / student / client accounts and what hangs off them) from its old database into the
 * company's workspace on this platform. Built for the case where the rest of the company was imported but the portal accounts
 * did not come across, so candidates cannot sign in.
 *
 * It is INSERT-ONLY. It never deletes, never overwrites, never touches a collection outside the list below:
 *   - a document whose `_id` already exists for the company is left exactly as it is;
 *   - an account whose email already belongs to another account of the company is left alone and reported;
 *   - the only thing it can change is a stand-in account made by "Restore portal accounts" (marked `restoredByRepair`), and only
 *     when you pass --replace-stand-ins: that stand-in has no password, the original does.
 * The source database is only READ.
 *
 * Run (the target is the MONGODB_URI of this project's .env; the source URI is typed on the command line, never stored):
 *
 *   SOURCE_MONGODB_URI='mongodb+srv://USER:PASS@host/yashorbit_prod' \
 *     npx --yes tsx --require ./scripts/lib/next-server-shims.cjs --env-file=.env scripts/restore-portal-data.ts --to-company <slug>
 *
 * Without --apply it is a dry run: it counts and reports, and writes nothing. Add --apply to write.
 *
 * Options:
 *   --to-company <slug>     the company that receives the data: the slug of its workspace address ...
 *   --to-domain <host>      ... or one of its domains (https://www.example.com, app.example.com or example.com), instead of the slug
 *   --from-company <id|slug> only when the source is multi-company (default: the one flagged as owner)
 *   --only a,b              restrict to these collections
 *   --replace-stand-ins     replace stand-in accounts (made by "Restore portal accounts") with the original ones, keeping their id
 *   --apply                 write (default: dry run)
 *
 * Passwords come across exactly as they were (they are hashes). Sessions are not copied: everyone signs in again.
 * Wallet / document files need the same file-storage and encryption keys in the environment as the source used.
 */

import { MongoClient, type Document } from "mongodb";
import { clientPromise, getPlatformDb } from "@/lib/platform/tenancy/platform-db";
import { COMPANIES_COLLECTION, type Company } from "@/lib/platform/tenancy/companies";
import { KEYED_COLLECTIONS, KEY_SEPARATOR } from "@/lib/platform/tenancy/collections";

const args = process.argv.slice(2);
const flag = (n: string) => args.includes(`--${n}`);
const arg = (n: string) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : undefined;
};
const APPLY = flag("apply");
const REPLACE_STAND_INS = flag("replace-stand-ins");
const say = (m: string) => console.log(`${APPLY ? "" : "[dry run] "}${m}`);
const fail = (m: string): never => {
  console.error(`✗ ${m}`);
  process.exit(1);
};

/** The portal's own collections: accounts first (everything else refers to them). */
const COLLECTIONS = [
  "external_users",
  "portal_documents",
  "portal_interviews",
  "portal_activity_logs",
  "external_notifications",
  "referrals",
  "wallet_transactions",
  "wallet_referral_campaigns",
  "wallet_reward_rules",
  "wallet_usage_rules",
  "wallet_streaks",
] as const;
const BATCH = 200;

function describeBulkError(err: unknown): { inserted: number; reasons: string[] } {
  type WriteErr = { errmsg?: string; err?: { errmsg?: string } };
  const e = err as { insertedCount?: number; result?: { insertedCount?: number }; writeErrors?: WriteErr[] | WriteErr; message?: string };
  const list = Array.isArray(e.writeErrors) ? e.writeErrors : e.writeErrors ? [e.writeErrors] : [];
  const reasons = [...new Set(list.map((w) => String(w.errmsg ?? w.err?.errmsg ?? "").slice(0, 200)).filter(Boolean))].slice(0, 3);
  return { inserted: e.insertedCount ?? e.result?.insertedCount ?? 0, reasons: reasons.length ? reasons : [String(e.message ?? err).slice(0, 200)] };
}

async function main(): Promise<boolean> {
  const sourceUri = process.env.SOURCE_MONGODB_URI || fail("Set SOURCE_MONGODB_URI (the old database) on the command line.");
  let slug = arg("to-company");
  const only = arg("only")?.split(",").map((s) => s.trim()).filter(Boolean);

  const target = await getPlatformDb();
  const companies = target.collection<Company>(COMPANIES_COLLECTION);
  const domainArg = arg("to-domain");
  if (!slug && domainArg) {
    const host = domainArg.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0].replace(/:\d+$/, "");
    const bare = host.replace(/^(www|app)\./, "");
    const dom = await target.collection<{ _id: string; companyId: string }>("company_domains").findOne({ _id: { $in: [host, bare, `www.${bare}`] } });
    if (!dom) return fail(`No domain "${host}" is connected to any company in "${target.databaseName}".`);
    const owner = await companies.findOne({ _id: dom.companyId } as never);
    if (!owner) return fail(`The domain "${host}" points at a company that does not exist.`);
    slug = owner.slug;
  }
  if (!slug) {
    const list = await companies.find({ isPlatformOwner: { $ne: true } }, { projection: { slug: 1, name: 1 } }).toArray();
    fail(`--to-company <slug> or --to-domain <host> is required. Companies here: ${list.map((c) => `${c.slug} (${c.name})`).join(", ") || "none"}`);
  }
  const targetCompany = await companies.findOne({ slug });
  if (!targetCompany) return fail(`No company with slug "${slug}" in "${target.databaseName}".`);
  if (targetCompany.isPlatformOwner) return fail("That is the platform operator's company; pick the customer company.");
  const companyId = targetCompany._id;

  const client = await new MongoClient(sourceUri, { readPreference: "secondaryPreferred" }).connect();
  let allOk = true;
  try {
    const source = client.db();
    const strip = (u: string) => u.replace(/\/\/[^@]*@/, "//").replace(/\?.*$/, "");
    if (source.databaseName === target.databaseName && strip(sourceUri) === strip(process.env.MONGODB_URI ?? "")) fail("Source and target are the same database.");
    say(`Source "${source.databaseName}" (read only)  →  company "${targetCompany.name}" [${slug}] in "${target.databaseName}"`);

    // A tenant-aware source keeps a companyId on documents; an older single-company one has none.
    const names = new Set((await source.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name));
    let sourceCompanyId: string | null = null;
    if (names.has("companies")) {
      const from = arg("from-company");
      const sc = await source.collection("companies").findOne(from ? { $or: [{ _id: from as never }, { slug: from }] } : { isPlatformOwner: true });
      if (!sc) fail(from ? `The source has no company "${from}".` : "The source has no company flagged as owner; pass --from-company <id|slug>.");
      sourceCompanyId = String(sc!._id);
    }
    const filter: Document = sourceCompanyId ? { $or: [{ companyId: sourceCompanyId }, { companyId: { $exists: false } }, { companyId: null }] } : {};

    const list = COLLECTIONS.filter((c) => !only || only.includes(c));
    const keyOf = (id: unknown): unknown => (typeof id === "string" && id.includes(KEY_SEPARATOR) ? id.split(KEY_SEPARATOR).slice(1).join(KEY_SEPARATOR) : id);
    const problems: string[] = [];
    let totalNew = 0;

    for (const name of list) {
      if (!names.has(name)) {
        say(`  ${name.padEnd(28)} not in the source`);
        continue;
      }
      const col = target.collection(name);
      const keyed = KEYED_COLLECTIONS.has(name);
      const idFor = (id: unknown) => (keyed ? `${companyId}${KEY_SEPARATOR}${String(keyOf(id))}` : id);

      let inSource = 0;
      let present = 0;
      let toInsert = 0;
      let emailTaken = 0;
      let standIns = 0;
      let replaced = 0;
      let inserted = 0;
      let failed = 0;
      const reasons = new Set<string>();
      const takenEmails: string[] = [];
      let batch: Document[] = [];
      const flush = async () => {
        if (!batch.length) return;
        const size = batch.length;
        if (APPLY) {
          try {
            inserted += (await col.insertMany(batch, { ordered: false })).insertedCount;
          } catch (err) {
            const d = describeBulkError(err);
            inserted += d.inserted;
            failed += size - d.inserted;
            d.reasons.forEach((r) => reasons.add(r));
          }
        }
        batch = [];
      };

      for await (const doc of source.collection(name).find(filter)) {
        inSource++;
        const _id = idFor(doc._id);
        const existing = await col.findOne({ _id, companyId } as never, { projection: name === "external_users" ? { email: 1, restoredByRepair: 1 } : { _id: 1 } });
        if (existing) {
          if (name === "external_users" && (existing as Document).restoredByRepair === true) {
            standIns++;
            if (REPLACE_STAND_INS && APPLY) {
              // Only a stand-in (no password of its own) is replaced, by the original account under the same id.
              const res = await col.replaceOne({ _id, companyId, restoredByRepair: true } as never, { ...doc, _id, companyId } as never);
              replaced += res.modifiedCount;
            }
          } else present++;
          continue;
        }
        if (name === "external_users") {
          const email = String(doc.email ?? "").trim().toLowerCase();
          const holder = email ? await col.findOne({ companyId, email } as never, { projection: { _id: 1 } }) : null;
          if (holder) {
            emailTaken++;
            if (takenEmails.length < 10) takenEmails.push(email);
            continue;
          }
        }
        toInsert++;
        batch.push({ ...doc, _id, companyId });
        if (batch.length >= BATCH) await flush();
      }
      await flush();
      totalNew += toInsert;

      const bits = [`${inSource} in source`, `${present} already there`, `${toInsert} ${APPLY ? "inserted" : "to insert"}`];
      if (emailTaken) bits.push(`${emailTaken} skipped: email already used by another account (${takenEmails.join(", ")}${emailTaken > takenEmails.length ? ", …" : ""})`);
      if (standIns) bits.push(`${standIns} stand-in account(s)${REPLACE_STAND_INS ? (APPLY ? `, ${replaced} replaced by the original` : " would be replaced by the original") : " (use --replace-stand-ins to put the original back)"}`);
      if (failed) {
        allOk = false;
        problems.push(`${name}: ${failed} failed — ${[...reasons].join(" | ")}`);
        bits.push(`${failed} FAILED — ${[...reasons].join(" | ")}`);
      }
      say(`${failed ? "✗" : "✓"} ${name.padEnd(28)} ${bits.join(" · ")}`);
    }

    if (!APPLY) say(`\n${totalNew} document(s) would be added. Nothing was written. Re-run with --apply to write.`);
    else if (problems.length) console.error(`\n✗ Some documents did not copy:\n  ${problems.join("\n  ")}\nNothing was deleted or overwritten. Send this output.`);
    else say("\nDone. Candidates sign in with their old email and password at /portal/login.");
  } finally {
    await client.close();
  }
  return allOk;
}

main()
  .then(async (ok) => {
    (await clientPromise).close();
    if (!ok && APPLY) process.exitCode = 1;
  })
  .catch(async (err) => {
    console.error(err);
    (await clientPromise).close().catch(() => {});
    process.exit(1);
  });
