/**
 * Unit tests for the vision-ID pipeline — run with `npx tsx script/test-plant-id.ts`.
 *
 * These are dependency-light (node:assert, no test runner, no DB) so they run
 * anywhere: they exercise data-URL parsing, model-JSON extraction, candidate
 * normalization, fuzzy matching to speciesKey, top-3 formatting, a fully
 * MOCKED live vision call (global.fetch stubbed), and the no-key mock fallback.
 */
import assert from "node:assert";
import {
  parseDataUrl,
  extractJson,
  suggestionsFromCandidates,
  tagResultFromJson,
  identifyPlant,
  identifyTag,
} from "../server/plant-id";
import { matchCareProfile, searchCareProfiles, normalizeName } from "../server/care-match";
import { careProfileSeeds } from "../server/care-profile-seed";
import type { CareProfile } from "../shared/schema";

let passed = 0;
function test(name: string, fn: () => void | Promise<void>) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      passed++;
      console.log(`PASS  ${name}`);
    })
    .catch((err) => {
      console.error(`FAIL  ${name}\n      ${err?.message ?? err}`);
      process.exitCode = 1;
    });
}

// Build CareProfile-like rows from the seed list for matcher tests.
const profiles: CareProfile[] = careProfileSeeds.map((s, i) => ({
  id: i + 1,
  speciesKey: s.speciesKey,
  commonName: s.commonName,
  scientificName: s.scientificName,
  waterIntervalDaysMin: s.waterIntervalDaysMin,
  waterIntervalDaysMax: s.waterIntervalDaysMax,
  waterNotes: s.waterNotes,
  feedIntervalDaysActive: s.feedIntervalDaysActive,
  feedIntervalDaysDormant: s.feedIntervalDaysDormant ?? null,
  feedNotes: s.feedNotes,
  lightRequirement: s.lightRequirement,
  placementNotes: s.placementNotes,
  soilType: s.soilType,
  repotIntervalMonths: s.repotIntervalMonths ?? null,
  idealTempMinF: s.idealTempMinF ?? null,
  idealTempMaxF: s.idealTempMaxF ?? null,
  idealHumidityPct: s.idealHumidityPct ?? null,
  toxicity: s.toxicity ?? null,
  matureSizeNotes: s.matureSizeNotes ?? null,
  distinguishingTraits: s.distinguishingTraits ?? null,
  sourceCitations: JSON.stringify(s.sourceCitations),
  researchStatus: s.researchStatus ?? "seed",
  researchNotes: null,
}));

