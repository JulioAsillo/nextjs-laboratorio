import { readHeadersAsText } from '@/lib/excel/read-as-text';

/**
 * Lee SOLO la primera fila (cabeceras) de un archivo .csv / .xls / .xlsx.
 *
 * Delega en el lector único `@/lib/excel/read-as-text`, que NO infiere tipos
 * (ver ahí el porqué). Así la validación de columnas y el posterior unificado
 * leen el archivo exactamente igual: cero divergencias.
 */
export async function readHeaders(file: File): Promise<string[]> {
  return readHeadersAsText(file);
}
