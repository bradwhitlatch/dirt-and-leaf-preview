/**
 * Affiliate link category seed data.
 *
 * The Amazon Associates tracking tag is read from process.env.AMAZON_ASSOCIATES_TAG
 * (see server/affiliate.ts for the link-builder that appends it) — never hardcoded
 * here. This file only defines the product category -> search query mapping.
 */
import type { InsertAffiliateLink } from "@shared/schema";

export const affiliateLinkSeeds: InsertAffiliateLink[] = [
  { category: "fertilizer", label: "Buy plant food", searchQuery: "indoor houseplant liquid fertilizer", asin: null },
  { category: "watering_tools", label: "Buy water supplies", searchQuery: "houseplant watering can long spout", asin: null },
  { category: "soil", label: "Buy soil mix", searchQuery: "indoor potting mix well draining", asin: null },
  { category: "pot", label: "Buy a pot", searchQuery: "ceramic plant pot with drainage hole", asin: null },
  { category: "repot_kit", label: "Buy repot kit", searchQuery: "plant repotting kit tools soil pot", asin: null },
  { category: "aroid_soil", label: "Buy aroid soil", searchQuery: "chunky aroid potting mix bark perlite", asin: null },
  { category: "succulent_soil", label: "Buy succulent soil", searchQuery: "cactus succulent potting mix fast draining", asin: null },
  { category: "grow_light", label: "Buy a grow light", searchQuery: "indoor plant grow light full spectrum", asin: null },
  { category: "humidity_tools", label: "Buy a humidifier", searchQuery: "small room humidifier for houseplants", asin: null },
  { category: "moss_pole", label: "Buy a moss pole", searchQuery: "moss pole plant support climbing", asin: null },
];
