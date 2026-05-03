/**
 * IndexedDB store for the background media data URL.
 * Used instead of localStorage because videos encoded as base64 can exceed
 * the ~5-10 MB localStorage quota. IndexedDB supports hundreds of MB.
 */

const DB_NAME = 'poster-studio-bg';
const DB_VERSION = 1;
const STORE_NAME = 'background';
const RECORD_KEY = 'current';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveBackgroundMedia(dataUrl: string | null): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = dataUrl !== null ? store.put(dataUrl, RECORD_KEY) : store.delete(RECORD_KEY);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export async function loadBackgroundMedia(): Promise<string | null> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(RECORD_KEY);
      req.onsuccess = () => { resolve((req.result as string | undefined) ?? null); };
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch {
    return null;
  }
}

export async function clearBackgroundMedia(): Promise<void> {
  try {
    await saveBackgroundMedia(null);
  } catch {
    /* ignore */
  }
}
