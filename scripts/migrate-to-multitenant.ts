/**
 * Multi-tenancy migration: makes every existing document belong to the
 * platform-owner company (company #1), so the company-scoped data layer
 * (`src/lib/platform/tenancy/`) keeps serving exactly what it served before.
 *
 *   npm run db:migrate-tenancy                 # dry run — prints the plan, writes nothing
 *   npm run db:migrate-tenancy -- --apply      # writes to the database in MONGODB_URI
 *
 * Options:
 *   --name "Demo Company"                          platform-owner company name (first run only)
 *   --slug demo                            its slug / platform subdomain (first run only)
 *   --domains example.com,www.example.com   verified custom domains to attach to it
 *
 * Steps (idempotent, safe to re-run — e.g. after a demo seeder that writes
 * straight to Mongo has added documents without a company):
 *  1. Ensures the platform-owner company exists, and attaches its domains.
 *  2. Every scoped collection: documents without `companyId` get the owner's.
 *  3. Keyed collections (counters, settings singletons, …): bare `_id` keys
 *     are re-keyed to `<companyId>::<key>`. A bare key whose prefixed twin
 *     already exists is reported and left alone (it's invisible to the app).
 *  4. Unique indexes are rebuilt with `companyId` as their first key (new
 *     index created first, then the old one dropped), so emails, slugs and
 *     codes are unique per company rather than platform-wide. TTL indexes
 *     (single-field by definition) are left alone.
 *  5. A `{ companyId: 1 }` index on every scoped collection.
 */

import { randomUUID } from "node:crypto";
import type { Document } from "mongodb";
import { clientPromise, getPlatformDb } from "@/lib/platform/tenancy/platform-db";
import { GLOBAL_COLLECTIONS, KEYED_COLLECTIONS, KEY_SEPARATOR } from "@/lib/platform/tenancy/collections";
import { COMPANIES_COLLECTION, COMPANY_DOMAINS_COLLECTION, normalizeHost, type Company, type CompanyDomain } from "@/lib/platform/tenancy/companies";

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
function arg(name: string, fallback: string): string {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}

const log = (...parts: unknown[]) => console.log(...parts);
const tag = APPLY ? "" : "[dry run] ";

async function ensureOwner(): Promise<string> {
  const db = await getPlatformDb();
  const companies = db.collection<Company>(COMPANIES_COLLECTION);
  const existing = await companies.findOne({ isPlatformOwner: true });
  if (existing) {
    log(`Platform-owner company: ${existing.name} (${existing.slug}) ${existing._id}`);
    return existing._id;
  }
  const now = new Date();
  const owner: Company = {
    _id: randomUUID(),
    slug: arg("slug", "demo"),
    name: arg("name", "Demo Company"),
    status: "active",
    isPlatformOwner: true,
    createdAt: now,
    updatedAt: now,
  };
  log(`${tag}Creating platform-owner company: ${owner.name} (${owner.slug}) ${owner._id}`);
  if (APPLY) {
    await companies.createIndex({ slug: 1 }, { unique: true });
    await companies.insertOne(owner);
  }
  return owner._id;
}

async function attachDomains(companyId: string): Promise<void> {
  const db = await getPlatformDb();
  const domains = db.collection<CompanyDomain>(COMPANY_DOMAINS_COLLECTION);
  if (APPLY) await domains.createIndex({ companyId: 1 });
  const list = arg("domains", "example.com,www.example.com")
    .split(",")
    .map((d) => normalizeHost(d))
    .filter((d): d is string => Boolean(d));
  for (const [i, domain] of list.entries()) {
    const found = await domains.findOne({ _id: domain });
    if (found) {
      log(`  domain ${domain}: already attached to ${found.companyId === companyId ? "the owner" : `company ${found.companyId}`} (${found.status})`);
      continue;
    }
    log(`  ${tag}domain ${domain}: attach as verified${i === 0 ? " (primary)" : ""}`);
    if (APPLY) {
      await domains.insertOne({ _id: domain, companyId, status: "verified", verificationToken: randomUUID(), isPrimary: i === 0, createdAt: new Date(), verifiedAt: new Date() });
    }
  }
}

