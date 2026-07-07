"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
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

// shared/schema.ts
var import_pg_core, import_drizzle_zod, rooms, insertRoomSchema, careProfiles, insertCareProfileSchema, plants, insertPlantSchema, reminders, insertReminderSchema, progressPhotos, insertProgressPhotoSchema, notificationLog, insertNotificationLogSchema, affiliateLinks, insertAffiliateLinkSchema, pushSubscriptions, insertPushSubscriptionSchema, SUBSCRIPTION_TIERS, users, insertUserSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    import_pg_core = require("drizzle-orm/pg-core");
    import_drizzle_zod = require("drizzle-zod");
    rooms = (0, import_pg_core.pgTable)("rooms", {
      id: (0, import_pg_core.serial)("id").primaryKey(),
      name: (0, import_pg_core.text)("name").notNull(),
      photoUrl: (0, import_pg_core.text)("photo_url"),
      createdAt: (0, import_pg_core.bigint)("created_at", { mode: "number" }).notNull()
      // epoch ms
    });
    insertRoomSchema = (0, import_drizzle_zod.createInsertSchema)(rooms).omit({ id: true, createdAt: true });
    careProfiles = (0, import_pg_core.pgTable)("care_profiles", {
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
      // Trust / provenance
      sourceCitations: (0, import_pg_core.text)("source_citations").notNull(),
      // JSON: [{label,url}]
      researchStatus: (0, import_pg_core.text)("research_status").notNull().default("seed"),
      // "seed" | "verified"
      researchNotes: (0, import_pg_core.text)("research_notes")
      // free-text TODOs for the follow-up research pass
    });
    insertCareProfileSchema = (0, import_drizzle_zod.createInsertSchema)(careProfiles).omit({ id: true });
    plants = (0, import_pg_core.pgTable)("plants", {
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
    insertPlantSchema = (0, import_drizzle_zod.createInsertSchema)(plants).omit({ id: true, saveDate: true });
    reminders = (0, import_pg_core.pgTable)("reminders", {
      id: (0, import_pg_core.serial)("id").primaryKey(),
      plantId: (0, import_pg_core.integer)("plant_id").notNull(),
      type: (0, import_pg_core.text)("type").notNull(),
      // "water" | "feed" | "light" | "repot"
      dueDate: (0, import_pg_core.bigint)("due_date", { mode: "number" }).notNull(),
      status: (0, import_pg_core.text)("status").notNull().default("pending"),
      // "pending" | "done" | "snoozed"
      createdAt: (0, import_pg_core.bigint)("created_at", { mode: "number" }).notNull()
    });
    insertReminderSchema = (0, import_drizzle_zod.createInsertSchema)(reminders).omit({ id: true, createdAt: true });
    progressPhotos = (0, import_pg_core.pgTable)("progress_photos", {
      id: (0, import_pg_core.serial)("id").primaryKey(),
      plantId: (0, import_pg_core.integer)("plant_id").notNull(),
      photoUrl: (0, import_pg_core.text)("photo_url").notNull(),
      capturedDate: (0, import_pg_core.bigint)("captured_date", { mode: "number" }).notNull(),
      note: (0, import_pg_core.text)("note")
    });
    insertProgressPhotoSchema = (0, import_drizzle_zod.createInsertSchema)(progressPhotos).omit({ id: true });
    notificationLog = (0, import_pg_core.pgTable)("notification_log", {
      id: (0, import_pg_core.serial)("id").primaryKey(),
      reminderId: (0, import_pg_core.integer)("reminder_id"),
      plantId: (0, import_pg_core.integer)("plant_id"),
      title: (0, import_pg_core.text)("title").notNull(),
      body: (0, import_pg_core.text)("body").notNull(),
      sentAt: (0, import_pg_core.bigint)("sent_at", { mode: "number" }).notNull(),
      status: (0, import_pg_core.text)("status").notNull()
      // "sent" | "failed" | "no_subscription"
    });
    insertNotificationLogSchema = (0, import_drizzle_zod.createInsertSchema)(notificationLog).omit({ id: true });
    affiliateLinks = (0, import_pg_core.pgTable)("affiliate_links", {
      id: (0, import_pg_core.serial)("id").primaryKey(),
      category: (0, import_pg_core.text)("category").notNull().unique(),
      // "fertilizer" | "soil" | "pot" | "watering_tools" | "repot_kit"
      label: (0, import_pg_core.text)("label").notNull(),
      searchQuery: (0, import_pg_core.text)("search_query").notNull(),
      // used to build an Amazon search URL
      asin: (0, import_pg_core.text)("asin")
      // optional specific product ASIN, preferred over search when present
    });
    insertAffiliateLinkSchema = (0, import_drizzle_zod.createInsertSchema)(affiliateLinks).omit({ id: true });
    pushSubscriptions = (0, import_pg_core.pgTable)("push_subscriptions", {
      id: (0, import_pg_core.serial)("id").primaryKey(),
      endpoint: (0, import_pg_core.text)("endpoint").notNull().unique(),
      subscriptionJson: (0, import_pg_core.text)("subscription_json").notNull(),
      // full PushSubscription JSON
      createdAt: (0, import_pg_core.bigint)("created_at", { mode: "number" }).notNull()
    });
    insertPushSubscriptionSchema = (0, import_drizzle_zod.createInsertSchema)(pushSubscriptions).omit({ id: true, createdAt: true });
    SUBSCRIPTION_TIERS = ["free", "premium_monthly", "premium_yearly"];
    users = (0, import_pg_core.pgTable)("users", {
      id: (0, import_pg_core.serial)("id").primaryKey(),
      subscriptionTier: (0, import_pg_core.text)("subscription_tier").notNull().default("free"),
      // SubscriptionTier
      subscriptionExpiresAt: (0, import_pg_core.bigint)("subscription_expires_at", { mode: "number" }),
      // epoch ms, null for free tier
      subscriptionRenews: (0, import_pg_core.boolean)("subscription_renews").notNull().default(true),
      createdAt: (0, import_pg_core.bigint)("created_at", { mode: "number" }).notNull()
    });
    insertUserSchema = (0, import_drizzle_zod.createInsertSchema)(users).omit({ id: true, createdAt: true });
  }
});