async function main() {
  await test("parseDataUrl splits a browser data URL", () => {
    const { mediaType, data } = parseDataUrl("data:image/png;base64,AAAB");
    assert.equal(mediaType, "image/png");
    assert.equal(data, "AAAB");
  });

  await test("parseDataUrl tolerates raw base64", () => {
    const { mediaType, data } = parseDataUrl("QUJD");
    assert.equal(mediaType, "image/jpeg");
    assert.equal(data, "QUJD");
  });

  await test("extractJson handles ```json fenced output", () => {
    const obj = extractJson('Here you go:\n```json\n{"candidates":[{"commonName":"Pothos"}]}\n```');
    assert.equal(obj.candidates[0].commonName, "Pothos");
  });

  await test("suggestionsFromCandidates caps at 3 and normalizes 0-100 confidence", () => {
    const out = suggestionsFromCandidates([
      { commonName: "A", scientificName: "a", confidence: 90 },
      { commonName: "B", scientificName: "b", confidence: 0.5 },
      { commonName: "C", scientificName: "c", confidence: 0.2 },
      { commonName: "D", scientificName: "d", confidence: 0.1 },
    ]);
    assert.equal(out.length, 3);
    assert.equal(out[0].probability, 0.9); // 90 -> 0.9
    assert.equal(out[1].probability, 0.5);
    assert.ok(out[0].similarImageUrl.startsWith("http"));
  });

  await test("tagResultFromJson normalizes fields and null-handling", () => {
    const r = tagResultFromJson({ commonName: "Snake Plant", scientificName: null, rawText: "Sansevieria", confidence: 95 });
    assert.equal(r.commonName, "Snake Plant");
    assert.equal(r.scientificName, null);
    assert.equal(r.confidence, 0.95);
  });

  await test("normalizeName strips cultivar quotes and parentheticals", () => {
    assert.equal(normalizeName("Monstera 'Albo Variegata' (Swiss cheese)"), "monstera albo variegata");
  });

  await test("matchCareProfile fuzzy-matches scientific name to speciesKey", () => {
    const m = matchCareProfile("Epipremnum aureum", profiles);
    assert.ok(m, "expected a match for Epipremnum aureum");
    assert.equal(m!.speciesKey, "golden-pothos");
  });

  await test("matchCareProfile links a rare cultivar the vision model might return", () => {
    const m = matchCareProfile("Anthurium clarinervium", profiles);
    assert.ok(m);
    assert.equal(m!.speciesKey, "anthurium-clarinervium");
  });

  await test("matchCareProfile returns undefined for an unrelated name", () => {
    const m = matchCareProfile("Tyrannosaurus rex", profiles);
    assert.equal(m, undefined);
  });

  await test("searchCareProfiles ranks a partial query", () => {
    const results = searchCareProfiles("philodendron", profiles);
    assert.ok(results.length >= 3);
    assert.ok(results.every((p) => /philodendron/i.test(p.commonName + p.scientificName + p.speciesKey)));
  });

  await test("identifyPlant parses a MOCKED live vision response end-to-end", async () => {
    const originalFetch = globalThis.fetch;
    process.env.ANTHROPIC_API_KEY = "test-key";
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          content: [
            {
              type: "text",
              text:
                '```json\n{"candidates":[' +
                '{"commonName":"Golden pothos","scientificName":"Epipremnum aureum","confidence":0.88,"reasoning":"Waxy gold-variegated leaves, not the matte heartleaf philodendron."},' +
                '{"commonName":"Heartleaf philodendron","scientificName":"Philodendron hederaceum","confidence":0.6,"reasoning":"Look-alike, but leaves here are thicker/waxier."},' +
                '{"commonName":"Satin pothos","scientificName":"Scindapsus pictus","confidence":0.2,"reasoning":"Ruled out: no silver spots."}' +
                "]}\n```",
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      )) as unknown as typeof fetch;
    try {
      const result = await identifyPlant("data:image/jpeg;base64,QUJD");
      assert.equal(result.mock, false);
      assert.equal(result.suggestions.length, 3);
      assert.equal(result.suggestions[0].commonName, "Golden pothos");
      assert.equal(result.suggestions[0].probability, 0.88);
      assert.ok(result.suggestions[0].reasoning?.includes("heartleaf"));
      // Cross-check step (as routes do) links top candidate to a speciesKey.
      const matched = matchCareProfile(result.suggestions[0].scientificName, profiles);
      assert.equal(matched?.speciesKey, "golden-pothos");
    } finally {
      globalThis.fetch = originalFetch;
      delete process.env.ANTHROPIC_API_KEY;
    }
  });

  await test("identifyPlant falls back to mock (200, never crash) with no API key", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const result = await identifyPlant("data:image/jpeg;base64,QUJD");
    assert.equal(result.mock, true);
    assert.equal(result.suggestions.length, 3);
  });

  await test("identifyPlant falls back to mock when the live API errors", async () => {
    const originalFetch = globalThis.fetch;
    process.env.ANTHROPIC_API_KEY = "test-key";
    globalThis.fetch = (async () => new Response("boom", { status: 500 })) as unknown as typeof fetch;
    try {
      const result = await identifyPlant("data:image/jpeg;base64,QUJD");
      assert.equal(result.mock, true); // graceful fallback, no throw
      assert.equal(result.suggestions.length, 3);
    } finally {
      globalThis.fetch = originalFetch;
      delete process.env.ANTHROPIC_API_KEY;
    }
  });

  await test("identifyTag falls back to mock with no API key", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const r = await identifyTag("data:image/jpeg;base64,QUJD");
    assert.equal(r.mock, true);
    assert.ok(r.commonName);
  });

  console.log(`\n${passed} passed`);
}

main();
