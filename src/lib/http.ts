/**
 * Cliente HTTP único de la app.
 *
 * Fuente de verdad de `BASE_URL` y del patrón fetch + manejo de errores, que
 * antes estaba duplicado en api.ts, datos.ts, upload-fuente.ts y delete-fuente.ts.
 * Las funciones de dominio ahora dependen de esta abstracción (DIP), no de fetch.
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

/** Construye la URL absoluta a partir de un path relativo del backend. */
export function apiUrl(path: string): string {
  return `${BASE_URL}${path}`;
}

/** GET que devuelve JSON tipado. Lanza si la respuesta no es `ok`. */
export async function getJson<T = unknown>(path: string): Promise<T> {
  const url = apiUrl(path);
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} al consultar ${url}`);
  return res.json() as Promise<T>;
}

/**
 * Petición con método/cuerpo arbitrario (POST FormData, DELETE, etc.).
 * Lanza si no es `ok`. Si el cuerpo no es JSON parseable, devuelve `{}`.
 * No fija Content-Type: con FormData el navegador agrega el boundary correcto.
 */
export async function sendJson<T = unknown>(path: string, init: RequestInit): Promise<T> {
  const url = apiUrl(path);
  const res = await fetch(url, {
    ...init,
    headers: { Accept: 'application/json', ...(init.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} en ${url}`);
  try {
    return (await res.json()) as T;
  } catch {
    return {} as T;
  }
}
