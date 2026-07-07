/**
 * Plant identification via a vision-capable LLM (Anthropic Claude).
 * =================================================================
 *
 * WHY NOT A DEDICATED PLANT-ID VENDOR (Plant.id / PlantNet)?
 * The owner rejected per-scan vendor pricing and black-box depth. Instead we
 * send the photo to a general vision LLM with a carefully engineered prompt,
 * get back the top candidates WITH reasoning about look-alike confusions, and
 * then cross-check those names against our own deep `care_profiles` reference
 * table (see server/care-match.ts + server/routes.ts). This keeps the ID logic
 * proprietary and layerable (tag OCR, look-alike disambiguation, rare cultivar
 * coverage) rather than a thin wrapper around someone else's API.
 *
 * PROVIDER / KEY: set `ANTHROPIC_API_KEY` (a normal Anthropic API key the owner
 * provides) as a Vercel environment variable. Optionally override the model
 * with `ANTHROPIC_MODEL`. This mirrors the old `PLANT_ID_API_KEY` pattern.
 *
 * COST NOTE: vision LLM calls are NOT free, but are typically far cheaper per
 * image than dedicated plant-ID vendors (see MASTER_REFERENCE.md §6).
 *
 * MOCK MODE: if `ANTHROPIC_API_KEY` is unset, both paths fall back to
 * deterministic, clearly-labeled mock results so the app never hard-fails and
 * stays fully testable end to end (preserving the prior crash-safe behavior).
 * The `.mock` flag on every result tells the UI to show "demo" messaging.
 */

export interface PlantSuggestion {
  id: string;
  commonName: string;
  scientificName: string;
  probability: number; // 0-1
  similarImageUrl: string;
  reasoning?: string; // short "why" for the UI, incl. look-alike disambiguation
}

export interface IdentificationResult {
  suggestions: PlantSuggestion[]; // top 3, ordered by confidence desc
  mock: boolean;
}

export interface TagReadResult {
  commonName: string | null;
  scientificName: string | null;
  rawText: string; // full text the model read off the tag
  confidence: number; // 0-1
  mock: boolean;
}

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-3-5-sonnet-latest";

// Curated reference photos reused for mock suggestions / "visual compare" tiles
// and as stand-in imagery for live vision suggestions (we don't get a photo
// back from the LLM, so we show a deterministic curated tile per candidate).
const STOCK_PHOTOS = {
  monstera: "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/4643d8940a3a1b5edbae380c8f1667def76247aa.jpg",
  miniMonstera: "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/0509bcf44436822dcb9999f9c0d1ddcdd08ca135.jpg",
  philodendron: "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/dbd7a70d946d6bdadc5ff96b8b607fc36c15f29c.jpg",
  livingRoom: "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/2f7d59b0b46396ab6a280ae4cc1ba831b83cb102.jpg",
  office: "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/0b3fa622feb42c41ca3fbb785fe0014d25ce6980.jpg",
  products: "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/19fe21f5dc77d469dea6f87ba3ecd6097a56bd1c.jpg",
};

const STOCK_ROTATION = [STOCK_PHOTOS.monstera, STOCK_PHOTOS.philodendron, STOCK_PHOTOS.miniMonstera];

/** Deterministic curated stand-in image for a live vision candidate. */
function stockPhotoFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return STOCK_ROTATION[hash % STOCK_ROTATION.length];
}

/**
 * Split a browser data URL ("data:image/jpeg;base64,....") into the media type
 * and raw base64 the Anthropic image content block expects. Falls back to
 * image/jpeg and treats the input as already-raw base64 if there is no header.
 */
export function parseDataUrl(input: string): { mediaType: string; data: string } {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]*)$/.exec(input.trim());
  if (match) {
    return { mediaType: match[1], data: match[2] };
  }
  return { mediaType: "image/jpeg", data: input.replace(/^data:.*;base64,/, "").trim() };
}

