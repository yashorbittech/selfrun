#!/usr/bin/env node
import { MongoClient } from "mongodb";
import { randomBytes, scryptSync } from "node:crypto";

const SCRYPT_KEYLEN = 64;

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `${salt}:${hash}`;
}

async function seedSuperAdmin() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ Error: Missing MONGODB_URI environment variable.");
    console.error("Run with: node --env-file=.env scripts/seed-super-admin.mjs");
    process.exit(1);
  }

  const args = process.argv.slice(2);
  let adminEmail = "admin@example.com";
  let adminPassword = "Admin#2026pw";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--email" && args[i + 1]) {
      adminEmail = args[i + 1].trim().toLowerCase();
    }
    if (args[i] === "--password" && args[i + 1]) {
      adminPassword = args[i + 1].trim();
    }
  }

  console.log("--------------------------------------------------");
  console.log("👑 SYSTEM SUPER ADMIN SEEDER");
  console.log("--------------------------------------------------");
  console.log("Connecting to MongoDB...");

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();

    // Multi-tenant: the account belongs to one company — `--company <slug>`,
    // else the platform owner. (A database that hasn't been through
    // `npm run db:migrate-tenancy` yet has no companies; the migration then
    // assigns this account to the platform owner.)
    const slugArg = args.indexOf("--company") >= 0 ? args[args.indexOf("--company") + 1] : null;
    const company = await db.collection("companies").findOne(slugArg ? { slug: slugArg } : { isPlatformOwner: true });
    if (slugArg && !company) {
      console.error(`❌ No company with slug "${slugArg}".`);
      process.exit(1);
    }
    const scope = company ? { companyId: company._id } : {};

    const adminUsersCol = db.collection("admin_users");
    await adminUsersCol.createIndex(company ? { companyId: 1, email: 1 } : { email: 1 }, { unique: true }).catch(() => {});

    const passwordHash = hashPassword(adminPassword);

    const superAdminDoc = {
      ...scope,
      email: adminEmail,
      passwordHash: passwordHash,
      roles: ["super_admin"],
      permissionOverrides: {},
      userType: "system",
      notes: "System Super Admin Account initialized with executive privileges",
      employeeId: null,
      mustChangePassword: false,
      failedLoginAttempts: 0,
      lockedUntil: null,
      updatedAt: new Date(),
    };

    const result = await adminUsersCol.findOneAndUpdate(
      { ...scope, email: adminEmail },
      {
        $set: superAdminDoc,
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true, returnDocument: "after" }
    );

    const userObj = result.value ?? result;

    console.log("--------------------------------------------------");
    console.log("✅ SYSTEM SUPER ADMIN SEEDED / ENSURED");
    console.log("--------------------------------------------------");
    console.log(`  • ID:       ${userObj._id ?? userObj.insertedId}`);
    console.log(`  • Email:    ${adminEmail}`);
    console.log(`  • Password: ${adminPassword}`);
    console.log(`  • Roles:    super_admin (Full Executive Access across 10 Panels)`);
    console.log(`  • Category: system`);
    console.log("--------------------------------------------------");
  } catch (error) {
    console.error("❌ Super Admin Seeder failed with error:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seedSuperAdmin();
