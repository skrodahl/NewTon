/**
 * NewTon Chalker - IndexedDB Wrapper
 * Provides persistent storage for match data and settings
 */

const DB_NAME = 'newton-chalker';
const DB_VERSION = 1;
const MAX_HISTORY = 1000;

let db = null;

/**
 * Open the IndexedDB database and create stores if needed
 * @returns {Promise<IDBDatabase>}
 */
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (e) => {
      const database = e.target.result;

      // Settings store - single record for last used config
      if (!database.objectStoreNames.contains('settings')) {
        database.createObjectStore('settings', { keyPath: 'id' });
      }

      // Current match store - single record for active match
      if (!database.objectStoreNames.contains('current_match')) {
        database.createObjectStore('current_match', { keyPath: 'id' });
      }

      // Match history store - completed matches with timestamp index
      if (!database.objectStoreNames.contains('match_history')) {
        const historyStore = database.createObjectStore('match_history', {
          keyPath: 'id',
          autoIncrement: true
        });
        historyStore.createIndex('timestamp', 'timestamp');
      }
    };
  });
}

/**
 * Get a single record from a store
 * @param {string} store - Store name
 * @param {string|number} key - Record key
 * @returns {Promise<any>}
 */
async function dbGet(store, key) {
  return new Promise((resolve) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

/**
 * Put (insert or update) a record in a store
 * @param {string} store - Store name
 * @param {object} data - Record data (must include keyPath field)
 * @returns {Promise<void>}
 */
async function dbPut(store, data) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(data);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Delete a record from a store
 * @param {string} store - Store name
 * @param {string|number} key - Record key
 * @returns {Promise<void>}
 */
async function dbDelete(store, key) {
  return new Promise((resolve) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => resolve();
  });
}

/**
 * Get all records from a store, sorted by index
 * @param {string} store - Store name
 * @param {string} indexName - Index to sort by
 * @param {string} direction - 'next' (ascending) or 'prev' (descending)
 * @returns {Promise<array>}
 */
async function dbGetAllByIndex(store, indexName, direction = 'prev') {
  return new Promise((resolve) => {
    const tx = db.transaction(store, 'readonly');
    const index = tx.objectStore(store).index(indexName);
    const results = [];
    const req = index.openCursor(null, direction);

    req.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        resolve(results);
      }
    };

    req.onerror = () => resolve([]);
  });
}

/**
 * Get count of records in a store
 * @param {string} store - Store name
 * @returns {Promise<number>}
 */
async function dbCount(store) {
  return new Promise((resolve) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(0);
  });
}
