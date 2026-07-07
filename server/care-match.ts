/**
 * Fuzzy matching of free-text plant names (from the vision LLM's candidates,
 * a tag OCR read, or a user's manual search box) against the care_profiles
 * reference table. All three identification paths funnel through here so they
 * resolve to the SAME care profile / speciesKey and drive identical schedules.
 *
 * Deliberately dependency-free (no fuzzy-search npm package): the reference set
 * is small (~90 rows) so a simple normalized token-overlap score is both fast
 * and easy to reason about, and it keeps the serverless bundle lean.
 */
import type { CareProfile } from "@shared/schema";

/** Lowercase, strip cultivar quotes/parentheticals/punctuation, collapse spaces. */
export function normalizeName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/['"''`]/g, " ")
    .replace(/\([^)]*\)/g, " ") // drop parenthetical common/scientific alternates
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(raw: string): string[] {
  return normalizeName(raw).split(" ").filter((t) => t.length > 1);
}

/**
 * Score how well a query matches a single care profile (0 = no match).
 * Higher is better. Exact/substring hits are boosted above token overlap so a
 * clean "monstera deliciosa" always beats a partial genus-only overlap.
 */
export function scoreProfile(query: string, profile: CareProfile): number {
  const q = normalizeName(query);
  if (!q) return 0;

  const fields = [profile.commonName, profile.scientificName, profile.speciesKey.replace(/-/g, " ")];
  const normFields = fields.map(normalizeName);

  // Exact match on any field.
  if (normFields.some((f) => f === q)) return 1000;

  let best = 0;
  const qTokens = tokens(query);
  for (const f of normFields) {
    if (!f) continue;
    // Full-substring containment either direction (e.g. query "monstera" in
    // "monstera deliciosa", or field "hoya" inside query "my hoya carnosa").
    if (f.includes(q) || q.includes(f)) {
      best = Math.max(best, 500 + Math.min(q.length, f.length));
      continue;
    }
    // Token overlap: how many query tokens appear as field tokens.
    const fTokens = new Set(f.split(" "));
    let overlap = 0;
    for (const t of qTokens) if (fTokens.has(t)) overlap++;
    if (overlap > 0) {
      // Weight overlap by how much of the query it covers.
      best = Math.max(best, overlap * 100 + (overlap / Math.max(qTokens.length, 1)) * 50);
    }
  }
  return best;
}

/** Best single matching profile for a name, or undefined if nothing plausible. */
export function matchCareProfile(name: string, profiles: CareProfile[]): CareProfile | undefined {
  let best: CareProfile | undefined;
  let bestScore = 0;
  for (const p of profiles) {
    const s = scoreProfile(name, p);
    if (s > bestScore) {
      bestScore = s;
      best = p;
    }
  }
  // Require a minimum plausibility so an unrelated name doesn't latch onto a
  // weak genus-only overlap. Token-overlap of at least one full token (>=100)
  // or any substring/exact hit clears the bar.
  return bestScore >= 100 ? best : undefined;
}

/** Ranked list of profiles for the manual search box (best first). */
export function searchCareProfiles(query: string, profiles: CareProfile[], limit = 12): CareProfile[] {
  return profiles
    .map((p) => ({ p, score: scoreProfile(query, p) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.p);
}
