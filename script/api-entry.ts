export default function handler(req: any, res: any) {
  res.statusCode = 200;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify({ ok: true, env: !!process.env.DATABASE_URL }));
}
