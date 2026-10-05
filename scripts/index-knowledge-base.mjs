#!/usr/bin/env node
// Kick off a knowledge-base website re-index against a running Demo Company server
// and stream progress until it finishes. Run with:
//
//   node --env-file=.env scripts/index-knowledge-base.mjs [options]
//
// Options:
//   --server <url>       Base URL of the running app        (default http://localhost:3000)
//   --base-url <url>     Base URL the crawler fetches pages  (default CHATBOT_CRAWL_BASE_URL or --server)
//   --incremental        Only re-index pages whose content changed
//
// Auth: set CHATBOT_ADMIN_API_SECRET in .env and send it as a bearer token.
// (Without it, trigger a re-index from the Admin Panel → AI Chatbot → Knowledge Base.)

const args = process.argv.slice(2);
function flag(name) {
  return args.includes(`--${name}`);
}
function opt(name, fallback) {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
}

const server = opt("server", "http://localhost:3000").replace(/\/$/, "");
const baseUrl = opt("base-url", process.env.CHATBOT_CRAWL_BASE_URL || server).replace(/\/$/, "");
const incremental = flag("incremental");
const secret = process.env.CHATBOT_ADMIN_API_SECRET;

if (!secret) {
  console.error(
    "CHATBOT_ADMIN_API_SECRET is not set in .env.\n" +
      "Add it, or run the re-index from the Admin Panel instead."
  );
  process.exit(1);
}

const headers = { "content-type": "application/json", authorization: `Bearer ${secret}` };
const endpoint = `${server}/api/lms/chatbot/reindex`;

async function main() {
  console.log(`Triggering ${incremental ? "incremental" : "full"} index`);
  console.log(`  server : ${server}`);
  console.log(`  crawl  : ${baseUrl}`);

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ incremental, baseUrl }),
  });
  const started = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`Failed to start: HTTP ${res.status} — ${started.error ?? "unknown error"}`);
    process.exit(1);
  }
  const runId = started.runId;
  console.log(`Run ${runId} started. Polling…\n`);

  let lastLogCount = 0;
  for (;;) {
    await new Promise((r) => setTimeout(r, 3000));
    const statusRes = await fetch(endpoint, { headers });
    if (!statusRes.ok) {
      console.error(`Poll failed: HTTP ${statusRes.status}`);
      continue;
    }
    const { runs } = await statusRes.json();
    const run = runs.find((r) => r._id === runId);
    if (!run) {
      console.error("Run not found in status feed.");
      process.exit(1);
    }
    for (const entry of run.logs.slice(lastLogCount)) {
      console.log(`  [${entry.level}] ${entry.message}`);
    }
    lastLogCount = run.logs.length;

    if (run.status !== "running") {
      const s = run.stats;
      console.log(
        `\nRun ${run.status}. indexed=${s.itemsIndexed} skipped=${s.itemsSkipped} failed=${s.itemsFailed} of ${s.itemsTotal}`
      );
      process.exit(run.status === "completed" ? 0 : 1);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
