/**
 * Utilidades para nombrar los Excel exportados con un sello temporal.
 *
 * Todos los exports (Usuarios, BD, Perfiles y sus resúmenes) pasan su
 * `fileName` por `withTimestamp(...)`, de modo que el archivo descargado queda
 * como `nombre_YYYYMMDD_HHMMSS.xlsx`. El sello usa la HORA LOCAL del usuario
 * (la del momento de exportar), que es lo esperado en el nombre de archivo.
 */

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Devuelve `YYYYMMDD_HHMMSS` en hora local. */
export function timestampTag(d: Date = new Date()): string {
  const ymd = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const hms = `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  return `${ymd}_${hms}`;
}

/**
 * Inserta `_YYYYMMDD_HHMMSS` ANTES de la extensión del archivo:
 *   'hallazgos-aplicaciones.xlsx' -> 'hallazgos-aplicaciones_20260701_134507.xlsx'
 * Si el nombre no tiene extensión, se agrega al final.
 */
export function withTimestamp(fileName: string, d: Date = new Date()): string {
  const tag = timestampTag(d);
  const dot = fileName.lastIndexOf('.');
  if (dot <= 0) return `${fileName}_${tag}`; // sin extensión (o punto inicial)
  return `${fileName.slice(0, dot)}_${tag}${fileName.slice(dot)}`;
}
