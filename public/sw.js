// Service Worker cho QC NoiDung PWA & Background Notification Handler

const CACHE_NAME = "qc-app-cache-v1";

// Cài đặt Service Worker
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// Kích hoạt Service Worker
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Xử lý sự kiện Push Notification từ máy chủ / Service Worker
self.addEventListener("push", (event) => {
  let data = { title: "QC Nội Dung", body: "Bạn có thông báo mới!" };
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    if (event.data) data.body = event.data.text();
  }

  const options = {
    body: data.body,
    icon: "/Logo Marvel Team.png",
    badge: "/Logo Marvel Team.png",
    vibrate: [200, 100, 200],
    data: data.url || "/",
    actions: [{ action: "open", title: "Xem ngay" }],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Khi người dùng click vào thông báo trên màn hình khóa điện thoại
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
