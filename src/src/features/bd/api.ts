import type { HallazgoAplicacion } from '@/types/hallazgo';
import { getJson } from '@/lib/http';

/**
 * Fetcher del "Hallazgo Base de Datos".
 *
 * GET http://localhost:8000/hallazgos/dbs  ->  { data: { db_generales: [...], db_vida: [...] } }
 * Devuelve ambas hojas en un solo objeto para alimentar las dos pestañas.
 *
 * El path es configurable por entorno; el default apunta al endpoint real.
 */
const ENDPOINT_DBS = process.env.NEXT_PUBLIC_BD_HALLAZGOS_ENDPOINT ?? '/hallazgos/dbs';

export interface BdHallazgoDbs {
  vida: HallazgoAplicacion[];
  generales: HallazgoAplicacion[];
}

/** Extrae un array por nombre de clave dentro de `data` (o de la raíz). */
function pick(raw: unknown, keys: string[]): HallazgoAplicacion[] {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const data = (obj.data && typeof obj.data === 'object' ? obj.data : obj) as Record<string, unknown>;
  for (const k of keys) {
    if (Array.isArray(data[k])) return data[k] as HallazgoAplicacion[];
  }
  return [];
}

export async function fetchBdHallazgoDbs(): Promise<BdHallazgoDbs> {
  const raw = await getJson(ENDPOINT_DBS);
  return {
    vida: pick(raw, ['db_vida', 'vida']),
    generales: pick(raw, ['db_generales', 'generales']),
  };
}
