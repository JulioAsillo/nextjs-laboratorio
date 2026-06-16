'use client';

import { useEffect, useRef } from 'react';
import { idbGet, idbSet } from './idb-cache';

interface Snapshot<S> {
  loaded: Record<string, number>;
  status: Record<string, S>;
}
interface Envelope<S> extends Snapshot<S> {
  savedAt: number;
}

/**
 * Persiste el estado "cargado" de la página Cargar Información en IndexedDB:
 * el conteo por fuente (`loaded`) y el estado de cada card (`status`).
 * Tras un F5 las cards vuelven a su color sin re-consultar el backend; el
 * preview completo se rehidrata bajo demanda al abrir el modal.
 *
 * Hidrata una vez al montar y reescribe el snapshot cuando cambian los mapas.
 * El flag `hydrated` evita pisar lo guardado con el estado inicial vacío.
 */
export function useCargarCache<S>(
  cacheKey: string,
  loaded: Record<string, number>,
  status: Record<string, S>,
  setLoaded: (v: Record<string, number>) => void,
  setStatus: (v: Record<string, S>) => void,
): void {
  const hydrated = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const env = await idbGet<Envelope<S>>(cacheKey);
      if (!cancelled && env) {
        setLoaded(env.loaded ?? {});
        setStatus(env.status ?? {});
      }
      hydrated.current = true;
    })();
    return () => {
      cancelled = true;
    };
    // setLoaded/setStatus son estables (useState); solo re-hidratar si cambia la clave.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  useEffect(() => {
    if (!hydrated.current) return;
    // No persistir estados transitorios: una card en 'loading' al recargar
    // quedaría colgada. Se omiten; se rehidratan solo ok/empty/error.
    const clean: Record<string, S> = {};
    for (const [k, v] of Object.entries(status)) {
      if ((v as unknown) !== 'loading') clean[k] = v;
    }
    void idbSet<Envelope<S>>(cacheKey, { savedAt: Date.now(), loaded, status: clean });
  }, [cacheKey, loaded, status]);
}
