import type { HallazgoAplicacion } from '@/types/hallazgo';
import { scenarios, rowsForScenario, countByResponsible } from '../export-resumen-ad';

export interface ResumenAdRow {
  code: string;
  title: string;
  total: number;
  gdh: number;
  accesos: number;
}

export interface ResumenAd {
  rows: ResumenAdRow[];
  totalRows: number;
  totalHallazgos: number;
}

/**
 * Construye el preview por escenario (H1_AD…H7_AD) a partir del detalle ya con
 * Responsable poblado. Usa exactamente las mismas flags y conteo que el export.
 */
export function buildResumenAd(rows: HallazgoAplicacion[]): ResumenAd {
  const out: ResumenAdRow[] = scenarios.map((s) => {
    const scoped = rowsForScenario(rows, s);
    return {
      code: s.code,
      title: s.title,
      total: scoped.length,
      gdh: countByResponsible(scoped, 'GDH'),
      accesos: countByResponsible(scoped, 'ACCESOS'),
    };
  });

  const totalHallazgos = out.reduce((acc, r) => acc + r.total, 0);
  return { rows: out, totalRows: rows.length, totalHallazgos };
}