interface Totals {
  collections: number;
  stamped: number;
  rekeyed: number;
  conflicts: number;
  indexesRebuilt: number;
}

async function migrateCollection(name: string, ownerId: string, totals: Totals): Promise<void> {
  const db = await getPlatformDb();
  // Typed as string ids: only string _ids are ever re-keyed (see the $type filter below).
  const col = db.collection<{ _id: string } & Document>(name);
  const notes: string[] = [];

  // 2. Stamp documents that have no company.
  const unstamped = await col.countDocuments({ companyId: { $exists: false } });
  if (unstamped > 0) {
    notes.push(`${unstamped} doc(s) → owner`);
    totals.stamped += unstamped;
    if (APPLY) await col.updateMany({ companyId: { $exists: false } }, { $set: { companyId: ownerId } });
  }

  // 3. Re-key bare _id keys in keyed collections.
  if (KEYED_COLLECTIONS.has(name)) {
    const bare = await col.find({ $and: [{ _id: { $type: "string" } }, { _id: { $not: new RegExp(KEY_SEPARATOR) } }] }).toArray();
    for (const doc of bare) {
      const companyId = typeof doc.companyId === "string" ? doc.companyId : ownerId;
      const newId = `${companyId}${KEY_SEPARATOR}${String(doc._id)}`;
      if (await col.findOne({ _id: newId }, { projection: { _id: 1 } })) {
        notes.push(`CONFLICT: "${doc._id}" already exists as "${newId}" — bare copy left in place`);
        totals.conflicts++;
        continue;
      }
      totals.rekeyed++;
      if (APPLY) {
        await col.insertOne({ ...doc, _id: newId, companyId });
        await col.deleteOne({ _id: doc._id });
      }
    }
    if (bare.length) notes.push(`${bare.length} key(s) re-keyed`);
  }

  // 4. Unique indexes → company-prefixed.
  const indexes = await col.indexes().catch(() => [] as Document[]);
  for (const idx of indexes) {
    if (idx.name === "_id_" || !idx.unique || idx.expireAfterSeconds !== undefined) continue;
    const keys = Object.keys(idx.key ?? {});
    if (keys[0] === "companyId") continue;
    const options: Document = { unique: true };
    for (const k of ["sparse", "partialFilterExpression", "collation"]) if (idx[k] !== undefined) options[k] = idx[k];
    notes.push(`unique index ${idx.name} → { companyId, ${keys.join(", ")} }`);
    totals.indexesRebuilt++;
    if (APPLY) {
      await col.createIndex({ companyId: 1, ...idx.key }, options);
      await col.dropIndex(idx.name as string);
    }
  }

  // 5. Plain companyId index.
  if (APPLY && !indexes.some((i) => Object.keys(i.key ?? {})[0] === "companyId" && Object.keys(i.key).length === 1)) {
    await col.createIndex({ companyId: 1 });
  }

  if (notes.length) log(`  ${name}: ${notes.join("; ")}`);
}

async function main() {
  log(`Multi-tenancy migration ${APPLY ? "(APPLY)" : "(dry run — pass --apply to write)"}`);
  const ownerId = await ensureOwner();
  await attachDomains(ownerId);

  const db = await getPlatformDb();
  const all = await db.listCollections({}, { nameOnly: false }).toArray();
  const scoped = all
    .filter((c) => c.type === "collection" && !c.name.startsWith("system.") && !GLOBAL_COLLECTIONS.has(c.name))
    .map((c) => c.name)
    .sort();

  const totals: Totals = { collections: scoped.length, stamped: 0, rekeyed: 0, conflicts: 0, indexesRebuilt: 0 };
  log(`\n${scoped.length} company-scoped collection(s):`);
  for (const name of scoped) await migrateCollection(name, ownerId, totals);

  log(
    `\n${tag}Done: ${totals.stamped} document(s) assigned to the owner, ${totals.rekeyed} key(s) re-keyed, ` +
      `${totals.indexesRebuilt} unique index(es) rebuilt, ${totals.conflicts} conflict(s).`,
  );
}

main()
  .then(async () => (await clientPromise).close())
  .catch(async (err) => {
    console.error(err);
    await (await clientPromise).close().catch(() => {});
    process.exit(1);
  });
