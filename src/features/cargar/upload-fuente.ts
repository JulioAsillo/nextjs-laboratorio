import { sendJson } from '@/lib/http';

const UPLOAD_PATH = process.env.NEXT_PUBLIC_UPLOAD_PATH ?? '/datos/upload';

/** Respuesta del backend al subir un archivo correctamente. */
export interface UploadResult {
  success?: boolean;
  mensaje?: string;
  origen?: string;
  destino?: string;
}

/**
 * Sube un archivo validado al backend.
 *
 *   POST {UPLOAD_PATH}?file_name={fileName}
 *   Content-Type: multipart/form-data  (campo "file")
 *
 * `fileName` es el identificador del backend (p.ej. "usuarios_billing_center",
 * "ad_pps", "activos_gdh"). Vive en `slot.fileName` (ver features/cargar/fuentes.ts).
 */
export async function uploadFuente(fileName: string, file: File): Promise<UploadResult> {
  const form = new FormData();
  form.append('file', file, file.name);

  return sendJson<UploadResult>(`${UPLOAD_PATH}?file_name=${encodeURIComponent(fileName)}`, {
    method: 'POST',
    body: form,
  });
}
