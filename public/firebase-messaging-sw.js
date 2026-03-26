// firebase-messaging-sw.js
// Este archivo DEBE estar en la raíz del dominio (/firebase-messaging-sw.js)
// Vite lo copia desde /public automáticamente.

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// La config se inyecta desde el cliente via postMessage o puedes hardcodearla aquí.
// Por seguridad, usa variables de entorno en el build o una configuración mínima.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    if (!firebase.apps.length) {
      firebase.initializeApp(event.data.config);
      const messaging = firebase.messaging();

      messaging.onBackgroundMessage((payload) => {
        const { title, body } = payload.notification || {};
        self.registration.showNotification(title || 'PASALO', {
          body: body || 'Tienes una nueva notificación',
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          data: payload.data,
          vibrate: [200, 100, 200],
        });
      });
    }
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.chatId
    ? `/chat/${event.notification.data.chatId}`
    : '/';
  event.waitUntil(clients.openWindow(url));
});
