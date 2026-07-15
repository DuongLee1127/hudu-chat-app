self.addEventListener('push', (event) => {
  let data = { title: 'Hudu Chat', body: 'Bạn có thông báo mới', url: '/chat' };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    // ignore
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      data: { url: data.url || '/chat' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/chat';
  event.waitUntil(clients.openWindow(url));
});
