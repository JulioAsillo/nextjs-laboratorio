import type { HallazgoAplicacion } from '@/types/hallazgo';

export interface EscenarioStat {
  key: string;
  label: string;
  count: number;
}

const NEGATIVOS = new Set(['', 'no', '0', 'false', 'n', '-', 'null', 'none']);

/** Un flag se cuenta como activo si su valor no es vacío/negativo. */
export function isFlagOn(value: unknown): boolean {
  if (value == null) return false;
  return !NEGATIVOS.has(String(value).trim().toLowerCase());
}

/** Cuenta cuántas filas tienen activo cada flag de escenario. */
export function computePerfilesSummary(
  rows: HallazgoAplicacion[],
  flags: readonly string[],
): EscenarioStat[] {
  return flags.map((key) => ({
    key,
    label: key,
    count: rows.reduce((acc, row) => acc + (isFlagOn(row[key]) ? 1 : 0), 0),
  }));
}
