import type { HallazgoAplicacion } from '@/types/hallazgo';
import { getJson } from '@/lib/http';

/**
 * Fetcher del "Hallazgo de Perfiles".
 *
 * Contrato esperado (TBD) — mismo shape que Aplicaciones/BD:
 *   GET {API_BASE}/hallazgos/perfiles?fecha_ref=YYYY-MM-DD
 *   -> { data: { reporte_perfiles: HallazgoAplicacion[] } }
 *
 * Mientras no exista el backend, se sirve un mock desde /public. Para
 * conmutar a producción: pon USE_MOCK = false (o define el endpoint real).
 */
const ENDPOINT = process.env.NEXT_PUBLIC_PERFILES_HALLAZGOS_ENDPOINT ?? '/hallazgos/perfiles';
const MOCK_URL = '/mock-perfiles-hallazgos.json';

/** Mientras el backend no exista, dejar en true. */
const USE_MOCK = true;

function pick(raw: unknown): HallazgoAplicacion[] {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const data = (obj.data && typeof obj.data === 'object' ? obj.data : obj) as Record<string, unknown>;
  for (const k of ['reporte_perfiles', 'perfiles', 'hallazgos']) {
    if (Array.isArray(data[k])) return data[k] as HallazgoAplicacion[];
  }
  return [];
}

export async function fetchHallazgosPerfiles(fechaRef?: string): Promise<HallazgoAplicacion[]> {
  if (USE_MOCK) {
    const res = await fetch(MOCK_URL, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`No se pudo cargar el mock de Perfiles (${res.status})`);
    return pick(await res.json());
  }

  // --- Producción (cuando el backend esté listo) ---
  const qs = fechaRef ? `?fecha_ref=${encodeURIComponent(fechaRef)}` : '';
  const raw = await getJson(`${ENDPOINT}${qs}`);
  return pick(raw);
}
