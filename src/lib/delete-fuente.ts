const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
const DELETE_PATH = process.env.NEXT_PUBLIC_DELETE_PATH ?? '/datos/apps/delete';
// Método del endpoint. Asumo GET (lo probaste pegando la URL). Si es DELETE/POST, cámbialo aquí.
const METHOD = 'DELETE';

export interface DeleteResult {
  success?: boolean;
  mensaje?: string;
  archivo_eliminado?: boolean;
}

export interface PurgeReportEntry {
  status: string;               // 'procesado' | 'error'
  archivo_eliminado?: boolean;
  detalle?: string;
}
export interface PurgeResult {
  success?: boolean;
  mensaje?: string;
  reporte?: Record<string, PurgeReportEntry>;
}

/** Elimina el/los Excel del backend para una app (app_name = appsKey). */
export async function deleteFuente(appName: string): Promise<DeleteResult> {
  const url = `${BASE_URL}${DELETE_PATH}?app_name=${encodeURIComponent(appName)}`;
  const res = await fetch(url, { method: METHOD, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Error ${res.status} al eliminar ${appName}`);
  try { return (await res.json()) as DeleteResult; } catch { return {}; }
}

/** Purga TODOS los Excel del backend (sin app_name). */
export async function purgeAll(): Promise<PurgeResult> {
  const url = `${BASE_URL}${DELETE_PATH}`;
  const res = await fetch(url, { method: METHOD, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Error ${res.status} en la purga total`);
  try { return (await res.json()) as PurgeResult; } catch { return {}; }
}