// shared/pricing.ts
var FREE_PLANT_LIMIT, PREMIUM_MONTHLY_PRICE_USD, PREMIUM_YEARLY_PRICE_USD, PREMIUM_YEARLY_EFFECTIVE_MONTHLY, PREMIUM_YEARLY_SAVINGS_PCT;
var init_pricing = __esm({
  "shared/pricing.ts"() {
    "use strict";
    FREE_PLANT_LIMIT = 3;
    PREMIUM_MONTHLY_PRICE_USD = 4.99;
    PREMIUM_YEARLY_PRICE_USD = 39.99;
    PREMIUM_YEARLY_EFFECTIVE_MONTHLY = PREMIUM_YEARLY_PRICE_USD / 12;
    PREMIUM_YEARLY_SAVINGS_PCT = Math.round(
      (1 - PREMIUM_YEARLY_EFFECTIVE_MONTHLY / PREMIUM_MONTHLY_PRICE_USD) * 100
    );
  }
});

// server/care-profile-seed.ts
var CITATIONS, careProfileSeeds;
var init_care_profile_seed = __esm({
  "server/care-profile-seed.ts"() {
    "use strict";
    CITATIONS = {
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
    careProfileSeeds = [
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
  }
});

// server/affiliate-seed.ts
var affiliateLinkSeeds;
var init_affiliate_seed = __esm({
  "server/affiliate-seed.ts"() {
    "use strict";
    affiliateLinkSeeds = [
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
  }
});

// server/storage.ts
async function count(table) {
  const [row] = await client.unsafe(`SELECT COUNT(*)::int AS c FROM ${table}`);
  return Number(row.c);
}
async function bootstrap() {
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
  if (await count("care_profiles") === 0) {
    await db.insert(careProfiles).values(
      careProfileSeeds.map((s) => ({
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
        sourceCitations: JSON.stringify(s.sourceCitations),
        researchStatus: "seed",
        researchNotes: null
      }))
    );
    console.log(`[storage] Seeded ${careProfileSeeds.length} care_profiles rows.`);
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
var import_postgres_js, import_postgres, import_drizzle_orm, connectionString, client, db, BOOTSTRAP_DDL, dbReady, DatabaseStorage, storage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_schema();
    init_pricing();
    import_postgres_js = require("drizzle-orm/postgres-js");
    import_postgres = __toESM(require("postgres"), 1);
    import_drizzle_orm = require("drizzle-orm");
    init_care_profile_seed();
    init_affiliate_seed();
    connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "DATABASE_URL is not set. Dirt & Leaf now uses Postgres \u2014 copy .env.example to .env and set DATABASE_URL."
      );
    }
    client = (0, import_postgres.default)(connectionString, { max: 1, prepare: false });
    db = (0, import_postgres_js.drizzle)(client);
    BOOTSTRAP_DDL = `
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
  source_citations TEXT NOT NULL,
  research_status TEXT NOT NULL DEFAULT 'seed',
  research_notes TEXT
);

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
    dbReady = bootstrap();
    dbReady.catch((err) => {
      console.error("[storage] Database bootstrap failed:", err);
    });
    DatabaseStorage = class {
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
    storage = new DatabaseStorage();
  }
});

// server/plant-id.ts
function mockIdentify() {
  console.log(
    "[plant-id] MOCK MODE: PLANT_ID_API_KEY is not set. Returning deterministic mock identification results so the app remains testable end to end. Get a real key at https://web.plant.id/ and set PLANT_ID_API_KEY to enable live identification."
  );
  return {
    mock: true,
    suggestions: [
      { id: "mock-monstera-deliciosa", commonName: "Monstera deliciosa", scientificName: "Monstera deliciosa", probability: 0.94, similarImageUrl: STOCK_PHOTOS.monstera },
      { id: "mock-mini-monstera", commonName: "Mini monstera", scientificName: "Rhaphidophora tetrasperma", probability: 0.82, similarImageUrl: STOCK_PHOTOS.miniMonstera },
      { id: "mock-tree-philodendron", commonName: "Tree philodendron", scientificName: "Philodendron bipinnatifidum", probability: 0.76, similarImageUrl: STOCK_PHOTOS.philodendron }
    ]
  };
}
async function fetchFromPlantId(imageBase64) {
  const apiKey = process.env.PLANT_ID_API_KEY;
  const response = await fetch(PLANT_ID_HOST, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Api-Key": apiKey
    },
    body: JSON.stringify({
      images: [imageBase64],
      modifiers: ["similar_images"],
      plant_details: [
        "common_names",
        "url",
        "wiki_description",
        "taxonomy",
        "watering"
      ],
      plant_language: "en"
    })
  });
  if (!response.ok) {
    const text2 = await response.text().catch(() => "");
    throw new Error(`Plant.id API error ${response.status}: ${text2}`);
  }
  const data = await response.json();
  const suggestions = (data.suggestions ?? []).slice(0, 5).map((s) => ({
    id: String(s.id ?? s.plant_name),
    commonName: s.plant_details?.common_names?.[0] ?? s.plant_name,
    scientificName: s.plant_name,
    probability: s.probability ?? 0,
    similarImageUrl: s.similar_images?.[0]?.url ?? ""
  }));
  if (suggestions.length < 3) {
    console.warn(`[plant-id] API returned only ${suggestions.length} suggestion(s); expected 3-5.`);
  }
  return { suggestions, mock: false };
}
async function identifyPlant(imageBase64) {
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
var PLANT_ID_HOST, STOCK_PHOTOS;
var init_plant_id = __esm({
  "server/plant-id.ts"() {
    "use strict";
    PLANT_ID_HOST = "https://api.plant.id/v2/identify";
    STOCK_PHOTOS = {
      monstera: "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/4643d8940a3a1b5edbae380c8f1667def76247aa.jpg",
      miniMonstera: "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/0509bcf44436822dcb9999f9c0d1ddcdd08ca135.jpg",
      philodendron: "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/dbd7a70d946d6bdadc5ff96b8b607fc36c15f29c.jpg",
      livingRoom: "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/2f7d59b0b46396ab6a280ae4cc1ba831b83cb102.jpg",
      office: "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/0b3fa622feb42c41ca3fbb785fe0014d25ce6980.jpg",
      products: "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/19fe21f5dc77d469dea6f87ba3ecd6097a56bd1c.jpg"
    };
  }
});

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
var init_weather = __esm({
  "server/weather.ts"() {
    "use strict";
  }
});

// server/care-scheduling.ts
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
var DAY_MS;
var init_care_scheduling = __esm({
  "server/care-scheduling.ts"() {
    "use strict";
    init_weather();
    DAY_MS = 24 * 60 * 60 * 1e3;
  }
});

// server/nurseries.ts
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
var OVERPASS_URL, MILES_TO_METERS;
var init_nurseries = __esm({
  "server/nurseries.ts"() {
    "use strict";
    OVERPASS_URL = "https://overpass-api.de/api/interpreter";
    MILES_TO_METERS = 1609.34;
  }
});

// server/affiliate.ts
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
var FALLBACK_TAG;
var init_affiliate = __esm({
  "server/affiliate.ts"() {
    "use strict";
    FALLBACK_TAG = "YOUR-ASSOCIATES-TAG-20";
  }
});

// server/push.ts
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
var import_web_push, DEV_VAPID_PUBLIC_KEY, DEV_VAPID_PRIVATE_KEY, publicKey, privateKey, pushConfigured, vapidPublicKey;
var init_push = __esm({
  "server/push.ts"() {
    "use strict";
    import_web_push = __toESM(require("web-push"), 1);
    DEV_VAPID_PUBLIC_KEY = "BMahVCo20wGvxca97xdAcW7MLU_vytGfWeziTzGPKrEYcq6fJlKm_ddrlsftMmQ9jCX6igleqozn_LD6SeYDEcY";
    DEV_VAPID_PRIVATE_KEY = "uG3SdZfPRabPQbKEh8aMLO-C-Z8SR6dicC8qC5nAUqM";
    publicKey = process.env.VAPID_PUBLIC_KEY || DEV_VAPID_PUBLIC_KEY;
    privateKey = process.env.VAPID_PRIVATE_KEY || DEV_VAPID_PRIVATE_KEY;
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      console.log(
        "[push] VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY not set \u2014 using a bundled DEV-ONLY keypair so push notifications work in local testing. Generate your own permanent keys with `npx web-push generate-vapid-keys` before going to production."
      );
    }
    pushConfigured = false;
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
    vapidPublicKey = pushConfigured ? publicKey : "";
  }
});

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
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err?.message ?? "Identification failed" });
    }
  });
  app.get("/api/care-profiles", async (_req, res) => {
    const list = await storage.listCareProfiles();
    res.json(list.map(withParsedCitations));
  });
  app.get("/api/care-profiles/lookup", async (req, res) => {
    const name = String(req.query.name ?? "");
    const profile = await storage.findCareProfileByName(name);
    res.json(profile ? withParsedCitations(profile) : null);
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
var init_routes = __esm({
  "server/routes.ts"() {
    "use strict";
    init_storage();
    init_plant_id();
    init_care_scheduling();
    init_weather();
    init_nurseries();
    init_affiliate();
    init_push();
    init_schema();
    init_pricing();
  }
});

// server/app.ts
var app_exports = {};
__export(app_exports, {
  createApp: () => createApp,
  log: () => log
});
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
var import_config, import_express, import_node_http;
var init_app = __esm({
  "server/app.ts"() {
    "use strict";
    import_config = require("dotenv/config");
    import_express = __toESM(require("express"), 1);
    import_node_http = require("node:http");
    init_routes();
  }
});

// script/api-entry.ts
var api_entry_exports = {};
__export(api_entry_exports, {
  default: () => handler
});
module.exports = __toCommonJS(api_entry_exports);
async function handler(req, res) {
  try {
    const { createApp: createApp2 } = await Promise.resolve().then(() => (init_app(), app_exports));
    const { app } = await createApp2();
    res.statusCode = 200;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: err?.message || String(err), stack: err?.stack }));
  }
}
