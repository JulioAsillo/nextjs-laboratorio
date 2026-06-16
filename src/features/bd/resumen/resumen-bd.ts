import type { HallazgoAplicacion } from '@/types/hallazgo';
import {
  GENERALES_SCENARIOS,
  VIDA_SCENARIOS,
  monitoreoValues,
  cellFor,
  type BdScenario,
  type ResumenCell,
} from './export-resumen-bd';

export interface ResumenMatrix {
  sheet: 'GENERALES' | 'VIDA';
  scenarios: BdScenario[];
  monitoreos: string[];
  /** monitoreo -> code -> celda. */
  cells: Record<string, Record<string, ResumenCell>>;
  /** code -> totales de la columna. */
  totals: Record<string, ResumenCell>;
  grandTotal: number;
}

function buildMatrix(
  sheet: 'GENERALES' | 'VIDA',
  scenarios: BdScenario[],
  rows: HallazgoAplicacion[],
): ResumenMatrix {
  const monitoreos = monitoreoValues(rows);
  const cells: Record<string, Record<string, ResumenCell>> = {};
  const totals: Record<string, ResumenCell> = {};
  for (const s of scenarios) totals[s.code] = { total: 0, gdh: 0, accesos: 0, ambos: 0 };

  for (const m of monitoreos) {
    cells[m] = {};
    for (const s of scenarios) {
      const c = cellFor(rows, s, m);
      cells[m][s.code] = c;
      totals[s.code].total += c.total;
      totals[s.code].gdh += c.gdh;
      totals[s.code].accesos += c.accesos;
      totals[s.code].ambos += c.ambos;
    }
  }

  const grandTotal = scenarios.reduce((acc, s) => acc + totals[s.code].total, 0);
  return { sheet, scenarios, monitoreos, cells, totals, grandTotal };
}

export interface ResumenBd {
  generales: ResumenMatrix;
  vida: ResumenMatrix;
  rowsGenerales: HallazgoAplicacion[];
  rowsVida: HallazgoAplicacion[];
}

/** Preview por escenarios a partir del detalle ya con Responsable poblado. */
export function buildResumenBd(
  generales: HallazgoAplicacion[],
  vida: HallazgoAplicacion[],
): ResumenBd {
  return {
    generales: buildMatrix('GENERALES', GENERALES_SCENARIOS, generales),
    vida: buildMatrix('VIDA', VIDA_SCENARIOS, vida),
    rowsGenerales: generales,
    rowsVida: vida,
  };
}
