// The plain-Mongo seed scripts predate multi-tenancy: they read and write
// without a company filter, so with more than one company in the database an
// upsert by email/code/slug could overwrite another company's document. They
// stay usable on a single-company database (run `npm run db:migrate-tenancy
// -- --apply` afterwards to assign what they wrote to that company) and
// refuse otherwise.
export async function assertSingleCompany(db) {
  const count = await db.collection("companies").countDocuments().catch(() => 0);
  if (count > 1) {
    console.error(`❌ Refusing: database "${db.databaseName}" holds ${count} companies, and this script writes without a company filter.`);
    console.error("   It is only safe on a single-company database.");
    process.exit(1);
  }
}
