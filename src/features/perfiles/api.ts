import type { HallazgoAplicacion } from '@/types/hallazgo';
import { getJson } from '@/lib/http';

/**
 * Fetcher del "Hallazgo de Perfiles".
 *
 * Contrato real del backend:
 *   GET {API_BASE}/hallazgos/profiles
 *   -> { data: { reporte_perfiles: HallazgoAplicacion[] } }
 *
 * Se aceptan variantes (array directo, `reporte_perfiles`/`perfiles`/`profiles`)
 * por robustez, igual que en Aplicaciones (`reporte_apps`).
 *
 * NO recibe fecha de referencia: el endpoint no toma query params. Si en el
 * futuro el backend agrega `?fecha_ref=`, el parámetro `fechaRef` ya está listo
 * para enviarse (ver más abajo).
 */
const ENDPOINT = process.env.NEXT_PUBLIC_PERFILES_HALLAZGOS_ENDPOINT ?? '/hallazgos/profiles';

function pick(raw: unknown): HallazgoAplicacion[] {
  if (Array.isArray(raw)) return raw as HallazgoAplicacion[];
  const obj = (raw ?? {}) as Record<string, unknown>;
  const data = (obj.data && typeof obj.data === 'object' ? obj.data : obj) as Record<string, unknown>;
  for (const k of ['reporte_perfiles', 'perfiles', 'profiles']) {
    if (Array.isArray(data[k])) return data[k] as HallazgoAplicacion[];
  }
  return [];
}

export async function fetchHallazgosPerfiles(fechaRef?: string): Promise<HallazgoAplicacion[]> {
  // El endpoint actual no usa fecha. Se deja preparado por si el backend la añade.
  //const qs = fechaRef ? `?fecha_ref=${encodeURIComponent(fechaRef)}` : '';
  return pick(await getJson(`${ENDPOINT}`));
}
