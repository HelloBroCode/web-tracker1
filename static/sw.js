// Service Worker for FinMate Expense Tracker
const CACHE_NAME = 'finmate-cache-v1';
const urlsToCache = [
  '/',
  '/static/css/styles.css',
  '/static/js/script.js',
  '/static/sounds/notification.mp3',
  '/static/images/logo.png',
  'https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.1/css/all.min.css'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Cache installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  // Skip non-GET requests and API calls
  if (event.request.method !== 'GET' || 
      event.request.url.includes('/api/') ||
      event.request.url.includes('/finmate')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached response if found
        if (response) {
          return response;
        }
        
        // Clone the request since it can only be used once
        const fetchRequest = event.request.clone();
        
        // Make network request
        return fetch(fetchRequest)
          .then(response => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response since it can only be used once
            const responseToCache = response.clone();
            
            // Cache the new resource
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(error => {
            console.error('Fetch failed:', error);
            // You could return a custom offline page here
          });
      })
  );
});

// Handle background sync for offline form submissions
self.addEventListener('sync', event => {
  if (event.tag === 'expense-sync') {
    event.waitUntil(syncExpenses());
  }
});

// Function to sync pending expenses
async function syncExpenses() {
  try {
    // Get pending expenses from IndexedDB
    const pendingExpenses = await getPendingExpenses();
    
    // Process each pending expense
    for (const expense of pendingExpenses) {
      await fetch('/finmate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: expense.data }),
      });
      
      // Remove from pending after successful sync
      await removePendingExpense(expense.id);
    }
    
    // Notify clients that sync is complete
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETED',
        message: 'Pending expenses have been synchronized'
      });
    });
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// Placeholder functions for IndexedDB operations
// In a real implementation, these would interact with IndexedDB
async function getPendingExpenses() {
  return [];
}

async function removePendingExpense(id) {
  return true;
} 