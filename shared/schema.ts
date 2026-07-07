import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * Dirt & Leaf data model
 * ----------------------
 * See README.md "Where things live" section for a map of which routes/UI
 * consume each table.
 *
 * SQLite (via better-sqlite3 + Drizzle) does not support array or nested
 * object columns, so anywhere the domain model needs a list/object
 * (e.g. Plant.id suggestion lists, step arrays, source citation lists)
 * we store JSON text and parse/stringify it in the storage layer.
 */

// ---------------------------------------------------------------------------
// Rooms ("Spaces" in the UI: Living room, Office, etc.)
// ---------------------------------------------------------------------------
export const rooms = sqliteTable("rooms", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  photoUrl: text("photo_url"),
  createdAt: integer("created_at").notNull(), // epoch ms
});

export const insertRoomSchema = createInsertSchema(rooms).omit({ id: true, createdAt: true });
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof rooms.$inferSelect;

// ---------------------------------------------------------------------------
// Care profiles — SPECIES-LEVEL reference data, seeded once, looked up by
// every plant of that species. This is the "deep research" table: each
// field is meant to represent a synthesized answer across multiple
// authoritative source types (university extension horticulture programs,
// established houseplant reference books, specialist grower/nursery
// guidance) rather than a single API's thin default response. Plant.id
// gives us the *visual match*; this table gives us the *care truth* that
// actually drives reminders, product recommendations, and placement advice.
//
// `sourceCitations` is a JSON-encoded array of { label, url } objects so a
// future research pass can attach real citations per species/field, and the
// UI can eventually surface "based on university extension + grower
// guidance" style trust copy.
//
// `researchStatus` flags how deep the enrichment pass on that row has gone:
//   "seed"       -> initial best-available synthesis at build time (this build)
//   "verified"   -> a dedicated research pass has fact-checked/cited it
// See README.md "Care data research process" for the follow-up workflow.
// ---------------------------------------------------------------------------
export const careProfiles = sqliteTable("care_profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  speciesKey: text("species_key").notNull().unique(), // slug, e.g. "monstera-deliciosa"
  commonName: text("common_name").notNull(),
  scientificName: text("scientific_name").notNull(),
  // Watering
  waterIntervalDaysMin: integer("water_interval_days_min").notNull(),
  waterIntervalDaysMax: integer("water_interval_days_max").notNull(),
  waterNotes: text("water_notes").notNull(),
  // Feeding
  feedIntervalDaysActive: integer("feed_interval_days_active").notNull(), // growing season
  feedIntervalDaysDormant: integer("feed_interval_days_dormant"), // null = skip feeding when dormant
  feedNotes: text("feed_notes").notNull(),
  // Light & placement
  lightRequirement: text("light_requirement").notNull(), // e.g. "bright_indirect"
  placementNotes: text("placement_notes").notNull(),
  // Soil & repotting
  soilType: text("soil_type").notNull(),
  repotIntervalMonths: integer("repot_interval_months"),
  // Environment ranges (used to cross-check against live weather/season)
  idealTempMinF: integer("ideal_temp_min_f"),
  idealTempMaxF: integer("ideal_temp_max_f"),
  idealHumidityPct: integer("ideal_humidity_pct"),
  toxicity: text("toxicity"), // e.g. "Toxic to cats and dogs if ingested"
  matureSizeNotes: text("mature_size_notes"),
  // Trust / provenance
  sourceCitations: text("source_citations").notNull(), // JSON: [{label,url}]
  researchStatus: text("research_status").notNull().default("seed"), // "seed" | "verified"
  researchNotes: text("research_notes"), // free-text TODOs for the follow-up research pass
});

export const insertCareProfileSchema = createInsertSchema(careProfiles).omit({ id: true });
export type InsertCareProfile = z.infer<typeof insertCareProfileSchema>;
export type CareProfile = typeof careProfiles.$inferSelect;

// ---------------------------------------------------------------------------
// Plants — one row per plant the user has actually saved (starts empty).
// ---------------------------------------------------------------------------
export const plants = sqliteTable("plants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  roomId: integer("room_id").notNull(),
  careProfileId: integer("care_profile_id"), // nullable: matched species may not be in reference table yet
  commonName: text("common_name").notNull(),
  scientificName: text("scientific_name"),
  curatedPhotoUrl: text("curated_photo_url"), // stock/reference image for the matched species
  userPhotoUrl: text("user_photo_url"), // the original ID photo (never shown as the "main" photo per spec)
  confirmedConfidence: real("confirmed_confidence"), // 0-1, from the Plant.id suggestion the user tapped
  matchCandidates: text("match_candidates"), // JSON: full top-3..5 suggestion list at save time (audit trail)
  saveDate: integer("save_date").notNull(),
  // Location snapshot at save time, used to compute the initial schedule
  locationLat: real("location_lat"),
  locationLon: real("location_lon"),
  locationLabel: text("location_label"), // reverse-geocoded city/region
  hardinessZone: text("hardiness_zone"),
  potSizeInches: integer("pot_size_inches"),
  nextWaterDate: integer("next_water_date"),
  nextFeedDate: integer("next_feed_date"),
});

