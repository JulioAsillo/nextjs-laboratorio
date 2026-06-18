import type { HallazgoAplicacion } from '@/types/hallazgo';
import { PERFILES_VALIDACIONES } from './perfiles-columns';

export interface ValidacionStat {
  key: string;
  label: string;
  /** Filas con resultado "Incorrecto" (los hallazgos a revisar). */
  incorrectos: number;
}

export interface PerfilesSummary {
  total: number;
  stats: ValidacionStat[];
}

const LABELS: Record<string, string> = {
  'Rol+App': 'Rol + App',
  'Rol+App+Perfil': 'Rol + App + Perfil',
  'Rol+Perfil': 'Rol + Perfil',
};

const isIncorrecto = (v: unknown): boolean => String(v ?? '').trim().toLowerCase() === 'incorrecto';

/**
 * Resumen del hallazgo: por cada validación contra la Matriz de Roles
 * (Rol+App, Rol+App+Perfil, Rol+Perfil) cuenta cuántas filas dan "Incorrecto".
 *
 * IMPORTANTE: referencia de módulo estable (no inline) para que el `useMemo`
 * de HallazgosView funcione bien con datasets grandes.
 */
export function computePerfilesSummary(rows: HallazgoAplicacion[]): PerfilesSummary {
  return {
    total: rows.length,
    stats: PERFILES_VALIDACIONES.map((key) => ({
      key,
      label: LABELS[key] ?? key,
      incorrectos: rows.reduce((acc, row) => acc + (isIncorrecto(row[key]) ? 1 : 0), 0),
    })),
  };
}
