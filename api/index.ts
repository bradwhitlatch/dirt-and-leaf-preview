import type { IncomingMessage, ServerResponse } from "node:http";
import type { Express } from "express";
import { createApp } from "../server/app";

/**
 * Vercel serverless entry point for the Express API.
 *
 * vercel.json rewrites every `/api/*` request to this function, while the
 * static Vite build is served directly from the CDN. The Express app is built
 * once per warm function instance and reused across invocations.
 */
let appPromise: Promise<Express> | undefined;

function getApp(): Promise<Express> {
  if (!appPromise) {
    // If initialization fails, clear the cached promise so the next invocation
    // retries a cold start rather than serving the same rejected promise forever.
    appPromise = createApp()
      .then(({ app }) => app)
      .catch((err) => {
        appPromise = undefined;
        throw err;
      });
  }
  return appPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const app = await getApp();
    return (app as unknown as (req: IncomingMessage, res: ServerResponse) => void)(req, res);
  } catch (err: any) {
    // Without this, an initialization error escapes the handler and Vercel
    // returns an opaque FUNCTION_INVOCATION_FAILED with no detail. Surface the
    // real message so failures are diagnosable from the response itself.
    console.error("[api] Failed to initialize/handle request:", err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("content-type", "application/json");
      res.end(
        JSON.stringify({
          error: "server_initialization_failed",
          message: err?.message ?? String(err),
        }),
      );
    }
  }
}
