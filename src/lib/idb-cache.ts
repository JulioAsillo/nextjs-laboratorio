/**
 * Caché clave-valor sobre IndexedDB, sin dependencias.
 *
 * Pensado para volúmenes grandes (hallazgos de 90k+ filas) donde localStorage
 * no sirve: IndexedDB es asíncrono (no congela la UI) y guarda por structured
 * clone (sin `JSON.stringify` manual). Una sola DB, un solo object store.
 *
 * Todas las operaciones son tolerantes a fallo: en SSR (sin `indexedDB`) o ante
 * cualquier error, `get` devuelve `null` y `set/del/clear` no lanzan. Así los
 * llamadores no necesitan envolver cada llamada en try/catch.
 */
const DB_NAME = 'certificaciones-cache';
const STORE = 'kv';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB no disponible (SSR o navegador sin soporte).'));
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

/** Lee un valor. Devuelve `null` si no existe o ante cualquier error. */
export async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openDb();
    return await new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

/** Guarda un valor (structured clone). Silencioso ante error. */
export async function idbSet<T>(key: string, value: T): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* no-op */
  }
}

/** Elimina una clave. Silencioso ante error. */
export async function idbDel(key: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* no-op */
  }
}

/** Vacía todo el store. Silencioso ante error. */
export async function idbClear(): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* no-op */
  }
}
