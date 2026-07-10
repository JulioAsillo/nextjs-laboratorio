import type { HallazgoAplicacion } from '@/types/hallazgo';

/**
 * Motor GENÉRICO de "Resumen por escenarios", reutilizable por cualquier
 * certificación (AD, BD, Perfiles, …).
 *
 * La idea es la misma que `fuentes.ts`: toda la lógica vive aquí y cada
 * certificación solo aporta un archivo de CONFIG declarativo (un arreglo de
 * `ScenarioDef`) que dice, por escenario:
 *   - flagKey : columna booleana que marca la pertenencia base.
 *   - columns : qué columnas se PINTAN en la hoja de detalle (las "amarillas").
 *   - filters : filtros extra (en AND) que también afectan el CONTEO del resumen.
 */

export type Row = HallazgoAplicacion;

/** Contexto de ejecución que los filtros pueden consultar. */
export interface ScenarioContext {
  /**
   * Mes de ejecución en formato 'YYYY-MM' (derivado de la fecha de corte).
   * Si está ausente, los filtros `monthEquals` no restringen nada.
   */
  mesEjecucion?: string;
}

/**
 * Filtro declarativo aplicado a una fila ADEMÁS del flag del escenario.
 * Todas las comparaciones de texto son trim + case-insensitive.
 *
 *  - equals / notEquals : igualdad exacta contra `value`.
 *  - in                 : el valor de la celda está dentro de `values`.
 *  - notEmpty           : la celda no está vacía.
 *  - truthy             : la celda es "positiva" (igual heurística que un flag).
 *  - monthEquals        : el mes de la fecha en la celda == ctx.mesEjecucion.
 */
export type RowFilter =
  | { field: string; op: 'equals'; value: string }
  | { field: string; op: 'notEquals'; value: string }
  | { field: string; op: 'in'; values: string[] }
  | { field: string; op: 'notEmpty' }
  | { field: string; op: 'truthy' }
  | { field: string; op: 'monthEquals' };

export interface ScenarioDef {
  code: string;
  title: string;
  /** Columna booleana que marca pertenencia base. '' = sin flag (solo filtros). */
  flagKey: string;
  /** Keys (de las columnas de la certificación) que se pintan en la hoja de detalle. */
  columns: string[];
  /** Filtros extra; se aplican en AND y afectan el conteo del resumen. */
  filters?: RowFilter[];
}

function norm(value: unknown): string {
  return String(value ?? '').trim().toUpperCase();
}

/** Heurística "positivo" para flags/booleanos de texto. */
export function isPositive(value: unknown): boolean {
  const v = norm(value);
  return !['', 'NO', '0', 'FALSE', 'N', 'NULL', '-', 'N/A'].includes(v);
}

/**
 * Devuelve 'YYYY-MM' a partir de un valor fecha (ISO, 'DD/MM/YYYY', 'D-M-YYYY'
 * o un Date serializado). Retorna null si no se puede parsear.
 */
export function monthOf(value: unknown): string | null {
  const raw = String(value ?? '').trim();
  if (!raw) return null;

  const iso = raw.match(/^(\d{4})-(\d{2})/); // 2026-06-30 / 2026-06
  if (iso) return `${iso[1]}-${iso[2]}`;

  const dmy = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/); // 30/06/2026
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}`;

  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
  return null;
}

function getField(row: Row, field: string): unknown {
  return (row as Record<string, unknown>)[field];
}

function passesFilter(row: Row, f: RowFilter, ctx: ScenarioContext): boolean {
  const cell = getField(row, f.field);
  switch (f.op) {
    case 'equals':
      return norm(cell) === norm(f.value);
    case 'notEquals':
      return norm(cell) !== norm(f.value);
    case 'in':
      return f.values.map(norm).includes(norm(cell));
    case 'notEmpty':
      return norm(cell) !== '';
    case 'truthy':
      return isPositive(cell);
    case 'monthEquals':
      if (!ctx.mesEjecucion) return true; // sin corte definido -> no restringe
      return monthOf(cell) === ctx.mesEjecucion;
    default:
      return true;
  }
}

/** ¿La fila pertenece al escenario? = flag positivo (si hay) Y todos los filtros. */
export function rowMatchesScenario(row: Row, s: ScenarioDef, ctx: ScenarioContext): boolean {
  if (s.flagKey && !isPositive(getField(row, s.flagKey))) return false;
  return (s.filters ?? []).every((f) => passesFilter(row, f, ctx));
}

export function rowsForScenario(rows: Row[], s: ScenarioDef, ctx: ScenarioContext = {}): Row[] {
  return rows.filter((row) => rowMatchesScenario(row, s, ctx));
}

/* ------------------------------------------------------------------ */
/* Responsable (clasificación INCLUSIVA: una fila puede sumar a GDH y a ACCESOS) */
/* ------------------------------------------------------------------ */

/**
 * Clasificación de Responsable NO excluyente: una fila puede pertenecer a GDH
 * y a ACCESOS a la vez. Un valor "GDH | ACCESOS" cuenta en AMBAS columnas.
 *
 * (Antes existía un bucket excluyente "AMBOS"; se eliminó por decisión de
 * negocio: ahora "GDH | ACCESOS" suma +1 a GDH y +1 a ACCESOS.)
 */
export function hasGdh(value: unknown): boolean {
  return norm(value).includes('GDH');
}
export function hasAccesos(value: unknown): boolean {
  return norm(value).includes('ACCESO');
}

/**
 * Cuenta filas cuyo `Responsable` incluye el tipo pedido. INCLUSIVO: las filas
 * "GDH | ACCESOS" se cuentan tanto en 'GDH' como en 'ACCESOS' (por eso
 * gdh + accesos puede superar el total del escenario).
 */
export function countByResponsible(rows: Row[], responsible: 'GDH' | 'ACCESOS'): number {
  const has = responsible === 'GDH' ? hasGdh : hasAccesos;
  return rows.filter((row) => has((row as Record<string, unknown>).Responsable)).length;
}

/** Junta los comentarios distintos y no vacíos de un set de filas. */
export function collectComentarios(rows: Row[], key = 'Comentario'): string {
  const seen = new Set<string>();
  for (const row of rows) {
    const c = String((row as Record<string, unknown>)[key] ?? '').trim();
    if (c) seen.add(c);
  }
  return Array.from(seen).join(' | ');
}

/* ------------------------------------------------------------------ */
/* Preview (vista previa por escenario)                                */
/* ------------------------------------------------------------------ */

export interface ResumenScenarioRow {
  code: string;
  title: string;
  total: number;
  gdh: number;
  accesos: number;
}

export interface ResumenScenario {
  rows: ResumenScenarioRow[];
  totalRows: number;
  totalHallazgos: number;
}

/** Construye el preview por escenario (mismas flags/filtros/conteo que el export). */
export function buildScenarioResumen(
  rows: Row[],
  scenarios: ScenarioDef[],
  ctx: ScenarioContext = {},
): ResumenScenario {
  const out: ResumenScenarioRow[] = scenarios.map((s) => {
    const scoped = rowsForScenario(rows, s, ctx);
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
