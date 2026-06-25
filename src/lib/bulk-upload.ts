'use client';

/**
 * Registro compartido de subidas pendientes para "Cargar Información".
 *
 * Cada `SlotUploader` (de cualquier certificación: Usuarios, BD, Perfiles…) se
 * registra aquí cuando tiene archivos válidos pendientes de subir, exponiendo su
 * propio `run` (= el mismo handler del botón "Subir X archivo" de esa card).
 *
 * El botón global "Subir todos los archivos" consume `useBulkUpload()` y dispara
 * todos los `run` en secuencia, sin prop-drilling ni refs entre vistas. Funciona
 * igual para `FuenteCard` y `FuenteCardBd` porque ambos importan este módulo.
 */
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';

interface Uploader {
  run: () => Promise<void>;
  pending: number; // nº de archivos pendientes en ese slot (solo informativo)
}

const registry = new Map<string, Uploader>();
const listeners = new Set<() => void>();
let snapshot = 0; // nº de slots con subida pendiente (lo que observa React)

function emit() {
  snapshot = registry.size;
  listeners.forEach((l) => l());
}

/** Registra/actualiza un slot pendiente. Devuelve la función para desregistrar. */
export function registerUploader(id: string, uploader: Uploader): () => void {
  registry.set(id, uploader);
  emit();
  return () => {
    // Solo elimina si sigue siendo la misma entrada (evita carreras al remontar).
    if (registry.get(id) === uploader) {
      registry.delete(id);
      emit();
    }
  };
}

export function unregisterUploader(id: string) {
  if (registry.delete(id)) emit();
}

/** Dispara en secuencia todos los slots pendientes. Cada card muestra su propio estado/errores. */
export async function runAllPending(onProgress?: (done: number, total: number) => void) {
  const entries = Array.from(registry.values()); // snapshot estable al iniciar
  const total = entries.length;
  let done = 0;
  onProgress?.(0, total);
  for (const u of entries) {
    try {
      await u.run();
    } catch {
      /* la card surface su propio error; no abortamos el lote */
    }
    done += 1;
    onProgress?.(done, total);
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function getSnapshot() {
  return snapshot;
}
function getServerSnapshot() {
  return 0;
}

export interface BulkUploadState {
  /** Nº de slots con archivos válidos pendientes de subir. */
  pending: number;
  running: boolean;
  progress: { done: number; total: number };
  run: () => Promise<void>;
}

export function useBulkUpload(): BulkUploadState {
  const pending = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const run = useCallback(async () => {
    setRunning(true);
    try {
      await runAllPending((done, total) => setProgress({ done, total }));
    } finally {
      setRunning(false);
      setProgress({ done: 0, total: 0 });
    }
  }, []);

  return { pending, running, progress, run };
}

/* ── Fuentes con archivos subidos (estado local de subida) ──────────
 * Lee `localStorage` SOLO tras el montaje para evitar mismatch de hidratación
 * (el servidor no tiene localStorage → 0; el cliente sí → N). Compartido por
 * todas las certificaciones; cada una pasa su propio predicado `isUploaded`.
 */
interface SlotLike { fileName: string }
interface FuenteLike { id: string; label: string; appsKey?: string; slots: readonly SlotLike[] }

export interface FuenteSubidaInfo {
  id: string;
  label: string;
  uploaded: number;
  total: number;
  appsKey?: string;
}

export function useUploadedFuentes(
  fuentes: readonly FuenteLike[],
  isUploaded: (fuenteId: string, fileName: string) => boolean,
  tick: number,
): FuenteSubidaInfo[] {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return useMemo<FuenteSubidaInfo[]>(() => {
    if (!mounted) return []; // 1er render (cliente) == servidor
    return fuentes.flatMap((f) => {
      const uploaded = f.slots.filter((s) => isUploaded(f.id, s.fileName)).length;
      return uploaded > 0 ? [{ id: f.id, label: f.label, uploaded, total: f.slots.length, appsKey: f.appsKey }] : [];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, tick]);
}
