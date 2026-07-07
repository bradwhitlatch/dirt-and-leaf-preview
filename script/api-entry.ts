export default async function handler(req: any, res: any) {
  const results: Record<string, string> = {};
  const mods = ["express", "postgres", "web-push", "drizzle-orm/postgres-js"];
  for (const m of mods) {
    try {
      await import(m);
      results[m] = "OK";
    } catch (e: any) {
      results[m] = `FAIL: ${e?.message || e}`;
    }
  }
  res.statusCode = 200;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(results));
}
