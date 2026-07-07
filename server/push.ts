/**
 * Web Push notifications (Notification/Push API + service worker).
 * Uses the `web-push` library (VAPID protocol) to send real push messages
 * to subscribed browsers — see client/public/sw.js for the service worker
 * that receives and displays them, and client/src/lib/push.ts for the
 * subscribe flow.
 *
 * VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY should be real, permanent keys in
 * production (generate once with `npx web-push generate-vapid-keys` and
 * store them — do not regenerate on every deploy or existing subscriptions
 * break). For local dev/testing, this file falls back to a checked-in dev
 * keypair (clearly NOT for production) so push works out of the box.
 */
import webpush from "web-push";

// Dev-only fallback keypair generated for this build — safe to keep public
// since dev/test push subscriptions are not real user data. Replace with
// your own permanent keys in production via env vars.
const DEV_VAPID_PUBLIC_KEY = "BMahVCo20wGvxca97xdAcW7MLU_vytGfWeziTzGPKrEYcq6fJlKm_ddrlsftMmQ9jCX6igleqozn_LD6SeYDEcY";
const DEV_VAPID_PRIVATE_KEY = "uG3SdZfPRabPQbKEh8aMLO-C-Z8SR6dicC8qC5nAUqM";

const publicKey = process.env.VAPID_PUBLIC_KEY || DEV_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY || DEV_VAPID_PRIVATE_KEY;

if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  console.log(
    "[push] VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY not set — using a bundled DEV-ONLY " +
      "keypair so push notifications work in local testing. Generate your own permanent " +
      "keys with `npx web-push generate-vapid-keys` before going to production."
  );
}

webpush.setVapidDetails(
  process.env.VAPID_CONTACT_EMAIL ? `mailto:${process.env.VAPID_CONTACT_EMAIL}` : "mailto:admin@example.com",
  publicKey,
  privateKey
);

export const vapidPublicKey = publicKey;

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

export async function sendPushNotification(
  subscriptionJson: string,
  payload: PushPayload
): Promise<{ ok: boolean; error?: string }> {
  try {
    const subscription = JSON.parse(subscriptionJson);
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { ok: true };
  } catch (err: any) {
    console.error("[push] Failed to send push notification:", err?.message ?? err);
    return { ok: false, error: err?.message ?? String(err) };
  }
}
