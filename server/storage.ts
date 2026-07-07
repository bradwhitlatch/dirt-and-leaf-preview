import {
  rooms, careProfiles, plants, reminders, progressPhotos, notificationLog, affiliateLinks, pushSubscriptions, users,
} from "@shared/schema";
import type {
  Room, InsertRoom,
  CareProfile, InsertCareProfile,
  Plant, InsertPlant,
  Reminder, InsertReminder,
  ProgressPhoto, InsertProgressPhoto,
  NotificationLogEntry, InsertNotificationLog,
  AffiliateLink, InsertAffiliateLink,
  PushSubscription, InsertPushSubscription,
  User, SubscriptionTier,
} from "@shared/schema";
import { FREE_PLANT_LIMIT } from "@shared/pricing";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, asc, sql } from "drizzle-orm";
import { careProfileSeeds } from "./care-profile-seed";
import { affiliateLinkSeeds } from "./affiliate-seed";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Dirt & Leaf now uses Postgres — copy .env.example to .env and set DATABASE_URL."
  );
}

// `max: 1` keeps the pool tiny, which is what serverless (Vercel) wants: each
// warm function instance holds at most one connection. `prepare: false` is
// required for transaction-pooler connection strings (PgBouncer / Neon pooled
// endpoint) that don't support prepared statements. `connect_timeout` is raised
// to 15s (Neon's recommendation) because the free-tier compute suspends after
// ~5 min idle and the first connection after a cold period must wait for it to
// wake — the postgres-js default is too aggressive and surfaces as a
// `write CONNECT_TIMEOUT` error on the very first request. See `withRetry`
// below, which also retries the initial connection with backoff.
const client = postgres(connectionString, {
  max: 1,
  prepare: false,
  connect_timeout: 15,
});

// Retry an operation with short exponential backoff. Used for the initial
// database connection: Neon's free-tier compute auto-suspends after ~5 minutes
// of no queries, so the first query after an idle period can transiently fail
// with a connection timeout while the compute wakes (typically a few hundred ms
// to a couple of seconds). Retrying transparently turns that into a success
// instead of a 500 to the client. The total worst-case wait (0.5 + 1 + 2 = 3.5s
// of backoff, plus up to 15s per connect attempt) stays well inside the Vercel
// function budget (maxDuration: 30s in vercel.json).
async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  const delaysMs = [500, 1000, 2000];
  let lastErr: unknown;
  for (let attempt = 0; attempt <= delaysMs.length; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === delaysMs.length) break;
      const delay = delaysMs[attempt];
      console.warn(
        `[storage] ${label} failed (attempt ${attempt + 1}/${delaysMs.length + 1}); ` +
          `retrying in ${delay}ms. This is expected on a cold Neon compute. Cause: ` +
          (err instanceof Error ? err.message : String(err))
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastErr;
}

export const db = drizzle(client);

