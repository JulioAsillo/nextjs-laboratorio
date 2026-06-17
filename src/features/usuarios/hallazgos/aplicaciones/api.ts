import type { HallazgoAplicacion } from '@/types/hallazgo';
import { getJson } from '@/lib/http';

const ENDPOINT_APPS = process.env.NEXT_PUBLIC_HALLAZGOS_ENDPOINT ?? '/hallazgos/apps';
const ENDPOINT_AD = process.env.NEXT_PUBLIC_HALLAZGOS_AD_ENDPOINT ?? '/hallazgos/ad';

type Row = HallazgoAplicacion;

/** Extrae el array de filas desde { data: { <key>: [...] } } y variantes. */
function pickCollection(raw: unknown, keys: string[]): Row[] {
  if (Array.isArray(raw)) return raw as Row[];
  const obj = (raw ?? {}) as Record<string, unknown>;
  const data = obj.data;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    for (const k of keys) {
      const v = (data as Record<string, unknown>)[k];
      if (Array.isArray(v)) return v as Row[];
    }
  }
  if (Array.isArray(data)) return data as Row[];
  for (const k of keys) {
    if (Array.isArray(obj[k])) return obj[k] as Row[];
  }
  return [];
}

/**
 * Hallazgos de Aplicaciones: /hallazgos/apps -> data.reporte_apps
 * NO recibe fecha de referencia (es el único hallazgo sin `fecha_ref`).
 */
export async function fetchHallazgos(): Promise<Row[]> {
  try {
    return pickCollection(await getJson(ENDPOINT_APPS), ['reporte_apps']);
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      const mock = await fetch('/mock-hallazgos.json').then((r) => r.json());
      return pickCollection(mock, ['reporte_apps']);
    }
    throw err;
  }
}

/**
 * Hallazgos de Active Directory: /hallazgos/ad -> data.reporte_ad
 *
 * `fechaRef` (YYYY-MM-DD) se envía como query `?fecha_ref=` cuando está
 * presente. El disparo es manual desde la vista (igual que Base de Datos).
 */
export async function fetchHallazgosAd(fechaRef?: string): Promise<Row[]> {
  const qs = fechaRef ? `?fecha_ref=${encodeURIComponent(fechaRef)}` : '';
  return pickCollection(await getJson(`${ENDPOINT_AD}${qs}`), ['reporte_ad']);
}