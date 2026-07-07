"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// script/api-entry.ts
var api_entry_exports = {};
__export(api_entry_exports, {
  default: () => handler
});
module.exports = __toCommonJS(api_entry_exports);

// server/app.ts
var import_config = require("dotenv/config");
var import_express = __toESM(require("express"), 1);
var import_node_http = require("node:http");

// shared/schema.ts
var import_pg_core = require("drizzle-orm/pg-core");
var import_drizzle_zod = require("drizzle-zod");
var rooms = (0, import_pg_core.pgTable)("rooms", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  name: (0, import_pg_core.text)("name").notNull(),
  photoUrl: (0, import_pg_core.text)("photo_url"),
  createdAt: (0, import_pg_core.bigint)("created_at", { mode: "number" }).notNull()
  // epoch ms
});
var insertRoomSchema = (0, import_drizzle_zod.createInsertSchema)(rooms).omit({ id: true, createdAt: true });
var careProfiles = (0, import_pg_core.pgTable)("care_profiles", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  speciesKey: (0, import_pg_core.text)("species_key").notNull().unique(),
  // slug, e.g. "monstera-deliciosa"
  commonName: (0, import_pg_core.text)("common_name").notNull(),
  scientificName: (0, import_pg_core.text)("scientific_name").notNull(),
  // Watering
  waterIntervalDaysMin: (0, import_pg_core.integer)("water_interval_days_min").notNull(),
  waterIntervalDaysMax: (0, import_pg_core.integer)("water_interval_days_max").notNull(),
  waterNotes: (0, import_pg_core.text)("water_notes").notNull(),
  // Feeding
  feedIntervalDaysActive: (0, import_pg_core.integer)("feed_interval_days_active").notNull(),
  // growing season
  feedIntervalDaysDormant: (0, import_pg_core.integer)("feed_interval_days_dormant"),
  // null = skip feeding when dormant
  feedNotes: (0, import_pg_core.text)("feed_notes").notNull(),
  // Light & placement
  lightRequirement: (0, import_pg_core.text)("light_requirement").notNull(),
  // e.g. "bright_indirect"
  placementNotes: (0, import_pg_core.text)("placement_notes").notNull(),
  // Soil & repotting
  soilType: (0, import_pg_core.text)("soil_type").notNull(),
  repotIntervalMonths: (0, import_pg_core.integer)("repot_interval_months"),
  // Environment ranges (used to cross-check against live weather/season)
  idealTempMinF: (0, import_pg_core.integer)("ideal_temp_min_f"),
  idealTempMaxF: (0, import_pg_core.integer)("ideal_temp_max_f"),
  idealHumidityPct: (0, import_pg_core.integer)("ideal_humidity_pct"),
  toxicity: (0, import_pg_core.text)("toxicity"),
  // e.g. "Toxic to cats and dogs if ingested"
  matureSizeNotes: (0, import_pg_core.text)("mature_size_notes"),
  // Look-alike disambiguation: 2-4 sentences of specific visual traits that
  // separate this species from its most common confusions. This is what the
  // vision-ID cross-check step reads to avoid mismatching look-alikes (e.g.
  // pothos vs. heartleaf philodendron).
  distinguishingTraits: (0, import_pg_core.text)("distinguishing_traits"),
  // Trust / provenance
  sourceCitations: (0, import_pg_core.text)("source_citations").notNull(),
  // JSON: [{label,url}]
  researchStatus: (0, import_pg_core.text)("research_status").notNull().default("seed"),
  // "seed" | "verified"
  researchNotes: (0, import_pg_core.text)("research_notes")
  // free-text TODOs for the follow-up research pass
});
var insertCareProfileSchema = (0, import_drizzle_zod.createInsertSchema)(careProfiles).omit({ id: true });
var plants = (0, import_pg_core.pgTable)("plants", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  roomId: (0, import_pg_core.integer)("room_id").notNull(),
  careProfileId: (0, import_pg_core.integer)("care_profile_id"),
  // nullable: matched species may not be in reference table yet
  commonName: (0, import_pg_core.text)("common_name").notNull(),
  scientificName: (0, import_pg_core.text)("scientific_name"),
  curatedPhotoUrl: (0, import_pg_core.text)("curated_photo_url"),
  // stock/reference image for the matched species
  userPhotoUrl: (0, import_pg_core.text)("user_photo_url"),
  // the original ID photo (never shown as the "main" photo per spec)
  confirmedConfidence: (0, import_pg_core.doublePrecision)("confirmed_confidence"),
  // 0-1, from the Plant.id suggestion the user tapped
  matchCandidates: (0, import_pg_core.text)("match_candidates"),
  // JSON: full top-3..5 suggestion list at save time (audit trail)
  saveDate: (0, import_pg_core.bigint)("save_date", { mode: "number" }).notNull(),
  // Location snapshot at save time, used to compute the initial schedule
  locationLat: (0, import_pg_core.doublePrecision)("location_lat"),
  locationLon: (0, import_pg_core.doublePrecision)("location_lon"),
  locationLabel: (0, import_pg_core.text)("location_label"),
  // reverse-geocoded city/region
  hardinessZone: (0, import_pg_core.text)("hardiness_zone"),
  potSizeInches: (0, import_pg_core.integer)("pot_size_inches"),
  nextWaterDate: (0, import_pg_core.bigint)("next_water_date", { mode: "number" }),
  nextFeedDate: (0, import_pg_core.bigint)("next_feed_date", { mode: "number" })
});
var insertPlantSchema = (0, import_drizzle_zod.createInsertSchema)(plants).omit({ id: true, saveDate: true });
var reminders = (0, import_pg_core.pgTable)("reminders", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  plantId: (0, import_pg_core.integer)("plant_id").notNull(),
  type: (0, import_pg_core.text)("type").notNull(),
  // "water" | "feed" | "light" | "repot"
  dueDate: (0, import_pg_core.bigint)("due_date", { mode: "number" }).notNull(),
  status: (0, import_pg_core.text)("status").notNull().default("pending"),
  // "pending" | "done" | "snoozed"
  createdAt: (0, import_pg_core.bigint)("created_at", { mode: "number" }).notNull()
});
var insertReminderSchema = (0, import_drizzle_zod.createInsertSchema)(reminders).omit({ id: true, createdAt: true });
var progressPhotos = (0, import_pg_core.pgTable)("progress_photos", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  plantId: (0, import_pg_core.integer)("plant_id").notNull(),
  photoUrl: (0, import_pg_core.text)("photo_url").notNull(),
  capturedDate: (0, import_pg_core.bigint)("captured_date", { mode: "number" }).notNull(),
  note: (0, import_pg_core.text)("note")
});
var insertProgressPhotoSchema = (0, import_drizzle_zod.createInsertSchema)(progressPhotos).omit({ id: true });
var notificationLog = (0, import_pg_core.pgTable)("notification_log", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  reminderId: (0, import_pg_core.integer)("reminder_id"),
  plantId: (0, import_pg_core.integer)("plant_id"),
  title: (0, import_pg_core.text)("title").notNull(),
  body: (0, import_pg_core.text)("body").notNull(),
  sentAt: (0, import_pg_core.bigint)("sent_at", { mode: "number" }).notNull(),
  status: (0, import_pg_core.text)("status").notNull()
  // "sent" | "failed" | "no_subscription"
});
var insertNotificationLogSchema = (0, import_drizzle_zod.createInsertSchema)(notificationLog).omit({ id: true });
var affiliateLinks = (0, import_pg_core.pgTable)("affiliate_links", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  category: (0, import_pg_core.text)("category").notNull().unique(),
  // "fertilizer" | "soil" | "pot" | "watering_tools" | "repot_kit"
  label: (0, import_pg_core.text)("label").notNull(),
  searchQuery: (0, import_pg_core.text)("search_query").notNull(),
  // used to build an Amazon search URL
  asin: (0, import_pg_core.text)("asin")
  // optional specific product ASIN, preferred over search when present
});
var insertAffiliateLinkSchema = (0, import_drizzle_zod.createInsertSchema)(affiliateLinks).omit({ id: true });
var pushSubscriptions = (0, import_pg_core.pgTable)("push_subscriptions", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  endpoint: (0, import_pg_core.text)("endpoint").notNull().unique(),
  subscriptionJson: (0, import_pg_core.text)("subscription_json").notNull(),
  // full PushSubscription JSON
  createdAt: (0, import_pg_core.bigint)("created_at", { mode: "number" }).notNull()
});
var insertPushSubscriptionSchema = (0, import_drizzle_zod.createInsertSchema)(pushSubscriptions).omit({ id: true, createdAt: true });
var SUBSCRIPTION_TIERS = ["free", "premium_monthly", "premium_yearly"];
var users = (0, import_pg_core.pgTable)("users", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  subscriptionTier: (0, import_pg_core.text)("subscription_tier").notNull().default("free"),
  // SubscriptionTier
  subscriptionExpiresAt: (0, import_pg_core.bigint)("subscription_expires_at", { mode: "number" }),
  // epoch ms, null for free tier
  subscriptionRenews: (0, import_pg_core.boolean)("subscription_renews").notNull().default(true),
  createdAt: (0, import_pg_core.bigint)("created_at", { mode: "number" }).notNull()
});
var insertUserSchema = (0, import_drizzle_zod.createInsertSchema)(users).omit({ id: true, createdAt: true });

// shared/pricing.ts
var FREE_PLANT_LIMIT = 3;
var PREMIUM_MONTHLY_PRICE_USD = 4.99;
var PREMIUM_YEARLY_PRICE_USD = 39.99;
var PREMIUM_YEARLY_EFFECTIVE_MONTHLY = PREMIUM_YEARLY_PRICE_USD / 12;
var PREMIUM_YEARLY_SAVINGS_PCT = Math.round(
  (1 - PREMIUM_YEARLY_EFFECTIVE_MONTHLY / PREMIUM_MONTHLY_PRICE_USD) * 100
);

// server/storage.ts
var import_postgres_js = require("drizzle-orm/postgres-js");
var import_postgres = __toESM(require("postgres"), 1);
var import_drizzle_orm = require("drizzle-orm");

