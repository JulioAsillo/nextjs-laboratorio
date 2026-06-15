import { sendJson } from '@/lib/http';
import { uploadFuente } from '@/features/cargar/upload-fuente';
import { deleteFuente, type DeleteResult, type PurgeResult } from '@/features/cargar/delete-fuente';
import { BD_DBS_PATH } from './endpoints';
import type { BdFuente } from './fuentes';

/**
 * UPLOAD: idéntico a Usuarios para TODAS las cards (/datos/upload?file_name=...).
 * Solo cambia `file_name` (db_vida / db_generales para las DB).
 */
export const uploadFuenteBd = uploadFuente;

/**
 * DELETE por fuente:
 *  - 'shared' -> Usuarios: DELETE /datos/apps/delete?app_name={appsKey}
 *  - 'dbs'    -> DELETE /datos/dbs/delete?db_name={db_name}
 */
export async function deleteFuenteBd(kind: BdFuente['kind'], key: string): Promise<DeleteResult> {
  if (kind === 'shared') return deleteFuente(key);
  return sendJson<DeleteResult>(`${BD_DBS_PATH}/delete?db_name=${encodeURIComponent(key)}`, {
    method: 'DELETE',
  });
}

/**
 * "Eliminar todo": elimina secuencialmente cada fuente con su backend propio.
 * (No hay purga única para /datos/dbs, y una purga ciega de /datos/apps borraría
 * data de Usuarios fuera de este módulo.)
 */
export async function purgeAllBd(fuentes: BdFuente[]): Promise<PurgeResult> {
  const reporte: NonNullable<PurgeResult['reporte']> = {};
  for (const f of fuentes) {
    if (!f.appsKey) continue;
    try {
      const res = await deleteFuenteBd(f.kind, f.appsKey);
      reporte[f.appsKey] = { status: 'procesado', archivo_eliminado: res.archivo_eliminado ?? true };
    } catch (e) {
      reporte[f.appsKey] = { status: 'error', detalle: e instanceof Error ? e.message : 'Error' };
    }
  }
  return { success: true, reporte };
}

/* ── upload-status (LS propio de BD, aislado del de Usuarios) ──────── */
const LS_KEY = 'itsecops-bd-upload-status-v1';
type Store = Record<string, Record<string, boolean>>;

function read(): Store {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '{}'); }
  catch { return {}; }
}
function write(s: Store) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LS_KEY, JSON.stringify(s));
}

export function markUploadedBd(fuenteId: string, fileName: string) {
  const s = read();
  s[fuenteId] = { ...(s[fuenteId] ?? {}), [fileName]: true };
  write(s);
}
export function isSlotUploadedBd(fuenteId: string, fileName: string): boolean {
  return read()[fuenteId]?.[fileName] === true;
}
export function clearFuenteBd(fuenteId: string) {
  const s = read();
  delete s[fuenteId];
  write(s);
}
export function clearAllUploadsBd() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LS_KEY);
}
