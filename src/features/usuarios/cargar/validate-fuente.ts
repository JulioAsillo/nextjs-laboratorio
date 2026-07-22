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
/**
 * Caracteres INVISIBLES que se cuelan en las cabeceras al exportar desde
 * PowerShell / Excel / Entra / web y que rompen el match silenciosamente:
 *   U+FEFF  BOM / zero-width no-break space (el "ï»¿" del reporte AD/Entra)
 *   U+200B  zero-width space
 *   U+200C  zero-width non-joiner
 *   U+200D  zero-width joiner
 *   U+00AD  soft hyphen (guion invisible)
 *   U+2060  word joiner
 * `String.prototype.trim()` NO los elimina, por eso hay que quitarlos aparte.
 */
const INVISIBLES = /[\uFEFF\u200B\u200C\u200D\u00AD\u2060]/g;

/**
 * Comillas ENVOLVENTES (al inicio o final) que algunos exports pegan alrededor
 * del nombre de la columna: rectas (" '), tipográficas dobles (“ ”) y simples
 * (‘ ’). Solo se quitan en los bordes; nunca en medio del texto.
 */
const WRAPPING_QUOTES = /^["'\u201C\u2018\u201D\u2019]+|["'\u201C\u2018\u201D\u2019]+$/g;

/**
 * Normaliza una cabecera para compararla de forma tolerante:
 *  1) NFD + quita diacríticos (tildes, diéresis)  -> "Á" == "A"
 *  2) quita caracteres invisibles (BOM, zero-width, soft-hyphen)
 *  3) quita comillas envolventes ("samaccountname" -> samaccountname)
 *  4) recorta y colapsa espacios internos (incluye NBSP, tab, saltos de línea)
 *  5) MAYÚSCULAS
 *
 * Con esto, "ï»¿\"samaccountname\"" y "SAMACCOUNTNAME" se consideran iguales.
 */
export const normHeader = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // diacríticos combinantes (tildes, diéresis)
    .replace(INVISIBLES, '') // BOM, zero-width, soft-hyphen, word-joiner
    .replace(/[\u00A0\t\r\n]+/g, ' ') // NBSP / tab / saltos -> espacio normal
    .trim()
    .replace(WRAPPING_QUOTES, '') // comillas envolventes tras recortar bordes
    .trim() // por si quedaban espacios pegados a las comillas
    .replace(/\s+/g, ' ') // colapsa espacios internos
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
