import { apiRequest } from "./queryClient";

/**
 * Web Push subscription flow.
 * -----------------------------------------------------------------------
 * Real push requires HTTPS + a registered service worker + user permission.
 * This helper degrades gracefully: if Notification/Push APIs are missing
 * (unsupported browser, iframe preview, etc.) it resolves to a no-op so the
 * rest of the app never breaks. See server/push.ts for the sending side.
 */

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export async function isPushSupported() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch (err) {
    console.warn("[push] service worker registration failed", err);
    return null;
  }
}

export async function subscribeToPush(): Promise<{ ok: boolean; reason?: string }> {
  if (!(await isPushSupported())) {
    return { ok: false, reason: "unsupported" };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false, reason: "denied" };
  }

  const registration = await registerServiceWorker();
  if (!registration) return { ok: false, reason: "no_service_worker" };

  try {
    const keyRes = await apiRequest("GET", "/api/push/vapid-public-key");
    const { publicKey } = await keyRes.json();

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    await apiRequest("POST", "/api/push/subscribe", subscription.toJSON());
    return { ok: true };
  } catch (err: any) {
    console.warn("[push] subscribe failed", err);
    return { ok: false, reason: err?.message ?? "unknown_error" };
  }
}
