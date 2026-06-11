import type { HallazgoAplicacion } from '@/types/hallazgo';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
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

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} al consultar ${url}`);
  return res.json();
}

/** Hallazgos de Aplicaciones: /hallazgos/apps -> data.reporte_apps */
export async function fetchHallazgos(): Promise<Row[]> {
  const url = `${BASE_URL}${ENDPOINT_APPS}`;
  try {
    return pickCollection(await fetchJson(url), ['reporte_apps']);
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      const mock = await fetch('/mock-hallazgos.json').then((r) => r.json());
      return pickCollection(mock, ['reporte_apps']);
    }
    throw err;
  }
}

/** Hallazgos de Active Directory: /hallazgos/ad -> data.reporte_ad */
export async function fetchHallazgosAd(): Promise<Row[]> {
  const url = `${BASE_URL}${ENDPOINT_AD}`;
  return pickCollection(await fetchJson(url), ['reporte_ad']);
}
