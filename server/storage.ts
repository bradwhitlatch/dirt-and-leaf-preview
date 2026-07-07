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
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, asc } from "drizzle-orm";
import { careProfileSeeds } from "./care-profile-seed";
import { affiliateLinkSeeds } from "./affiliate-seed";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite);

// ---------------------------------------------------------------------------
// Schema bootstrap — the fullstack template doesn't run drizzle-kit migrate
// automatically, so we create tables directly if they don't exist yet. This
// keeps `npm run dev` / `npm run build` self-contained with zero extra steps.
// ---------------------------------------------------------------------------
sqlite.exec(`
CREATE TABLE IF NOT EXISTS rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  photo_url TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS care_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
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
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id INTEGER NOT NULL,
  care_profile_id INTEGER,
  common_name TEXT NOT NULL,
  scientific_name TEXT,
  curated_photo_url TEXT,
  user_photo_url TEXT,
  confirmed_confidence REAL,
  match_candidates TEXT,
  save_date INTEGER NOT NULL,
  location_lat REAL,
  location_lon REAL,
  location_label TEXT,
  hardiness_zone TEXT,
  pot_size_inches INTEGER,
  next_water_date INTEGER,
  next_feed_date INTEGER
);

CREATE TABLE IF NOT EXISTS reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plant_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  due_date INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS progress_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plant_id INTEGER NOT NULL,
  photo_url TEXT NOT NULL,
  captured_date INTEGER NOT NULL,
  note TEXT
);

CREATE TABLE IF NOT EXISTS notification_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reminder_id INTEGER,
  plant_id INTEGER,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at INTEGER NOT NULL,
  status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS affiliate_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  search_query TEXT NOT NULL,
  asin TEXT
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  endpoint TEXT NOT NULL UNIQUE,
  subscription_json TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subscription_tier TEXT NOT NULL DEFAULT 'free',
  subscription_expires_at INTEGER,
  subscription_renews INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);
`);

// Seed exactly one user row (single-user local app) on first run.
function seedUserIfEmpty() {
  const count = sqlite.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number };
  if (count.c === 0) {
    sqlite
      .prepare(
        "INSERT INTO users (subscription_tier, subscription_expires_at, subscription_renews, created_at) VALUES (?,?,?,?)"
      )
      .run("free", null, 1, Date.now());
    console.log("[storage] Seeded default free-tier user row.");
  }
}
seedUserIfEmpty();

// ---------------------------------------------------------------------------
// Seed care_profiles + affiliate_links on first run only (idempotent).
// ---------------------------------------------------------------------------
function seedIfEmpty() {
  const careCount = sqlite.prepare("SELECT COUNT(*) as c FROM care_profiles").get() as { c: number };
  if (careCount.c === 0) {
    const insert = sqlite.prepare(`
      INSERT INTO care_profiles (
        species_key, common_name, scientific_name,
        water_interval_days_min, water_interval_days_max, water_notes,
        feed_interval_days_active, feed_interval_days_dormant, feed_notes,
        light_requirement, placement_notes, soil_type, repot_interval_months,
        ideal_temp_min_f, ideal_temp_max_f, ideal_humidity_pct, toxicity, mature_size_notes,
        source_citations, research_status, research_notes
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `);
    const insertMany = sqlite.transaction((seeds: typeof careProfileSeeds) => {
      for (const s of seeds) {
        insert.run(
          s.speciesKey, s.commonName, s.scientificName,
          s.waterIntervalDaysMin, s.waterIntervalDaysMax, s.waterNotes,
          s.feedIntervalDaysActive, s.feedIntervalDaysDormant ?? null, s.feedNotes,
          s.lightRequirement, s.placementNotes, s.soilType, s.repotIntervalMonths ?? null,
          s.idealTempMinF ?? null, s.idealTempMaxF ?? null, s.idealHumidityPct ?? null,
          s.toxicity ?? null, s.matureSizeNotes ?? null,
          JSON.stringify(s.sourceCitations), "seed", null
        );
      }
    });
    insertMany(careProfileSeeds);
    console.log(`[storage] Seeded ${careProfileSeeds.length} care_profiles rows.`);
  }

  const affCount = sqlite.prepare("SELECT COUNT(*) as c FROM affiliate_links").get() as { c: number };
  if (affCount.c === 0) {
    const insert = sqlite.prepare(
      `INSERT INTO affiliate_links (category, label, search_query, asin) VALUES (?,?,?,?)`
    );
    const insertMany = sqlite.transaction((seeds: typeof affiliateLinkSeeds) => {
      for (const s of seeds) insert.run(s.category, s.label, s.searchQuery, s.asin ?? null);
    });
    insertMany(affiliateLinkSeeds);
    console.log(`[storage] Seeded ${affiliateLinkSeeds.length} affiliate_links rows.`);
  }
}
seedIfEmpty();

