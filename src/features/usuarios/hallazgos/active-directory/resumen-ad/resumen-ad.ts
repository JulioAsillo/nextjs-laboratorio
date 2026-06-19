import type { HallazgoAplicacion } from '@/types/hallazgo';
import {
  buildScenarioResumen,
  type ResumenScenario,
  type ResumenScenarioRow,
  type ScenarioContext,
} from '@/lib/resumen/scenario-engine';
import { adScenarios } from './ad-scenarios';

// Se mantienen los nombres ResumenAd* para no romper a los consumidores.
export type ResumenAdRow = ResumenScenarioRow;
export type ResumenAd = ResumenScenario;

/**
 * Construye el preview por escenario (H1_AD…H7_AD) a partir del detalle ya con
 * Responsable poblado. Usa exactamente las mismas flags, filtros y conteo que
 * el export, leyendo la config de `ad-scenarios.ts`.
 *
 * `ctx.mesEjecucion` ('YYYY-MM') alimenta el filtro de postcese de H2.
 */
export function buildResumenAd(
  rows: HallazgoAplicacion[],
  ctx: ScenarioContext = {},
): ResumenAd {
  return buildScenarioResumen(rows, adScenarios, ctx);
}