export const insertPlantSchema = createInsertSchema(plants).omit({ id: true, saveDate: true });
export type InsertPlant = z.infer<typeof insertPlantSchema>;
export type Plant = typeof plants.$inferSelect;

// ---------------------------------------------------------------------------
// Reminders — computed queue of upcoming/overdue water/feed/light/repot tasks
// ---------------------------------------------------------------------------
export const reminders = sqliteTable("reminders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  plantId: integer("plant_id").notNull(),
  type: text("type").notNull(), // "water" | "feed" | "light" | "repot"
  dueDate: integer("due_date").notNull(),
  status: text("status").notNull().default("pending"), // "pending" | "done" | "snoozed"
  createdAt: integer("created_at").notNull(),
});

export const insertReminderSchema = createInsertSchema(reminders).omit({ id: true, createdAt: true });
export type InsertReminder = z.infer<typeof insertReminderSchema>;
export type Reminder = typeof reminders.$inferSelect;

// ---------------------------------------------------------------------------
// Progress photos — growth-tracking photos, compared against the FIRST saved
// analysis photo. Never overwrites plants.curatedPhotoUrl or the original ID photo.
// ---------------------------------------------------------------------------
export const progressPhotos = sqliteTable("progress_photos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  plantId: integer("plant_id").notNull(),
  photoUrl: text("photo_url").notNull(),
  capturedDate: integer("captured_date").notNull(),
  note: text("note"),
});

export const insertProgressPhotoSchema = createInsertSchema(progressPhotos).omit({ id: true });
export type InsertProgressPhoto = z.infer<typeof insertProgressPhotoSchema>;
export type ProgressPhoto = typeof progressPhotos.$inferSelect;

// ---------------------------------------------------------------------------
// Notification log — records of push notifications actually sent/attempted
// ---------------------------------------------------------------------------
export const notificationLog = sqliteTable("notification_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reminderId: integer("reminder_id"),
  plantId: integer("plant_id"),
  title: text("title").notNull(),
  body: text("body").notNull(),
  sentAt: integer("sent_at").notNull(),
  status: text("status").notNull(), // "sent" | "failed" | "no_subscription"
});

export const insertNotificationLogSchema = createInsertSchema(notificationLog).omit({ id: true });
export type InsertNotificationLog = z.infer<typeof insertNotificationLogSchema>;
export type NotificationLogEntry = typeof notificationLog.$inferSelect;

// ---------------------------------------------------------------------------
// Affiliate links — product category -> Amazon Associates link builder input
// ---------------------------------------------------------------------------
export const affiliateLinks = sqliteTable("affiliate_links", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  category: text("category").notNull().unique(), // "fertilizer" | "soil" | "pot" | "watering_tools" | "repot_kit"
  label: text("label").notNull(),
  searchQuery: text("search_query").notNull(), // used to build an Amazon search URL
  asin: text("asin"), // optional specific product ASIN, preferred over search when present
});

export const insertAffiliateLinkSchema = createInsertSchema(affiliateLinks).omit({ id: true });
export type InsertAffiliateLink = z.infer<typeof insertAffiliateLinkSchema>;
export type AffiliateLink = typeof affiliateLinks.$inferSelect;

// ---------------------------------------------------------------------------
// Push subscriptions — Web Push (Notification/Push API) subscription objects
// ---------------------------------------------------------------------------
export const pushSubscriptions = sqliteTable("push_subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  endpoint: text("endpoint").notNull().unique(),
  subscriptionJson: text("subscription_json").notNull(), // full PushSubscription JSON
  createdAt: integer("created_at").notNull(),
});

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({ id: true, createdAt: true });
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;

// ---------------------------------------------------------------------------
// Subscription tiers — freemium + subscription pricing model.
// ---------------------------------------------------------------------------
// "free"             -> unlimited scans/IDs, but tracked plants capped at
//                       FREE_PLANT_LIMIT (see shared/pricing.ts)
// "premium_monthly"  -> $4.99/mo, unlimited tracked plants + full feature set
// "premium_yearly"   -> $39.99/yr (~33% off monthly), same unlocks
// ---------------------------------------------------------------------------
export const SUBSCRIPTION_TIERS = ["free", "premium_monthly", "premium_yearly"] as const;
export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number];

// ---------------------------------------------------------------------------
// Users — this build ships as a single-user local app (no login flow in the
// spec), so this table holds exactly one row representing "the app owner's"
// account/subscription state. It is modeled as a real table (not a config
// file) specifically so a future multi-user/auth pass is additive, not a
// rewrite: add an auth id + foreign keys from rooms/plants to userId.
// ---------------------------------------------------------------------------
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  subscriptionTier: text("subscription_tier").notNull().default("free"), // SubscriptionTier
  subscriptionExpiresAt: integer("subscription_expires_at"), // epoch ms, null for free tier
  subscriptionRenews: integer("subscription_renews", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at").notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
