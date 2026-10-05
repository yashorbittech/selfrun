#!/usr/bin/env node
// One-time (or as-needed) bootstrap for LMS (Lead Management System) accounts. Run with:
//   npm run create-lms
// This is the ONLY way an LMS account is ever created — there is no
// self-registration endpoint and no seeded/default account.

import { MongoClient } from "mongodb";
import { randomBytes, scryptSync } from "node:crypto";
import readline from "node:readline";
import { stdin, stdout } from "node:process";
import { assertSingleCompany } from "./lib/single-company-guard.mjs";

const SCRYPT_KEYLEN = 64;
const MIN_PASSWORD_LENGTH = 10;
const CTRL_C = String.fromCharCode(3);
const BACKSPACE = String.fromCharCode(127);

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `${salt}:${hash}`;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Carries over any bytes read past the current line's newline so a piped
// multi-line input (which can arrive as a single chunk) isn't dropped
// between successive askLine() calls.
let pipedBuffer = "";

/**
 * Reads one line from stdin. On a real terminal, echoes typed characters
 * back live (masked with "*" when `hidden`). When stdin is piped (not a
 * TTY — e.g. scripted testing), falls back to plain line consumption.
 */
function askLine(prompt, { hidden = false } = {}) {
  stdout.write(prompt);

  if (!stdin.isTTY) {
    return new Promise((resolve) => {
      const tryResolve = () => {
        const newlineIndex = pipedBuffer.indexOf("\n");
        if (newlineIndex === -1) return false;
        const line = pipedBuffer.slice(0, newlineIndex).replace(/\r$/, "");
        pipedBuffer = pipedBuffer.slice(newlineIndex + 1);
        resolve(line);
        return true;
      };

      if (tryResolve()) return;

      const onData = (chunk) => {
        pipedBuffer += chunk.toString("utf8");
        if (tryResolve()) {
          stdin.removeListener("data", onData);
        }
      };
      stdin.resume();
      stdin.on("data", onData);
    });
  }

  return new Promise((resolve) => {
    let input = "";
    const onData = (chunk) => {
      const char = chunk.toString("utf8");

      if (char === "\n" || char === "\r") {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener("data", onData);
        stdout.write("\n");
        resolve(input);
        return;
      }
      if (char === CTRL_C) {
        stdout.write("\n");
        process.exit(1);
      }
      if (char === BACKSPACE || char === "\b") {
        if (input.length > 0) {
          input = input.slice(0, -1);
          if (hidden) {
            stdout.write("\b \b");
          } else {
            readline.moveCursor(stdout, -1, 0);
            readline.clearLine(stdout, 1);
          }
        }
        return;
      }
      input += char;
      stdout.write(hidden ? "*" : char);
    };

    stdin.setRawMode(true);
    stdin.resume();
    stdin.on("data", onData);
  });
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Missing MONGODB_URI. Run with: node --env-file=.env scripts/create-lms.mjs");
    process.exit(1);
  }

  const emailRaw = await askLine("Admin email: ");
  const email = emailRaw.trim().toLowerCase();
  if (!isValidEmail(email)) {
    console.error("That doesn't look like a valid email address.");
    process.exit(1);
  }

  const password = await askLine(`Admin password (min ${MIN_PASSWORD_LENGTH} chars): `, { hidden: true });
  if (password.length < MIN_PASSWORD_LENGTH) {
    console.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    process.exit(1);
  }

  const confirm = await askLine("Confirm password: ", { hidden: true });
  if (password !== confirm) {
    console.error("Passwords do not match.");
    process.exit(1);
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    await assertSingleCompany(db);
    const users = db.collection("admin_users");
    await users.createIndex({ email: 1 }, { unique: true });

    const existing = await users.findOne({ email });
    if (existing) {
      console.error(`An LMS account with email "${email}" already exists.`);
      process.exit(1);
    }

    await users.insertOne({
      email,
      passwordHash: hashPassword(password),
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: new Date(),
      lastLoginAt: null,
    });

    console.log(`\nAdmin account created for ${email}.`);
    console.log("You can now log in at /lms/login.");
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