// Seed a couple of default rooms ("Spaces") on first run only, matching the
// approved UI reference (Living room / Office) so Home has somewhere to
// assign a freshly-scanned plant to on day one. Users are not asked to set
// up rooms manually per the "one photo, that's it" simplicity requirement.
function seedRoomsIfEmpty() {
  const count = sqlite.prepare("SELECT COUNT(*) as c FROM rooms").get() as { c: number };
  if (count.c === 0) {
    const insert = sqlite.prepare(`INSERT INTO rooms (name, photo_url, created_at) VALUES (?,?,?)`);
    const now = Date.now();
    insert.run(
      "Living room",
      "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/2f7d59b0b46396ab6a280ae4cc1ba831b83cb102.jpg",
      now
    );
    insert.run(
      "Office",
      "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/0b3fa622feb42c41ca3fbb785fe0014d25ce6980.jpg",
      now
    );
    console.log("[storage] Seeded 2 default rooms (Living room, Office).");
  }
}
seedRoomsIfEmpty();

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
    return db.select().from(rooms).orderBy(asc(rooms.id)).all();
  }
  async getRoom(id: number): Promise<Room | undefined> {
    return db.select().from(rooms).where(eq(rooms.id, id)).get();
  }
  async createRoom(room: InsertRoom): Promise<Room> {
    return db.insert(rooms).values({ ...room, createdAt: Date.now() }).returning().get();
  }

  async listCareProfiles(): Promise<CareProfile[]> {
    return db.select().from(careProfiles).all();
  }
  async getCareProfile(id: number): Promise<CareProfile | undefined> {
    return db.select().from(careProfiles).where(eq(careProfiles.id, id)).get();
  }
  async getCareProfileBySpeciesKey(speciesKey: string): Promise<CareProfile | undefined> {
    return db.select().from(careProfiles).where(eq(careProfiles.speciesKey, speciesKey)).get();
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
    return db.select().from(plants).orderBy(asc(plants.id)).all();
  }
  async listPlantsByRoom(roomId: number): Promise<Plant[]> {
    return db.select().from(plants).where(eq(plants.roomId, roomId)).all();
  }
  async getPlant(id: number): Promise<Plant | undefined> {
    return db.select().from(plants).where(eq(plants.id, id)).get();
  }
  async createPlant(plant: InsertPlant): Promise<Plant> {
    return db.insert(plants).values({ ...plant, saveDate: Date.now() }).returning().get();
  }
  async updatePlantSchedule(id: number, nextWaterDate: number, nextFeedDate: number | null): Promise<void> {
    db.update(plants).set({ nextWaterDate, nextFeedDate }).where(eq(plants.id, id)).run();
  }

  async listReminders(): Promise<Reminder[]> {
    return db.select().from(reminders).all();
  }
  async listRemindersByPlant(plantId: number): Promise<Reminder[]> {
    return db.select().from(reminders).where(eq(reminders.plantId, plantId)).all();
  }
  async createReminder(reminder: InsertReminder): Promise<Reminder> {
    return db.insert(reminders).values({ ...reminder, createdAt: Date.now() }).returning().get();
  }
  async updateReminderStatus(id: number, status: string): Promise<void> {
    db.update(reminders).set({ status }).where(eq(reminders.id, id)).run();
  }

  async listProgressPhotos(plantId: number): Promise<ProgressPhoto[]> {
    return db.select().from(progressPhotos).where(eq(progressPhotos.plantId, plantId)).all();
  }
  async createProgressPhoto(photo: InsertProgressPhoto): Promise<ProgressPhoto> {
    return db.insert(progressPhotos).values(photo).returning().get();
  }

  async createNotificationLog(entry: InsertNotificationLog): Promise<NotificationLogEntry> {
    return db.insert(notificationLog).values(entry).returning().get();
  }
  async listNotificationLog(): Promise<NotificationLogEntry[]> {
    return db.select().from(notificationLog).all();
  }

  async listAffiliateLinks(): Promise<AffiliateLink[]> {
    return db.select().from(affiliateLinks).all();
  }
  async getAffiliateLinkByCategory(category: string): Promise<AffiliateLink | undefined> {
    return db.select().from(affiliateLinks).where(eq(affiliateLinks.category, category)).get();
  }

  async listPushSubscriptions(): Promise<PushSubscription[]> {
    return db.select().from(pushSubscriptions).all();
  }
  async createPushSubscription(sub: InsertPushSubscription): Promise<PushSubscription> {
    return db.insert(pushSubscriptions).values({ ...sub, createdAt: Date.now() }).returning().get();
  }

  async getCurrentUser(): Promise<User> {
    const existing = db.select().from(users).where(eq(users.id, 1)).get();
    if (existing) return existing;
    // Defensive fallback in case the seed row is ever missing.
    return db.insert(users).values({ subscriptionTier: "free", subscriptionExpiresAt: null, subscriptionRenews: true, createdAt: Date.now() }).returning().get();
  }

  async setSubscriptionTier(tier: SubscriptionTier, expiresAt: number | null): Promise<User> {
    const current = await this.getCurrentUser();
    return db
      .update(users)
      .set({ subscriptionTier: tier, subscriptionExpiresAt: expiresAt, subscriptionRenews: true })
      .where(eq(users.id, current.id))
      .returning()
      .get();
  }

  async canTrackAdditionalPlant(): Promise<boolean> {
    const user = await this.getCurrentUser();
    if (user.subscriptionTier !== "free") return true;
    const count = (await this.listPlants()).length;
    return count < FREE_PLANT_LIMIT;
  }
}

export const storage = new DatabaseStorage();
