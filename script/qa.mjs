import { chromium } from "playwright";

const BASE = process.env.QA_BASE || "http://127.0.0.1:5000";
const results = [];
const consoleErrors = [];

function ok(name, cond, detail = "") {
  results.push({ name, pass: !!cond, detail });
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  :: " + detail : ""}`);
}

const browser = await chromium.launch();
const page = await browser.newContext({ viewport: { width: 390, height: 844 } }).then((c) => c.newPage());
// The paywall test intentionally drives the API to a 402 response. Browsers
// surface that as a "Failed to load resource ... 402" console error even though
// it is expected app behavior, so it is excluded from the error assertion.
const isExpectedPaywallNoise = (t) => /402|payment required/i.test(t);
page.on("console", (m) => {
  if (m.type() === "error" && !isExpectedPaywallNoise(m.text())) consoleErrors.push(m.text());
});
page.on("pageerror", (e) => consoleErrors.push("pageerror: " + e.message));

async function go(hash) {
  await page.goto(`${BASE}/#${hash}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
}

// 1. Home
await go("/");
ok("Home renders", (await page.locator("body").innerText()).length > 40);
await page.screenshot({ path: "qa_pg_home.png" });

// 2. Scan page reachable
await go("/scan");
ok("Scan page renders", /scan|photo|identif|camera|plant/i.test(await page.locator("body").innerText()));
await page.screenshot({ path: "qa_pg_scan.png" });

// 3. Seed 2 plants through the API (identify/save uses camera; API is the same path the UI calls)
async function apiSavePlant(commonName) {
  return page.evaluate(async (name) => {
    const r = await fetch("/api/plants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: 1, commonName: name }),
    });
    return r.status;
  }, commonName);
}
ok("Save plant #1 (201)", (await apiSavePlant("Monstera deliciosa")) === 201);
ok("Save plant #2 (201)", (await apiSavePlant("Pothos")) === 201);

// 4. Plants list shows saved plants.
// (Plants were injected via raw fetch above, bypassing the UI save mutation
// that normally invalidates the react-query cache — so reload to force a
// fresh fetch, mirroring what a real save-then-view flow shows.)
await go("/plants");
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(800);
const plantsText = await page.locator("body").innerText();
ok("Plants list shows a saved plant", /monstera/i.test(plantsText));
await page.screenshot({ path: "qa_pg_plants.png" });

// 5. Plant profile
await go("/plants/1");
const profileText = await page.locator("body").innerText();
ok("Plant profile renders care data", /water|light|soil|feed/i.test(profileText));
await page.screenshot({ path: "qa_pg_profile.png" });

// 6. Progress photo page
await go("/plants/1/progress");
ok("Progress photo page renders", /progress|photo|growth/i.test(await page.locator("body").innerText()));
await page.screenshot({ path: "qa_pg_progress.png" });

// 7. Shop
await go("/shop");
const shopText = await page.locator("body").innerText();
ok("Shop renders product categories", /buy|fertiliz|soil|pot|shop/i.test(shopText));
await page.screenshot({ path: "qa_pg_shop.png" });

// 8. Account
await go("/account");
ok("Account renders", /account|plan|free|premium|subscription/i.test(await page.locator("body").innerText()));
await page.screenshot({ path: "qa_pg_account.png" });

// 9. Paywall trigger at free limit: save up to limit then expect 402
ok("Save plant #3 (201, reaches free limit)", (await apiSavePlant("Snake Plant")) === 201);
ok("Save plant #4 blocked (402 paywall)", (await apiSavePlant("Fiddle Leaf Fig")) === 402);

// 10. Upgrade page + mock upgrade
await go("/upgrade");
ok("Upgrade page shows pricing", /4\.99|39\.99|premium|upgrade|month|year/i.test(await page.locator("body").innerText()));
await page.screenshot({ path: "qa_pg_upgrade.png" });

const upStatus = await page.evaluate(async () => {
  const r = await fetch("/api/account/upgrade", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tier: "premium_monthly" }),
  });
  return r.status;
});
ok("Mock upgrade succeeds (200)", upStatus === 200);
ok("Save plant #4 now succeeds after upgrade (201)", (await apiSavePlant("Fiddle Leaf Fig")) === 201);

ok("No console/page errors during QA", consoleErrors.length === 0, consoleErrors.slice(0, 3).join(" | "));

await browser.close();

const failed = results.filter((r) => !r.pass);
console.log(`\n==== QA SUMMARY: ${results.length - failed.length}/${results.length} passed ====`);
if (failed.length) {
  console.log("FAILURES:", failed.map((f) => f.name).join(", "));
  process.exit(1);
}
