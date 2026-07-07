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
    appPromise = createApp().then(({ app }) => app);
  }
  return appPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await getApp();
  return (app as unknown as (req: IncomingMessage, res: ServerResponse) => void)(req, res);
}
