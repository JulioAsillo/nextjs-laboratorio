import { getJson } from '@/lib/http';
import { fetchDatosApp, type DatosRow, type DatosResult } from '@/features/cargar/datos';
import { BD_DBS_PATH } from './endpoints';
import type { BdFuente } from './fuentes';

/** Toma el primer array que aparezca dentro de `data`. */
function pickFirstArray(data: unknown): DatosRow[] {
  if (Array.isArray(data)) return data as DatosRow[];
  if (data && typeof data === 'object') {
    for (const v of Object.values(data as Record<string, unknown>)) {
      if (Array.isArray(v)) return v as DatosRow[];
    }
  }
  return [];
}

/**
 * Consulta los datos cargados de una fuente.
 *  - 'shared' -> reutiliza Usuarios: GET /datos/apps/{appsKey}
 *  - 'dbs'    -> GET /datos/dbs/{db_name} -> { fecha_corte, data: { <db_name>: [...] } }
 */
export async function fetchDatosBd(kind: BdFuente['kind'], key: string): Promise<DatosResult> {
  if (kind === 'shared') return fetchDatosApp(key);

  const payload = await getJson<unknown>(`${BD_DBS_PATH}/${key}`);
  const obj = (payload ?? {}) as Record<string, unknown>;
  const data = 'data' in obj ? obj.data : payload;
  // fecha_corte de Cargar Información se ignora a propósito (suele venir "-").
  return { fechaCorte: null, rows: pickFirstArray(data) };
}

/** Clave SWR para la vista de datos de una fuente BD (única por appsKey/db_name). */
export const bdDatosKey = (key: string) => ['bd-datos', key] as const;
