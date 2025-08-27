const CACHE_NAME = 'legaldiary-v1.0.0';
const STATIC_CACHE_NAME = 'legaldiary-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'legaldiary-dynamic-v1.0.0';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// API routes that should be cached for offline access
const API_ROUTES = [
  '/api/cases',
  '/api/chambers',
  '/api/auth/user'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Error caching static assets', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Claiming clients');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-HTTP requests
  if (!request.url.startsWith('http')) {
    return;
  }

   // ✅ Special handling for diary entries POST
  if (url.pathname.startsWith('/api/diary-entries') && request.method === 'POST') {
    event.respondWith(
      (async () => {
        try {
          // Try normal network call
          const response = await fetch(request);
          return response;
        } catch (error) {
          // If offline → save in IndexedDB
          const cloned = request.clone();
          const body = await cloned.json();
          await savePendingDiaryEntry(body);

          // Register background sync
          if ('sync' in self.registration) {
            await self.registration.sync.register('sync-diary-entries');
          }

          // Tell frontend we saved offline
          return new Response(JSON.stringify({ 
            message: 'Saved offline. Will sync when online.',
            offline: true 
          }), {
            status: 202,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      })()
    );
    return; // stop here, don’t let other handlers catch it
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets and navigation
  event.respondWith(handleStaticRequest(request));
});

// Handle API requests with cache-first strategy for GET requests
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  try {
    // For GET requests, try cache first, then network
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request);
      
      if (cachedResponse) {
        console.log('Service Worker: Serving from cache', url.pathname);
        
        // Try to update cache in background
        fetch(request)
          .then((response) => {
            if (response.ok) {
              return caches.open(DYNAMIC_CACHE_NAME)
                .then((cache) => cache.put(request, response.clone()));
            }
          })
          .catch(() => {
            // Background update failed, but we have cached version
          });
        
        return cachedResponse;
      }
    }

    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok && request.method === 'GET') {
      // Cache successful GET responses
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache', error);
    
    // Network failed, try cache for GET requests
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // Return offline response for failed requests
    return new Response(
      JSON.stringify({ 
        message: 'Offline - Data not available',
        offline: true,
        timestamp: Date.now()
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      }
    );
  }
}

