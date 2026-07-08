import type { HallazgoAplicacion } from '@/types/hallazgo';
import { getJson } from '@/lib/http';

/**
 * Fetcher del hallazgo "Activos GDH".
 *
 * Contrato real del backend:
 *   GET {API_BASE}/hallazgos/activos-gdh
 *   -> { cert_activos: HallazgoAplicacion[] }
 *
 * El backend NO envuelve la respuesta en `data`, pero `pick()` acepta ambas
 * formas (array directo, { cert_activos }, o { data: { cert_activos } }) por
 * robustez, igual que Perfiles/Aplicaciones. No recibe query params.
 */
const ENDPOINT =
  process.env.NEXT_PUBLIC_PERFILES_ACTIVOS_GDH_ENDPOINT ?? '/hallazgos/activos_gdh';

function pick(raw: unknown): HallazgoAplicacion[] {
  if (Array.isArray(raw)) return raw as HallazgoAplicacion[];
  const obj = (raw ?? {}) as Record<string, unknown>;
  const data = (obj.data && typeof obj.data === 'object' ? obj.data : obj) as Record<string, unknown>;
  for (const k of ['cert_activos', 'activos', 'reporte_activos']) {
    if (Array.isArray(data[k])) return data[k] as HallazgoAplicacion[];
  }
  return [];
}

export async function fetchHallazgosActivosGdh(): Promise<HallazgoAplicacion[]> {
  return pick(await getJson(`${ENDPOINT}`));
}