/** Pull the first JSON object/array out of a model text response (handles ```json fences). */
export function extractJson(text: string): any {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(text);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.search(/[[{]/);
  if (start === -1) throw new Error("No JSON found in model response");
  // Find the matching last bracket of the same kind.
  const open = candidate[start];
  const close = open === "[" ? "]" : "}";
  const end = candidate.lastIndexOf(close);
  if (end === -1 || end < start) throw new Error("Malformed JSON in model response");
  return JSON.parse(candidate.slice(start, end + 1));
}

async function callClaudeVision(imageInput: string, system: string, prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY!;
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
  const { mediaType, data } = parseDataUrl(imageInput);

  const response = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data } },
            { type: "text", text: prompt },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Anthropic API error ${response.status}: ${body}`);
  }
  const json: any = await response.json();
  const textBlock = (json.content ?? []).find((b: any) => b.type === "text");
  if (!textBlock?.text) throw new Error("Empty response from Anthropic API");
  return textBlock.text as string;
}

// ---------------------------------------------------------------------------
// Photo-of-plant identification
// ---------------------------------------------------------------------------
const IDENTIFY_SYSTEM =
  "You are an expert botanist and houseplant specialist with deep knowledge of both mainstream " +
  "houseplants AND rare/uncommon cultivars actively traded among collectors (rare aroids, " +
  "variegated Monstera/Philodendron/Syngonium, uncommon Hoya/Scindapsus, etc.). You identify " +
  "plants from photos and are careful to distinguish visually similar look-alikes.";

const IDENTIFY_PROMPT =
  "Identify the plant in this photo. Return the TOP 3 most likely species as strict JSON only " +
  "(no prose outside the JSON), in this exact shape:\n" +
  '{"candidates":[{"commonName":"...","scientificName":"...","confidence":0.0,' +
  '"reasoning":"one short sentence: why this, and why it is not the most likely look-alike"}]}\n' +
  "Rules: order candidates by confidence descending (0-1). Explicitly consider common look-alike " +
  "confusions (e.g. pothos vs. heartleaf philodendron, Monstera deliciosa vs. adansonii vs. " +
  "Rhaphidophora, Alocasia Polly vs. Frydek) and use the reasoning field to justify the pick over " +
  "its nearest look-alike. If the plant is a rare/variegated cultivar, name the specific cultivar. " +
  "Always return exactly 3 candidates even if unsure.";

function mockIdentify(): IdentificationResult {
  console.log(
    "[plant-id] MOCK MODE: ANTHROPIC_API_KEY is not set. Returning deterministic mock identification " +
      "results so the app remains testable end to end. Set ANTHROPIC_API_KEY to enable live AI vision ID."
  );
  return {
    mock: true,
    suggestions: [
      { id: "mock-monstera-deliciosa", commonName: "Monstera deliciosa", scientificName: "Monstera deliciosa", probability: 0.94, similarImageUrl: STOCK_PHOTOS.monstera, reasoning: "Demo result: large leaves with both splits and interior holes rule out the split-only Mini Monstera." },
      { id: "mock-mini-monstera", commonName: "Mini monstera", scientificName: "Rhaphidophora tetrasperma", probability: 0.82, similarImageUrl: STOCK_PHOTOS.miniMonstera, reasoning: "Demo result: smaller leaves splitting to the edge without interior holes." },
      { id: "mock-tree-philodendron", commonName: "Tree philodendron", scientificName: "Philodendron bipinnatifidum", probability: 0.76, similarImageUrl: STOCK_PHOTOS.philodendron, reasoning: "Demo result: feathery pinnate lobes with no round fenestrations." },
    ],
  };
}

/** Normalizes the model's raw candidate list into our PlantSuggestion shape. */
export function suggestionsFromCandidates(candidates: any[]): PlantSuggestion[] {
  return (Array.isArray(candidates) ? candidates : [])
    .slice(0, 3)
    .map((c: any, i: number) => {
      const commonName = String(c?.commonName ?? c?.common_name ?? c?.name ?? "Unknown plant").trim();
      const scientificName = String(c?.scientificName ?? c?.scientific_name ?? commonName).trim();
      let probability = Number(c?.confidence ?? c?.probability ?? 0);
      if (!Number.isFinite(probability)) probability = 0;
      if (probability > 1) probability = probability / 100; // tolerate 0-100 scale
      probability = Math.max(0, Math.min(1, probability));
      return {
        id: `vision-${i}-${scientificName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        commonName,
        scientificName,
        probability,
        similarImageUrl: stockPhotoFor(scientificName || commonName),
        reasoning: c?.reasoning ? String(c.reasoning).trim() : undefined,
      };
    });
}

