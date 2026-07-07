/**
 * Amazon Associates affiliate link builder.
 *
 * Every "Buy plant food" / "Buy water supplies" / "Buy pot" / "Buy soil" CTA
 * must route through this builder — never a raw unbranded link. Reads the
 * Associates tag from AMAZON_ASSOCIATES_TAG. Until the user creates a real
 * Amazon Associates account (https://affiliate-program.amazon.com/), this
 * falls back to the SPEC-mandated placeholder "YOUR-ASSOCIATES-TAG-20" so
 * the app is fully testable end to end and the swap-in later is a single
 * env var change.
 */
import type { AffiliateLink } from "@shared/schema";

const FALLBACK_TAG = "YOUR-ASSOCIATES-TAG-20";

export function getAssociatesTag(): string {
  const tag = process.env.AMAZON_ASSOCIATES_TAG;
  if (!tag) {
    // Mock mode notice — see README.md "Environment variables" section.
    console.log(
      "[affiliate] AMAZON_ASSOCIATES_TAG not set — using placeholder tag. " +
        "Create an Amazon Associates account at https://affiliate-program.amazon.com/ and set this env var before going live."
    );
    return FALLBACK_TAG;
  }
  return tag;
}

/** Builds a tracked Amazon search URL for a given affiliate link category row. */
export function buildAffiliateUrl(link: Pick<AffiliateLink, "asin" | "searchQuery">): string {
  const tag = getAssociatesTag();
  if (link.asin) {
    return `https://www.amazon.com/dp/${encodeURIComponent(link.asin)}?tag=${encodeURIComponent(tag)}`;
  }
  const query = encodeURIComponent(link.searchQuery);
  return `https://www.amazon.com/s?k=${query}&tag=${encodeURIComponent(tag)}`;
}
