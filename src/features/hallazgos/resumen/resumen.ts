import type { HallazgoAplicacion } from '@/types/hallazgo';
import { KEY_APLICACION, KEY_ESCENARIO, KEY_RESPONSABLE } from '../columns';

export interface ResumenRow {
  aplicacion: string;
  h1Total: number; // Cesados - N° Hallazgos
  h1Gdh: number;
  h1Accesos: number;
  h1Ambos: number;
  h2Total: number; // No identificados - N° Hallazgos
  h2Gdh: number;
  h2Accesos: number;
  h2Ambos: number;
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

/**
 * Clasifica el Responsable (ya en MAYÚSCULAS) de forma EXCLUYENTE.
 * "GDH | ACCESOS" / "ACCESOS | GDH" -> AMBOS.
 */
function classifyResp(resp: string): 'GDH' | 'ACCESOS' | 'AMBOS' | 'OTRO' {
  const g = resp.includes('GDH');
  const a = resp.includes('ACCESO');
  if (g && a) return 'AMBOS';
  if (g) return 'GDH';
  if (a) return 'ACCESOS';
  return 'OTRO';
}

function emptyRow(aplicacion: string): ResumenRow {
  return {
    aplicacion,
    h1Total: 0, h1Gdh: 0, h1Accesos: 0, h1Ambos: 0,
    h2Total: 0, h2Gdh: 0, h2Accesos: 0, h2Ambos: 0,
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

    const resp = (r[KEY_RESPONSABLE] ?? '').trim().toUpperCase();
    const tipo = classifyResp(resp);

    if (matchesH1(esc)) {
      acc.h1Total++;
      if (tipo === 'GDH') acc.h1Gdh++;
      else if (tipo === 'ACCESOS') acc.h1Accesos++;
      else if (tipo === 'AMBOS') acc.h1Ambos++;
    } else if (matchesH2(esc)) {
      acc.h2Total++;
      if (tipo === 'GDH') acc.h2Gdh++;
      else if (tipo === 'ACCESOS') acc.h2Accesos++;
      else if (tipo === 'AMBOS') acc.h2Ambos++;
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
    total.h1Ambos += r.h1Ambos;
    total.h2Total += r.h2Total;
    total.h2Gdh += r.h2Gdh;
    total.h2Accesos += r.h2Accesos;
    total.h2Ambos += r.h2Ambos;
  }

  return { rows: rowsArr, total };
}
