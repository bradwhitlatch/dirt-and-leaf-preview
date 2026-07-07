import { build as esbuild } from "esbuild";
import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Bundles the Vercel serverless API entry point (api/index.ts) into a single
 * plain-JS file at api/index.js.
 *
 * Why this exists: Vercel's zero-config Node function builder does NOT
 * resolve the `@shared/*` TypeScript path alias defined in tsconfig.json /
 * vite.config.ts (that alias only works for Vite's client bundle and for
 * `tsx`'s Node loader in local dev). Left as raw .ts, the deployed function
 * crashes at import time with "Cannot find package '@shared/schema'", which
 * Vercel surfaces as an opaque FUNCTION_INVOCATION_FAILED on every /api/*
 * route. Pre-bundling with esbuild (which we point at the same alias via the
 * `alias` option below) resolves `@shared/*` to real relative paths before
 * deploy, so the shipped function has no unresolved bare specifiers.
 *
 * `server/*` dependencies (storage, routes, push, weather, etc.) are bundled
 * in too, since they are only reachable through this one entry point and
 * Vercel's function tracer does not need to separately resolve them.
 *
 * Runs as part of `vercel.json`'s buildCommand, before `vite build`.
 */
async function buildApi() {
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  // Keep server deps external (installed via npm on the Vercel function
  // runtime) — only bundle our own source (server/**, shared/**, api/**),
  // matching the approach in script/build.ts for the long-running server.
  const external = allDeps;

  await esbuild({
    entryPoints: ["script/api-entry.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "api/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    alias: {
      "@shared": path.resolve(process.cwd(), "shared"),
    },
    external,
    logLevel: "info",
  });
}

buildApi().catch((err) => {
  console.error(err);
  process.exit(1);
});