// ---------------------------------------------------------------------------
// Schema bootstrap — the fullstack template doesn't run drizzle-kit migrate
// automatically, so we create tables directly if they don't exist yet. This
// keeps `npm run dev` self-contained with zero extra steps. In production the
// schema is created ahead of time via `npm run db:push`; these statements are
// idempotent (CREATE TABLE IF NOT EXISTS) so running them again is harmless.
// ---------------------------------------------------------------------------
const BOOTSTRAP_DDL = `
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

async function count(table: string): Promise<number> {
  const [row] = await client.unsafe<{ c: string }[]>(`SELECT COUNT(*)::int AS c FROM ${table}`);
  return Number(row.c);
}

// Seed exactly one user row (single-user local app), care_profiles,
// affiliate_links, and the two default rooms on first run only. Every step is
// idempotent (guarded by a row count) so this is safe to call on every boot,
// including serverless cold starts.
async function bootstrap() {
  // Warm the connection first, with retries, so a cold Neon compute wakes up
  // before we run any real work. Everything after this runs on an awake compute.
  // Without this, the first query below fails with `write CONNECT_TIMEOUT` on a
  // cold start and bubbles up as a 500 (`server_initialization_failed`) to the
  // client — a retry a few seconds later would have succeeded.
  await withRetry(() => client`SELECT 1`, "initial database connection");

  await client.unsafe(BOOTSTRAP_DDL);

  if ((await count("users")) === 0) {
    await db.insert(users).values({
      subscriptionTier: "free",
      subscriptionExpiresAt: null,
      subscriptionRenews: true,
      createdAt: Date.now(),
    });
    console.log("[storage] Seeded default free-tier user row.");
  }

  if ((await count("care_profiles")) === 0) {
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
        researchNotes: null,
      }))
    );
    console.log(`[storage] Seeded ${careProfileSeeds.length} care_profiles rows.`);
  }

  if ((await count("affiliate_links")) === 0) {
    await db.insert(affiliateLinks).values(
      affiliateLinkSeeds.map((s) => ({
        category: s.category,
        label: s.label,
        searchQuery: s.searchQuery,
        asin: s.asin ?? null,
      }))
    );
    console.log(`[storage] Seeded ${affiliateLinkSeeds.length} affiliate_links rows.`);
  }

  // Seed a couple of default rooms ("Spaces") on first run only, matching the
  // approved UI reference (Living room / Office) so Home has somewhere to
  // assign a freshly-scanned plant to on day one. Users are not asked to set
  // up rooms manually per the "one photo, that's it" simplicity requirement.
  if ((await count("rooms")) === 0) {
    const now = Date.now();
    await db.insert(rooms).values([
      {
        name: "Living room",
        photoUrl:
          "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/2f7d59b0b46396ab6a280ae4cc1ba831b83cb102.jpg",
        createdAt: now,
      },
      {
        name: "Office",
        photoUrl:
          "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/0b3fa622feb42c41ca3fbb785fe0014d25ce6980.jpg",
        createdAt: now,
      },
    ]);
    console.log("[storage] Seeded 2 default rooms (Living room, Office).");
  }
}

// Kicked off at import time; awaited by registerRoutes (see server/routes.ts)
// so no request is served before the schema + seed data exist.
export const dbReady: Promise<void> = bootstrap();

// Attach a no-op rejection handler so that if bootstrap() fails before the
// first request awaits `dbReady`, Node does not treat it as an *unhandled*
// rejection. On Vercel's serverless runtime an unhandled rejection during
// function initialization crashes the whole instance (FUNCTION_INVOCATION_FAILED
// on every route). registerRoutes still `await`s dbReady, so a genuine failure
// is surfaced per-request by the Express error handler instead of killing init.
dbReady.catch((err) => {
  console.error("[storage] Database bootstrap failed:", err);
});

// ---------------------------------------------------------------------------
// Storage interface
// ---------------------------------------------------------------------------
export interface IStorage {
  // Rooms
  listRooms(): Promise<Room[]>;
  getRoom(id: number): Promise<Room | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;

  // Care profiles
  listCareProfiles(): Promise<CareProfile[]>;
  getCareProfile(id: number): Promise<CareProfile | undefined>;
  getCareProfileBySpeciesKey(speciesKey: string): Promise<CareProfile | undefined>;
  findCareProfileByName(name: string): Promise<CareProfile | undefined>;

  // Plants
  listPlants(): Promise<Plant[]>;
  listPlantsByRoom(roomId: number): Promise<Plant[]>;
  getPlant(id: number): Promise<Plant | undefined>;
  createPlant(plant: InsertPlant): Promise<Plant>;
  updatePlantSchedule(id: number, nextWaterDate: number, nextFeedDate: number | null): Promise<void>;

  // Reminders
  listReminders(): Promise<Reminder[]>;
  listRemindersByPlant(plantId: number): Promise<Reminder[]>;
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  updateReminderStatus(id: number, status: string): Promise<void>;

  // Progress photos
  listProgressPhotos(plantId: number): Promise<ProgressPhoto[]>;
  createProgressPhoto(photo: InsertProgressPhoto): Promise<ProgressPhoto>;

  // Notification log
  createNotificationLog(entry: InsertNotificationLog): Promise<NotificationLogEntry>;
  listNotificationLog(): Promise<NotificationLogEntry[]>;

  // Affiliate links
  listAffiliateLinks(): Promise<AffiliateLink[]>;
  getAffiliateLinkByCategory(category: string): Promise<AffiliateLink | undefined>;

  // Push subscriptions
  listPushSubscriptions(): Promise<PushSubscription[]>;
  createPushSubscription(sub: InsertPushSubscription): Promise<PushSubscription>;

  // Users / subscription (single-user app: always operates on user id 1)
  getCurrentUser(): Promise<User>;
  setSubscriptionTier(tier: SubscriptionTier, expiresAt: number | null): Promise<User>;
  canTrackAdditionalPlant(): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async listRooms(): Promise<Room[]> {
    return db.select().from(rooms).orderBy(asc(rooms.id));
  }
  async getRoom(id: number): Promise<Room | undefined> {
    const [row] = await db.select().from(rooms).where(eq(rooms.id, id));
    return row;
  }
  async createRoom(room: InsertRoom): Promise<Room> {
    const [row] = await db.insert(rooms).values({ ...room, createdAt: Date.now() }).returning();
    return row;
  }

  async listCareProfiles(): Promise<CareProfile[]> {
    return db.select().from(careProfiles);
  }
  async getCareProfile(id: number): Promise<CareProfile | undefined> {
    const [row] = await db.select().from(careProfiles).where(eq(careProfiles.id, id));
    return row;
  }
  async getCareProfileBySpeciesKey(speciesKey: string): Promise<CareProfile | undefined> {
    const [row] = await db.select().from(careProfiles).where(eq(careProfiles.speciesKey, speciesKey));
    return row;
  }
  async findCareProfileByName(name: string): Promise<CareProfile | undefined> {
    const all = await this.listCareProfiles();
    const lower = name.toLowerCase();
    return all.find(
      (p) => p.commonName.toLowerCase() === lower || p.scientificName.toLowerCase() === lower
    ) ?? all.find(
      (p) => lower.includes(p.commonName.toLowerCase()) || p.commonName.toLowerCase().includes(lower)
    );
  }

  async listPlants(): Promise<Plant[]> {
    return db.select().from(plants).orderBy(asc(plants.id));
  }
  async listPlantsByRoom(roomId: number): Promise<Plant[]> {
    return db.select().from(plants).where(eq(plants.roomId, roomId));
  }
  async getPlant(id: number): Promise<Plant | undefined> {
    const [row] = await db.select().from(plants).where(eq(plants.id, id));
    return row;
  }
  async createPlant(plant: InsertPlant): Promise<Plant> {
    const [row] = await db.insert(plants).values({ ...plant, saveDate: Date.now() }).returning();
    return row;
  }
  async updatePlantSchedule(id: number, nextWaterDate: number, nextFeedDate: number | null): Promise<void> {
    await db.update(plants).set({ nextWaterDate, nextFeedDate }).where(eq(plants.id, id));
  }

  async listReminders(): Promise<Reminder[]> {
    return db.select().from(reminders);
  }
  async listRemindersByPlant(plantId: number): Promise<Reminder[]> {
    return db.select().from(reminders).where(eq(reminders.plantId, plantId));
  }
  async createReminder(reminder: InsertReminder): Promise<Reminder> {
    const [row] = await db.insert(reminders).values({ ...reminder, createdAt: Date.now() }).returning();
    return row;
  }
  async updateReminderStatus(id: number, status: string): Promise<void> {
    await db.update(reminders).set({ status }).where(eq(reminders.id, id));
  }

  async listProgressPhotos(plantId: number): Promise<ProgressPhoto[]> {
    return db.select().from(progressPhotos).where(eq(progressPhotos.plantId, plantId));
  }
  async createProgressPhoto(photo: InsertProgressPhoto): Promise<ProgressPhoto> {
    const [row] = await db.insert(progressPhotos).values(photo).returning();
    return row;
  }

  async createNotificationLog(entry: InsertNotificationLog): Promise<NotificationLogEntry> {
    const [row] = await db.insert(notificationLog).values(entry).returning();
    return row;
  }
  async listNotificationLog(): Promise<NotificationLogEntry[]> {
    return db.select().from(notificationLog);
  }

  async listAffiliateLinks(): Promise<AffiliateLink[]> {
    return db.select().from(affiliateLinks);
  }
  async getAffiliateLinkByCategory(category: string): Promise<AffiliateLink | undefined> {
    const [row] = await db.select().from(affiliateLinks).where(eq(affiliateLinks.category, category));
    return row;
  }

  async listPushSubscriptions(): Promise<PushSubscription[]> {
    return db.select().from(pushSubscriptions);
  }
  async createPushSubscription(sub: InsertPushSubscription): Promise<PushSubscription> {
    const [row] = await db.insert(pushSubscriptions).values({ ...sub, createdAt: Date.now() }).returning();
    return row;
  }

  async getCurrentUser(): Promise<User> {
    const [existing] = await db.select().from(users).where(eq(users.id, 1));
    if (existing) return existing;
    // Defensive fallback in case the seed row is ever missing.
    const [created] = await db
      .insert(users)
      .values({ subscriptionTier: "free", subscriptionExpiresAt: null, subscriptionRenews: true, createdAt: Date.now() })
      .returning();
    return created;
  }

  async setSubscriptionTier(tier: SubscriptionTier, expiresAt: number | null): Promise<User> {
    const current = await this.getCurrentUser();
    const [row] = await db
      .update(users)
      .set({ subscriptionTier: tier, subscriptionExpiresAt: expiresAt, subscriptionRenews: true })
      .where(eq(users.id, current.id))
      .returning();
    return row;
  }

  async canTrackAdditionalPlant(): Promise<boolean> {
    const user = await this.getCurrentUser();
    if (user.subscriptionTier !== "free") return true;
    const [row] = await db.select({ c: sql<number>`count(*)::int` }).from(plants);
    return Number(row.c) < FREE_PLANT_LIMIT;
  }
}

export const storage = new DatabaseStorage();
