'use client';

import { useCallback, useState } from 'react';
import { idbGet, idbSet, idbDel } from './idb-cache';

export interface CacheMeta {
  /** Epoch ms del último guardado. */
  savedAt: number;
  /** Fecha de referencia usada al generar (si aplica). */
  fechaRef?: string;
}

interface Envelope<T> extends CacheMeta {
  data: T;
}

/**
 * Persistencia de un dataset de hallazgos en IndexedDB.
 *
 * - `hydrate()`  -> lee el envelope guardado (o null).
 * - `remember()` -> guarda data + fecha de referencia + timestamp.
 * - `forget()`   -> borra la entrada.
 * - `meta`       -> info para el banner ("datos del DD/MM…"). Se setea solo al
 *                   recordar; al hidratar, el llamador la fija con `setMeta`.
 */
export function useHallazgoCache<T>(cacheKey: string) {
  const [meta, setMeta] = useState<CacheMeta | null>(null);

  const hydrate = useCallback(
    async (): Promise<Envelope<T> | null> => idbGet<Envelope<T>>(cacheKey),
    [cacheKey],
  );

  const remember = useCallback(
    async (data: T, fechaRef?: string): Promise<void> => {
      const env: Envelope<T> = { savedAt: Date.now(), fechaRef, data };
      await idbSet(cacheKey, env);
      setMeta({ savedAt: env.savedAt, fechaRef });
    },
    [cacheKey],
  );

  const forget = useCallback(async (): Promise<void> => {
    await idbDel(cacheKey);
    setMeta(null);
  }, [cacheKey]);

  return { meta, setMeta, hydrate, remember, forget };
}
