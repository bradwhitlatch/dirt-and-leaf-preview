/**
 * Plant.id (kindwise.com) integration.
 *
 * Real endpoint: POST https://api.plant.id/v2/identify (v2 "identify" API),
 * header auth `Api-Key: <PLANT_ID_API_KEY>`. Docs: https://web.plant.id/ and
 * https://documenation.kindwise.com/plant-id/.
 *
 * This module always returns the SAME shape (`IdentificationResult`)
 * regardless of whether the real API or mock fallback is used, so the rest
 * of the app never has to know which path served the request.
 *
 * MOCK MODE: if PLANT_ID_API_KEY is not set in the environment, this file
 * falls back to a deterministic mock response so the app is fully testable
 * end to end without a real key. This is clearly logged and labeled below.
 * The real integration path (fetchFromPlantId) is fully implemented and
 * just needs a real key in the environment to activate.
 */

export interface PlantSuggestion {
  id: string;
  commonName: string;
  scientificName: string;
  probability: number; // 0-1
  similarImageUrl: string;
}

export interface IdentificationResult {
  suggestions: PlantSuggestion[]; // top 3-5, ordered by confidence desc
  mock: boolean;
}

const PLANT_ID_HOST = "https://api.plant.id/v2/identify";

// Curated reference photos reused for mock suggestions / "visual compare" tiles.
const STOCK_PHOTOS = {
  monstera: "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/4643d8940a3a1b5edbae380c8f1667def76247aa.jpg",
  miniMonstera: "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/0509bcf44436822dcb9999f9c0d1ddcdd08ca135.jpg",
  philodendron: "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/dbd7a70d946d6bdadc5ff96b8b607fc36c15f29c.jpg",
  livingRoom: "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/2f7d59b0b46396ab6a280ae4cc1ba831b83cb102.jpg",
  office: "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/0b3fa622feb42c41ca3fbb785fe0014d25ce6980.jpg",
  products: "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/19fe21f5dc77d469dea6f87ba3ecd6097a56bd1c.jpg",
};

function mockIdentify(): IdentificationResult {
  console.log(
    "[plant-id] MOCK MODE: PLANT_ID_API_KEY is not set. Returning deterministic mock " +
      "identification results so the app remains testable end to end. Get a real key at " +
      "https://web.plant.id/ and set PLANT_ID_API_KEY to enable live identification."
  );
  return {
    mock: true,
    suggestions: [
      { id: "mock-monstera-deliciosa", commonName: "Monstera deliciosa", scientificName: "Monstera deliciosa", probability: 0.94, similarImageUrl: STOCK_PHOTOS.monstera },
      { id: "mock-mini-monstera", commonName: "Mini monstera", scientificName: "Rhaphidophora tetrasperma", probability: 0.82, similarImageUrl: STOCK_PHOTOS.miniMonstera },
      { id: "mock-tree-philodendron", commonName: "Tree philodendron", scientificName: "Philodendron bipinnatifidum", probability: 0.76, similarImageUrl: STOCK_PHOTOS.philodendron },
    ],
  };
}

/** Real Plant.id v2 identify call. Only invoked when PLANT_ID_API_KEY is present. */
async function fetchFromPlantId(imageBase64: string): Promise<IdentificationResult> {
  const apiKey = process.env.PLANT_ID_API_KEY!;
  const response = await fetch(PLANT_ID_HOST, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Api-Key": apiKey,
    },
    body: JSON.stringify({
      images: [imageBase64],
      modifiers: ["similar_images"],
      plant_details: [
        "common_names",
        "url",
        "wiki_description",
        "taxonomy",
        "watering",
      ],
      plant_language: "en",
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Plant.id API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  const suggestions: PlantSuggestion[] = (data.suggestions ?? [])
    .slice(0, 5)
    .map((s: any) => ({
      id: String(s.id ?? s.plant_name),
      commonName: s.plant_details?.common_names?.[0] ?? s.plant_name,
      scientificName: s.plant_name,
      probability: s.probability ?? 0,
      similarImageUrl: s.similar_images?.[0]?.url ?? "",
    }));

  // Hard requirement: never show only 1 match. If Plant.id returns fewer
  // than 3, pad is not possible without fabricating data, so we surface
  // whatever came back but log a warning for visibility.
  if (suggestions.length < 3) {
    console.warn(`[plant-id] API returned only ${suggestions.length} suggestion(s); expected 3-5.`);
  }

  return { suggestions, mock: false };
}

export async function identifyPlant(imageBase64: string | null): Promise<IdentificationResult> {
  const apiKey = process.env.PLANT_ID_API_KEY;
  if (!apiKey) {
    return mockIdentify();
  }
  try {
    return await fetchFromPlantId(imageBase64 ?? "");
  } catch (err) {
    console.error("[plant-id] Live API call failed, falling back to mock so the flow stays usable:", err);
    return mockIdentify();
  }
}
