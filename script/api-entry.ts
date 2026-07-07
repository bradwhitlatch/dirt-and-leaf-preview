import type { IncomingMessage, ServerResponse } from "node:http";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const { createApp } = await import("../server/app");
    const { app } = await createApp();
    res.statusCode = 200;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ ok: true }));
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: err?.message || String(err), stack: err?.stack }));
  }
}
