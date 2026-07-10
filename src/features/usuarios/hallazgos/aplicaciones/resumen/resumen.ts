import type { HallazgoAplicacion } from '@/types/hallazgo';
import { KEY_APLICACION, KEY_ESCENARIO, KEY_RESPONSABLE } from '../columns';
import { hasGdh, hasAccesos } from '@/lib/resumen/scenario-engine';

export interface ResumenRow {
  aplicacion: string;
  h1Total: number; // Cesados - N° Hallazgos
  h1Gdh: number;
  h1Accesos: number;
  h2Total: number; // No identificados - N° Hallazgos
  h2Gdh: number;
  h2Accesos: number;
}

export interface Resumen {
  rows: ResumenRow[];
  total: ResumenRow;
}

/** H1: escenario "Cesado Activo" EXCLUYENDO "Cesado Activo Ticket". */
export const matchesH1 = (esc: string) => {
  const l = esc.toLowerCase();
  return l.includes('cesado activo') && !l.includes('cesado activo ticket');
};
/** H2: el escenario CONTIENE "no identificado". Agrega más términos aquí si surgen. */
export const matchesH2 = (esc: string) => esc.toLowerCase().includes('no identificado');

function emptyRow(aplicacion: string): ResumenRow {
  return {
    aplicacion,
    h1Total: 0, h1Gdh: 0, h1Accesos: 0,
    h2Total: 0, h2Gdh: 0, h2Accesos: 0,
  };
}

/**
 * Construye el resumen por aplicación a partir del detalle (reporte_apps) ya con Responsable llenado.
 * - N° Hallazgos: todas las filas del escenario (independiente del Responsable).
 * - GDH / ACCESOS: subconjunto según Responsable.toUpperCase().
 * - Escenario vacío -> no entra a ningún escenario. Responsable vacío/otro -> no suma a subtotales.
 * - Toda aplicación con valor aparece (aunque tenga 0 hallazgos), igual que en la hoja modelo.
 */
export function buildResumen(rows: HallazgoAplicacion[]): Resumen {
  const map = new Map<string, ResumenRow>();

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const app = (r[KEY_APLICACION] ?? '').trim();
    if (!app) continue;

    let acc = map.get(app);
    if (!acc) {
      acc = emptyRow(app);
      map.set(app, acc);
    }

    const esc = (r[KEY_ESCENARIO] ?? '').trim();
    if (!esc) continue; // vacío no cuenta

    const resp = (r[KEY_RESPONSABLE] ?? '').trim();
    const esGdh = hasGdh(resp);
    const esAccesos = hasAccesos(resp);

    if (matchesH1(esc)) {
      acc.h1Total++;
      if (esGdh) acc.h1Gdh++;
      if (esAccesos) acc.h1Accesos++;
    } else if (matchesH2(esc)) {
      acc.h2Total++;
      if (esGdh) acc.h2Gdh++;
      if (esAccesos) acc.h2Accesos++;
    }
  }

  const rowsArr = Array.from(map.values()).sort((a, b) =>
    a.aplicacion.localeCompare(b.aplicacion, 'es'),
  );

  const total = emptyRow('TOTAL');
  for (const r of rowsArr) {
    total.h1Total += r.h1Total;
    total.h1Gdh += r.h1Gdh;
    total.h1Accesos += r.h1Accesos;
    total.h2Total += r.h2Total;
    total.h2Gdh += r.h2Gdh;
    total.h2Accesos += r.h2Accesos;
  }

  return { rows: rowsArr, total };
}
