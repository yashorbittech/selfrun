#!/usr/bin/env node
import { MongoClient } from "mongodb";

async function truncateAllData() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ Error: Missing MONGODB_URI environment variable.");
    console.error("Run with: node --env-file=.env scripts/truncate-all-data.mjs");
    process.exit(1);
  }

  console.log("--------------------------------------------------");
  console.log("🧹 DATABASE TRUNCATION — CLEARING ALL PANELS DATA");
  console.log("--------------------------------------------------");
  console.log("Connecting to MongoDB...");

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();

    // Multi-tenant guard: this wipes EVERY company's data. Refuse once more than
    // one company exists unless explicitly forced.
    const companyCount = await db.collection("companies").countDocuments().catch(() => 0);
    if (companyCount > 1 && !process.argv.includes("--all-companies")) {
      console.error(`❌ Refusing: this database holds ${companyCount} companies and truncation would wipe all of them.`);
      console.error("   Re-run with --all-companies if that is really what you want.");
      process.exit(1);
    }

    const collections = await db.listCollections().toArray();
    console.log(`Found ${collections.length} collection(s) in database "${db.databaseName}".`);

    for (const colInfo of collections) {
      const colName = colInfo.name;
      if (colName.startsWith("system.")) continue;

      try {
        await db.collection(colName).deleteMany({});
        console.log(`  ✓ Cleared all documents from: ${colName}`);
      } catch (err) {
        // Fallback to drop if deleteMany fails
        await db.collection(colName).drop();
        console.log(`  ✓ Dropped collection: ${colName}`);
      }
    }

    console.log("--------------------------------------------------");
    console.log("✅ All application collections truncated successfully.");
    console.log("--------------------------------------------------");
  } catch (error) {
    console.error("❌ Truncate failed with error:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

truncateAllData();