async function fetchVisionIdentify(imageInput: string): Promise<IdentificationResult> {
  const text = await callClaudeVision(imageInput, IDENTIFY_SYSTEM, IDENTIFY_PROMPT);
  const parsed = extractJson(text);
  const suggestions = suggestionsFromCandidates(parsed?.candidates ?? parsed);
  if (suggestions.length === 0) throw new Error("Vision model returned no candidates");
  return { suggestions, mock: false };
}

export async function identifyPlant(imageBase64: string | null): Promise<IdentificationResult> {
  if (!process.env.ANTHROPIC_API_KEY || !imageBase64) {
    return mockIdentify();
  }
  try {
    return await fetchVisionIdentify(imageBase64);
  } catch (err) {
    console.error("[plant-id] Live vision ID failed, falling back to mock so the flow stays usable:", err);
    return mockIdentify();
  }
}

// ---------------------------------------------------------------------------
// Tag / nursery-label OCR
// ---------------------------------------------------------------------------
const TAG_SYSTEM =
  "You read the printed text off plant nursery tags/labels (the plastic stake in the pot). You " +
  "extract the plant's name exactly as printed and normalize it to a common name and scientific name.";

const TAG_PROMPT =
  "This photo is of a plant nursery tag/label. Read the printed plant name and return strict JSON only:\n" +
  '{"commonName":"...","scientificName":"...","rawText":"all text you can read","confidence":0.0}\n' +
  "Use null for commonName/scientificName if the tag does not legibly show that field. confidence is " +
  "0-1 for how legible/certain the name read is. Do not guess a species from a plant photo — only " +
  "report what is printed on the tag.";

function mockTag(): TagReadResult {
  console.log(
    "[plant-id] MOCK MODE (tag): ANTHROPIC_API_KEY is not set. Returning a deterministic mock tag read."
  );
  return {
    commonName: "Golden pothos",
    scientificName: "Epipremnum aureum",
    rawText: "Demo tag read — set ANTHROPIC_API_KEY to enable live label OCR.",
    confidence: 0.9,
    mock: true,
  };
}

export function tagResultFromJson(parsed: any): Omit<TagReadResult, "mock"> {
  const commonName = parsed?.commonName != null ? String(parsed.commonName).trim() || null : null;
  const scientificName = parsed?.scientificName != null ? String(parsed.scientificName).trim() || null : null;
  let confidence = Number(parsed?.confidence ?? 0);
  if (!Number.isFinite(confidence)) confidence = 0;
  if (confidence > 1) confidence = confidence / 100;
  confidence = Math.max(0, Math.min(1, confidence));
  return {
    commonName,
    scientificName,
    rawText: parsed?.rawText ? String(parsed.rawText).trim() : "",
    confidence,
  };
}

async function fetchTagRead(imageInput: string): Promise<TagReadResult> {
  const text = await callClaudeVision(imageInput, TAG_SYSTEM, TAG_PROMPT);
  const parsed = extractJson(text);
  return { ...tagResultFromJson(parsed), mock: false };
}

export async function identifyTag(imageBase64: string | null): Promise<TagReadResult> {
  if (!process.env.ANTHROPIC_API_KEY || !imageBase64) {
    return mockTag();
  }
  try {
    return await fetchTagRead(imageBase64);
  } catch (err) {
    console.error("[plant-id] Live tag OCR failed, falling back to mock so the flow stays usable:", err);
    return mockTag();
  }
}
