import { sendJson } from '@/lib/http';

const DELETE_PATH = process.env.NEXT_PUBLIC_DELETE_PATH ?? '/datos/apps/delete';

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
  return sendJson<DeleteResult>(`${DELETE_PATH}?app_name=${encodeURIComponent(appName)}`, {
    method: 'DELETE',
  });
}

/** Purga TODOS los Excel del backend (sin app_name). */
export async function purgeAll(): Promise<PurgeResult> {
  return sendJson<PurgeResult>(DELETE_PATH, { method: 'DELETE' });
}
