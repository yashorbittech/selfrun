// Lets a plain Node script (run with tsx) import this app's server modules:
// "server-only" becomes a no-op, and next/cache's request-scoped APIs become
// pass-throughs (there is no Next server to revalidate — the site picks the
// changes up on its next cache expiry / deploy).
const Module = require("module");
const path = require("path");
const orig = Module._resolveFilename;
const SHIM = path.join(__dirname, "next-cache-shim.cjs");
Module._resolveFilename = function (request, ...rest) {
  if (request === "server-only") return SHIM;
  if (request === "next/cache") return SHIM;
  return orig.call(this, request, ...rest);
};
globalThis.React = require("react");
