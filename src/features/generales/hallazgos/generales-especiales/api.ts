import type { HallazgoAplicacion } from '@/types/hallazgo';
import { getJson } from '@/lib/http';

/**
 * Fetcher del hallazgo "Generales y Especiales".
 *
 *   GET {API_BASE}/hallazgos/generales_especiales
 *   -> { reporte_generales: HallazgoAplicacion[] }
 *
 * `pick()` acepta array directo, { <key> } o { data: { <key> } } por robustez,
 * igual que Aplicaciones / Perfiles / Activos GDH.
 *
 * ⚠️ TODO(Julio): confirmar endpoint y nombre de la colección.
 */
const ENDPOINT =
  process.env.NEXT_PUBLIC_GENERALES_ENDPOINT ?? '/hallazgos/generales_especiales';

const KEYS = ['reporte_generales', 'reporte_generales_especiales', 'cert_generales'];

function pick(raw: unknown): HallazgoAplicacion[] {
  if (Array.isArray(raw)) return raw as HallazgoAplicacion[];
  const obj = (raw ?? {}) as Record<string, unknown>;
  const data = (obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data) ? obj.data : obj) as Record<string, unknown>;
  if (Array.isArray(obj.data)) return obj.data as HallazgoAplicacion[];
  for (const k of KEYS) {
    if (Array.isArray(data[k])) return data[k] as HallazgoAplicacion[];
  }
  return [];
}

/**
 * `fechaRef` (YYYY-MM-DD) se envía como `?fecha_ref=` solo si llega. Si el
 * backend no la usa, dejar `withFechaRef: false` en el registry y nunca llegará.
 */
export async function fetchHallazgosGeneralesEspeciales(
  fechaRef?: string,
): Promise<HallazgoAplicacion[]> {
  const qs = fechaRef ? `?fecha_ref=${encodeURIComponent(fechaRef)}` : '';
  return pick(await getJson(`${ENDPOINT}${qs}`));
}