// server/care-profile-seed.ts
var CITATIONS = {
  clemsonHGIC: { label: "Clemson Cooperative Extension, Home & Garden Information Center", url: "https://hgic.clemson.edu/" },
  ifas: { label: "University of Florida IFAS Extension", url: "https://sfyl.ifas.ufl.edu/" },
  moBotGarden: { label: "Missouri Botanical Garden Plant Finder", url: "https://www.missouribotanicalgarden.org/PlantFinder/PlantFinderSearch.aspx" },
  ncsuToolbox: { label: "NC State Extension Gardener Plant Toolbox", url: "https://plants.ces.ncsu.edu/" },
  asHouseplantEncyclopedia: { label: "American Horticultural Society, Encyclopedia of Houseplants", url: "https://ahsgardening.org/" },
  newPlantParent: { label: "Darryl Cheng, The New Plant Parent (book)", url: "https://www.houseplantjournal.com/" },
  costaFarms: { label: "Costa Farms Plant Care Guides", url: "https://www.costafarms.com/plants" },
  aspcaToxic: { label: "ASPCA Animal Poison Control, Toxic and Non-Toxic Plant List", url: "https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants" },
  nasaCleanAir: { label: "B.C. Wolverton, How to Grow Fresh Air / NASA Clean Air Study", url: "https://www.nasa.gov/" }
};
var baseSeeds = [
  {
    speciesKey: "monstera-deliciosa",
    commonName: "Monstera deliciosa",
    scientificName: "Monstera deliciosa",
    waterIntervalDaysMin: 7,
    waterIntervalDaysMax: 10,
    waterNotes: "Water when the top 1-2 inches of soil are dry. Reduce frequency in winter dormancy.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: null,
    feedNotes: "Balanced liquid houseplant fertilizer monthly during spring/summer active growth; skip in fall/winter.",
    lightRequirement: "bright_indirect",
    placementNotes: "Bright indirect light; tolerates medium light but fenestration (leaf splits) is reduced. Keep out of direct afternoon sun.",
    soilType: "Chunky, well-draining aroid mix (bark, perlite, peat/coco coir)",
    repotIntervalMonths: 24,
    idealTempMinF: 65,
    idealTempMaxF: 85,
    idealHumidityPct: 60,
    toxicity: "Toxic to cats and dogs if ingested (insoluble calcium oxalates).",
    matureSizeNotes: "Can reach 6-8 ft indoors with support; provide a moss pole as it matures.",
    sourceCitations: [CITATIONS.ifas, CITATIONS.newPlantParent, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "mini-monstera",
    commonName: "Mini monstera",
    scientificName: "Rhaphidophora tetrasperma",
    waterIntervalDaysMin: 7,
    waterIntervalDaysMax: 9,
    waterNotes: "Allow top inch of soil to dry between waterings; likes consistent moisture but not soggy roots.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: null,
    feedNotes: "Monthly balanced fertilizer during active growth; pause in winter.",
    lightRequirement: "bright_indirect",
    placementNotes: "Bright indirect light; a climbing pole encourages larger fenestrated leaves.",
    soilType: "Chunky, airy aroid mix with extra perlite/bark",
    repotIntervalMonths: 18,
    idealTempMinF: 65,
    idealTempMaxF: 85,
    idealHumidityPct: 60,
    toxicity: "Mildly toxic to pets if ingested (calcium oxalates), similar family to Monstera.",
    matureSizeNotes: "Fast-growing climbing vine; can reach several feet with support.",
    sourceCitations: [CITATIONS.costaFarms, CITATIONS.newPlantParent]
  },
  {
    speciesKey: "tree-philodendron",
    commonName: "Tree philodendron",
    scientificName: "Philodendron bipinnatifidum (Thaumatophyllum bipinnatifidum)",
    waterIntervalDaysMin: 7,
    waterIntervalDaysMax: 10,
    waterNotes: "Water when top 1-2 inches are dry; fairly drought tolerant once established.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: 60,
    feedNotes: "Monthly in spring/summer; every other month in fall/winter.",
    lightRequirement: "medium_to_bright_indirect",
    placementNotes: "Adapts to medium light but grows fuller in bright indirect light. Broad leaf spread needs floor space.",
    soilType: "Well-draining potting mix with added perlite/bark",
    repotIntervalMonths: 24,
    idealTempMinF: 60,
    idealTempMaxF: 85,
    idealHumidityPct: 50,
    toxicity: "Toxic to cats and dogs if ingested (calcium oxalates).",
    matureSizeNotes: "Large self-heading philodendron, can spread 4-5 ft wide indoors.",
    sourceCitations: [CITATIONS.ifas, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "fiddle-leaf-fig",
    commonName: "Fiddle leaf fig",
    scientificName: "Ficus lyrata",
    waterIntervalDaysMin: 6,
    waterIntervalDaysMax: 8,
    waterNotes: "Check top inch of soil before watering; sensitive to both under- and over-watering. Water thoroughly, then let drain fully.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: null,
    feedNotes: "Foliage fertilizer monthly at half strength during active growth (spring-summer); skip in winter.",
    lightRequirement: "bright_indirect",
    placementNotes: "Bright indirect light, rotate weekly for even growth; avoid moving/drafts which cause leaf drop.",
    soilType: "Well-draining potting mix with perlite for aeration",
    repotIntervalMonths: 24,
    idealTempMinF: 65,
    idealTempMaxF: 80,
    idealHumidityPct: 40,
    toxicity: "Toxic to cats and dogs if ingested (irritant sap with calcium oxalates).",
    matureSizeNotes: "Can reach 6-10 ft indoors; slow to moderate grower.",
    sourceCitations: [CITATIONS.clemsonHGIC, CITATIONS.newPlantParent, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "snake-plant",
    commonName: "Snake plant",
    scientificName: "Dracaena trifasciata (formerly Sansevieria trifasciata)",
    waterIntervalDaysMin: 14,
    waterIntervalDaysMax: 21,
    waterNotes: "Let soil dry out deeply between waterings; highly drought tolerant, most commonly killed by overwatering.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: null,
    feedNotes: "Light, quarter-to-half-strength houseplant fertilizer monthly in spring/summer only.",
    lightRequirement: "low_to_bright_indirect",
    placementNotes: "Tolerates low light but grows best in medium-bright indirect light. Very adaptable.",
    soilType: "Fast-draining succulent/cactus mix",
    repotIntervalMonths: 36,
    idealTempMinF: 60,
    idealTempMaxF: 85,
    idealHumidityPct: 30,
    toxicity: "Mildly toxic to cats and dogs if ingested (saponins) \u2014 can cause GI upset.",
    matureSizeNotes: "Upright architectural leaves typically 1-3 ft tall indoors.",
    sourceCitations: [CITATIONS.ifas, CITATIONS.nasaCleanAir, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "golden-pothos",
    commonName: "Golden pothos",
    scientificName: "Epipremnum aureum",
    waterIntervalDaysMin: 7,
    waterIntervalDaysMax: 9,
    waterNotes: "Water when top 1-2 inches of soil are dry; very forgiving of missed waterings.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: 60,
    feedNotes: "Monthly in active growth; every other month in winter.",
    lightRequirement: "low_to_bright_indirect",
    placementNotes: "Extremely adaptable \u2014 low light to bright indirect; variegation fades in low light.",
    soilType: "Standard well-draining potting mix",
    repotIntervalMonths: 18,
    idealTempMinF: 60,
    idealTempMaxF: 85,
    idealHumidityPct: 40,
    toxicity: "Toxic to cats and dogs if ingested (calcium oxalates).",
    matureSizeNotes: "Trailing vine, can grow several feet long; trim to encourage fullness.",
    sourceCitations: [CITATIONS.clemsonHGIC, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "peace-lily",
    commonName: "Peace lily",
    scientificName: "Spathiphyllum wallisii",
    waterIntervalDaysMin: 6,
    waterIntervalDaysMax: 8,
    waterNotes: "Keep soil evenly moist; plant droops visibly when thirsty and perks up quickly after watering.",
    feedIntervalDaysActive: 42,
    feedIntervalDaysDormant: null,
    feedNotes: "Balanced liquid fertilizer every 6 weeks in spring/summer; skip in winter.",
    lightRequirement: "low_to_medium_indirect",
    placementNotes: "Tolerates low light, flowers best in medium indirect light. Avoid direct sun (scorches leaves).",
    soilType: "Rich, well-draining potting mix that retains some moisture",
    repotIntervalMonths: 18,
    idealTempMinF: 65,
    idealTempMaxF: 80,
    idealHumidityPct: 50,
    toxicity: "Toxic to cats and dogs if ingested (calcium oxalates).",
    matureSizeNotes: "Typically 1-3 ft tall indoors with white spathe blooms.",
    sourceCitations: [CITATIONS.ifas, CITATIONS.nasaCleanAir, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "zz-plant",
    commonName: "ZZ plant",
    scientificName: "Zamioculcas zamiifolia",
    waterIntervalDaysMin: 14,
    waterIntervalDaysMax: 21,
    waterNotes: "Allow soil to dry completely; rhizomes store water, so this plant tolerates neglect well.",
    feedIntervalDaysActive: 60,
    feedIntervalDaysDormant: null,
    feedNotes: "Light feeding every 2 months during spring/summer; skip in winter.",
    lightRequirement: "low_to_bright_indirect",
    placementNotes: "Extremely tolerant of low light; grows faster in bright indirect light.",
    soilType: "Well-draining potting mix, cactus/succulent blend works well",
    repotIntervalMonths: 36,
    idealTempMinF: 60,
    idealTempMaxF: 85,
    idealHumidityPct: 30,
    toxicity: "Toxic to cats and dogs if ingested (calcium oxalates); sap can irritate skin.",
    matureSizeNotes: "Glossy upright stems, typically 2-3 ft tall indoors.",
    sourceCitations: [CITATIONS.ifas, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "rubber-plant",
    commonName: "Rubber plant",
    scientificName: "Ficus elastica",
    waterIntervalDaysMin: 7,
    waterIntervalDaysMax: 10,
    waterNotes: "Water when top 1-2 inches of soil are dry; sensitive to overwatering (leaf drop/yellowing).",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: null,
    feedNotes: "Monthly balanced fertilizer spring-summer; skip in winter dormancy.",
    lightRequirement: "bright_indirect",
    placementNotes: "Bright indirect light produces the deepest leaf color; wipe leaves to keep pores clear.",
    soilType: "Well-draining potting mix with perlite",
    repotIntervalMonths: 24,
    idealTempMinF: 65,
    idealTempMaxF: 80,
    idealHumidityPct: 40,
    toxicity: "Toxic to cats and dogs if ingested (irritant latex sap).",
    matureSizeNotes: "Can reach 6-10 ft indoors as a tree form.",
    sourceCitations: [CITATIONS.clemsonHGIC, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "pothos-marble-queen",
    commonName: "Marble queen pothos",
    scientificName: "Epipremnum aureum 'Marble Queen'",
    waterIntervalDaysMin: 7,
    waterIntervalDaysMax: 10,
    waterNotes: "Water when top 1-2 inches are dry; needs slightly more light than solid green pothos to maintain variegation.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: 60,
    feedNotes: "Monthly in active growth, every other month in winter.",
    lightRequirement: "medium_to_bright_indirect",
    placementNotes: "Brighter indirect light keeps the white variegation pronounced; low light causes reversion to green.",
    soilType: "Standard well-draining potting mix",
    repotIntervalMonths: 18,
    idealTempMinF: 60,
    idealTempMaxF: 85,
    idealHumidityPct: 40,
    toxicity: "Toxic to cats and dogs if ingested (calcium oxalates).",
    matureSizeNotes: "Trailing vine similar habit to golden pothos.",
    sourceCitations: [CITATIONS.clemsonHGIC, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "spider-plant",
    commonName: "Spider plant",
    scientificName: "Chlorophytum comosum",
    waterIntervalDaysMin: 6,
    waterIntervalDaysMax: 9,
    waterNotes: "Keep lightly moist; sensitive to fluoride/chlorine in tap water (brown leaf tips) \u2014 filtered water helps.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: 60,
    feedNotes: "Monthly during growth, every other month in winter.",
    lightRequirement: "medium_to_bright_indirect",
    placementNotes: "Bright indirect light produces best variegation; tolerates some direct morning sun.",
    soilType: "Standard well-draining potting mix",
    repotIntervalMonths: 18,
    idealTempMinF: 60,
    idealTempMaxF: 80,
    idealHumidityPct: 40,
    toxicity: "Non-toxic to cats and dogs (may cause mild GI upset/attracts cats but not seriously toxic).",
    matureSizeNotes: "Arching grass-like leaves, produces plantlets on runners.",
    sourceCitations: [CITATIONS.ifas, CITATIONS.nasaCleanAir, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "chinese-money-plant",
    commonName: "Chinese money plant",
    scientificName: "Pilea peperomioides",
    waterIntervalDaysMin: 7,
    waterIntervalDaysMax: 9,
    waterNotes: "Let top inch of soil dry; rotate pot regularly for even, symmetrical growth.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: null,
    feedNotes: "Monthly balanced fertilizer during spring/summer; skip in winter.",
    lightRequirement: "bright_indirect",
    placementNotes: "Bright indirect light; avoid direct sun which scorches round leaves.",
    soilType: "Well-draining potting mix with perlite",
    repotIntervalMonths: 18,
    idealTempMinF: 65,
    idealTempMaxF: 80,
    idealHumidityPct: 40,
    toxicity: "Generally considered non-toxic to pets.",
    matureSizeNotes: "Compact, typically under 12 in indoors; produces easy-to-propagate offsets.",
    sourceCitations: [CITATIONS.newPlantParent, CITATIONS.costaFarms]
  },
  {
    speciesKey: "philodendron-heartleaf",
    commonName: "Heartleaf philodendron",
    scientificName: "Philodendron hederaceum",
    waterIntervalDaysMin: 7,
    waterIntervalDaysMax: 9,
    waterNotes: "Water when top inch is dry; very forgiving trailing plant.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: 60,
    feedNotes: "Monthly in active growth, every other month in winter.",
    lightRequirement: "low_to_bright_indirect",
    placementNotes: "Tolerates low light but grows fuller/faster in medium-bright indirect light.",
    soilType: "Standard well-draining potting mix",
    repotIntervalMonths: 18,
    idealTempMinF: 65,
    idealTempMaxF: 85,
    idealHumidityPct: 45,
    toxicity: "Toxic to cats and dogs if ingested (calcium oxalates).",
    matureSizeNotes: "Fast-growing trailing/climbing vine.",
    sourceCitations: [CITATIONS.ifas, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "calathea-orbifolia",
    commonName: "Calathea orbifolia",
    scientificName: "Goeppertia orbifolia",
    waterIntervalDaysMin: 5,
    waterIntervalDaysMax: 7,
    waterNotes: "Keep evenly moist, never soggy or bone dry; sensitive to tap water minerals/fluoride \u2014 use filtered/distilled water.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: null,
    feedNotes: "Diluted (half-strength) fertilizer monthly in spring/summer; skip in winter.",
    lightRequirement: "medium_indirect",
    placementNotes: "Medium indirect light, no direct sun; needs consistently high humidity (pebble tray/humidifier recommended).",
    soilType: "Peat-based, moisture-retentive but well-draining mix",
    repotIntervalMonths: 18,
    idealTempMinF: 65,
    idealTempMaxF: 80,
    idealHumidityPct: 60,
    toxicity: "Non-toxic to cats and dogs.",
    matureSizeNotes: "Large striped oval leaves, can reach 2-3 ft; notoriously fussy about humidity/water quality.",
    sourceCitations: [CITATIONS.asHouseplantEncyclopedia, CITATIONS.newPlantParent, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "boston-fern",
    commonName: "Boston fern",
    scientificName: "Nephrolepis exaltata",
    waterIntervalDaysMin: 3,
    waterIntervalDaysMax: 5,
    waterNotes: "Keep soil consistently moist; do not let dry out fully \u2014 fronds crisp quickly when underwatered.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: null,
    feedNotes: "Light monthly feeding spring-summer; skip in winter.",
    lightRequirement: "medium_indirect",
    placementNotes: "Bright, indirect light; loves high humidity (bathrooms/kitchens work well).",
    soilType: "Peat-based, moisture-retentive potting mix",
    repotIntervalMonths: 12,
    idealTempMinF: 60,
    idealTempMaxF: 80,
    idealHumidityPct: 65,
    toxicity: "Non-toxic to cats and dogs.",
    matureSizeNotes: "Arching fronds, spreads 2-3 ft; classic hanging basket plant.",
    sourceCitations: [CITATIONS.ifas, CITATIONS.nasaCleanAir, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "aloe-vera",
    commonName: "Aloe vera",
    scientificName: "Aloe vera (Aloe barbadensis miller)",
    waterIntervalDaysMin: 14,
    waterIntervalDaysMax: 21,
    waterNotes: "Let soil dry completely between waterings; a classic succulent \u2014 overwatering causes root rot.",
    feedIntervalDaysActive: 60,
    feedIntervalDaysDormant: null,
    feedNotes: "Light cactus/succulent fertilizer 1-2 times during spring/summer; skip in winter.",
    lightRequirement: "bright_direct_to_indirect",
    placementNotes: "Bright light, tolerates some direct sun; a south/west windowsill is ideal.",
    soilType: "Fast-draining cactus/succulent mix",
    repotIntervalMonths: 24,
    idealTempMinF: 55,
    idealTempMaxF: 85,
    idealHumidityPct: 30,
    toxicity: "Mildly toxic to cats and dogs if ingested (saponins) \u2014 GI upset.",
    matureSizeNotes: "Rosette form, typically 1-2 ft; produces offset pups.",
    sourceCitations: [CITATIONS.ifas, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "jade-plant",
    commonName: "Jade plant",
    scientificName: "Crassula ovata",
    waterIntervalDaysMin: 14,
    waterIntervalDaysMax: 21,
    waterNotes: "Let soil dry fully between waterings; classic succulent, very drought tolerant.",
    feedIntervalDaysActive: 60,
    feedIntervalDaysDormant: null,
    feedNotes: "Diluted succulent fertilizer every 2 months in spring/summer; skip in winter.",
    lightRequirement: "bright_direct_to_indirect",
    placementNotes: "Needs several hours of bright light daily (south/west window) to stay compact and avoid legginess.",
    soilType: "Fast-draining cactus/succulent mix",
    repotIntervalMonths: 24,
    idealTempMinF: 60,
    idealTempMaxF: 85,
    idealHumidityPct: 30,
    toxicity: "Toxic to cats and dogs if ingested (unknown compound, causes vomiting/lethargy).",
    matureSizeNotes: "Thick woody stems, can reach 2-3 ft, tree-like with age.",
    sourceCitations: [CITATIONS.ifas, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "pothos-neon",
    commonName: "Neon pothos",
    scientificName: "Epipremnum aureum 'Neon'",
    waterIntervalDaysMin: 7,
    waterIntervalDaysMax: 9,
    waterNotes: "Water when top 1-2 inches dry; chartreuse color is brightest in more light.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: 60,
    feedNotes: "Monthly active season, every other month in winter.",
    lightRequirement: "medium_to_bright_indirect",
    placementNotes: "Brighter indirect light keeps foliage vivid chartreuse; low light causes it to green out.",
    soilType: "Standard well-draining potting mix",
    repotIntervalMonths: 18,
    idealTempMinF: 60,
    idealTempMaxF: 85,
    idealHumidityPct: 40,
    toxicity: "Toxic to cats and dogs if ingested (calcium oxalates).",
    matureSizeNotes: "Trailing vine, similar habit to golden pothos.",
    sourceCitations: [CITATIONS.clemsonHGIC, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "dracaena-marginata",
    commonName: "Dragon tree",
    scientificName: "Dracaena marginata",
    waterIntervalDaysMin: 10,
    waterIntervalDaysMax: 14,
    waterNotes: "Allow soil to dry out between waterings; sensitive to fluoride in tap water (brown leaf tips).",
    feedIntervalDaysActive: 45,
    feedIntervalDaysDormant: null,
    feedNotes: "Light feeding every 6 weeks spring-summer; skip in winter.",
    lightRequirement: "medium_to_bright_indirect",
    placementNotes: "Tolerates medium light, best color in bright indirect light; avoid direct sun.",
    soilType: "Well-draining potting mix with perlite",
    repotIntervalMonths: 24,
    idealTempMinF: 65,
    idealTempMaxF: 80,
    idealHumidityPct: 40,
    toxicity: "Toxic to cats and dogs if ingested (saponins).",
    matureSizeNotes: "Slow-growing, can reach 6+ ft indoors with slender arching leaves.",
    sourceCitations: [CITATIONS.ifas, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "bird-of-paradise",
    commonName: "Bird of paradise",
    scientificName: "Strelitzia nicolai",
    waterIntervalDaysMin: 7,
    waterIntervalDaysMax: 10,
    waterNotes: "Water when top 1-2 inches are dry; thrives with consistent moisture in active growth.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: 60,
    feedNotes: "Monthly balanced fertilizer in spring/summer, every other month in winter.",
    lightRequirement: "bright_indirect_to_direct",
    placementNotes: "Needs bright light, tolerates some direct sun; rotate for even growth.",
    soilType: "Rich, well-draining potting mix",
    repotIntervalMonths: 24,
    idealTempMinF: 65,
    idealTempMaxF: 85,
    idealHumidityPct: 50,
    toxicity: "Mildly toxic to cats and dogs if ingested (GI upset).",
    matureSizeNotes: "Large architectural plant, can reach 6-8+ ft indoors.",
    sourceCitations: [CITATIONS.ifas, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "english-ivy",
    commonName: "English ivy",
    scientificName: "Hedera helix",
    waterIntervalDaysMin: 6,
    waterIntervalDaysMax: 8,
    waterNotes: "Keep soil lightly moist; likes more humidity than average.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: 60,
    feedNotes: "Monthly during growth, every other month in winter.",
    lightRequirement: "medium_to_bright_indirect",
    placementNotes: "Bright indirect light; good air circulation reduces spider mite risk.",
    soilType: "Standard well-draining potting mix",
    repotIntervalMonths: 18,
    idealTempMinF: 55,
    idealTempMaxF: 80,
    idealHumidityPct: 45,
    toxicity: "Toxic to cats and dogs if ingested.",
    matureSizeNotes: "Trailing/climbing vine, several feet long when mature.",
    sourceCitations: [CITATIONS.ifas, CITATIONS.nasaCleanAir, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "peperomia-obtusifolia",
    commonName: "Baby rubber plant (Peperomia)",
    scientificName: "Peperomia obtusifolia",
    waterIntervalDaysMin: 9,
    waterIntervalDaysMax: 12,
    waterNotes: "Let soil dry between waterings; semi-succulent leaves store water, prone to rot if overwatered.",
    feedIntervalDaysActive: 45,
    feedIntervalDaysDormant: null,
    feedNotes: "Light feeding every 6 weeks in spring/summer; skip in winter.",
    lightRequirement: "medium_indirect",
    placementNotes: "Medium to bright indirect light; compact size suits desks/shelves.",
    soilType: "Well-draining potting mix with perlite",
    repotIntervalMonths: 24,
    idealTempMinF: 65,
    idealTempMaxF: 80,
    idealHumidityPct: 45,
    toxicity: "Non-toxic to cats and dogs.",
    matureSizeNotes: "Compact, typically under 12 in.",
    sourceCitations: [CITATIONS.ifas, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "anthurium-andraeanum",
    commonName: "Anthurium (flamingo flower)",
    scientificName: "Anthurium andraeanum",
    waterIntervalDaysMin: 7,
    waterIntervalDaysMax: 9,
    waterNotes: "Water when top inch of soil is dry; likes humidity but not soggy roots.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: 60,
    feedNotes: "Monthly balanced/bloom fertilizer spring-summer; every other month in winter.",
    lightRequirement: "medium_to_bright_indirect",
    placementNotes: "Bright indirect light encourages more blooms; avoid direct sun.",
    soilType: "Chunky, well-draining aroid mix",
    repotIntervalMonths: 18,
    idealTempMinF: 65,
    idealTempMaxF: 85,
    idealHumidityPct: 60,
    toxicity: "Toxic to cats and dogs if ingested (calcium oxalates).",
    matureSizeNotes: "Typically 1-2 ft; blooms glossy red/pink spathes when happy.",
    sourceCitations: [CITATIONS.ifas, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "areca-palm",
    commonName: "Areca palm",
    scientificName: "Dypsis lutescens",
    waterIntervalDaysMin: 7,
    waterIntervalDaysMax: 9,
    waterNotes: "Keep soil lightly moist; sensitive to both drought stress and overwatering root rot.",
    feedIntervalDaysActive: 45,
    feedIntervalDaysDormant: null,
    feedNotes: "Palm-specific fertilizer every 6 weeks in spring/summer; skip in winter.",
    lightRequirement: "bright_indirect",
    placementNotes: "Bright indirect light; benefits from higher humidity and occasional misting.",
    soilType: "Well-draining potting mix with peat and perlite",
    repotIntervalMonths: 24,
    idealTempMinF: 65,
    idealTempMaxF: 85,
    idealHumidityPct: 50,
    toxicity: "Non-toxic to cats and dogs \u2014 a pet-safe palm option.",
    matureSizeNotes: "Can reach 6-7 ft indoors, clumping habit.",
    sourceCitations: [CITATIONS.ifas, CITATIONS.nasaCleanAir, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "christmas-cactus",
    commonName: "Christmas cactus",
    scientificName: "Schlumbergera bridgesii",
    waterIntervalDaysMin: 10,
    waterIntervalDaysMax: 14,
    waterNotes: "Let top inch dry between waterings; more moisture-loving than desert cacti. Reduce watering after bloom for dormancy.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: null,
    feedNotes: "Balanced fertilizer monthly spring-summer; switch to bloom fertilizer in fall bud set; skip in winter rest.",
    lightRequirement: "medium_to_bright_indirect",
    placementNotes: "Bright indirect light; needs cooler temps and long dark nights in fall to set buds.",
    soilType: "Well-draining potting mix with extra perlite (not desert cactus mix \u2014 retains more moisture)",
    repotIntervalMonths: 24,
    idealTempMinF: 60,
    idealTempMaxF: 75,
    idealHumidityPct: 45,
    toxicity: "Non-toxic to cats and dogs.",
    matureSizeNotes: "Trailing segmented stems, typically 12-24 in.",
    sourceCitations: [CITATIONS.ifas, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "parlor-palm",
    commonName: "Parlor palm",
    scientificName: "Chamaedorea elegans",
    waterIntervalDaysMin: 8,
    waterIntervalDaysMax: 10,
    waterNotes: "Keep lightly moist; let top inch dry before watering again.",
    feedIntervalDaysActive: 45,
    feedIntervalDaysDormant: null,
    feedNotes: "Light palm fertilizer every 6 weeks in spring/summer; skip in winter.",
    lightRequirement: "low_to_medium_indirect",
    placementNotes: "Tolerates low light well, a good low-maintenance office palm.",
    soilType: "Well-draining potting mix",
    repotIntervalMonths: 24,
    idealTempMinF: 65,
    idealTempMaxF: 80,
    idealHumidityPct: 45,
    toxicity: "Non-toxic to cats and dogs \u2014 a pet-safe palm option.",
    matureSizeNotes: "Compact, typically 2-4 ft indoors, slow growing.",
    sourceCitations: [CITATIONS.ifas, CITATIONS.nasaCleanAir, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "african-violet",
    commonName: "African violet",
    scientificName: "Saintpaulia ionantha",
    waterIntervalDaysMin: 5,
    waterIntervalDaysMax: 7,
    waterNotes: "Keep soil evenly moist but not wet; water from below or avoid wetting fuzzy leaves to prevent spotting.",
    feedIntervalDaysActive: 14,
    feedIntervalDaysDormant: 30,
    feedNotes: "Dilute African-violet-specific fertilizer every 2 weeks in bloom season; monthly in winter.",
    lightRequirement: "medium_indirect",
    placementNotes: "Bright indirect light (east-facing window ideal); avoid direct sun which scorches leaves.",
    soilType: "Light, well-draining African violet potting mix",
    repotIntervalMonths: 12,
    idealTempMinF: 65,
    idealTempMaxF: 80,
    idealHumidityPct: 50,
    toxicity: "Non-toxic to cats and dogs.",
    matureSizeNotes: "Compact rosette, typically under 12 in, repeat-blooming.",
    sourceCitations: [CITATIONS.ifas, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "orchid-phalaenopsis",
    commonName: "Moth orchid",
    scientificName: "Phalaenopsis spp.",
    waterIntervalDaysMin: 7,
    waterIntervalDaysMax: 10,
    waterNotes: "Water thoroughly then allow to nearly dry (ice cube or weekly soak methods both work); never let roots sit in water.",
    feedIntervalDaysActive: 14,
    feedIntervalDaysDormant: 30,
    feedNotes: "Weak orchid-specific fertilizer every 2 weeks in active growth; monthly during rest.",
    lightRequirement: "medium_bright_indirect",
    placementNotes: "Bright indirect light (east/north window); needs a dip in nighttime temp to trigger reblooming.",
    soilType: "Specialized orchid bark/moss mix \u2014 never standard potting soil",
    repotIntervalMonths: 18,
    idealTempMinF: 65,
    idealTempMaxF: 80,
    idealHumidityPct: 55,
    toxicity: "Non-toxic to cats and dogs.",
    matureSizeNotes: "Arching flower spikes, blooms last 2-3 months.",
    sourceCitations: [CITATIONS.ifas, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "succulent-echeveria",
    commonName: "Echeveria (rosette succulent)",
    scientificName: "Echeveria spp.",
    waterIntervalDaysMin: 12,
    waterIntervalDaysMax: 18,
    waterNotes: "Soak-and-dry method: water thoroughly then let dry completely; very susceptible to rot if kept wet.",
    feedIntervalDaysActive: 60,
    feedIntervalDaysDormant: null,
    feedNotes: "Light succulent fertilizer 1-2 times per growing season; skip in winter.",
    lightRequirement: "bright_direct_to_indirect",
    placementNotes: "Needs several hours of bright light daily to prevent stretching/etiolation.",
    soilType: "Fast-draining cactus/succulent mix",
    repotIntervalMonths: 24,
    idealTempMinF: 60,
    idealTempMaxF: 85,
    idealHumidityPct: 30,
    toxicity: "Generally non-toxic to cats and dogs.",
    matureSizeNotes: "Compact rosette form, typically under 6 in.",
    sourceCitations: [CITATIONS.ifas, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "haworthia",
    commonName: "Haworthia (zebra plant)",
    scientificName: "Haworthiopsis attenuata",
    waterIntervalDaysMin: 14,
    waterIntervalDaysMax: 21,
    waterNotes: "Let soil dry fully between waterings; small succulent, easy to overwater.",
    feedIntervalDaysActive: 60,
    feedIntervalDaysDormant: null,
    feedNotes: "Light succulent feeding 1-2 times per growing season.",
    lightRequirement: "medium_bright_indirect",
    placementNotes: "Bright indirect light; direct hot sun can scorch \u2014 unlike some succulents it prefers filtered light.",
    soilType: "Fast-draining cactus/succulent mix",
    repotIntervalMonths: 24,
    idealTempMinF: 60,
    idealTempMaxF: 85,
    idealHumidityPct: 30,
    toxicity: "Non-toxic to cats and dogs.",
    matureSizeNotes: "Small rosette, typically under 5 in, offsets readily.",
    sourceCitations: [CITATIONS.ifas, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "philodendron-brasil",
    commonName: "Philodendron Brasil",
    scientificName: "Philodendron hederaceum 'Brasil'",
    waterIntervalDaysMin: 7,
    waterIntervalDaysMax: 9,
    waterNotes: "Water when top inch is dry; forgiving trailing plant similar to heartleaf philodendron.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: 60,
    feedNotes: "Monthly in active growth, every other month in winter.",
    lightRequirement: "medium_to_bright_indirect",
    placementNotes: "Brighter indirect light keeps the yellow-green variegation vivid.",
    soilType: "Standard well-draining potting mix",
    repotIntervalMonths: 18,
    idealTempMinF: 65,
    idealTempMaxF: 85,
    idealHumidityPct: 45,
    toxicity: "Toxic to cats and dogs if ingested (calcium oxalates).",
    matureSizeNotes: "Fast-growing trailing vine.",
    sourceCitations: [CITATIONS.ifas, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "croton",
    commonName: "Croton",
    scientificName: "Codiaeum variegatum",
    waterIntervalDaysMin: 6,
    waterIntervalDaysMax: 8,
    waterNotes: "Keep soil consistently moist; sensitive to both drought and cold drafts (leaf drop).",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: 60,
    feedNotes: "Monthly balanced fertilizer in spring/summer; every other month in winter.",
    lightRequirement: "bright_direct_to_indirect",
    placementNotes: "Needs bright light (some direct sun) to maintain vivid leaf coloration.",
    soilType: "Well-draining potting mix",
    repotIntervalMonths: 18,
    idealTempMinF: 65,
    idealTempMaxF: 85,
    idealHumidityPct: 50,
    toxicity: "Toxic to cats and dogs if ingested (irritant sap).",
    matureSizeNotes: "Colorful leathery leaves, typically 2-4 ft indoors.",
    sourceCitations: [CITATIONS.ifas, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "calathea-medallion",
    commonName: "Calathea medallion",
    scientificName: "Goeppertia veitchiana 'Medallion'",
    waterIntervalDaysMin: 5,
    waterIntervalDaysMax: 7,
    waterNotes: "Keep evenly moist with filtered/distilled water; sensitive to tap water minerals.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: null,
    feedNotes: "Half-strength fertilizer monthly in spring/summer; skip in winter.",
    lightRequirement: "medium_indirect",
    placementNotes: "Medium indirect light, no direct sun; high humidity essential (leaves curl when dry air).",
    soilType: "Peat-based, moisture-retentive well-draining mix",
    repotIntervalMonths: 18,
    idealTempMinF: 65,
    idealTempMaxF: 80,
    idealHumidityPct: 60,
    toxicity: "Non-toxic to cats and dogs.",
    matureSizeNotes: "Ornately patterned round leaves, typically 1-2 ft.",
    sourceCitations: [CITATIONS.asHouseplantEncyclopedia, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "money-tree",
    commonName: "Money tree",
    scientificName: "Pachira aquatica",
    waterIntervalDaysMin: 9,
    waterIntervalDaysMax: 12,
    waterNotes: "Allow top 1-2 inches to dry; sensitive to overwatering despite aquatic origin/common name.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: 60,
    feedNotes: "Monthly balanced fertilizer spring-summer; every other month in winter.",
    lightRequirement: "medium_to_bright_indirect",
    placementNotes: "Bright indirect light; braided trunk forms tolerate lower light than most.",
    soilType: "Well-draining potting mix",
    repotIntervalMonths: 24,
    idealTempMinF: 65,
    idealTempMaxF: 85,
    idealHumidityPct: 50,
    toxicity: "Non-toxic to cats and dogs.",
    matureSizeNotes: "Can reach 6-8 ft indoors with braided trunk.",
    sourceCitations: [CITATIONS.ifas, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "ponytail-palm",
    commonName: "Ponytail palm",
    scientificName: "Beaucarnea recurvata",
    waterIntervalDaysMin: 14,
    waterIntervalDaysMax: 21,
    waterNotes: "Let soil dry fully; bulbous caudex stores water, tolerates significant drought.",
    feedIntervalDaysActive: 60,
    feedIntervalDaysDormant: null,
    feedNotes: "Light feeding every 2 months during spring/summer; skip in winter.",
    lightRequirement: "bright_direct_to_indirect",
    placementNotes: "Needs bright light, tolerates direct sun; a sunny window is ideal.",
    soilType: "Fast-draining cactus/succulent mix",
    repotIntervalMonths: 36,
    idealTempMinF: 60,
    idealTempMaxF: 85,
    idealHumidityPct: 30,
    toxicity: "Non-toxic to cats and dogs.",
    matureSizeNotes: "Distinctive swollen base, can reach several feet indoors.",
    sourceCitations: [CITATIONS.ifas, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "prayer-plant",
    commonName: "Prayer plant",
    scientificName: "Maranta leuconeura",
    waterIntervalDaysMin: 5,
    waterIntervalDaysMax: 7,
    waterNotes: "Keep evenly moist with filtered water; leaves fold up at night (nyctinasty) \u2014 a normal trait, not distress.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: null,
    feedNotes: "Half-strength fertilizer monthly spring-summer; skip in winter.",
    lightRequirement: "low_to_medium_indirect",
    placementNotes: "Medium indirect light, tolerates lower light; high humidity keeps leaf edges from browning.",
    soilType: "Peat-based, moisture-retentive well-draining mix",
    repotIntervalMonths: 18,
    idealTempMinF: 65,
    idealTempMaxF: 80,
    idealHumidityPct: 55,
    toxicity: "Non-toxic to cats and dogs.",
    matureSizeNotes: "Low, spreading habit, typically under 12 in.",
    sourceCitations: [CITATIONS.asHouseplantEncyclopedia, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "philodendron-birkin",
    commonName: "Philodendron Birkin",
    scientificName: "Philodendron 'Birkin'",
    waterIntervalDaysMin: 7,
    waterIntervalDaysMax: 9,
    waterNotes: "Water when top inch is dry; keep an eye on new leaves which emerge solid green before pinstripes develop.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: 60,
    feedNotes: "Monthly in active growth, every other month in winter.",
    lightRequirement: "medium_to_bright_indirect",
    placementNotes: "Bright indirect light keeps variegated pinstripe pattern crisp.",
    soilType: "Chunky, well-draining aroid mix",
    repotIntervalMonths: 18,
    idealTempMinF: 65,
    idealTempMaxF: 85,
    idealHumidityPct: 50,
    toxicity: "Toxic to cats and dogs if ingested (calcium oxalates).",
    matureSizeNotes: "Compact, non-climbing, typically under 2 ft.",
    sourceCitations: [CITATIONS.costaFarms, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "alocasia-polly",
    commonName: "Alocasia Polly (African mask plant)",
    scientificName: "Alocasia x amazonica 'Polly'",
    waterIntervalDaysMin: 6,
    waterIntervalDaysMax: 8,
    waterNotes: "Keep soil moist but not soggy; goes dormant in winter \u2014 reduce watering significantly then.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: null,
    feedNotes: "Half-strength fertilizer monthly in spring/summer; withhold during winter dormancy.",
    lightRequirement: "medium_bright_indirect",
    placementNotes: "Bright indirect light, no direct sun; needs high humidity, prone to spider mites in dry air.",
    soilType: "Chunky, well-draining aroid mix",
    repotIntervalMonths: 18,
    idealTempMinF: 65,
    idealTempMaxF: 85,
    idealHumidityPct: 60,
    toxicity: "Toxic to cats and dogs if ingested (calcium oxalates).",
    matureSizeNotes: "Arrow-shaped leaves with white veins, typically 1-2 ft; can die back to tuber in winter and regrow.",
    sourceCitations: [CITATIONS.asHouseplantEncyclopedia, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "philodendron-xanadu",
    commonName: "Philodendron Xanadu",
    scientificName: "Thaumatophyllum xanadu",
    waterIntervalDaysMin: 7,
    waterIntervalDaysMax: 10,
    waterNotes: "Water when top 1-2 inches are dry; fairly forgiving.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: 60,
    feedNotes: "Monthly in active growth, every other month in winter.",
    lightRequirement: "medium_to_bright_indirect",
    placementNotes: "Medium to bright indirect light; compact mounding habit good for floor or large pots.",
    soilType: "Well-draining potting mix with added perlite/bark",
    repotIntervalMonths: 24,
    idealTempMinF: 60,
    idealTempMaxF: 85,
    idealHumidityPct: 45,
    toxicity: "Toxic to cats and dogs if ingested (calcium oxalates).",
    matureSizeNotes: "Mounding habit, spreads 2-3 ft wide.",
    sourceCitations: [CITATIONS.ifas, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "fern-maidenhair",
    commonName: "Maidenhair fern",
    scientificName: "Adiantum raddianum",
    waterIntervalDaysMin: 3,
    waterIntervalDaysMax: 4,
    waterNotes: "Keep soil consistently moist at all times; extremely sensitive to drying out (fronds die back quickly).",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: null,
    feedNotes: "Light monthly feeding in spring/summer; skip in winter.",
    lightRequirement: "medium_indirect",
    placementNotes: "Bright indirect light, no direct sun; needs very high humidity \u2014 a terrarium or bathroom suits it well.",
    soilType: "Peat-based, highly moisture-retentive mix",
    repotIntervalMonths: 12,
    idealTempMinF: 65,
    idealTempMaxF: 80,
    idealHumidityPct: 70,
    toxicity: "Non-toxic to cats and dogs.",
    matureSizeNotes: "Delicate fronds, typically under 18 in; considered a finicky/advanced-care fern.",
    sourceCitations: [CITATIONS.ifas, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "hoya-carnosa",
    commonName: "Hoya (wax plant)",
    scientificName: "Hoya carnosa",
    waterIntervalDaysMin: 10,
    waterIntervalDaysMax: 14,
    waterNotes: "Let soil dry out between waterings; semi-succulent leaves store water, prone to rot if overwatered.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: null,
    feedNotes: "Diluted bloom fertilizer monthly during active growth; skip in winter.",
    lightRequirement: "bright_indirect",
    placementNotes: "Bright indirect light with some direct morning sun encourages blooming clusters.",
    soilType: "Chunky, well-draining mix (orchid bark + perlite blend works well)",
    repotIntervalMonths: 24,
    idealTempMinF: 65,
    idealTempMaxF: 85,
    idealHumidityPct: 50,
    toxicity: "Generally non-toxic to cats and dogs (mildly irritating sap).",
    matureSizeNotes: "Trailing/climbing vine, can grow several feet; blooms fragrant star-shaped flower clusters when mature.",
    sourceCitations: [CITATIONS.asHouseplantEncyclopedia, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "philodendron-pink-princess",
    commonName: "Pink princess philodendron",
    scientificName: "Philodendron erubescens 'Pink Princess'",
    waterIntervalDaysMin: 7,
    waterIntervalDaysMax: 9,
    waterNotes: "Water when top inch is dry; avoid overwatering which can cause stem rot at variegated sections.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: 60,
    feedNotes: "Monthly in active growth, every other month in winter.",
    lightRequirement: "bright_indirect",
    placementNotes: "Bright indirect light maximizes pink variegation; too little light reduces pink coloring.",
    soilType: "Chunky, well-draining aroid mix",
    repotIntervalMonths: 18,
    idealTempMinF: 65,
    idealTempMaxF: 85,
    idealHumidityPct: 55,
    toxicity: "Toxic to cats and dogs if ingested (calcium oxalates).",
    matureSizeNotes: "Climbing vine, variegation pattern varies per leaf/cutting.",
    sourceCitations: [CITATIONS.newPlantParent, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "succulent-string-of-pearls",
    commonName: "String of pearls",
    scientificName: "Curio rowleyanus (Senecio rowleyanus)",
    waterIntervalDaysMin: 10,
    waterIntervalDaysMax: 14,
    waterNotes: "Soak-and-dry; let soil dry fully \u2014 bead-like leaves store water and rot easily if overwatered.",
    feedIntervalDaysActive: 60,
    feedIntervalDaysDormant: null,
    feedNotes: "Light succulent fertilizer 1-2 times per growing season.",
    lightRequirement: "bright_indirect_to_some_direct",
    placementNotes: "Bright light, tolerates some direct sun; best in a hanging basket to let strands trail.",
    soilType: "Fast-draining cactus/succulent mix",
    repotIntervalMonths: 24,
    idealTempMinF: 60,
    idealTempMaxF: 85,
    idealHumidityPct: 30,
    toxicity: "Toxic to cats and dogs if ingested (contains pyrrolizidine-type compounds \u2014 GI upset).",
    matureSizeNotes: "Trailing bead-like strands, can reach several feet long.",
    sourceCitations: [CITATIONS.ifas, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "philodendron-selloum",
    commonName: "Philodendron Selloum",
    scientificName: "Thaumatophyllum bipinnatifidum (syn. Philodendron selloum)",
    waterIntervalDaysMin: 7,
    waterIntervalDaysMax: 10,
    waterNotes: "Same care profile as tree philodendron \u2014 water when top 1-2 inches dry.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: 60,
    feedNotes: "Monthly in spring/summer; every other month in fall/winter.",
    lightRequirement: "medium_to_bright_indirect",
    placementNotes: "Adapts to medium light, fuller in bright indirect light; needs floor space as it matures.",
    soilType: "Well-draining potting mix with added perlite/bark",
    repotIntervalMonths: 24,
    idealTempMinF: 60,
    idealTempMaxF: 85,
    idealHumidityPct: 50,
    toxicity: "Toxic to cats and dogs if ingested (calcium oxalates).",
    matureSizeNotes: "Large self-heading philodendron, spreads several feet wide.",
    sourceCitations: [CITATIONS.ifas, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "kentia-palm",
    commonName: "Kentia palm",
    scientificName: "Howea forsteriana",
    waterIntervalDaysMin: 9,
    waterIntervalDaysMax: 12,
    waterNotes: "Let top inch dry between waterings; sensitive to both extremes.",
    feedIntervalDaysActive: 45,
    feedIntervalDaysDormant: null,
    feedNotes: "Palm-specific fertilizer every 6 weeks spring-summer; skip in winter.",
    lightRequirement: "low_to_bright_indirect",
    placementNotes: "Tolerates lower light well; a classic elegant low-maintenance interior palm.",
    soilType: "Well-draining potting mix",
    repotIntervalMonths: 36,
    idealTempMinF: 65,
    idealTempMaxF: 80,
    idealHumidityPct: 45,
    toxicity: "Non-toxic to cats and dogs.",
    matureSizeNotes: "Slow growing, can reach 6-10 ft indoors over many years.",
    sourceCitations: [CITATIONS.ifas, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "philodendron-congo",
    commonName: "Philodendron Congo",
    scientificName: "Philodendron 'Congo'",
    waterIntervalDaysMin: 7,
    waterIntervalDaysMax: 10,
    waterNotes: "Water when top 1-2 inches dry; larger leaves show wilting clearly when thirsty.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: 60,
    feedNotes: "Monthly in active growth, every other month in winter.",
    lightRequirement: "medium_to_bright_indirect",
    placementNotes: "Medium to bright indirect light; non-climbing upright form.",
    soilType: "Well-draining potting mix with perlite",
    repotIntervalMonths: 24,
    idealTempMinF: 65,
    idealTempMaxF: 85,
    idealHumidityPct: 45,
    toxicity: "Toxic to cats and dogs if ingested (calcium oxalates).",
    matureSizeNotes: "Upright clumping form, typically 2-3 ft.",
    sourceCitations: [CITATIONS.costaFarms, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "cast-iron-plant",
    commonName: "Cast iron plant",
    scientificName: "Aspidistra elatior",
    waterIntervalDaysMin: 10,
    waterIntervalDaysMax: 14,
    waterNotes: "Let top 1-2 inches dry; extremely tolerant of neglect and inconsistent watering.",
    feedIntervalDaysActive: 60,
    feedIntervalDaysDormant: null,
    feedNotes: "Light feeding every 2 months in spring/summer; skip in winter.",
    lightRequirement: "low_indirect",
    placementNotes: "One of the most shade-tolerant houseplants; avoid direct sun which scorches leaves.",
    soilType: "Standard well-draining potting mix",
    repotIntervalMonths: 36,
    idealTempMinF: 55,
    idealTempMaxF: 85,
    idealHumidityPct: 35,
    toxicity: "Non-toxic to cats and dogs.",
    matureSizeNotes: "Slow-growing, upright dark green leaves, typically 1-2 ft.",
    sourceCitations: [CITATIONS.ifas, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "philodendron-micans",
    commonName: "Philodendron Micans",
    scientificName: "Philodendron hederaceum var. hederaceum",
    waterIntervalDaysMin: 7,
    waterIntervalDaysMax: 9,
    waterNotes: "Water when top inch is dry; velvety leaves bruise easily so handle gently.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: 60,
    feedNotes: "Monthly in active growth, every other month in winter.",
    lightRequirement: "medium_to_bright_indirect",
    placementNotes: "Bright indirect light enhances the iridescent bronze-green velvet sheen.",
    soilType: "Standard well-draining potting mix",
    repotIntervalMonths: 18,
    idealTempMinF: 65,
    idealTempMaxF: 85,
    idealHumidityPct: 50,
    toxicity: "Toxic to cats and dogs if ingested (calcium oxalates).",
    matureSizeNotes: "Trailing vine with velvety heart-shaped leaves.",
    sourceCitations: [CITATIONS.newPlantParent, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "swiss-cheese-vine",
    commonName: "Swiss cheese vine",
    scientificName: "Monstera adansonii",
    waterIntervalDaysMin: 6,
    waterIntervalDaysMax: 8,
    waterNotes: "Water when top inch is dry; likes consistent moisture more than Monstera deliciosa.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: null,
    feedNotes: "Monthly balanced fertilizer in spring/summer; skip in winter.",
    lightRequirement: "medium_to_bright_indirect",
    placementNotes: "Bright indirect light; a moss pole or trellis encourages larger fenestrated leaves.",
    soilType: "Chunky, well-draining aroid mix",
    repotIntervalMonths: 18,
    idealTempMinF: 65,
    idealTempMaxF: 85,
    idealHumidityPct: 55,
    toxicity: "Toxic to cats and dogs if ingested (calcium oxalates).",
    matureSizeNotes: "Fast-growing vine with fenestrated (holey) leaves.",
    sourceCitations: [CITATIONS.newPlantParent, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "fittonia",
    commonName: "Nerve plant",
    scientificName: "Fittonia albivenis",
    waterIntervalDaysMin: 4,
    waterIntervalDaysMax: 6,
    waterNotes: "Keep soil consistently moist; dramatically wilts when dry but usually recovers quickly after watering.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: null,
    feedNotes: "Light monthly feeding in spring/summer; skip in winter.",
    lightRequirement: "low_to_medium_indirect",
    placementNotes: "Medium indirect light, no direct sun; loves humidity \u2014 great terrarium candidate.",
    soilType: "Peat-based, moisture-retentive mix",
    repotIntervalMonths: 12,
    idealTempMinF: 65,
    idealTempMaxF: 80,
    idealHumidityPct: 65,
    toxicity: "Non-toxic to cats and dogs.",
    matureSizeNotes: "Low, spreading habit with vividly veined leaves, typically under 6 in.",
    sourceCitations: [CITATIONS.ifas, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "bromeliad-guzmania",
    commonName: "Bromeliad (Guzmania)",
    scientificName: "Guzmania lingulata",
    waterIntervalDaysMin: 7,
    waterIntervalDaysMax: 10,
    waterNotes: "Keep the central cup filled with fresh water (flush monthly), keep soil lightly moist.",
    feedIntervalDaysActive: 45,
    feedIntervalDaysDormant: null,
    feedNotes: "Very light diluted fertilizer in the central cup or soil every 6 weeks during growth; most nutrients absorbed via leaves.",
    lightRequirement: "medium_bright_indirect",
    placementNotes: "Bright indirect light, no direct sun; mother plant dies after blooming but produces offset pups.",
    soilType: "Light, well-draining epiphyte-friendly mix (orchid bark blend)",
    repotIntervalMonths: 12,
    idealTempMinF: 65,
    idealTempMaxF: 85,
    idealHumidityPct: 55,
    toxicity: "Non-toxic to cats and dogs.",
    matureSizeNotes: "Rosette form with a colorful central bract bloom, typically 1-2 ft.",
    sourceCitations: [CITATIONS.ifas, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "philodendron-lemon-lime",
    commonName: "Philodendron Lemon Lime",
    scientificName: "Philodendron hederaceum 'Lemon Lime'",
    waterIntervalDaysMin: 7,
    waterIntervalDaysMax: 9,
    waterNotes: "Water when top inch is dry; a forgiving trailing philodendron.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: 60,
    feedNotes: "Monthly in active growth, every other month in winter.",
    lightRequirement: "medium_to_bright_indirect",
    placementNotes: "Brighter indirect light keeps chartreuse color vivid; too little light causes greening/legginess.",
    soilType: "Standard well-draining potting mix",
    repotIntervalMonths: 18,
    idealTempMinF: 65,
    idealTempMaxF: 85,
    idealHumidityPct: 45,
    toxicity: "Toxic to cats and dogs if ingested (calcium oxalates).",
    matureSizeNotes: "Fast-growing trailing vine.",
    sourceCitations: [CITATIONS.costaFarms, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "yucca-cane",
    commonName: "Yucca cane",
    scientificName: "Yucca elephantipes (Yucca gigantea)",
    waterIntervalDaysMin: 14,
    waterIntervalDaysMax: 21,
    waterNotes: "Allow soil to dry out fully; very drought tolerant, prone to root rot if overwatered.",
    feedIntervalDaysActive: 60,
    feedIntervalDaysDormant: null,
    feedNotes: "Light feeding every 2 months spring-summer; skip in winter.",
    lightRequirement: "bright_direct_to_indirect",
    placementNotes: "Needs bright light, tolerates direct sun; a sunny spot keeps growth compact.",
    soilType: "Fast-draining cactus/succulent-style mix",
    repotIntervalMonths: 36,
    idealTempMinF: 60,
    idealTempMaxF: 85,
    idealHumidityPct: 30,
    toxicity: "Toxic to cats and dogs if ingested (saponins).",
    matureSizeNotes: "Woody cane trunk with sword-like leaf rosettes, can reach 6+ ft indoors.",
    sourceCitations: [CITATIONS.ifas, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "philodendron-moonlight",
    commonName: "Philodendron Moonlight",
    scientificName: "Philodendron 'Moonlight'",
    waterIntervalDaysMin: 7,
    waterIntervalDaysMax: 9,
    waterNotes: "Water when top inch is dry; non-climbing, compact rosette form.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: 60,
    feedNotes: "Monthly in active growth, every other month in winter.",
    lightRequirement: "medium_to_bright_indirect",
    placementNotes: "Bright indirect light keeps the chartreuse new growth vivid.",
    soilType: "Well-draining potting mix with perlite",
    repotIntervalMonths: 18,
    idealTempMinF: 65,
    idealTempMaxF: 85,
    idealHumidityPct: 50,
    toxicity: "Toxic to cats and dogs if ingested (calcium oxalates).",
    matureSizeNotes: "Compact, non-climbing, typically under 18 in.",
    sourceCitations: [CITATIONS.costaFarms, CITATIONS.aspcaToxic]
  },
  {
    speciesKey: "umbrella-plant-schefflera",
    commonName: "Umbrella plant (Schefflera)",
    scientificName: "Schefflera arboricola",
    waterIntervalDaysMin: 9,
    waterIntervalDaysMax: 12,
    waterNotes: "Let top 1-2 inches dry; sensitive to overwatering (leaf drop and root rot).",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: 60,
    feedNotes: "Monthly balanced fertilizer spring-summer; every other month in winter.",
    lightRequirement: "medium_to_bright_indirect",
    placementNotes: "Bright indirect light; tolerates medium light but grows leggy.",
    soilType: "Well-draining potting mix",
    repotIntervalMonths: 24,
    idealTempMinF: 60,
    idealTempMaxF: 85,
    idealHumidityPct: 45,
    toxicity: "Toxic to cats and dogs if ingested (calcium oxalates).",
    matureSizeNotes: "Can reach 6-8 ft indoors with distinctive umbrella-like leaflet clusters.",
    sourceCitations: [CITATIONS.ifas, CITATIONS.aspcaToxic]
  }
];
var DISTINGUISHING_TRAITS = {
  "monstera-deliciosa": "Distinguish from Rhaphidophora tetrasperma (Mini Monstera) and Philodendron bipinnatifidum by its very large, thick leaves with BOTH splits (lobes) and interior holes (fenestrations); mature leaves are leathery and can exceed 2 ft. Mini Monstera leaves are far smaller and split only to the edge with no interior holes. Split-leaf philodendrons lack true round fenestrations.",
  "mini-monstera": "Distinguish from true Monstera deliciosa by its much smaller, thinner leaves (usually under 8 in) that split to the margin but rarely form interior holes. The vine is slender and grows very fast. Unlike Monstera adansonii, splits reach the leaf edge rather than forming enclosed oval holes.",
  "tree-philodendron": "Distinguish from Monstera deliciosa by deeply cut, feathery pinnate lobes with NO interior holes, and a self-heading (non-vining) trunk-forming habit. Leaves are matte and paper-thin compared to Monstera's glossy leathery blades.",
  "fiddle-leaf-fig": "Distinguish from rubber plant (Ficus elastica) by large, violin/fiddle-shaped leaves with wavy margins and prominent pale veins; leaves are broadest near the tip. Rubber plant leaves are narrow ovals, smooth-edged, and thicker with a red-tinged new-growth sheath.",
  "snake-plant": "Distinguish from Dracaena/Aloe by stiff, upright sword leaves with horizontal grey-green banding and no central stem; leaves grow directly from the soil in a rosette. Unlike Aloe, leaves are flat and fibrous, not plump and gel-filled.",
  "golden-pothos": "Distinguish from heartleaf philodendron by thicker, slightly waxy leaves with irregular GOLD/yellow variegation and a subtly ridged petiole; new leaves emerge from a sheath-less stem. Philodendron leaves are thinner, matte, more heart-shaped, and emerge from a papery cataphyll.",
  "peace-lily": "Distinguish from Chinese evergreen (Aglaonema) by glossy dark lance leaves rising directly from the soil (no stem) and the signature white spathe flower. Aglaonema usually shows silver/pink leaf patterning and never the pure-white hooded spathe.",
  "zz-plant": "Distinguish from cycads/ferns by thick, glossy, symmetrical paired leaflets along an upright fleshy rachis and a potato-like rhizome at the base. Leaflets are rubbery and uniformly waxy \u2014 no fern-like fronds and no woody trunk.",
  "rubber-plant": "Distinguish from fiddle-leaf fig by thick, glossy, oval leaves with smooth (not wavy) margins and a red-pink sheath protecting new leaves. Fiddle-leaf leaves are much larger, fiddle-shaped, and matte with wavy edges.",
  "pothos-marble-queen": "Distinguish from Manjula/Snow Queen pothos and variegated philodendron by heavy white-and-green marbled streaking with no clean color blocks; leaf is thick and waxy with a grooved petiole. Snow Queen shows more white; Marble Queen keeps more green speckling.",
  "spider-plant": "Distinguish from Dracaena by arching grass-like strappy leaves (often center- or edge-striped cream) and dangling plantlets ('spiderettes') on wiry runners. No woody stem; the plantlets are the unmistakable tell.",
  "chinese-money-plant": "Distinguish from Peperomia by perfectly round, coin-like leaves attached at the CENTER of the blade (peltate) on long petioles. No other common houseplant has this central-attachment round-leaf look.",
  "philodendron-heartleaf": "Distinguish from golden pothos by thinner, matte, truly heart-shaped leaves that emerge bright bronze/red from a papery cataphyll; petiole is round and smooth. Pothos leaves are thicker, waxier, often gold-variegated, with a grooved petiole.",
  "calathea-orbifolia": "Distinguish from other Calathea/Maranta by large round silvery-green leaves with broad pale-and-dark stripe bands; no purple undersides. Leaves are much rounder and larger than medallion or rattlesnake calatheas.",
  "boston-fern": "Distinguish from other ferns by long arching fronds of many small, slightly ruffled pinnae in a dense fountain shape. Unlike maidenhair, pinnae are narrow and sword-like, not fan-shaped on black wiry stems.",
  "aloe-vera": "Distinguish from Haworthia and Agave by thick, plump, gel-filled grey-green leaves with soft white teeth along the margins, arranged in an upright rosette. Haworthia is far smaller with firmer leaves; Agave has rigid, sharply spined leaves.",
  "jade-plant": "Distinguish from other succulents by thick, glossy, oval paddle leaves (often red-edged in sun) on a woody, tree-like branching trunk. The stout bonsai-like trunk sets it apart from rosette succulents.",
  "pothos-neon": "Distinguish from lemon-lime philodendron by uniformly bright chartreuse, thick waxy heart-ish leaves with a grooved petiole and no papery cataphyll. Lemon-lime philodendron leaves are thinner, more elongated-heart, and emerge from a cataphyll.",
  "dracaena-marginata": "Distinguish from other Dracaena by very thin, arching red-edged strappy leaves clustered at the tips of slender, often multi-headed canes. The fine red leaf margin and bare sculptural canes are the tell.",
  "bird-of-paradise": "Distinguish from banana plants by large, stiff, upright paddle leaves on long rigid petioles and (when mature) the crane-shaped orange/blue flower. Banana leaves are softer, tear easily, and lack the rigid fan arrangement.",
  "english-ivy": "Distinguish from other trailing vines by classic 3\u20135 lobed star-shaped leaves on wiry trailing/climbing stems with aerial rootlets. The lobed leaf shape separates it from pothos/philodendron's whole leaves.",
  "peperomia-obtusifolia": "Distinguish from jade plant and Chinese money plant by thick, rounded, cupped leaves attached at the leaf BASE (not center) on upright fleshy stems. Unlike Pilea, the petiole joins at the edge of the blade, not the middle.",
  "anthurium-andraeanum": "Distinguish from peace lily by its glossy, heart-shaped RED (or pink/white) waxy spathe with a straight yellow spadix. Peace lily's spathe is always white and more hooded; Anthurium leaves are stiffer and more heart-shaped.",
  "areca-palm": "Distinguish from kentia and parlor palms by many thin, feathery yellow-green fronds arching from clustered bamboo-like golden canes. Kentia is darker and more upright; parlor palm is far smaller with a single soft crown.",
  "christmas-cactus": "Distinguish from Thanksgiving cactus by flattened, SCALLOP-edged (rounded, toothless) stem segments; Thanksgiving cactus has pointed, claw-like teeth on its segments. Both differ from desert cacti by having no spines and leaf-like pads.",
  "parlor-palm": "Distinguish from areca and kentia palms by its small size, single soft crown of delicate dark-green fronds, and thin reed-like stems. It stays compact and clumping rather than forming tall canes.",
  "african-violet": "Distinguish from gloxinia and other gesneriads by fuzzy, rounded, thick dark-green leaves in a flat rosette with clusters of small 5-petaled purple/pink/white flowers. The velvety leaf texture is the key tell.",
  "orchid-phalaenopsis": "Distinguish from other orchids by broad, flat, leathery strap leaves in a low fan and thick silvery aerial roots, with an arching spray of flat rounded 'moth' flowers. No pseudobulbs, unlike Dendrobium/Cattleya.",
  "succulent-echeveria": "Distinguish from Sempervivum and Graptopetalum by a tight symmetrical rosette of plump, spoon-shaped leaves often with a pastel farina (powdery bloom) and rounded tips. Sempervivum leaves are thinner and pointed with fine marginal hairs.",
  "haworthia": "Distinguish from Aloe by its small size, firm (not gel-plump) dark-green leaves, and translucent 'window' tips or white pearly bands (H. fasciata). Much smaller and denser than any Aloe rosette.",
  "philodendron-brasil": "Distinguish from Golden/Neon pothos by thin, matte, true-heart leaves with an irregular lime-green center stripe on darker green, emerging from a papery cataphyll. Pothos variegation is more speckled/marbled and leaves are thicker and waxier.",
  "croton": "Distinguish from other foliage plants by thick, leathery leaves splashed in bold red, orange, yellow, and green along the veins. No other common houseplant shows this multicolor leathery variegation.",
  "calathea-medallion": "Distinguish from orbifolia and rattlesnake calathea by rounded leaves with a feathered dark-and-light green top pattern and a deep PURPLE underside. The purple reverse plus the medallion 'brushstroke' top pattern are the tells.",
  "money-tree": "Distinguish from schefflera by 5\u20137 glossy leaflets splayed hand-like from a single point atop a characteristically BRAIDED trunk. Schefflera leaflets are thicker/rounder and the trunk is never braided.",
  "ponytail-palm": "Distinguish from true palms and dracaena by a swollen, bulbous water-storing base (caudex) topped with long, thin, curly cascading strap leaves. The onion-like swollen base is unmistakable.",
  "prayer-plant": "Distinguish from Calathea by oval leaves with red herringbone veins that fold UP at night ('praying'); Maranta is lower-growing and trailing. Calathea patterns are bolder and plants are more upright.",
  "philodendron-birkin": "Distinguish from Aglaonema and other variegated aroids by dark-green leaves with fine, crisp WHITE pinstripe lines radiating from the midrib on a compact self-heading plant. The precise thin pinstriping is the tell.",
  "alocasia-polly": "Distinguish from other Alocasia by stiff, arrow/shield-shaped very dark-green leaves with bold white veins and wavy, scalloped edges held upright. The near-metallic dark leaf with sharp white veins and rigid upright posture is the tell.",
  "philodendron-xanadu": "Distinguish from selloum/tree philodendron by a compact, self-heading clump of glossy leaves with 15\u201320 shallow finger-like lobes. Much smaller and denser than selloum, with lobes that are less deeply cut.",
  "fern-maidenhair": "Distinguish from Boston and other ferns by delicate fan-shaped bright-green pinnae on fine, wiry BLACK stems. The black stems plus fan-shaped leaflets are unmistakable versus sword-shaped fern fronds.",
  "hoya-carnosa": "Distinguish from other trailing plants by thick, waxy, succulent-like oval leaves on trailing vines and clusters of star-shaped waxy flowers. Leaves are far thicker/stiffer than pothos or philodendron.",
  "philodendron-pink-princess": "Distinguish from Pink Congo (a temporary chemical treatment) by STABLE dark-green/near-black leaves with true pink variegated blocks and pink-flecked stems. Pink Congo reverts to all green; PPP's pink is permanent and blocky, not uniform.",
  "succulent-string-of-pearls": "Distinguish from string-of-tears/beans by trailing strands of near-spherical pea-like leaves each with a translucent 'window' stripe. String of tears leaves are teardrop-pointed; string of bananas are curved and elongated.",
  "philodendron-selloum": "Distinguish from Xanadu by large, deeply cut, wavy pinnate leaves on a big self-heading plant that develops a trunk with age. Much larger and more deeply lobed than compact Xanadu.",
  "kentia-palm": "Distinguish from areca palm by darker green, wider, more horizontal feathery fronds on fewer, upright single stems. More elegant and upright than the clustering yellow-green areca.",
  "philodendron-congo": "Distinguish from other self-heading philodendrons by large, thick, glossy solid-green (or red, in 'Rojo Congo') paddle leaves on short sturdy stalks forming a dense mound. Leaves are entire (unlobed), unlike selloum/xanadu.",
  "cast-iron-plant": "Distinguish from peace lily by very tough, broad, dark-green lance leaves rising straight from the soil with no flower spathe and near-indestructible thick texture. No white flower and a much stiffer leaf than peace lily.",
  "philodendron-micans": "Distinguish from heartleaf philodendron by its VELVETY matte texture and bronze/purple sheen on the heart-shaped leaves. Standard heartleaf is smooth and glossy green; micans is unmistakably velvety.",
  "swiss-cheese-vine": "Distinguish from Monstera deliciosa by smaller leaves with enclosed OVAL holes (fenestrations) that do NOT reach the leaf edge, on a thin trailing vine. Deliciosa is huge with splits reaching the margin; adansonii holes are interior ovals.",
  "fittonia": "Distinguish from other low foliage by small oval leaves laced with a dense network of bright white, pink, or red veins (nerve plant). The fine contrasting vein netting on a low spreading habit is the tell.",
  "bromeliad-guzmania": "Distinguish from other bromeliads by a rosette of smooth, glossy, strappy green leaves and a long-lasting bright red/orange/yellow flower BRACT spike from the center. Smooth (non-spiny) leaves separate it from Aechmea.",
  "philodendron-lemon-lime": "Distinguish from Neon pothos by thinner, more elongated bright chartreuse heart-shaped leaves emerging from a papery cataphyll on a round smooth petiole. Neon pothos leaves are thicker, waxier, and broader with a grooved petiole.",
  "yucca-cane": "Distinguish from dracaena and ponytail palm by stiff, sword-shaped blue-green leaves with sharp points radiating from thick woody canes. Leaves are rigid and spiky, not soft/arching like dracaena.",
  "philodendron-moonlight": "Distinguish from lemon-lime philodendron by bright neon-yellow NEW growth that matures to lime-green, on a compact self-heading (non-vining) clump. Lemon-lime is a trailing vine; Moonlight stays a mounded clump.",
  "umbrella-plant-schefflera": "Distinguish from money tree by 7\u201311 glossy oval leaflets radiating umbrella-like from each stalk tip on an upright shrub with an unbraided trunk. Money tree has a braided trunk and fewer, larger leaflets."
};
var CITATIONS_EXT = {
  wisconsinHort: { label: "Wisconsin Horticulture Division of Extension", url: "https://hort.extension.wisc.edu/" },
  pennState: { label: "Penn State Extension", url: "https://extension.psu.edu/" },
  ncState: { label: "NC State Extension Gardener Plant Toolbox", url: "https://plants.ces.ncsu.edu/" },
  rhs: { label: "Royal Horticultural Society (RHS) Plant Finder", url: "https://www.rhs.org.uk/plants" },
  pistils: { label: "Pistils Nursery Plant Care Library", url: "https://pistilsnursery.com/blogs/journal" },
  theSill: { label: "The Sill Plant Care Guides", url: "https://www.thesill.com/blogs/care" },
  aroidWiki: { label: "International Aroid Society", url: "https://www.aroid.org/" },
  gardeniaNet: { label: "Gardenia.net Plant Database", url: "https://www.gardenia.net/plants" }
};
var newSeeds = [
  {
    speciesKey: "philodendron-white-knight",
    commonName: "Philodendron White Knight",
    scientificName: "Philodendron erubescens 'White Knight'",
    waterIntervalDaysMin: 7,
    waterIntervalDaysMax: 10,
    waterNotes: "Water when top 1-2 in dry; variegated (white) sections photosynthesize less, so avoid overwatering.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: null,
    feedNotes: "Dilute balanced fertilizer monthly in active growth; skip in winter.",
    lightRequirement: "bright_indirect",
    placementNotes: "Bright indirect light to preserve variegation; a moss pole supports its climbing habit.",
    soilType: "Chunky aroid mix (bark, perlite, coco coir)",
    repotIntervalMonths: 18,
    idealTempMinF: 65,
    idealTempMaxF: 82,
    idealHumidityPct: 60,
    toxicity: "Toxic to cats and dogs if ingested (calcium oxalates).",
    matureSizeNotes: "Climbing; leaves have crisp white variegated blocks and dark, often maroon, stems.",
    distinguishingTraits: "Distinguish from Philodendron White Princess by White Knight's DARK maroon/near-black petioles and stems (White Princess has green stems with pink flecks). Distinguish from White Wizard by White Knight's dark stems (White Wizard has green stems).",
    sourceCitations: [CITATIONS_EXT.aroidWiki, CITATIONS_EXT.pistils, CITATIONS.aspcaToxic],
    researchStatus: "verified"
  },
  {
    speciesKey: "philodendron-white-princess",
    commonName: "Philodendron White Princess",
    scientificName: "Philodendron erubescens 'White Princess'",
    waterIntervalDaysMin: 7,
    waterIntervalDaysMax: 10,
    waterNotes: "Water when top 1-2 in dry; white sections burn easily, keep evenly (not heavily) moist.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: null,
    feedNotes: "Dilute balanced fertilizer monthly during active growth; pause in winter.",
    lightRequirement: "bright_indirect",
    placementNotes: "Bright indirect light to hold variegation; more compact and upright than White Knight.",
    soilType: "Chunky aroid mix (bark, perlite, coco coir)",
    repotIntervalMonths: 18,
    idealTempMinF: 65,
    idealTempMaxF: 82,
    idealHumidityPct: 60,
    toxicity: "Toxic to cats and dogs if ingested (calcium oxalates).",
    matureSizeNotes: "Compact climber; green stems with pink flecks and white-splashed narrow leaves.",
    distinguishingTraits: "Distinguish from White Knight by White Princess's GREEN stems with pink/red flecks (White Knight has dark maroon stems). Leaves are narrower and more elongated than the broader White Wizard.",
    sourceCitations: [CITATIONS_EXT.aroidWiki, CITATIONS_EXT.theSill, CITATIONS.aspcaToxic],
    researchStatus: "verified"
  },
  {
    speciesKey: "philodendron-florida-ghost",
    commonName: "Philodendron Florida Ghost",
    scientificName: "Philodendron 'Florida Ghost'",
    waterIntervalDaysMin: 7,
    waterIntervalDaysMax: 10,
    waterNotes: "Water when top 1-2 in dry; likes consistent moisture with excellent drainage.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: null,
    feedNotes: "Balanced fertilizer monthly in spring/summer; reduce in winter.",
    lightRequirement: "bright_indirect",
    placementNotes: "Bright indirect light; climbing hybrid that benefits from a moss pole.",
    soilType: "Chunky aroid mix (bark, perlite, coco coir)",
    repotIntervalMonths: 18,
    idealTempMinF: 65,
    idealTempMaxF: 85,
    idealHumidityPct: 60,
    toxicity: "Toxic to cats and dogs if ingested (calcium oxalates).",
    matureSizeNotes: "Climber with multi-lobed leaves; new growth emerges near-white ('ghost') and greens with age.",
    distinguishingTraits: "Distinguish from Philodendron pedatum by Florida Ghost's ghostly WHITE/pale-yellow new leaves that darken to green as they harden. The multi-lobed, deeply cut leaf shape separates it from entire-leaved climbers like Brasil or micans.",
    sourceCitations: [CITATIONS_EXT.aroidWiki, CITATIONS_EXT.pistils, CITATIONS.aspcaToxic],
    researchStatus: "verified"
  },
  {
    speciesKey: "philodendron-gloriosum",
    commonName: "Philodendron gloriosum",
    scientificName: "Philodendron gloriosum",
    waterIntervalDaysMin: 7,
    waterIntervalDaysMax: 10,
    waterNotes: "Water when top inch dries; a creeping rhizome type \u2014 keep the rhizome at the soil surface.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: null,
    feedNotes: "Balanced fertilizer monthly in active growth; pause when dormant.",
    lightRequirement: "medium_to_bright_indirect",
    placementNotes: "Bright indirect light; a CRAWLER, not a climber \u2014 plant in a wide, shallow pot.",
    soilType: "Chunky, humus-rich aroid mix",
    repotIntervalMonths: 18,
    idealTempMinF: 65,
    idealTempMaxF: 85,
    idealHumidityPct: 65,
    toxicity: "Toxic to cats and dogs if ingested (calcium oxalates).",
    matureSizeNotes: "Large velvety heart-shaped leaves with bright white/pink veins; creeps horizontally.",
    distinguishingTraits: "Distinguish from Philodendron melanochrysum by gloriosum's broad HEART-shaped velvety leaves (melanochrysum's are long and narrow) and its horizontal creeping rhizome. The bright white contrasting veins on a matte velvet leaf are the tell.",
    sourceCitations: [CITATIONS_EXT.aroidWiki, CITATIONS.moBotGarden, CITATIONS.aspcaToxic],
    researchStatus: "verified"
  },
  {
    speciesKey: "philodendron-melanochrysum",
    commonName: "Philodendron melanochrysum (Black Gold)",
    scientificName: "Philodendron melanochrysum",
    waterIntervalDaysMin: 6,
    waterIntervalDaysMax: 9,
    waterNotes: "Keep evenly moist; sensitive to drying out. Water when the top inch begins to dry.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: null,
    feedNotes: "Balanced fertilizer monthly in spring/summer; pause in winter.",
    lightRequirement: "bright_indirect",
    placementNotes: "Bright indirect light; a climber \u2014 a moss pole yields much larger adult leaves.",
    soilType: "Chunky, moisture-retentive aroid mix",
    repotIntervalMonths: 18,
    idealTempMinF: 65,
    idealTempMaxF: 85,
    idealHumidityPct: 65,
    toxicity: "Toxic to cats and dogs if ingested (calcium oxalates).",
    matureSizeNotes: "Elongating velvety dark-green leaves with golden veins; can exceed 2 ft when climbing.",
    distinguishingTraits: "Distinguish from Philodendron gloriosum by melanochrysum's LONG, narrow, drip-tip velvet leaves and vertical climbing habit (gloriosum is broad-heart and crawls). Distinguish from micans by its much larger, darker, more elongated leaves.",
    sourceCitations: [CITATIONS_EXT.aroidWiki, CITATIONS_EXT.pistils, CITATIONS.aspcaToxic],
    researchStatus: "verified"
  },
  {
    speciesKey: "anthurium-clarinervium",
    commonName: "Anthurium clarinervium",
    scientificName: "Anthurium clarinervium",
    waterIntervalDaysMin: 6,
    waterIntervalDaysMax: 9,
    waterNotes: "Water when top inch dries; wants high humidity and a very airy mix to avoid root rot.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: null,
    feedNotes: "Dilute balanced fertilizer monthly in active growth; reduce in winter.",
    lightRequirement: "bright_indirect",
    placementNotes: "Bright indirect light; an epiphytic 'velvet-leaf' anthurium \u2014 never let it sit wet.",
    soilType: "Very chunky epiphytic mix (bark, perlite, charcoal, sphagnum)",
    repotIntervalMonths: 24,
    idealTempMinF: 65,
    idealTempMaxF: 82,
    idealHumidityPct: 70,
    toxicity: "Toxic to cats and dogs if ingested (calcium oxalates).",
    matureSizeNotes: "Thick, dark, heart-shaped velvet leaves with striking white vein networks.",
    distinguishingTraits: "Distinguish from Anthurium crystallinum by clarinervium's THICKER, more leathery heart-shaped leaves and shorter rounder form (crystallinum leaves are thinner and more elongated). Both differ from flowering A. andraeanum, which is grown for its red spathe, not foliage.",
    sourceCitations: [CITATIONS_EXT.aroidWiki, CITATIONS_EXT.gardeniaNet, CITATIONS.aspcaToxic],
    researchStatus: "verified"
  },
  {
    speciesKey: "anthurium-crystallinum",
    commonName: "Anthurium crystallinum",
    scientificName: "Anthurium crystallinum",
    waterIntervalDaysMin: 6,
    waterIntervalDaysMax: 9,
    waterNotes: "Keep lightly moist in an airy mix; high humidity essential. Water when top inch dries.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: null,
    feedNotes: "Dilute balanced fertilizer monthly during active growth; pause in winter.",
    lightRequirement: "bright_indirect",
    placementNotes: "Bright indirect light and high humidity; epiphytic, needs a chunky airy medium.",
    soilType: "Chunky epiphytic mix (bark, perlite, charcoal, sphagnum)",
    repotIntervalMonths: 24,
    idealTempMinF: 65,
    idealTempMaxF: 82,
    idealHumidityPct: 70,
    toxicity: "Toxic to cats and dogs if ingested (calcium oxalates).",
    matureSizeNotes: "Elongated velvety leaves with brilliant silvery-white veins.",
    distinguishingTraits: "Distinguish from Anthurium clarinervium by crystallinum's THINNER, more elongated heart leaves (clarinervium is thicker and rounder). The silvery crystalline vein sheen is slightly brighter than clarinervium's matte white veins.",
    sourceCitations: [CITATIONS_EXT.aroidWiki, CITATIONS_EXT.gardeniaNet, CITATIONS.aspcaToxic],
    researchStatus: "verified"
  },
  {
    speciesKey: "scindapsus-pictus-exotica",
    commonName: "Scindapsus pictus 'Exotica' (Satin pothos)",
    scientificName: "Scindapsus pictus 'Exotica'",
    waterIntervalDaysMin: 7,
    waterIntervalDaysMax: 11,
    waterNotes: "Water when top 1-2 in dry; leaves matte and thick, fairly drought-tolerant.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: null,
    feedNotes: "Balanced fertilizer monthly in spring/summer; skip in winter.",
    lightRequirement: "medium_to_bright_indirect",
    placementNotes: "Medium to bright indirect light; trailing vine, great for shelves and hanging pots.",
    soilType: "Well-draining aroid/potting mix with perlite",
    repotIntervalMonths: 24,
    idealTempMinF: 65,
    idealTempMaxF: 85,
    idealHumidityPct: 55,
    toxicity: "Toxic to cats and dogs if ingested (calcium oxalates).",
    matureSizeNotes: "Trailing vine with matte, silver-spotted heart leaves; 'Exotica' has large silver patches.",
    distinguishingTraits: "Distinguish from true pothos (Epipremnum) by Scindapsus's MATTE, slightly puckered, asymmetric heart leaves with silvery spots/splashes (pothos leaves are glossy). 'Exotica' has larger silver blotches than the smaller-flecked 'Argyraeus'.",
    sourceCitations: [CITATIONS_EXT.theSill, CITATIONS_EXT.pistils, CITATIONS.aspcaToxic],
    researchStatus: "verified"
  },
  {
    speciesKey: "scindapsus-treubii-moonlight",
    commonName: "Scindapsus treubii 'Moonlight'",
    scientificName: "Scindapsus treubii 'Moonlight'",
    waterIntervalDaysMin: 8,
    waterIntervalDaysMax: 12,
    waterNotes: "Water when top 2 in dry; thick semi-succulent leaves tolerate some drought.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: null,
    feedNotes: "Balanced fertilizer monthly during active growth; pause in winter.",
    lightRequirement: "medium_to_bright_indirect",
    placementNotes: "Medium to bright indirect light; slow-growing trailing/climbing vine.",
    soilType: "Well-draining aroid mix with perlite",
    repotIntervalMonths: 24,
    idealTempMinF: 65,
    idealTempMaxF: 85,
    idealHumidityPct: 55,
    toxicity: "Toxic to cats and dogs if ingested (calcium oxalates).",
    matureSizeNotes: "Thick, shimmery silver-green pointed leaves on a slow trailing vine.",
    distinguishingTraits: "Distinguish from Scindapsus pictus by treubii 'Moonlight's' near-solid SILVERY-SHEEN pointed leaves (pictus is spotted/blotched). Distinguish from the dark 'Dark Form' treubii, which is near-black rather than silvery.",
    sourceCitations: [CITATIONS_EXT.pistils, CITATIONS_EXT.gardeniaNet, CITATIONS.aspcaToxic],
    researchStatus: "verified"
  },
  {
    speciesKey: "syngonium-albo-variegatum",
    commonName: "Syngonium 'Albo Variegatum'",
    scientificName: "Syngonium podophyllum 'Albo Variegatum'",
    waterIntervalDaysMin: 6,
    waterIntervalDaysMax: 9,
    waterNotes: "Keep lightly moist; water when top inch dries. White sections need careful (not soggy) watering.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: null,
    feedNotes: "Dilute balanced fertilizer monthly in active growth; pause in winter.",
    lightRequirement: "bright_indirect",
    placementNotes: "Bright indirect light to keep the white blocks; fast-growing, pinch to keep bushy.",
    soilType: "Well-draining aroid mix with perlite",
    repotIntervalMonths: 18,
    idealTempMinF: 65,
    idealTempMaxF: 85,
    idealHumidityPct: 60,
    toxicity: "Toxic to cats and dogs if ingested (calcium oxalates).",
    matureSizeNotes: "Arrowhead leaves splashed with pure-white variegated blocks; vining with age.",
    distinguishingTraits: "Distinguish from Syngonium 'Albo' by its blocky pure-WHITE (not pink) sectoral variegation on arrowhead leaves. Distinguish from Syngonium 'Pink' varieties, which are pink-mottled rather than white-blocked.",
    sourceCitations: [CITATIONS.ncsuToolbox, CITATIONS_EXT.pistils, CITATIONS.aspcaToxic],
    researchStatus: "verified"
  },
  {
    speciesKey: "syngonium-pink-neon",
    commonName: "Syngonium 'Neon Robusta' (Pink arrowhead)",
    scientificName: "Syngonium podophyllum 'Neon Robusta'",
    waterIntervalDaysMin: 5,
    waterIntervalDaysMax: 8,
    waterNotes: "Likes consistent moisture; water when the top inch dries. Wilts quickly if too dry.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: null,
    feedNotes: "Balanced fertilizer monthly in active growth; reduce in winter.",
    lightRequirement: "medium_to_bright_indirect",
    placementNotes: "Medium to bright indirect light; brighter light deepens the pink tone.",
    soilType: "Well-draining potting mix with perlite",
    repotIntervalMonths: 18,
    idealTempMinF: 65,
    idealTempMaxF: 85,
    idealHumidityPct: 55,
    toxicity: "Toxic to cats and dogs if ingested (calcium oxalates).",
    matureSizeNotes: "Soft pink arrowhead leaves maturing greener; compact then vining.",
    distinguishingTraits: "Distinguish from variegated Syngonium 'Albo' by 'Neon Robusta's' uniform soft-PINK leaves (not white blocks). Distinguish from Caladium by Syngonium's arrowhead leaf shape and vining habit versus Caladium's larger heart leaves and dormant tuber.",
    sourceCitations: [CITATIONS.ncsuToolbox, CITATIONS_EXT.theSill, CITATIONS.aspcaToxic],
    researchStatus: "verified"
  },
  {
    speciesKey: "hoya-kerrii",
    commonName: "Hoya kerrii (Sweetheart hoya)",
    scientificName: "Hoya kerrii",
    waterIntervalDaysMin: 12,
    waterIntervalDaysMax: 18,
    waterNotes: "Succulent leaves store water \u2014 let soil dry well between waterings; overwatering rots single-leaf cuttings.",
    feedIntervalDaysActive: 45,
    feedIntervalDaysDormant: null,
    feedNotes: "Dilute fertilizer every 6-8 weeks in growing season; skip in winter.",
    lightRequirement: "bright_indirect",
    placementNotes: "Bright indirect light; a single-leaf 'heart' cutting rarely vines \u2014 a rooted plant will.",
    soilType: "Very well-draining succulent/cactus mix with bark",
    repotIntervalMonths: 36,
    idealTempMinF: 60,
    idealTempMaxF: 85,
    idealHumidityPct: 45,
    toxicity: "Generally considered non-toxic to cats and dogs.",
    matureSizeNotes: "Thick heart-shaped succulent leaves; slow to vine.",
    distinguishingTraits: "Distinguish from other Hoyas by kerrii's thick, flat, HEART-shaped succulent leaves (often sold as a single potted 'heart' leaf). No other common Hoya has the heart leaf; H. carnosa leaves are oval.",
    sourceCitations: [CITATIONS_EXT.gardeniaNet, CITATIONS_EXT.pistils, CITATIONS.aspcaToxic],
    researchStatus: "verified"
  },
  {
    speciesKey: "hoya-pubicalyx",
    commonName: "Hoya pubicalyx",
    scientificName: "Hoya pubicalyx",
    waterIntervalDaysMin: 10,
    waterIntervalDaysMax: 16,
    waterNotes: "Let dry substantially between waterings; semi-succulent leaves tolerate drought.",
    feedIntervalDaysActive: 45,
    feedIntervalDaysDormant: null,
    feedNotes: "Dilute fertilizer every 6-8 weeks in active growth; pause in winter.",
    lightRequirement: "bright_indirect",
    placementNotes: "Bright indirect light encourages the star-shaped flower umbels; a vigorous vine.",
    soilType: "Well-draining mix with bark and perlite",
    repotIntervalMonths: 36,
    idealTempMinF: 60,
    idealTempMaxF: 85,
    idealHumidityPct: 50,
    toxicity: "Generally considered non-toxic to cats and dogs.",
    matureSizeNotes: "Fast climbing/trailing vine; often silver-flecked leaves, dusky-pink flower clusters.",
    distinguishingTraits: "Distinguish from Hoya carnosa by pubicalyx's longer, more pointed, often silver-SPLASHED leaves and faster vining (carnosa leaves are rounder and plainer). Flowers are darker dusky-pink to near-black versus carnosa's pale pink.",
    sourceCitations: [CITATIONS_EXT.gardeniaNet, CITATIONS_EXT.pistils, CITATIONS.aspcaToxic],
    researchStatus: "verified"
  },
  {
    speciesKey: "hoya-linearis",
    commonName: "Hoya linearis",
    scientificName: "Hoya linearis",
    waterIntervalDaysMin: 7,
    waterIntervalDaysMax: 11,
    waterNotes: "Thinner leaves than most Hoya \u2014 do not let it dry out completely; water when top inch dries.",
    feedIntervalDaysActive: 45,
    feedIntervalDaysDormant: null,
    feedNotes: "Dilute fertilizer every 6-8 weeks in active growth; skip in winter.",
    lightRequirement: "bright_indirect",
    placementNotes: "Bright indirect light; a cascading hanging-basket Hoya, wants good humidity.",
    soilType: "Airy, well-draining mix with bark and perlite",
    repotIntervalMonths: 36,
    idealTempMinF: 55,
    idealTempMaxF: 80,
    idealHumidityPct: 55,
    toxicity: "Generally considered non-toxic to cats and dogs.",
    matureSizeNotes: "Long curtains of fine, soft, needle-like trailing foliage.",
    distinguishingTraits: "Distinguish from string-of-pearls by linearis's soft, fuzzy, LINEAR needle leaves in dense hanging strands (string-of-pearls are round beads). Unlike other Hoyas, leaves are thin and grass-like rather than thick ovals.",
    sourceCitations: [CITATIONS_EXT.gardeniaNet, CITATIONS_EXT.pistils, CITATIONS.aspcaToxic],
    researchStatus: "verified"
  },
  {
    speciesKey: "alocasia-frydek",
    commonName: "Alocasia 'Green Velvet' (Frydek)",
    scientificName: "Alocasia micholitziana 'Frydek'",
    waterIntervalDaysMin: 5,
    waterIntervalDaysMax: 8,
    waterNotes: "Keep consistently moist (not soggy) in an airy mix; sensitive to both drought and overwatering.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: 60,
    feedNotes: "Balanced fertilizer monthly in active growth; may go dormant in winter \u2014 reduce feeding.",
    lightRequirement: "bright_indirect",
    placementNotes: "Bright indirect light and high humidity; can drop leaves/go dormant if stressed.",
    soilType: "Chunky, airy aroid mix",
    repotIntervalMonths: 18,
    idealTempMinF: 65,
    idealTempMaxF: 82,
    idealHumidityPct: 65,
    toxicity: "Toxic to cats and dogs if ingested (calcium oxalates).",
    matureSizeNotes: "Velvety dark-green arrow leaves with bold white veins, upright.",
    distinguishingTraits: "Distinguish from Alocasia 'Polly'/Amazonica by Frydek's soft VELVETY matte leaf surface (Polly is glossy and hard with wavy scalloped edges). Frydek leaves are narrower arrowheads with a plush texture.",
    sourceCitations: [CITATIONS_EXT.aroidWiki, CITATIONS_EXT.gardeniaNet, CITATIONS.aspcaToxic],
    researchStatus: "verified"
  },
  {
    speciesKey: "alocasia-zebrina",
    commonName: "Alocasia zebrina",
    scientificName: "Alocasia zebrina",
    waterIntervalDaysMin: 6,
    waterIntervalDaysMax: 9,
    waterNotes: "Water when top inch dries; keep evenly moist in growing season, drier in winter dormancy.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: 60,
    feedNotes: "Balanced fertilizer monthly spring-summer; taper as it slows in winter.",
    lightRequirement: "bright_indirect",
    placementNotes: "Bright indirect light; prized for its striped petioles \u2014 give it room to hold tall stems.",
    soilType: "Chunky, airy aroid mix",
    repotIntervalMonths: 18,
    idealTempMinF: 65,
    idealTempMaxF: 82,
    idealHumidityPct: 60,
    toxicity: "Toxic to cats and dogs if ingested (calcium oxalates).",
    matureSizeNotes: "Arrow-shaped leaves on tall yellow-and-black ZEBRA-striped petioles.",
    distinguishingTraits: "Distinguish from other Alocasia by zebrina's signature yellow-and-black ZEBRA-striped petioles (stems) topped with plain arrow leaves. The striped stems, not the leaf, are the identifier.",
    sourceCitations: [CITATIONS_EXT.aroidWiki, CITATIONS_EXT.gardeniaNet, CITATIONS.aspcaToxic],
    researchStatus: "verified"
  },
  {
    speciesKey: "philodendron-verrucosum",
    commonName: "Philodendron verrucosum",
    scientificName: "Philodendron verrucosum",
    waterIntervalDaysMin: 6,
    waterIntervalDaysMax: 9,
    waterNotes: "Keep evenly moist in a very airy mix; high humidity lover. Water when top inch dries.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: null,
    feedNotes: "Dilute balanced fertilizer monthly in active growth; pause in winter.",
    lightRequirement: "bright_indirect",
    placementNotes: "Bright indirect light, high humidity; a climber \u2014 moss pole yields big velvet leaves.",
    soilType: "Very chunky, humus-rich aroid mix",
    repotIntervalMonths: 18,
    idealTempMinF: 65,
    idealTempMaxF: 82,
    idealHumidityPct: 70,
    toxicity: "Toxic to cats and dogs if ingested (calcium oxalates).",
    matureSizeNotes: "Heart-shaped emerald velvet leaves with pale veins and hairy ('verrucose') petioles.",
    distinguishingTraits: "Distinguish from Philodendron gloriosum by verrucosum's climbing habit and its distinctive HAIRY/bristly petioles (gloriosum crawls and has smooth petioles). Leaf undersides often flush red.",
    sourceCitations: [CITATIONS_EXT.aroidWiki, CITATIONS_EXT.gardeniaNet, CITATIONS.aspcaToxic],
    researchStatus: "verified"
  },
  {
    speciesKey: "monstera-deliciosa-thai-constellation",
    commonName: "Monstera 'Thai Constellation'",
    scientificName: "Monstera deliciosa 'Thai Constellation'",
    waterIntervalDaysMin: 7,
    waterIntervalDaysMax: 10,
    waterNotes: "Water when top 1-2 in dry; creamy sections photosynthesize less, so avoid overwatering.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: null,
    feedNotes: "Balanced fertilizer monthly in spring/summer; skip in winter.",
    lightRequirement: "bright_indirect",
    placementNotes: "Bright indirect light to support the variegation; give a moss pole as it matures.",
    soilType: "Chunky, well-draining aroid mix",
    repotIntervalMonths: 24,
    idealTempMinF: 65,
    idealTempMaxF: 85,
    idealHumidityPct: 60,
    toxicity: "Toxic to cats and dogs if ingested (calcium oxalates).",
    matureSizeNotes: "Fenestrated Monstera leaves speckled with creamy-yellow 'constellation' variegation.",
    distinguishingTraits: "Distinguish from Monstera 'Albo Variegata' by Thai Constellation's SPECKLED/marbled creamy-yellow variegation spread evenly (Albo has sharp white sectoral blocks and reverts more readily). Thai is a stable tissue-cultured cultivar with a warmer cream tone.",
    sourceCitations: [CITATIONS_EXT.aroidWiki, CITATIONS_EXT.pistils, CITATIONS.aspcaToxic],
    researchStatus: "verified"
  },
  {
    speciesKey: "monstera-albo-variegata",
    commonName: "Monstera 'Albo Variegata'",
    scientificName: "Monstera deliciosa 'Albo Variegata'",
    waterIntervalDaysMin: 7,
    waterIntervalDaysMax: 10,
    waterNotes: "Water when top 1-2 in dry; pure-white sections burn and can't photosynthesize \u2014 water carefully.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: null,
    feedNotes: "Balanced fertilizer monthly in spring/summer; skip in winter.",
    lightRequirement: "bright_indirect",
    placementNotes: "Bright indirect light; protect white areas from direct sun. Give a moss pole.",
    soilType: "Chunky, well-draining aroid mix",
    repotIntervalMonths: 24,
    idealTempMinF: 65,
    idealTempMaxF: 85,
    idealHumidityPct: 60,
    toxicity: "Toxic to cats and dogs if ingested (calcium oxalates).",
    matureSizeNotes: "Fenestrated leaves with crisp pure-white sectoral variegation; can revert.",
    distinguishingTraits: "Distinguish from Thai Constellation by Albo's crisp pure-WHITE sectoral blocks/half-moons (Thai is creamy speckled). Albo is a propagated cutting line (unstable, can revert) rather than a stable tissue culture.",
    sourceCitations: [CITATIONS_EXT.aroidWiki, CITATIONS_EXT.pistils, CITATIONS.aspcaToxic],
    researchStatus: "verified"
  },
  {
    speciesKey: "calathea-white-fusion",
    commonName: "Calathea 'White Fusion'",
    scientificName: "Goeppertia lietzei 'White Fusion'",
    waterIntervalDaysMin: 5,
    waterIntervalDaysMax: 8,
    waterNotes: "Keep consistently moist with distilled/rain water; very sensitive to tap-water minerals and drying out.",
    feedIntervalDaysActive: 45,
    feedIntervalDaysDormant: null,
    feedNotes: "Dilute fertilizer every 6 weeks in growing season; sensitive to fertilizer burn.",
    lightRequirement: "medium_indirect",
    placementNotes: "Medium indirect light and high humidity; a fussy variegate \u2014 avoid drafts and dry air.",
    soilType: "Moisture-retentive, airy mix",
    repotIntervalMonths: 18,
    idealTempMinF: 65,
    idealTempMaxF: 80,
    idealHumidityPct: 70,
    toxicity: "Non-toxic to cats and dogs.",
    matureSizeNotes: "Green-and-white variegated leaves with purple undersides.",
    distinguishingTraits: "Distinguish from other Calathea by White Fusion's irregular WHITE marbled variegation over green with lilac-purple leaf undersides (most calatheas lack white variegation). Its fussiness and variegation set it apart from medallion or orbifolia.",
    sourceCitations: [CITATIONS_EXT.gardeniaNet, CITATIONS.ncsuToolbox, CITATIONS.aspcaToxic],
    researchStatus: "verified"
  },
  {
    speciesKey: "calathea-rattlesnake",
    commonName: "Rattlesnake plant",
    scientificName: "Goeppertia insignis (Calathea lancifolia)",
    waterIntervalDaysMin: 6,
    waterIntervalDaysMax: 9,
    waterNotes: "Keep evenly moist with filtered water; browning edges signal mineral buildup or dryness.",
    feedIntervalDaysActive: 45,
    feedIntervalDaysDormant: null,
    feedNotes: "Dilute fertilizer every 6 weeks in active growth; pause in winter.",
    lightRequirement: "medium_indirect",
    placementNotes: "Medium indirect light and good humidity; leaves fold up at night.",
    soilType: "Moisture-retentive, airy mix",
    repotIntervalMonths: 18,
    idealTempMinF: 65,
    idealTempMaxF: 80,
    idealHumidityPct: 60,
    toxicity: "Non-toxic to cats and dogs.",
    matureSizeNotes: "Long, wavy-edged lance leaves with alternating dark spots and deep-red undersides.",
    distinguishingTraits: "Distinguish from Calathea medallion/orbifolia by rattlesnake's long, narrow, WAVY-edged lance leaves with alternating small/large dark blotches and burgundy undersides. The elongated wavy leaf is unlike the round medallion/orbifolia leaves.",
    sourceCitations: [CITATIONS.ncsuToolbox, CITATIONS_EXT.gardeniaNet, CITATIONS.aspcaToxic],
    researchStatus: "verified"
  },
  {
    speciesKey: "stromanthe-triostar",
    commonName: "Stromanthe 'Triostar'",
    scientificName: "Stromanthe sanguinea 'Triostar'",
    waterIntervalDaysMin: 5,
    waterIntervalDaysMax: 8,
    waterNotes: "Keep consistently moist with filtered water; sensitive to drying out and to tap-water salts.",
    feedIntervalDaysActive: 45,
    feedIntervalDaysDormant: null,
    feedNotes: "Dilute fertilizer every 6 weeks in growing season; reduce in winter.",
    lightRequirement: "medium_to_bright_indirect",
    placementNotes: "Bright indirect light brings out pink tones; high humidity; a prayer-plant relative.",
    soilType: "Moisture-retentive, airy mix",
    repotIntervalMonths: 18,
    idealTempMinF: 65,
    idealTempMaxF: 80,
    idealHumidityPct: 65,
    toxicity: "Non-toxic to cats and dogs.",
    matureSizeNotes: "Variegated green/cream leaves with striking pink-and-maroon undersides.",
    distinguishingTraits: "Distinguish from Calathea/Maranta by Triostar's bold cream-and-green top variegation with vivid PINK and deep-maroon undersides (most prayer plants lack the pink reverse). It flashes pink undersides as leaves move.",
    sourceCitations: [CITATIONS_EXT.gardeniaNet, CITATIONS.ncsuToolbox, CITATIONS.aspcaToxic],
    researchStatus: "verified"
  },
  {
    speciesKey: "peperomia-watermelon",
    commonName: "Watermelon peperomia",
    scientificName: "Peperomia argyreia",
    waterIntervalDaysMin: 8,
    waterIntervalDaysMax: 12,
    waterNotes: "Let top 1-2 in dry; thick leaves store water, so avoid overwatering and rot.",
    feedIntervalDaysActive: 45,
    feedIntervalDaysDormant: null,
    feedNotes: "Dilute fertilizer every 6-8 weeks in growing season; skip in winter.",
    lightRequirement: "medium_to_bright_indirect",
    placementNotes: "Medium to bright indirect light; compact, great for desks and shelves.",
    soilType: "Well-draining, airy mix with perlite",
    repotIntervalMonths: 24,
    idealTempMinF: 60,
    idealTempMaxF: 80,
    idealHumidityPct: 50,
    toxicity: "Non-toxic to cats and dogs.",
    matureSizeNotes: "Round, teardrop leaves striped silver-and-green like a watermelon rind, on red stems.",
    distinguishingTraits: "Distinguish from Chinese money plant (Pilea) by watermelon peperomia's teardrop leaves attached at the EDGE (not center) with silver-and-green watermelon striping. Pilea leaves are plain round and center-attached.",
    sourceCitations: [CITATIONS.ncsuToolbox, CITATIONS_EXT.theSill, CITATIONS.aspcaToxic],
    researchStatus: "verified"
  },
  {
    speciesKey: "peperomia-hope",
    commonName: "Peperomia 'Hope'",
    scientificName: "Peperomia tetraphylla 'Hope'",
    waterIntervalDaysMin: 9,
    waterIntervalDaysMax: 14,
    waterNotes: "Semi-succulent \u2014 let dry well between waterings; overwatering causes stem rot.",
    feedIntervalDaysActive: 45,
    feedIntervalDaysDormant: null,
    feedNotes: "Dilute fertilizer every 6-8 weeks in growing season; pause in winter.",
    lightRequirement: "medium_to_bright_indirect",
    placementNotes: "Medium to bright indirect light; trailing, good for hanging pots.",
    soilType: "Well-draining, airy mix with perlite",
    repotIntervalMonths: 24,
    idealTempMinF: 60,
    idealTempMaxF: 80,
    idealHumidityPct: 45,
    toxicity: "Non-toxic to cats and dogs.",
    matureSizeNotes: "Trailing stems with small, round, thick coin-like leaves in whorls.",
    distinguishingTraits: "Distinguish from string-of-turtles by 'Hope's' plain, thick, round green coin leaves in whorls of 3-4 (string-of-turtles leaves are small and patterned). Fleshier and more upright-trailing than the flat-leaved turtles.",
    sourceCitations: [CITATIONS_EXT.theSill, CITATIONS_EXT.gardeniaNet, CITATIONS.aspcaToxic],
    researchStatus: "verified"
  },
  {
    speciesKey: "peperomia-string-of-turtles",
    commonName: "String of turtles",
    scientificName: "Peperomia prostrata",
    waterIntervalDaysMin: 8,
    waterIntervalDaysMax: 12,
    waterNotes: "Let top layer dry; small succulent leaves are prone to rot if kept wet.",
    feedIntervalDaysActive: 45,
    feedIntervalDaysDormant: null,
    feedNotes: "Dilute fertilizer every 6-8 weeks in growing season; skip in winter.",
    lightRequirement: "medium_to_bright_indirect",
    placementNotes: "Bright indirect light keeps the pattern crisp; delicate trailing vine.",
    soilType: "Well-draining, airy mix with perlite",
    repotIntervalMonths: 24,
    idealTempMinF: 60,
    idealTempMaxF: 80,
    idealHumidityPct: 55,
    toxicity: "Non-toxic to cats and dogs.",
    matureSizeNotes: "Tiny round leaves patterned like turtle shells on fine trailing strands.",
    distinguishingTraits: "Distinguish from Peperomia 'Hope' by string-of-turtles' tiny, flat, intricately turtle-shell-PATTERNED leaves (Hope leaves are plain, thick, larger). Much finer and more delicate than any other trailing peperomia.",
    sourceCitations: [CITATIONS_EXT.gardeniaNet, CITATIONS_EXT.theSill, CITATIONS.aspcaToxic],
    researchStatus: "verified"
  },
  {
    speciesKey: "begonia-maculata",
    commonName: "Polka dot begonia",
    scientificName: "Begonia maculata 'Wightii'",
    waterIntervalDaysMin: 6,
    waterIntervalDaysMax: 9,
    waterNotes: "Keep lightly moist; water when top inch dries. Avoid wetting leaves to prevent powdery mildew.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: null,
    feedNotes: "Balanced fertilizer every 3-4 weeks in growing season; pause in winter.",
    lightRequirement: "bright_indirect",
    placementNotes: "Bright indirect light; cane-type begonia, benefits from good airflow.",
    soilType: "Well-draining, airy mix",
    repotIntervalMonths: 18,
    idealTempMinF: 62,
    idealTempMaxF: 80,
    idealHumidityPct: 55,
    toxicity: "Toxic to cats and dogs if ingested (soluble calcium oxalates).",
    matureSizeNotes: "Angel-wing leaves, olive-green with silver POLKA DOTS and deep-red undersides.",
    distinguishingTraits: "Distinguish from other cane begonias by maculata's asymmetric angel-wing leaves covered in evenly spaced SILVER polka dots over olive green, with red undersides. The regular silver spotting is the unmistakable tell.",
    sourceCitations: [CITATIONS.ncsuToolbox, CITATIONS_EXT.gardeniaNet, CITATIONS.aspcaToxic],
    researchStatus: "verified"
  },
  {
    speciesKey: "philodendron-mican-lime",
    commonName: "Philodendron 'Painted Lady'",
    scientificName: "Philodendron erubescens 'Painted Lady'",
    waterIntervalDaysMin: 7,
    waterIntervalDaysMax: 10,
    waterNotes: "Water when top 1-2 in dry; steady moisture in growing season.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: null,
    feedNotes: "Balanced fertilizer monthly in active growth; reduce in winter.",
    lightRequirement: "bright_indirect",
    placementNotes: "Bright indirect light brings out the yellow tones; a moderate climber.",
    soilType: "Chunky aroid mix (bark, perlite, coco coir)",
    repotIntervalMonths: 18,
    idealTempMinF: 65,
    idealTempMaxF: 85,
    idealHumidityPct: 60,
    toxicity: "Toxic to cats and dogs if ingested (calcium oxalates).",
    matureSizeNotes: "Chartreuse-yellow young leaves maturing green, on pink-speckled petioles.",
    distinguishingTraits: "Distinguish from 'Lemon Lime' and 'Moonlight' philodendrons by Painted Lady's mottled yellow-green NEW leaves held on distinctive PINK-speckled petioles (the others have plain green/yellow petioles). The pink stems plus mottled new growth are the tell.",
    sourceCitations: [CITATIONS_EXT.aroidWiki, CITATIONS_EXT.gardeniaNet, CITATIONS.aspcaToxic],
    researchStatus: "verified"
  },
  {
    speciesKey: "rhaphidophora-decursiva",
    commonName: "Rhaphidophora decursiva",
    scientificName: "Rhaphidophora decursiva",
    waterIntervalDaysMin: 6,
    waterIntervalDaysMax: 9,
    waterNotes: "Keep lightly moist; water when top inch dries. Vigorous grower in warmth.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: null,
    feedNotes: "Balanced fertilizer monthly in active growth; pause in winter.",
    lightRequirement: "bright_indirect",
    placementNotes: "Bright indirect light; a large climber \u2014 needs a sturdy moss pole for mature split leaves.",
    soilType: "Chunky aroid mix (bark, perlite, coco coir)",
    repotIntervalMonths: 18,
    idealTempMinF: 65,
    idealTempMaxF: 85,
    idealHumidityPct: 60,
    toxicity: "Toxic to cats and dogs if ingested (calcium oxalates).",
    matureSizeNotes: "Juvenile leaves entire; mature leaves deeply pinnately split, resembling Monstera.",
    distinguishingTraits: "Distinguish from Monstera deliciosa by decursiva's leaves splitting into deep, narrow FEATHER-like pinnae all the way to the midrib with no interior holes (Monstera has both splits and round holes). Distinguish from Rhaphidophora tetrasperma by decursiva's much larger, more deeply divided mature leaves.",
    sourceCitations: [CITATIONS_EXT.aroidWiki, CITATIONS_EXT.gardeniaNet, CITATIONS.aspcaToxic],
    researchStatus: "verified"
  },
  {
    speciesKey: "philodendron-prince-of-orange",
    commonName: "Philodendron 'Prince of Orange'",
    scientificName: "Philodendron 'Prince of Orange'",
    waterIntervalDaysMin: 7,
    waterIntervalDaysMax: 10,
    waterNotes: "Water when top 1-2 in dry; consistent moisture in growing season.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: null,
    feedNotes: "Balanced fertilizer monthly in active growth; reduce in winter.",
    lightRequirement: "bright_indirect",
    placementNotes: "Bright indirect light intensifies the orange new growth; a compact self-header.",
    soilType: "Chunky aroid mix (bark, perlite, coco coir)",
    repotIntervalMonths: 18,
    idealTempMinF: 65,
    idealTempMaxF: 85,
    idealHumidityPct: 55,
    toxicity: "Toxic to cats and dogs if ingested (calcium oxalates).",
    matureSizeNotes: "Self-heading clump; new leaves emerge bright orange, aging to green.",
    distinguishingTraits: "Distinguish from Philodendron 'McColley's Finale' by Prince of Orange's leaves emerging bright ORANGE and fading to green (McColley's emerge red). A self-heading clump, unlike the vining Painted Lady or Brasil.",
    sourceCitations: [CITATIONS_EXT.aroidWiki, CITATIONS.costaFarms, CITATIONS.aspcaToxic],
    researchStatus: "verified"
  },
  {
    speciesKey: "aglaonema-red-siam",
    commonName: "Aglaonema 'Siam Aurora' (Red)",
    scientificName: "Aglaonema commutatum 'Siam Aurora'",
    waterIntervalDaysMin: 8,
    waterIntervalDaysMax: 12,
    waterNotes: "Let top 1-2 in dry; tolerant of occasional dryness, sensitive to soggy soil.",
    feedIntervalDaysActive: 45,
    feedIntervalDaysDormant: null,
    feedNotes: "Balanced fertilizer every 6 weeks in growing season; skip in winter.",
    lightRequirement: "low_to_medium_indirect",
    placementNotes: "Tolerates low-medium light, but red coloring is stronger in brighter indirect light.",
    soilType: "Well-draining potting mix",
    repotIntervalMonths: 24,
    idealTempMinF: 65,
    idealTempMaxF: 85,
    idealHumidityPct: 50,
    toxicity: "Toxic to cats and dogs if ingested (calcium oxalates).",
    matureSizeNotes: "Green leaves edged and veined in bright pink-red; compact.",
    distinguishingTraits: "Distinguish from Croton by Aglaonema's soft, thin lance leaves with pink-RED margins/veins on green (Croton leaves are thick, leathery, multicolored). Distinguish from peace lily by the red coloration and lack of white spathe.",
    sourceCitations: [CITATIONS.ncsuToolbox, CITATIONS.costaFarms, CITATIONS.aspcaToxic],
    researchStatus: "verified"
  },
  {
    speciesKey: "ficus-audrey",
    commonName: "Ficus Audrey",
    scientificName: "Ficus benghalensis",
    waterIntervalDaysMin: 7,
    waterIntervalDaysMax: 11,
    waterNotes: "Water when top 1-2 in dry; dislikes both drought stress and soggy roots.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: 60,
    feedNotes: "Balanced fertilizer monthly spring-summer; every other month in winter.",
    lightRequirement: "bright_indirect",
    placementNotes: "Bright indirect light, some direct sun tolerated; rotate for even growth.",
    soilType: "Well-draining potting mix",
    repotIntervalMonths: 24,
    idealTempMinF: 60,
    idealTempMaxF: 85,
    idealHumidityPct: 45,
    toxicity: "Toxic to cats and dogs if ingested (sap irritation).",
    matureSizeNotes: "Upright tree with fuzzy, matte, oval sage-green leaves and pale veins.",
    distinguishingTraits: "Distinguish from rubber plant (Ficus elastica) by Audrey's MATTE, fuzzy, sage-green oval leaves with prominent pale veins (elastica leaves are glossy and darker). Distinguish from fiddle-leaf fig by Audrey's smaller, non-fiddle, softer-textured leaves.",
    sourceCitations: [CITATIONS.ncsuToolbox, CITATIONS_EXT.theSill, CITATIONS.aspcaToxic],
    researchStatus: "verified"
  },
  {
    speciesKey: "hoya-obovata",
    commonName: "Hoya obovata",
    scientificName: "Hoya obovata",
    waterIntervalDaysMin: 12,
    waterIntervalDaysMax: 18,
    waterNotes: "Thick succulent leaves store water \u2014 let dry well between waterings.",
    feedIntervalDaysActive: 45,
    feedIntervalDaysDormant: null,
    feedNotes: "Dilute fertilizer every 6-8 weeks in growing season; skip in winter.",
    lightRequirement: "bright_indirect",
    placementNotes: "Bright indirect light encourages blooming; a vigorous vine or hanging plant.",
    soilType: "Very well-draining mix with bark and perlite",
    repotIntervalMonths: 36,
    idealTempMinF: 60,
    idealTempMaxF: 85,
    idealHumidityPct: 50,
    toxicity: "Generally considered non-toxic to cats and dogs.",
    matureSizeNotes: "Large, round, thick leaves often silver-flecked; ball-shaped pink flower umbels.",
    distinguishingTraits: "Distinguish from Hoya carnosa/kerrii by obovata's large, ROUND (obovate) thick leaves, often heavily silver-speckled (carnosa leaves are oval; kerrii are heart-shaped). The big coin-round leaf is the tell.",
    sourceCitations: [CITATIONS_EXT.gardeniaNet, CITATIONS_EXT.pistils, CITATIONS.aspcaToxic],
    researchStatus: "verified"
  },
  {
    speciesKey: "dieffenbachia-camille",
    commonName: "Dumb cane 'Camille'",
    scientificName: "Dieffenbachia 'Camille'",
    waterIntervalDaysMin: 7,
    waterIntervalDaysMax: 10,
    waterNotes: "Water when top 1-2 in dry; keep moderately moist in growing season.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: 60,
    feedNotes: "Balanced fertilizer monthly spring-summer; every other month in winter.",
    lightRequirement: "medium_to_bright_indirect",
    placementNotes: "Medium to bright indirect light; keep out of direct sun to avoid leaf scorch.",
    soilType: "Well-draining potting mix",
    repotIntervalMonths: 24,
    idealTempMinF: 62,
    idealTempMaxF: 85,
    idealHumidityPct: 55,
    toxicity: "Toxic to cats, dogs, and humans if ingested (calcium oxalates cause mouth swelling).",
    matureSizeNotes: "Upright canes; leaves creamy-yellow centered with green margins.",
    distinguishingTraits: "Distinguish from Aglaonema by Dieffenbachia 'Camille's' larger leaves with a broad creamy-YELLOW center and thin green margin on thick upright canes (Aglaonema patterning is finer and silvery/red). The bold pale center is the tell.",
    sourceCitations: [CITATIONS.ncsuToolbox, CITATIONS.costaFarms, CITATIONS.aspcaToxic],
    researchStatus: "verified"
  },
  {
    speciesKey: "tradescantia-nanouk",
    commonName: "Tradescantia 'Nanouk'",
    scientificName: "Tradescantia albiflora 'Nanouk'",
    waterIntervalDaysMin: 5,
    waterIntervalDaysMax: 8,
    waterNotes: "Keep lightly moist; water when top inch dries. Fast grower, wilts if too dry.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: null,
    feedNotes: "Balanced fertilizer every 3-4 weeks in growing season; pause in winter.",
    lightRequirement: "bright_indirect",
    placementNotes: "Bright indirect light keeps the pink vivid; pinch to keep it full, great trailing.",
    soilType: "Well-draining potting mix",
    repotIntervalMonths: 18,
    idealTempMinF: 60,
    idealTempMaxF: 85,
    idealHumidityPct: 50,
    toxicity: "Mildly toxic; sap can irritate skin and is mildly toxic to pets if ingested.",
    matureSizeNotes: "Trailing stems of fuzzy leaves striped green, white, and bright pink/purple.",
    distinguishingTraits: "Distinguish from Tradescantia zebrina by 'Nanouk's' pastel PINK-and-cream broad stripes with thicker sturdier leaves (zebrina is purple-and-silver with thinner leaves). More robust and vividly pink than the typical wandering dude.",
    sourceCitations: [CITATIONS.ncsuToolbox, CITATIONS_EXT.gardeniaNet, CITATIONS.aspcaToxic],
    researchStatus: "verified"
  },
  {
    speciesKey: "philodendron-mccolley-finale",
    commonName: "Philodendron 'McColley's Finale'",
    scientificName: "Philodendron 'McColley's Finale'",
    waterIntervalDaysMin: 7,
    waterIntervalDaysMax: 10,
    waterNotes: "Water when top 1-2 in dry; steady moisture during growth.",
    feedIntervalDaysActive: 30,
    feedIntervalDaysDormant: null,
    feedNotes: "Balanced fertilizer monthly in active growth; reduce in winter.",
    lightRequirement: "bright_indirect",
    placementNotes: "Bright indirect light deepens the red new growth; compact self-header.",
    soilType: "Chunky aroid mix (bark, perlite, coco coir)",
    repotIntervalMonths: 18,
    idealTempMinF: 65,
    idealTempMaxF: 85,
    idealHumidityPct: 55,
    toxicity: "Toxic to cats and dogs if ingested (calcium oxalates).",
    matureSizeNotes: "Self-heading; new leaves emerge deep red/orange, maturing to green.",
    distinguishingTraits: "Distinguish from 'Prince of Orange' by McColley's Finale new leaves emerging deep RED (Prince of Orange emerges orange). Both are self-heading clumps, unlike vining red-stemmed philodendrons.",
    sourceCitations: [CITATIONS_EXT.aroidWiki, CITATIONS.costaFarms, CITATIONS.aspcaToxic],
    researchStatus: "verified"
  }
];
var careProfileSeeds = [
  ...baseSeeds.map((s) => ({
    ...s,
    distinguishingTraits: s.distinguishingTraits ?? DISTINGUISHING_TRAITS[s.speciesKey]
  })),
  ...newSeeds
];

// server/affiliate-seed.ts
var affiliateLinkSeeds = [
  { category: "fertilizer", label: "Buy plant food", searchQuery: "indoor houseplant liquid fertilizer", asin: null },
  { category: "watering_tools", label: "Buy water supplies", searchQuery: "houseplant watering can long spout", asin: null },
  { category: "soil", label: "Buy soil mix", searchQuery: "indoor potting mix well draining", asin: null },
  { category: "pot", label: "Buy a pot", searchQuery: "ceramic plant pot with drainage hole", asin: null },
  { category: "repot_kit", label: "Buy repot kit", searchQuery: "plant repotting kit tools soil pot", asin: null },
  { category: "aroid_soil", label: "Buy aroid soil", searchQuery: "chunky aroid potting mix bark perlite", asin: null },
  { category: "succulent_soil", label: "Buy succulent soil", searchQuery: "cactus succulent potting mix fast draining", asin: null },
  { category: "grow_light", label: "Buy a grow light", searchQuery: "indoor plant grow light full spectrum", asin: null },
  { category: "humidity_tools", label: "Buy a humidifier", searchQuery: "small room humidifier for houseplants", asin: null },
  { category: "moss_pole", label: "Buy a moss pole", searchQuery: "moss pole plant support climbing", asin: null }
];

// server/storage.ts
var connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Dirt & Leaf now uses Postgres \u2014 copy .env.example to .env and set DATABASE_URL."
  );
}
var client = (0, import_postgres.default)(connectionString, {
  max: 1,
  prepare: false,
  connect_timeout: 15
});
async function withRetry(fn, label) {
  const delaysMs = [500, 1e3, 2e3];
  let lastErr;
  for (let attempt = 0; attempt <= delaysMs.length; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === delaysMs.length) break;
      const delay = delaysMs[attempt];
      console.warn(
        `[storage] ${label} failed (attempt ${attempt + 1}/${delaysMs.length + 1}); retrying in ${delay}ms. This is expected on a cold Neon compute. Cause: ` + (err instanceof Error ? err.message : String(err))
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastErr;
}
var db = (0, import_postgres_js.drizzle)(client);
var BOOTSTRAP_DDL = `
CREATE TABLE IF NOT EXISTS rooms (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  photo_url TEXT,
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS care_profiles (
  id SERIAL PRIMARY KEY,
  species_key TEXT NOT NULL UNIQUE,
  common_name TEXT NOT NULL,
  scientific_name TEXT NOT NULL,
  water_interval_days_min INTEGER NOT NULL,
  water_interval_days_max INTEGER NOT NULL,
  water_notes TEXT NOT NULL,
  feed_interval_days_active INTEGER NOT NULL,
  feed_interval_days_dormant INTEGER,
  feed_notes TEXT NOT NULL,
  light_requirement TEXT NOT NULL,
  placement_notes TEXT NOT NULL,
  soil_type TEXT NOT NULL,
  repot_interval_months INTEGER,
  ideal_temp_min_f INTEGER,
  ideal_temp_max_f INTEGER,
  ideal_humidity_pct INTEGER,
  toxicity TEXT,
  mature_size_notes TEXT,
  distinguishing_traits TEXT,
  source_citations TEXT NOT NULL,
  research_status TEXT NOT NULL DEFAULT 'seed',
  research_notes TEXT
);

-- Idempotent add for databases created before distinguishing_traits existed.
ALTER TABLE care_profiles ADD COLUMN IF NOT EXISTS distinguishing_traits TEXT;

CREATE TABLE IF NOT EXISTS plants (
  id SERIAL PRIMARY KEY,
  room_id INTEGER NOT NULL,
  care_profile_id INTEGER,
  common_name TEXT NOT NULL,
  scientific_name TEXT,
  curated_photo_url TEXT,
  user_photo_url TEXT,
  confirmed_confidence DOUBLE PRECISION,
  match_candidates TEXT,
  save_date BIGINT NOT NULL,
  location_lat DOUBLE PRECISION,
  location_lon DOUBLE PRECISION,
  location_label TEXT,
  hardiness_zone TEXT,
  pot_size_inches INTEGER,
  next_water_date BIGINT,
  next_feed_date BIGINT
);

CREATE TABLE IF NOT EXISTS reminders (
  id SERIAL PRIMARY KEY,
  plant_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  due_date BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS progress_photos (
  id SERIAL PRIMARY KEY,
  plant_id INTEGER NOT NULL,
  photo_url TEXT NOT NULL,
  captured_date BIGINT NOT NULL,
  note TEXT
);

CREATE TABLE IF NOT EXISTS notification_log (
  id SERIAL PRIMARY KEY,
  reminder_id INTEGER,
  plant_id INTEGER,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at BIGINT NOT NULL,
  status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS affiliate_links (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  search_query TEXT NOT NULL,
  asin TEXT
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id SERIAL PRIMARY KEY,
  endpoint TEXT NOT NULL UNIQUE,
  subscription_json TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  subscription_tier TEXT NOT NULL DEFAULT 'free',
  subscription_expires_at BIGINT,
  subscription_renews BOOLEAN NOT NULL DEFAULT TRUE,
  created_at BIGINT NOT NULL
);
`;
async function count(table) {
  const [row] = await client.unsafe(`SELECT COUNT(*)::int AS c FROM ${table}`);
  return Number(row.c);
}
async function bootstrap() {
  await withRetry(() => client`SELECT 1`, "initial database connection");
  await client.unsafe(BOOTSTRAP_DDL);
  if (await count("users") === 0) {
    await db.insert(users).values({
      subscriptionTier: "free",
      subscriptionExpiresAt: null,
      subscriptionRenews: true,
      createdAt: Date.now()
    });
    console.log("[storage] Seeded default free-tier user row.");
  }
  const existingProfiles = await db.select({ speciesKey: careProfiles.speciesKey, distinguishingTraits: careProfiles.distinguishingTraits }).from(careProfiles);
  const existingByKey = new Map(existingProfiles.map((p) => [p.speciesKey, p]));
  const missing = careProfileSeeds.filter((s) => !existingByKey.has(s.speciesKey));
  if (missing.length > 0) {
    await db.insert(careProfiles).values(
      missing.map((s) => ({
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
        researchNotes: null
      }))
    );
    console.log(`[storage] Inserted ${missing.length} new care_profiles rows.`);
  }
  let backfilled = 0;
  for (const seed of careProfileSeeds) {
    if (!seed.distinguishingTraits) continue;
    const existing = existingByKey.get(seed.speciesKey);
    if (existing && !existing.distinguishingTraits) {
      await db.update(careProfiles).set({ distinguishingTraits: seed.distinguishingTraits, researchStatus: seed.researchStatus ?? "seed" }).where((0, import_drizzle_orm.eq)(careProfiles.speciesKey, seed.speciesKey));
      backfilled++;
    }
  }
  if (backfilled > 0) {
    console.log(`[storage] Backfilled distinguishing_traits on ${backfilled} existing care_profiles rows.`);
  }
  if (await count("affiliate_links") === 0) {
    await db.insert(affiliateLinks).values(
      affiliateLinkSeeds.map((s) => ({
        category: s.category,
        label: s.label,
        searchQuery: s.searchQuery,
        asin: s.asin ?? null
      }))
    );
    console.log(`[storage] Seeded ${affiliateLinkSeeds.length} affiliate_links rows.`);
  }
  if (await count("rooms") === 0) {
    const now = Date.now();
    await db.insert(rooms).values([
      {
        name: "Living room",
        photoUrl: "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/2f7d59b0b46396ab6a280ae4cc1ba831b83cb102.jpg",
        createdAt: now
      },
      {
        name: "Office",
        photoUrl: "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/0b3fa622feb42c41ca3fbb785fe0014d25ce6980.jpg",
        createdAt: now
      }
    ]);
    console.log("[storage] Seeded 2 default rooms (Living room, Office).");
  }
}
var dbReady = bootstrap();
dbReady.catch((err) => {
  console.error("[storage] Database bootstrap failed:", err);
});
var DatabaseStorage = class {
  async listRooms() {
    return db.select().from(rooms).orderBy((0, import_drizzle_orm.asc)(rooms.id));
  }
  async getRoom(id) {
    const [row] = await db.select().from(rooms).where((0, import_drizzle_orm.eq)(rooms.id, id));
    return row;
  }
  async createRoom(room) {
    const [row] = await db.insert(rooms).values({ ...room, createdAt: Date.now() }).returning();
    return row;
  }
  async listCareProfiles() {
    return db.select().from(careProfiles);
  }
  async getCareProfile(id) {
    const [row] = await db.select().from(careProfiles).where((0, import_drizzle_orm.eq)(careProfiles.id, id));
    return row;
  }
  async getCareProfileBySpeciesKey(speciesKey) {
    const [row] = await db.select().from(careProfiles).where((0, import_drizzle_orm.eq)(careProfiles.speciesKey, speciesKey));
    return row;
  }
  async findCareProfileByName(name) {
    const all = await this.listCareProfiles();
    const lower = name.toLowerCase();
    return all.find(
      (p) => p.commonName.toLowerCase() === lower || p.scientificName.toLowerCase() === lower
    ) ?? all.find(
      (p) => lower.includes(p.commonName.toLowerCase()) || p.commonName.toLowerCase().includes(lower)
    );
  }
  async listPlants() {
    return db.select().from(plants).orderBy((0, import_drizzle_orm.asc)(plants.id));
  }
  async listPlantsByRoom(roomId) {
    return db.select().from(plants).where((0, import_drizzle_orm.eq)(plants.roomId, roomId));
  }
  async getPlant(id) {
    const [row] = await db.select().from(plants).where((0, import_drizzle_orm.eq)(plants.id, id));
    return row;
  }
  async createPlant(plant) {
    const [row] = await db.insert(plants).values({ ...plant, saveDate: Date.now() }).returning();
    return row;
  }
  async updatePlantSchedule(id, nextWaterDate, nextFeedDate) {
    await db.update(plants).set({ nextWaterDate, nextFeedDate }).where((0, import_drizzle_orm.eq)(plants.id, id));
  }
  async listReminders() {
    return db.select().from(reminders);
  }
  async listRemindersByPlant(plantId) {
    return db.select().from(reminders).where((0, import_drizzle_orm.eq)(reminders.plantId, plantId));
  }
  async createReminder(reminder) {
    const [row] = await db.insert(reminders).values({ ...reminder, createdAt: Date.now() }).returning();
    return row;
  }
  async updateReminderStatus(id, status) {
    await db.update(reminders).set({ status }).where((0, import_drizzle_orm.eq)(reminders.id, id));
  }
  async listProgressPhotos(plantId) {
    return db.select().from(progressPhotos).where((0, import_drizzle_orm.eq)(progressPhotos.plantId, plantId));
  }
  async createProgressPhoto(photo) {
    const [row] = await db.insert(progressPhotos).values(photo).returning();
    return row;
  }
  async createNotificationLog(entry) {
    const [row] = await db.insert(notificationLog).values(entry).returning();
    return row;
  }
  async listNotificationLog() {
    return db.select().from(notificationLog);
  }
  async listAffiliateLinks() {
    return db.select().from(affiliateLinks);
  }
  async getAffiliateLinkByCategory(category) {
    const [row] = await db.select().from(affiliateLinks).where((0, import_drizzle_orm.eq)(affiliateLinks.category, category));
    return row;
  }
  async listPushSubscriptions() {
    return db.select().from(pushSubscriptions);
  }
  async createPushSubscription(sub) {
    const [row] = await db.insert(pushSubscriptions).values({ ...sub, createdAt: Date.now() }).returning();
    return row;
  }
  async getCurrentUser() {
    const [existing] = await db.select().from(users).where((0, import_drizzle_orm.eq)(users.id, 1));
    if (existing) return existing;
    const [created] = await db.insert(users).values({ subscriptionTier: "free", subscriptionExpiresAt: null, subscriptionRenews: true, createdAt: Date.now() }).returning();
    return created;
  }
  async setSubscriptionTier(tier, expiresAt) {
    const current = await this.getCurrentUser();
    const [row] = await db.update(users).set({ subscriptionTier: tier, subscriptionExpiresAt: expiresAt, subscriptionRenews: true }).where((0, import_drizzle_orm.eq)(users.id, current.id)).returning();
    return row;
  }
  async canTrackAdditionalPlant() {
    const user = await this.getCurrentUser();
    if (user.subscriptionTier !== "free") return true;
    const [row] = await db.select({ c: import_drizzle_orm.sql`count(*)::int` }).from(plants);
    return Number(row.c) < FREE_PLANT_LIMIT;
  }
};
var storage = new DatabaseStorage();

// server/plant-id.ts
var ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
var DEFAULT_MODEL = "claude-3-5-sonnet-latest";
var STOCK_PHOTOS = {
  monstera: "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/4643d8940a3a1b5edbae380c8f1667def76247aa.jpg",
  miniMonstera: "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/0509bcf44436822dcb9999f9c0d1ddcdd08ca135.jpg",
  philodendron: "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/dbd7a70d946d6bdadc5ff96b8b607fc36c15f29c.jpg",
  livingRoom: "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/2f7d59b0b46396ab6a280ae4cc1ba831b83cb102.jpg",
  office: "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/0b3fa622feb42c41ca3fbb785fe0014d25ce6980.jpg",
  products: "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/19fe21f5dc77d469dea6f87ba3ecd6097a56bd1c.jpg"
};
var STOCK_ROTATION = [STOCK_PHOTOS.monstera, STOCK_PHOTOS.philodendron, STOCK_PHOTOS.miniMonstera];
function stockPhotoFor(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = hash * 31 + seed.charCodeAt(i) >>> 0;
  return STOCK_ROTATION[hash % STOCK_ROTATION.length];
}
function parseDataUrl(input) {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]*)$/.exec(input.trim());
  if (match) {
    return { mediaType: match[1], data: match[2] };
  }
  return { mediaType: "image/jpeg", data: input.replace(/^data:.*;base64,/, "").trim() };
}
function extractJson(text2) {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(text2);
  const candidate = fenced ? fenced[1] : text2;
  const start = candidate.search(/[[{]/);
  if (start === -1) throw new Error("No JSON found in model response");
  const open = candidate[start];
  const close = open === "[" ? "]" : "}";
  const end = candidate.lastIndexOf(close);
  if (end === -1 || end < start) throw new Error("Malformed JSON in model response");
  return JSON.parse(candidate.slice(start, end + 1));
}
async function callClaudeVision(imageInput, system, prompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
  const { mediaType, data } = parseDataUrl(imageInput);
  const response = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
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
            { type: "text", text: prompt }
          ]
        }
      ]
    })
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Anthropic API error ${response.status}: ${body}`);
  }
  const json = await response.json();
  const textBlock = (json.content ?? []).find((b) => b.type === "text");
  if (!textBlock?.text) throw new Error("Empty response from Anthropic API");
  return textBlock.text;
}
var IDENTIFY_SYSTEM = "You are an expert botanist and houseplant specialist with deep knowledge of both mainstream houseplants AND rare/uncommon cultivars actively traded among collectors (rare aroids, variegated Monstera/Philodendron/Syngonium, uncommon Hoya/Scindapsus, etc.). You identify plants from photos and are careful to distinguish visually similar look-alikes.";
var IDENTIFY_PROMPT = 'Identify the plant in this photo. Return the TOP 3 most likely species as strict JSON only (no prose outside the JSON), in this exact shape:\n{"candidates":[{"commonName":"...","scientificName":"...","confidence":0.0,"reasoning":"one short sentence: why this, and why it is not the most likely look-alike"}]}\nRules: order candidates by confidence descending (0-1). Explicitly consider common look-alike confusions (e.g. pothos vs. heartleaf philodendron, Monstera deliciosa vs. adansonii vs. Rhaphidophora, Alocasia Polly vs. Frydek) and use the reasoning field to justify the pick over its nearest look-alike. If the plant is a rare/variegated cultivar, name the specific cultivar. Always return exactly 3 candidates even if unsure.';
function mockIdentify() {
  console.log(
    "[plant-id] MOCK MODE: ANTHROPIC_API_KEY is not set. Returning deterministic mock identification results so the app remains testable end to end. Set ANTHROPIC_API_KEY to enable live AI vision ID."
  );
  return {
    mock: true,
    suggestions: [
      { id: "mock-monstera-deliciosa", commonName: "Monstera deliciosa", scientificName: "Monstera deliciosa", probability: 0.94, similarImageUrl: STOCK_PHOTOS.monstera, reasoning: "Demo result: large leaves with both splits and interior holes rule out the split-only Mini Monstera." },
      { id: "mock-mini-monstera", commonName: "Mini monstera", scientificName: "Rhaphidophora tetrasperma", probability: 0.82, similarImageUrl: STOCK_PHOTOS.miniMonstera, reasoning: "Demo result: smaller leaves splitting to the edge without interior holes." },
      { id: "mock-tree-philodendron", commonName: "Tree philodendron", scientificName: "Philodendron bipinnatifidum", probability: 0.76, similarImageUrl: STOCK_PHOTOS.philodendron, reasoning: "Demo result: feathery pinnate lobes with no round fenestrations." }
    ]
  };
}
function suggestionsFromCandidates(candidates) {
  return (Array.isArray(candidates) ? candidates : []).slice(0, 3).map((c, i) => {
    const commonName = String(c?.commonName ?? c?.common_name ?? c?.name ?? "Unknown plant").trim();
    const scientificName = String(c?.scientificName ?? c?.scientific_name ?? commonName).trim();
    let probability = Number(c?.confidence ?? c?.probability ?? 0);
    if (!Number.isFinite(probability)) probability = 0;
    if (probability > 1) probability = probability / 100;
    probability = Math.max(0, Math.min(1, probability));
    return {
      id: `vision-${i}-${scientificName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      commonName,
      scientificName,
      probability,
      similarImageUrl: stockPhotoFor(scientificName || commonName),
      reasoning: c?.reasoning ? String(c.reasoning).trim() : void 0
    };
  });
}
async function fetchVisionIdentify(imageInput) {
  const text2 = await callClaudeVision(imageInput, IDENTIFY_SYSTEM, IDENTIFY_PROMPT);
  const parsed = extractJson(text2);
  const suggestions = suggestionsFromCandidates(parsed?.candidates ?? parsed);
  if (suggestions.length === 0) throw new Error("Vision model returned no candidates");
  return { suggestions, mock: false };
}
async function identifyPlant(imageBase64) {
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
var TAG_SYSTEM = "You read the printed text off plant nursery tags/labels (the plastic stake in the pot). You extract the plant's name exactly as printed and normalize it to a common name and scientific name.";
var TAG_PROMPT = 'This photo is of a plant nursery tag/label. Read the printed plant name and return strict JSON only:\n{"commonName":"...","scientificName":"...","rawText":"all text you can read","confidence":0.0}\nUse null for commonName/scientificName if the tag does not legibly show that field. confidence is 0-1 for how legible/certain the name read is. Do not guess a species from a plant photo \u2014 only report what is printed on the tag.';
function mockTag() {
  console.log(
    "[plant-id] MOCK MODE (tag): ANTHROPIC_API_KEY is not set. Returning a deterministic mock tag read."
  );
  return {
    commonName: "Golden pothos",
    scientificName: "Epipremnum aureum",
    rawText: "Demo tag read \u2014 set ANTHROPIC_API_KEY to enable live label OCR.",
    confidence: 0.9,
    mock: true
  };
}
function tagResultFromJson(parsed) {
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
    confidence
  };
}
async function fetchTagRead(imageInput) {
  const text2 = await callClaudeVision(imageInput, TAG_SYSTEM, TAG_PROMPT);
  const parsed = extractJson(text2);
  return { ...tagResultFromJson(parsed), mock: false };
}
async function identifyTag(imageBase64) {
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

// server/care-match.ts
function normalizeName(raw) {
  return raw.toLowerCase().replace(/['"''`]/g, " ").replace(/\([^)]*\)/g, " ").replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}
function tokens(raw) {
  return normalizeName(raw).split(" ").filter((t) => t.length > 1);
}
function scoreProfile(query, profile) {
  const q = normalizeName(query);
  if (!q) return 0;
  const fields = [profile.commonName, profile.scientificName, profile.speciesKey.replace(/-/g, " ")];
  const normFields = fields.map(normalizeName);
  if (normFields.some((f) => f === q)) return 1e3;
  let best = 0;
  const qTokens = tokens(query);
  for (const f of normFields) {
    if (!f) continue;
    if (f.includes(q) || q.includes(f)) {
      best = Math.max(best, 500 + Math.min(q.length, f.length));
      continue;
    }
    const fTokens = new Set(f.split(" "));
    let overlap = 0;
    for (const t of qTokens) if (fTokens.has(t)) overlap++;
    if (overlap > 0) {
      best = Math.max(best, overlap * 100 + overlap / Math.max(qTokens.length, 1) * 50);
    }
  }
  return best;
}
function matchCareProfile(name, profiles) {
  let best;
  let bestScore = 0;
  for (const p of profiles) {
    const s = scoreProfile(name, p);
    if (s > bestScore) {
      bestScore = s;
      best = p;
    }
  }
  return bestScore >= 100 ? best : void 0;
}
function searchCareProfiles(query, profiles, limit = 12) {
  return profiles.map((p) => ({ p, score: scoreProfile(query, p) })).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, limit).map((x) => x.p);
}

// server/weather.ts
function seasonForLatitudeAndDate(lat, date) {
  const month = date.getUTCMonth();
  const northernSeasons = [
    "winter",
    "winter",
    "spring",
    "spring",
    "spring",
    "summer",
    "summer",
    "summer",
    "fall",
    "fall",
    "fall",
    "winter"
  ];
  const isSouthern = lat < 0;
  const idx = month;
  const season = northernSeasons[idx];
  if (!isSouthern) return season;
  const flip = {
    winter: "summer",
    summer: "winter",
    spring: "fall",
    fall: "spring"
  };
  return flip[season];
}
async function getWeatherSnapshot(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m&temperature_unit=fahrenheit`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Open-Meteo error ${res.status}`);
    const data = await res.json();
    const temperatureF = data.current?.temperature_2m ?? 70;
    const humidityPct = data.current?.relative_humidity_2m ?? 40;
    const season = seasonForLatitudeAndDate(lat, /* @__PURE__ */ new Date());
    return {
      temperatureF,
      humidityPct,
      season,
      isDormantSeason: season === "winter"
    };
  } catch (err) {
    console.error("[weather] Open-Meteo call failed, using seasonal-only fallback:", err);
    const season = seasonForLatitudeAndDate(lat, /* @__PURE__ */ new Date());
    return { temperatureF: 70, humidityPct: 40, season, isDormantSeason: season === "winter" };
  }
}
async function reverseGeocode(lat, lon) {
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?latitude=${lat}&longitude=${lon}`;
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    const res = await fetch(nominatimUrl, {
      headers: { "User-Agent": "DirtAndLeafApp/1.0 (houseplant care app)" }
    });
    if (!res.ok) throw new Error(`Nominatim error ${res.status}`);
    const data = await res.json();
    const addr = data.address ?? {};
    const city = addr.city || addr.town || addr.village || addr.county;
    const region = addr.state;
    return [city, region].filter(Boolean).join(", ") || data.display_name || "Unknown location";
  } catch (err) {
    console.error("[weather] reverse geocode failed:", err);
    return "Unknown location";
  }
}
function approximateHardinessZone(lat) {
  if (lat >= 47) return "4b-5a";
  if (lat >= 43) return "5b-6a";
  if (lat >= 39) return "6b-7a";
  if (lat >= 35) return "7b-8a";
  if (lat >= 31) return "8b-9a";
  if (lat >= 27) return "9b-10a";
  return "10b-11";
}

// server/care-scheduling.ts
var DAY_MS = 24 * 60 * 60 * 1e3;
function adjustWaterIntervalDays(profile, weather) {
  const base = (profile.waterIntervalDaysMin + profile.waterIntervalDaysMax) / 2;
  let multiplier = 1;
  if (weather.isDormantSeason) multiplier += 0.35;
  if (weather.season === "summer") multiplier -= 0.15;
  if (weather.humidityPct >= 60) multiplier += 0.1;
  else if (weather.humidityPct <= 30) multiplier -= 0.15;
  if (weather.temperatureF >= 85) multiplier -= 0.15;
  else if (weather.temperatureF <= 55) multiplier += 0.2;
  const adjusted = base * Math.max(0.5, multiplier);
  return Math.round(Math.max(2, adjusted));
}
function feedIntervalDays(profile, weather) {
  if (weather.isDormantSeason) {
    return profile.feedIntervalDaysDormant;
  }
  return profile.feedIntervalDaysActive;
}
async function computeSchedule(profile, lat, lon, from = /* @__PURE__ */ new Date()) {
  const weather = lat != null && lon != null ? await getWeatherSnapshot(lat, lon) : { temperatureF: 70, humidityPct: 40, season: "spring", isDormantSeason: false };
  const waterDays = adjustWaterIntervalDays(profile, weather);
  const feedDays = feedIntervalDays(profile, weather);
  return {
    nextWaterDate: from.getTime() + waterDays * DAY_MS,
    nextFeedDate: feedDays != null ? from.getTime() + feedDays * DAY_MS : null,
    weatherUsed: weather
  };
}

// server/nurseries.ts
var OVERPASS_URL = "https://overpass-api.de/api/interpreter";
var MILES_TO_METERS = 1609.34;
function haversineMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const toRad = (d) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}
async function findNearbyNurseries(lat, lon, radiusMiles = 15) {
  const radiusMeters = Math.round(radiusMiles * MILES_TO_METERS);
  const query = `
    [out:json][timeout:15];
    (
      node["shop"="garden_centre"](around:${radiusMeters},${lat},${lon});
      way["shop"="garden_centre"](around:${radiusMeters},${lat},${lon});
      node["shop"="florist"]["plant"="yes"](around:${radiusMeters},${lat},${lon});
    );
    out center 20;
  `;
  try {
    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: query
    });
    if (!res.ok) throw new Error(`Overpass error ${res.status}`);
    const data = await res.json();
    const elements = data.elements ?? [];
    const results = elements.map((el) => {
      const elLat = el.lat ?? el.center?.lat;
      const elLon = el.lon ?? el.center?.lon;
      if (elLat == null || elLon == null) return null;
      const name = el.tags?.name ?? "Local plant nursery";
      const addr = [el.tags?.["addr:housenumber"], el.tags?.["addr:street"], el.tags?.["addr:city"]].filter(Boolean).join(" ");
      return {
        name,
        lat: elLat,
        lon: elLon,
        distanceMiles: Math.round(haversineMiles(lat, lon, elLat, elLon) * 10) / 10,
        address: addr || void 0
      };
    }).filter(Boolean);
    return results.sort((a, b) => a.distanceMiles - b.distanceMiles).slice(0, 10);
  } catch (err) {
    console.error("[nurseries] Overpass lookup failed:", err);
    return [];
  }
}

// server/affiliate.ts
var FALLBACK_TAG = "YOUR-ASSOCIATES-TAG-20";
function getAssociatesTag() {
  const tag = process.env.AMAZON_ASSOCIATES_TAG;
  if (!tag) {
    console.log(
      "[affiliate] AMAZON_ASSOCIATES_TAG not set \u2014 using placeholder tag. Create an Amazon Associates account at https://affiliate-program.amazon.com/ and set this env var before going live."
    );
    return FALLBACK_TAG;
  }
  return tag;
}
function buildAffiliateUrl(link) {
  const tag = getAssociatesTag();
  if (link.asin) {
    return `https://www.amazon.com/dp/${encodeURIComponent(link.asin)}?tag=${encodeURIComponent(tag)}`;
  }
  const query = encodeURIComponent(link.searchQuery);
  return `https://www.amazon.com/s?k=${query}&tag=${encodeURIComponent(tag)}`;
}

// server/push.ts
var import_web_push = __toESM(require("web-push"), 1);
var DEV_VAPID_PUBLIC_KEY = "BMahVCo20wGvxca97xdAcW7MLU_vytGfWeziTzGPKrEYcq6fJlKm_ddrlsftMmQ9jCX6igleqozn_LD6SeYDEcY";
var DEV_VAPID_PRIVATE_KEY = "uG3SdZfPRabPQbKEh8aMLO-C-Z8SR6dicC8qC5nAUqM";
var publicKey = process.env.VAPID_PUBLIC_KEY || DEV_VAPID_PUBLIC_KEY;
var privateKey = process.env.VAPID_PRIVATE_KEY || DEV_VAPID_PRIVATE_KEY;
if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  console.log(
    "[push] VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY not set \u2014 using a bundled DEV-ONLY keypair so push notifications work in local testing. Generate your own permanent keys with `npx web-push generate-vapid-keys` before going to production."
  );
}
var pushConfigured = false;
try {
  import_web_push.default.setVapidDetails(
    process.env.VAPID_CONTACT_EMAIL ? `mailto:${process.env.VAPID_CONTACT_EMAIL}` : "mailto:admin@example.com",
    publicKey,
    privateKey
  );
  pushConfigured = true;
} catch (err) {
  console.error(
    `[push] Invalid VAPID configuration \u2014 push notifications are disabled. Check VAPID_PUBLIC_KEY (65 bytes base64url), VAPID_PRIVATE_KEY (32 bytes base64url) and VAPID_CONTACT_EMAIL. Details: ${err?.message ?? err}`
  );
}
var vapidPublicKey = pushConfigured ? publicKey : "";
async function sendPushNotification(subscriptionJson, payload) {
  if (!pushConfigured) {
    return { ok: false, error: "Push notifications are not configured (invalid or missing VAPID keys)." };
  }
  try {
    const subscription = JSON.parse(subscriptionJson);
    await import_web_push.default.sendNotification(subscription, JSON.stringify(payload));
    return { ok: true };
  } catch (err) {
    console.error("[push] Failed to send push notification:", err?.message ?? err);
    return { ok: false, error: err?.message ?? String(err) };
  }
}

// server/routes.ts
async function registerRoutes(httpServer, app) {
  await dbReady;
  app.get("/api/rooms", async (_req, res) => {
    const list = await storage.listRooms();
    res.json(list);
  });
  app.get("/api/rooms/:id", async (req, res) => {
    const room = await storage.getRoom(Number(req.params.id));
    if (!room) return res.status(404).json({ error: "Not found" });
    res.json(room);
  });
  app.post("/api/rooms", async (req, res) => {
    const parsed = insertRoomSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const room = await storage.createRoom(parsed.data);
    res.status(201).json(room);
  });
  app.post("/api/identify", async (req, res) => {
    const { imageBase64 } = req.body ?? {};
    try {
      const result = await identifyPlant(imageBase64 ?? null);
      const suggestions = await crossCheckSuggestions(result.suggestions);
      res.json({ ...result, suggestions });
    } catch (err) {
      res.status(500).json({ error: err?.message ?? "Identification failed" });
    }
  });
  app.post("/api/identify-tag", async (req, res) => {
    const { imageBase64 } = req.body ?? {};
    try {
      const read = await identifyTag(imageBase64 ?? null);
      const profiles = await storage.listCareProfiles();
      const nameForMatch = read.scientificName || read.commonName || read.rawText || "";
      const matched = nameForMatch ? matchCareProfile(nameForMatch, profiles) : void 0;
      res.json({
        ...read,
        match: matched ? withParsedCitations(matched) : null,
        inDatabase: !!matched
      });
    } catch (err) {
      res.status(500).json({ error: err?.message ?? "Tag read failed" });
    }
  });
  async function crossCheckSuggestions(suggestions) {
    const profiles = await storage.listCareProfiles();
    return suggestions.map((s) => {
      const matched = matchCareProfile(s.scientificName || s.commonName, profiles);
      return {
        ...s,
        careProfileId: matched?.id ?? null,
        speciesKey: matched?.speciesKey ?? null,
        inDatabase: !!matched,
        distinguishingTraits: matched?.distinguishingTraits ?? null
      };
    });
  }
  app.get("/api/care-profiles", async (_req, res) => {
    const list = await storage.listCareProfiles();
    res.json(list.map(withParsedCitations));
  });
  app.get("/api/care-profiles/lookup", async (req, res) => {
    const name = String(req.query.name ?? "");
    const profile = await storage.findCareProfileByName(name);
    res.json(profile ? withParsedCitations(profile) : null);
  });
  app.get("/api/care-profiles/search", async (req, res) => {
    const q = String(req.query.q ?? "").trim();
    if (!q) return res.json([]);
    const profiles = await storage.listCareProfiles();
    res.json(searchCareProfiles(q, profiles).map(withParsedCitations));
  });
  function withParsedCitations(p) {
    return { ...p, sourceCitations: JSON.parse(p.sourceCitations || "[]") };
  }
  app.get("/api/plants", async (_req, res) => {
    res.json(await storage.listPlants());
  });
  app.get("/api/plants/room/:roomId", async (req, res) => {
    res.json(await storage.listPlantsByRoom(Number(req.params.roomId)));
  });
  app.get("/api/plants/:id", async (req, res) => {
    const plant = await storage.getPlant(Number(req.params.id));
    if (!plant) return res.status(404).json({ error: "Not found" });
    res.json(plant);
  });
  app.post("/api/plants", async (req, res) => {
    const body = req.body ?? {};
    const parsed = insertPlantSchema.safeParse(body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const canAdd = await storage.canTrackAdditionalPlant();
    if (!canAdd) {
      return res.status(402).json({
        error: "plant_limit_reached",
        message: `Free plan is limited to ${FREE_PLANT_LIMIT} tracked plants. Upgrade to Premium for unlimited plants.`,
        limit: FREE_PLANT_LIMIT
      });
    }
    const input = parsed.data;
    const careProfile = input.careProfileId ? await storage.getCareProfile(input.careProfileId) : await storage.findCareProfileByName(input.commonName);
    let nextWaterDate = null;
    let nextFeedDate = null;
    let hardinessZone = null;
    let locationLabel = input.locationLabel ?? null;
    if (careProfile) {
      const schedule = await computeSchedule(careProfile, input.locationLat ?? null, input.locationLon ?? null);
      nextWaterDate = schedule.nextWaterDate;
      nextFeedDate = schedule.nextFeedDate;
    }
    if (input.locationLat != null && input.locationLon != null) {
      hardinessZone = approximateHardinessZone(input.locationLat);
      if (!locationLabel) {
        locationLabel = await reverseGeocode(input.locationLat, input.locationLon);
      }
    }
    const plant = await storage.createPlant({
      ...input,
      careProfileId: careProfile?.id ?? input.careProfileId ?? null,
      scientificName: input.scientificName ?? careProfile?.scientificName ?? null,
      curatedPhotoUrl: input.curatedPhotoUrl ?? null,
      hardinessZone,
      locationLabel,
      nextWaterDate,
      nextFeedDate
    });
    if (nextWaterDate) {
      await storage.createReminder({ plantId: plant.id, type: "water", dueDate: nextWaterDate, status: "pending" });
    }
    if (nextFeedDate) {
      await storage.createReminder({ plantId: plant.id, type: "feed", dueDate: nextFeedDate, status: "pending" });
    }
    res.status(201).json(plant);
  });
  app.post("/api/plants/:id/recompute-schedule", async (req, res) => {
    const plant = await storage.getPlant(Number(req.params.id));
    if (!plant) return res.status(404).json({ error: "Not found" });
    if (!plant.careProfileId) return res.status(400).json({ error: "No care profile linked to this plant" });
    const profile = await storage.getCareProfile(plant.careProfileId);
    if (!profile) return res.status(400).json({ error: "Care profile not found" });
    const schedule = await computeSchedule(profile, plant.locationLat, plant.locationLon);
    await storage.updatePlantSchedule(plant.id, schedule.nextWaterDate, schedule.nextFeedDate);
    res.json({ nextWaterDate: schedule.nextWaterDate, nextFeedDate: schedule.nextFeedDate, weatherUsed: schedule.weatherUsed });
  });
  app.get("/api/plants/:id/progress-photos", async (req, res) => {
    res.json(await storage.listProgressPhotos(Number(req.params.id)));
  });
  app.post("/api/plants/:id/progress-photos", async (req, res) => {
    const plantId = Number(req.params.id);
    const parsed = insertProgressPhotoSchema.safeParse({ ...req.body, plantId, capturedDate: Date.now() });
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const photo = await storage.createProgressPhoto(parsed.data);
    res.status(201).json(photo);
  });
  app.get("/api/reminders", async (_req, res) => {
    res.json(await storage.listReminders());
  });
  app.post("/api/reminders/:id/status", async (req, res) => {
    const { status } = req.body ?? {};
    if (!["pending", "done", "snoozed"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    await storage.updateReminderStatus(Number(req.params.id), status);
    res.json({ ok: true });
  });
  app.get("/api/affiliate-links", async (_req, res) => {
    const links = await storage.listAffiliateLinks();
    res.json(links.map((l) => ({ ...l, url: buildAffiliateUrl(l) })));
  });
  app.get("/api/affiliate-links/:category", async (req, res) => {
    const link = await storage.getAffiliateLinkByCategory(req.params.category);
    if (!link) return res.status(404).json({ error: "Not found" });
    res.json({ ...link, url: buildAffiliateUrl(link) });
  });
  app.get("/api/nurseries", async (req, res) => {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    const radiusMiles = req.query.radiusMiles ? Number(req.query.radiusMiles) : 15;
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return res.status(400).json({ error: "lat and lon query params are required" });
    }
    const results = await findNearbyNurseries(lat, lon, radiusMiles);
    res.json(results);
  });
  app.get("/api/weather", async (req, res) => {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return res.status(400).json({ error: "lat and lon query params are required" });
    }
    const snapshot = await getWeatherSnapshot(lat, lon);
    res.json(snapshot);
  });
  app.get("/api/push/vapid-public-key", (_req, res) => {
    res.json({ publicKey: vapidPublicKey });
  });
  app.post("/api/push/subscribe", async (req, res) => {
    const parsed = insertPushSubscriptionSchema.safeParse({
      endpoint: req.body?.endpoint,
      subscriptionJson: JSON.stringify(req.body ?? {})
    });
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    try {
      const sub = await storage.createPushSubscription(parsed.data);
      res.status(201).json(sub);
    } catch {
      res.status(200).json({ ok: true });
    }
  });
  app.post("/api/push/check-reminders", async (_req, res) => {
    const now = Date.now();
    const allReminders = await storage.listReminders();
    const due = allReminders.filter((r) => r.status === "pending" && r.dueDate <= now);
    const subscriptions = await storage.listPushSubscriptions();
    const sentLog = [];
    for (const reminder of due) {
      const plant = await storage.getPlant(reminder.plantId);
      if (!plant) continue;
      const room = plant.roomId ? await storage.getRoom(plant.roomId) : void 0;
      const verb = reminder.type === "water" ? "water" : reminder.type === "feed" ? "feed" : "check on";
      const title = `Time to ${verb} your ${plant.commonName}`;
      const body = room ? `${plant.commonName} in the ${room.name}` : plant.commonName;
      if (subscriptions.length === 0) {
        await storage.createNotificationLog({
          reminderId: reminder.id,
          plantId: plant.id,
          title,
          body,
          sentAt: now,
          status: "no_subscription"
        });
        continue;
      }
      for (const sub of subscriptions) {
        const result = await sendPushNotification(sub.subscriptionJson, { title, body });
        await storage.createNotificationLog({
          reminderId: reminder.id,
          plantId: plant.id,
          title,
          body,
          sentAt: now,
          status: result.ok ? "sent" : "failed"
        });
        sentLog.push({ reminder: reminder.id, ok: result.ok });
      }
    }
    res.json({ checked: due.length, sent: sentLog.length });
  });
  app.get("/api/notification-log", async (_req, res) => {
    res.json(await storage.listNotificationLog());
  });
  app.get("/api/account", async (_req, res) => {
    const user = await storage.getCurrentUser();
    const plantCount = (await storage.listPlants()).length;
    res.json({
      ...user,
      plantCount,
      freePlantLimit: FREE_PLANT_LIMIT,
      canTrackAdditionalPlant: await storage.canTrackAdditionalPlant(),
      pricing: { monthly: PREMIUM_MONTHLY_PRICE_USD, yearly: PREMIUM_YEARLY_PRICE_USD }
    });
  });
  app.post("/api/account/upgrade", async (req, res) => {
    const tier = req.body?.tier;
    if (!SUBSCRIPTION_TIERS.includes(tier) || tier === "free") {
      return res.status(400).json({ error: "tier must be premium_monthly or premium_yearly" });
    }
    const now = Date.now();
    const oneMonthMs = 30 * 24 * 60 * 60 * 1e3;
    const oneYearMs = 365 * 24 * 60 * 60 * 1e3;
    const expiresAt = now + (tier === "premium_monthly" ? oneMonthMs : oneYearMs);
    const user = await storage.setSubscriptionTier(tier, expiresAt);
    res.json(user);
  });
  app.post("/api/account/downgrade", async (_req, res) => {
    const user = await storage.setSubscriptionTier("free", null);
    res.json(user);
  });
  return httpServer;
}

// server/app.ts
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function createApp() {
  const app = (0, import_express.default)();
  const httpServer = (0, import_node_http.createServer)(app);
  app.use(
    import_express.default.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      }
    })
  );
  app.use(import_express.default.urlencoded({ extended: false }));
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse = void 0;
    const originalResJson = res.json;
    res.json = function(bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }
        log(logLine);
      }
    });
    next();
  });
  await registerRoutes(httpServer, app);
  app.use((err, _req, res, next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Internal Server Error:", err);
    if (res.headersSent) {
      return next(err);
    }
    return res.status(status).json({ message });
  });
  return { app, httpServer };
}

// script/api-entry.ts
var appPromise;
function getApp() {
  if (!appPromise) {
    appPromise = createApp().then(({ app }) => app).catch((err) => {
      appPromise = void 0;
      throw err;
    });
  }
  return appPromise;
}
async function handler(req, res) {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (err) {
    console.error("[api] Failed to initialize/handle request:", err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("content-type", "application/json");
      res.end(
        JSON.stringify({
          error: "server_initialization_failed",
          message: err?.message ?? String(err)
        })
      );
    }
  }
}
