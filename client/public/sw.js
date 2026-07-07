/**
 * Dirt & Leaf service worker
 * --------------------------
 * Minimal Web Push receiver. Registered from client/src/lib/push.ts.
 * Displays a system notification when the server sends a push message via
 * server/push.ts (triggered by POST /api/push/check-reminders).
 */

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = { title: "Dirt & Leaf", body: "You have a plant care reminder." };
  try {
    if (event.data) data = event.data.json();
  } catch {
    if (event.data) data.body = event.data.text();
  }

  const title = data.title || "Dirt & Leaf";
  const options = {
    body: data.body || "",
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    tag: data.tag || "dirt-and-leaf-reminder",
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
      const existing = clientsArr.find((c) => "focus" in c);
      if (existing) return existing.focus();
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