// Handle static requests with cache-first strategy
async function handleStaticRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Try network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('Service Worker: Static request failed', error);
    
    // For navigation requests, return cached index.html
    if (request.mode === 'navigate') {
      const cachedIndex = await caches.match('/');
      if (cachedIndex) {
        return cachedIndex;
      }
    }
    
    // Return basic offline page
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>LegalDiary - Offline</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: system-ui, sans-serif; 
              text-align: center; 
              padding: 50px; 
              background: #f8fafc;
              color: #334155;
            }
            .offline-message {
              max-width: 400px;
              margin: 0 auto;
              padding: 20px;
              background: white;
              border-radius: 8px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .icon { font-size: 48px; margin-bottom: 16px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="offline-message">
            <div class="icon">📱</div>
            <h1>You're Offline</h1>
            <p>LegalDiary is not available right now. Please check your internet connection and try again.</p>
            <button onclick="window.location.reload()" style="
              background: #3b82f6; 
              color: white; 
              border: none; 
              padding: 12px 24px; 
              border-radius: 6px; 
              cursor: pointer;
              font-size: 14px;
              margin-top: 16px;
            ">Try Again</button>
          </div>
        </body>
      </html>`,
      {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-store'
        }
      }
    );
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);
  
  if (event.tag === 'sync-diary-entries') {
    event.waitUntil(syncDiaryEntries());
  }
  
  if (event.tag === 'sync-cases') {
    event.waitUntil(syncCases());
  }
});

// Sync diary entries when back online
async function syncDiaryEntries() {
  try {
    console.log('Service Worker: Syncing diary entries...');
    
    // Get pending diary entries from IndexedDB or localStorage
    const pendingEntries = await getPendingDiaryEntries();
    
    for (const entry of pendingEntries) {
      try {
        const response = await fetch('/api/diary-entries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(entry.data),
          credentials: 'include'
        });
        
        if (response.ok) {
          await removePendingDiaryEntry(entry.id);
          console.log('Service Worker: Synced diary entry', entry.id);
        }
      } catch (error) {
        console.error('Service Worker: Failed to sync diary entry', error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Sync diary entries failed', error);
  }
}

// Sync cases when back online
async function syncCases() {
  try {
    console.log('Service Worker: Syncing cases...');
    
    const pendingCases = await getPendingCases();
    
    for (const caseItem of pendingCases) {
      try {
        const response = await fetch('/api/cases', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(caseItem.data),
          credentials: 'include'
        });
        
        if (response.ok) {
          await removePendingCase(caseItem.id);
          console.log('Service Worker: Synced case', caseItem.id);
        }
      } catch (error) {
        console.error('Service Worker: Failed to sync case', error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Sync cases failed', error);
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('legaldiary-db', 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingDiaryEntries')) {
        db.createObjectStore('pendingDiaryEntries', { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

async function savePendingDiaryEntry(data) {
  const db = await openDB();
  const tx = db.transaction('pendingDiaryEntries', 'readwrite');
  tx.objectStore('pendingDiaryEntries').add({ data });
  return tx.complete;
}

// Helper functions for offline storage
async function getPendingDiaryEntries() {
  const db = await openDB();
  const tx = db.transaction('pendingDiaryEntries', 'readonly');
  return tx.objectStore('pendingDiaryEntries').getAll();
}

async function removePendingDiaryEntry(id) {
  const db = await openDB();
  const tx = db.transaction('pendingDiaryEntries', 'readwrite');
  tx.objectStore('pendingDiaryEntries').delete(id);
  return tx.complete;
}

async function getPendingCases() {
  // In a real implementation, you'd use IndexedDB
  return [];
}

async function removePendingCase(id) {
  // Remove from IndexedDB
}

// Push notification handler
// self.addEventListener('push', (event) => {
//   console.log('Service Worker: Push notification received');
  
//   const options = {
//     body: 'You have a new hearing reminder',
//     icon: '/icon-192.png',
//     badge: '/icon-192.png',
//     vibrate: [200, 100, 200],
//     data: {
//       url: '/?tab=calendar'
//     },
//     actions: [
//       {
//         action: 'view',
//         title: 'View Calendar',
//         icon: '/icon-192.png'
//       },
//       {
//         action: 'dismiss',
//         title: 'Dismiss'
//       }
//     ]
//   };
//   console.log('Triggering notification with before options:', options);
//   if (event.data) {
//     try {
//       const payload = event.data.json();
//       options.body = payload.body || options.body;
//       options.data = { ...options.data, ...payload.data };
//     } catch (error) {
//       console.error('Service Worker: Error parsing push payload', error);
//     }
//   }
  
//   event.waitUntil(
//   (async () => {
//     console.log('Triggering notification with options:', options);
//     await self.registration.showNotification('LegalDiary', options);
//   })()
// );
// });

// Listen for push events
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received');

  const payload = event.data ? event.data.json() : {};
  const title = payload.title || 'LegalDiary';
  const options = {
    body: payload.body || 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: payload.data || { url: '/?tab=calendar' },
    actions: payload.actions || [
      { action: 'view', title: 'View Calendar', icon: '/icon-192.png' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event.action);
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data?.url || '/')
    );
  } else if (event.action !== 'dismiss') {
    // Default action - open app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_API_RESPONSE') {
    const { url, response } = event.data;
    caches.open(DYNAMIC_CACHE_NAME)
      .then(cache => cache.put(url, new Response(JSON.stringify(response))))
      .catch(error => console.error('Service Worker: Cache API response failed', error));
  }
});

console.log('Service Worker: Script loaded');
