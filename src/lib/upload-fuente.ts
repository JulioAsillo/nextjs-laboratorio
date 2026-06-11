const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
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
 *   POST {BASE_URL}{UPLOAD_PATH}?file_name={fileName}
 *   Content-Type: multipart/form-data  (campo "file")
 *
 * No se fija Content-Type a mano: el navegador agrega el `boundary` correcto.
 * `fileName` es el identificador del backend (p.ej. "usuarios_billing_center",
 * "ad_pps", "activos_gdh"). Vive en `slot.fileName` (ver src/config/fuentes.ts).
 */
export async function uploadFuente(fileName: string, file: File): Promise<UploadResult> {
  const form = new FormData();
  form.append('file', file, file.name);

  const url = `${BASE_URL}${UPLOAD_PATH}?file_name=${encodeURIComponent(fileName)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: form,
  });

  if (!res.ok) throw new Error(`Error ${res.status} al subir ${file.name}`);

  try {
    return (await res.json()) as UploadResult;
  } catch {
    return {};
  }
}
