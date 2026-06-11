import type { HallazgoAplicacion } from '@/types/hallazgo';
import { palette } from './theme';
import { KEY_ESCENARIO, KEY_APLICACION } from './columns';

export interface EscenarioStat {
  label: string;
  count: number;
  color: string;
}

export interface Summary {
  escenarios: EscenarioStat[];
  totalApps: number;
  totalRows: number;
}

/** Paleta de respaldo para escenarios no reconocidos (se cicla por orden de aparición). */
const cyclePalette = [
  palette.primary,
  palette.secondary,
  palette.tertiary,
  palette.inverseSurface,
  palette.error,
  palette.outline,
];

/** Asigna un color de la paleta a cada escenario. Casos conocidos tienen color estable. */
function colorForEscenario(label: string, index: number): string {
  const l = label.toLowerCase();
  if (l.includes('no identificado')) return palette.outline;
  if (l.includes('cesado activo ticket')) return palette.tertiary;
  if (l.includes('cesado activo')) return palette.error;
  return cyclePalette[index % cyclePalette.length];
}

/**
 * Calcula en UNA sola pasada (O(n)) el conteo por escenario y el número de
 * aplicaciones distintas. Apto para 90k+ registros.
 */
export function computeSummary(rows: HallazgoAplicacion[]): Summary {
  const escenarioCounts = new Map<string, number>();
  const appSet = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    const esc = (row[KEY_ESCENARIO] ?? '').trim() || 'Sin escenario';
    escenarioCounts.set(esc, (escenarioCounts.get(esc) ?? 0) + 1);

    const app = (row[KEY_APLICACION] ?? '').trim();
    if (app) appSet.add(app);
  }

  const escenarios: EscenarioStat[] = Array.from(escenarioCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, count], index) => ({ label, count, color: colorForEscenario(label, index) }));

  return { escenarios, totalApps: appSet.size, totalRows: rows.length };
}
