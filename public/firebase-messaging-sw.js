/* Service worker para Firebase Cloud Messaging (push com app fechado). */
/* Versão alinhada ao SDK da app (package.json → firebase). */
importScripts(
  "https://www.gstatic.com/firebasejs/12.13.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/12.13.0/firebase-messaging-compat.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyA8pp5jX5ERcxDt4gJRvwAht1IrbDixKi8",
  authDomain: "studio-316805764-e4d13.firebaseapp.com",
  projectId: "studio-316805764-e4d13",
  storageBucket: "studio-316805764-e4d13.firebasestorage.app",
  messagingSenderId: "485112911461",
  appId: "1:485112911461:web:cc9216558bb9651214188c",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || "AmbientaR";
  const body =
    payload.notification?.body || payload.data?.body || "Nova mensagem no aplicativo";
  const link = payload.fcmOptions?.link || payload.data?.link || "/";

  self.registration.showNotification(title, {
    body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    data: { link },
    tag: payload.data?.sourceType
      ? `${payload.data.sourceType}:${payload.data.sourceId || ""}`
      : "ambientar-alert",
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = event.notification.data?.link || "/";
  const targetUrl = new URL(link, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (!client.url.startsWith(self.location.origin)) continue;
        if ("focus" in client) {
          return client.focus().then((focused) => {
            if (focused && "navigate" in focused) {
              return focused.navigate(targetUrl);
            }
          });
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    }),
  );
});
