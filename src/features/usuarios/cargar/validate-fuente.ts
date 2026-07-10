import { FORMATOS } from '@/config/fuentes';

export interface ColumnValidation {
  ok: boolean;
  missing: string[]; // columnas esperadas que NO aparecen
  extra: string[]; // columnas del archivo que no se esperaban
}

/**
 * Normaliza una cabecera para comparar: quita tildes/diacríticos, recorta,
 * colapsa espacios y pasa a MAYÚSCULAS.
 *
 * Al ignorar tildes, un mismo header canónico (p. ej. "ÁREA DE NÓMINA") acepta
 * el Excel tanto con tildes como sin ellas ("AREA DE NOMINA"). Esto vale para
 * TODAS las certificaciones, no solo GDH.
 */
export const normHeader = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // elimina diacríticos combinantes (tildes, diéresis)
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();

/** Valida la extensión contra los formatos permitidos (.csv, .xls, .xlsx). */
export function isAllowedFormat(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return FORMATOS.some((ext) => lower.endsWith(ext));
}

/**
 * Compara las cabeceras encontradas contra las esperadas (ambas normalizadas).
 * Es válido cuando no falta ninguna columna esperada. Las extra solo se informan.
 */
export function validateColumns(expected: string[], found: string[]): ColumnValidation {
  const foundSet = new Set(found.map(normHeader));
  const expectedSet = new Set(expected.map(normHeader));

  const missing = expected.filter((c) => !foundSet.has(normHeader(c)));
  const extra = found.filter((c) => !expectedSet.has(normHeader(c)));

  return { ok: missing.length === 0, missing, extra };
}
