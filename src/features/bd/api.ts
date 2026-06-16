import type { HallazgoAplicacion } from '@/types/hallazgo';
import { getJson } from '@/lib/http';

/**
 * Fetcher del "Hallazgo Base de Datos".
 *
 * GET http://localhost:8000/hallazgos/dbs  ->  { data: { db_generales: [...], db_vida: [...] } }
 * Devuelve ambas hojas en un solo objeto para alimentar las dos pestañas.
 *
 * `fechaRef` (YYYY-MM-DD) se envía como query `?fecha_ref=` cuando está
 * presente. Mismo nombre de parámetro que en Hallazgo AD: todos los hallazgos
 * (excepto Aplicaciones) comparten el contrato `?fecha_ref={fecha}`.
 */
const ENDPOINT_DBS = process.env.NEXT_PUBLIC_BD_HALLAZGOS_ENDPOINT ?? '/hallazgos/dbs';

export interface BdHallazgoDbs {
  vida: HallazgoAplicacion[];
  generales: HallazgoAplicacion[];
}

function pick(raw: unknown, keys: string[]): HallazgoAplicacion[] {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const data = (obj.data && typeof obj.data === 'object' ? obj.data : obj) as Record<string, unknown>;
  for (const k of keys) {
    if (Array.isArray(data[k])) return data[k] as HallazgoAplicacion[];
  }
  return [];
}

export async function fetchBdHallazgoDbs(fechaRef?: string): Promise<BdHallazgoDbs> {
  const qs = fechaRef ? `?fecha_ref=${encodeURIComponent(fechaRef)}` : '';
  const raw = await getJson(`${ENDPOINT_DBS}${qs}`);
  return {
    vida: pick(raw, ['db_vida', 'vida']),
    generales: pick(raw, ['db_generales', 'generales']),
  };
}