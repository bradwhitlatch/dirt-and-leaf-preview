import type { Express } from "express";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { storage, dbReady } from "./storage";
import { identifyPlant } from "./plant-id";
import { computeSchedule } from "./care-scheduling";
import { getWeatherSnapshot, reverseGeocode, approximateHardinessZone } from "./weather";
import { findNearbyNurseries } from "./nurseries";
import { buildAffiliateUrl } from "./affiliate";
import { sendPushNotification, vapidPublicKey } from "./push";
import { insertRoomSchema, insertPlantSchema, insertProgressPhotoSchema, insertPushSubscriptionSchema, SUBSCRIPTION_TIERS, type SubscriptionTier } from "@shared/schema";
import { PREMIUM_MONTHLY_PRICE_USD, PREMIUM_YEARLY_PRICE_USD, FREE_PLANT_LIMIT } from "@shared/pricing";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Ensure the Postgres schema + seed data exist before serving any request.
  await dbReady;

  // -------------------------------------------------------------------------
  // Rooms ("Spaces")
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // Plant identification — Plant.id integration (server/plant-id.ts).
  // Accepts a base64 image string; returns top 3-5 candidate suggestions.
  // -------------------------------------------------------------------------
  app.post("/api/identify", async (req, res) => {
    const { imageBase64 } = req.body ?? {};
    try {
      const result = await identifyPlant(imageBase64 ?? null);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err?.message ?? "Identification failed" });
    }
  });

  // -------------------------------------------------------------------------
  // Care profiles (species reference data — read-only from the client)
  // -------------------------------------------------------------------------
  app.get("/api/care-profiles", async (_req, res) => {
    const list = await storage.listCareProfiles();
    res.json(list.map(withParsedCitations));
  });

  app.get("/api/care-profiles/lookup", async (req, res) => {
    const name = String(req.query.name ?? "");
    const profile = await storage.findCareProfileByName(name);
    res.json(profile ? withParsedCitations(profile) : null);
  });

  function withParsedCitations(p: any) {
    return { ...p, sourceCitations: JSON.parse(p.sourceCitations || "[]") };
  }

  // -------------------------------------------------------------------------
  // Plants — save flow: user confirms a match -> we look up (or fall back)
  // the care profile, compute an initial schedule from geolocation+weather,
  // and persist. This is the ONLY place a plant becomes durable.
  // -------------------------------------------------------------------------
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

    // Freemium gate: free tier can track up to FREE_PLANT_LIMIT plants.
    // Plant scanning/identification itself (/api/identify) is never gated —
    // only the act of saving a plant to be tracked with reminders.
    const canAdd = await storage.canTrackAdditionalPlant();
    if (!canAdd) {
      return res.status(402).json({
        error: "plant_limit_reached",
        message: `Free plan is limited to ${FREE_PLANT_LIMIT} tracked plants. Upgrade to Premium for unlimited plants.`,
        limit: FREE_PLANT_LIMIT,
      });
    }

    const input = parsed.data;
    const careProfile = input.careProfileId
      ? await storage.getCareProfile(input.careProfileId)
      : await storage.findCareProfileByName(input.commonName);

    let nextWaterDate: number | null = null;
    let nextFeedDate: number | null = null;
    let hardinessZone: string | null = null;
    let locationLabel: string | null = input.locationLabel ?? null;

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
      nextFeedDate,
    } as any);

    // Seed the initial reminder queue rows for this plant.
    if (nextWaterDate) {
      await storage.createReminder({ plantId: plant.id, type: "water", dueDate: nextWaterDate, status: "pending" });
    }
    if (nextFeedDate) {
      await storage.createReminder({ plantId: plant.id, type: "feed", dueDate: nextFeedDate, status: "pending" });
    }

    res.status(201).json(plant);
  });

  // Recompute a single plant's schedule against current weather (also used by the daily cron-style job below).
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

  // -------------------------------------------------------------------------
  // Progress photos — growth tracking; never overwrites the plant's main photo.
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // Reminders
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // Affiliate links — every "Buy X" CTA resolves its URL through here.
  // -------------------------------------------------------------------------
  app.get("/api/affiliate-links", async (_req, res) => {
    const links = await storage.listAffiliateLinks();
    res.json(links.map((l) => ({ ...l, url: buildAffiliateUrl(l) })));
  });

  app.get("/api/affiliate-links/:category", async (req, res) => {
    const link = await storage.getAffiliateLinkByCategory(req.params.category);
    if (!link) return res.status(404).json({ error: "Not found" });
    res.json({ ...link, url: buildAffiliateUrl(link) });
  });

  // -------------------------------------------------------------------------
  // Nearby nurseries — OpenStreetMap Overpass/Nominatim, no key required.
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // Weather snapshot (used by the frontend to show "adjusted for your local
  // conditions" copy, and reused server-side for scheduling)
  // -------------------------------------------------------------------------
  app.get("/api/weather", async (req, res) => {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return res.status(400).json({ error: "lat and lon query params are required" });
    }
    const snapshot = await getWeatherSnapshot(lat, lon);
    res.json(snapshot);
  });

  // -------------------------------------------------------------------------
  // Web push notifications
  // -------------------------------------------------------------------------
  app.get("/api/push/vapid-public-key", (_req, res) => {
    res.json({ publicKey: vapidPublicKey });
  });

  app.post("/api/push/subscribe", async (req, res) => {
    const parsed = insertPushSubscriptionSchema.safeParse({
      endpoint: req.body?.endpoint,
      subscriptionJson: JSON.stringify(req.body ?? {}),
    });
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    try {
      const sub = await storage.createPushSubscription(parsed.data);
      res.status(201).json(sub);
    } catch {
      // Already subscribed (unique endpoint constraint) — treat as success.
      res.status(200).json({ ok: true });
    }
  });

  // Manually trigger a reminder-check pass (also intended to be invoked by an
  // external cron in production — see README.md "Reminders & notifications").
  app.post("/api/push/check-reminders", async (_req, res) => {
    const now = Date.now();
    const allReminders = await storage.listReminders();
    const due = allReminders.filter((r) => r.status === "pending" && r.dueDate <= now);
    const subscriptions = await storage.listPushSubscriptions();
    const sentLog: any[] = [];

    for (const reminder of due) {
      const plant = await storage.getPlant(reminder.plantId);
      if (!plant) continue;
      const room = plant.roomId ? await storage.getRoom(plant.roomId) : undefined;
      const verb = reminder.type === "water" ? "water" : reminder.type === "feed" ? "feed" : "check on";
      const title = `Time to ${verb} your ${plant.commonName}`;
      const body = room ? `${plant.commonName} in the ${room.name}` : plant.commonName;

      if (subscriptions.length === 0) {
        await storage.createNotificationLog({
          reminderId: reminder.id, plantId: plant.id, title, body,
          sentAt: now, status: "no_subscription",
        });
        continue;
      }

      for (const sub of subscriptions) {
        const result = await sendPushNotification(sub.subscriptionJson, { title, body });
        await storage.createNotificationLog({
          reminderId: reminder.id, plantId: plant.id, title, body,
          sentAt: now, status: result.ok ? "sent" : "failed",
        });
        sentLog.push({ reminder: reminder.id, ok: result.ok });
      }
    }

    res.json({ checked: due.length, sent: sentLog.length });
  });

  app.get("/api/notification-log", async (_req, res) => {
    res.json(await storage.listNotificationLog());
  });

  // -------------------------------------------------------------------------
  // Subscription / account (single-user app — operates on the one user row).
  // Payment processing is STUBBED: "upgrade" simply flips subscriptionTier
  // in the database. See README.md "Pricing & subscriptions" — before real
  // launch this must be wired to Stripe (web) and Apple/Google IAP (native).
  // -------------------------------------------------------------------------
  app.get("/api/account", async (_req, res) => {
    const user = await storage.getCurrentUser();
    const plantCount = (await storage.listPlants()).length;
    res.json({
      ...user,
      plantCount,
      freePlantLimit: FREE_PLANT_LIMIT,
      canTrackAdditionalPlant: await storage.canTrackAdditionalPlant(),
      pricing: { monthly: PREMIUM_MONTHLY_PRICE_USD, yearly: PREMIUM_YEARLY_PRICE_USD },
    });
  });

  app.post("/api/account/upgrade", async (req, res) => {
    const tier = req.body?.tier as SubscriptionTier;
    if (!SUBSCRIPTION_TIERS.includes(tier) || tier === "free") {
      return res.status(400).json({ error: "tier must be premium_monthly or premium_yearly" });
    }
    // TODO(payments): This is a MOCK upgrade for the web-app milestone — no
    // real charge occurs. Replace with a Stripe Checkout/webhook flow (web)
    // or Apple/Google in-app-purchase receipt validation (native apps)
    // before accepting real payments. See README.md for details.
    const now = Date.now();
    const oneMonthMs = 30 * 24 * 60 * 60 * 1000;
    const oneYearMs = 365 * 24 * 60 * 60 * 1000;
    const expiresAt = now + (tier === "premium_monthly" ? oneMonthMs : oneYearMs);
    const user = await storage.setSubscriptionTier(tier, expiresAt);
    res.json(user);
  });

  app.post("/api/account/downgrade", async (_req, res) => {
    // Stubbed "manage subscription -> cancel" path. Real implementation would
    // cancel the Stripe subscription / IAP and let it expire at period end.
    const user = await storage.setSubscriptionTier("free", null);
    res.json(user);
  });

  return httpServer;
}
