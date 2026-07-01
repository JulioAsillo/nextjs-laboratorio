import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { withTimestamp } from '@/lib/excel/filename';
import { bdVidaColumns, bdGeneralesColumns } from '../bd-columns';
import { colorGroups } from '@/lib/theme';
import { writeCell } from '@/lib/excel/cell-format';
import { styleHeader } from '@/lib/excel/style';
import type { ColumnDef } from '@/features/usuarios/hallazgos/aplicaciones/columns';
import type { HallazgoAplicacion } from '@/types/hallazgo';

type Row = HallazgoAplicacion;

/**
 * Campo por el que se agrupan las filas del resumen (las "Escenarios de
 * monitoreo": EPPS, ODW1, PVIDA6…). Por defecto el nombre del archivo de origen.
 * Si para VIDA debe agruparse por otro campo (p.ej. "DB Name"), cámbialo aquí.
 */
export const KEY_MONITOREO = 'Nombre Archivo';

export interface BdScenario {
  /** Nombre de la hoja de detalle, p.ej. "H1_GENERALES". */
  code: string;
  /** Etiqueta corta, p.ej. "H1". */
  hx: string;
  title: string;
  /** Columna booleana de escenario en el detalle. */
  flagKey: string;
  /** Si abre las sub-columnas Reportar GDH / Reportar Acceso (solo H1 y H2). */
  reportable: boolean;
  sheet: 'GENERALES' | 'VIDA';
}

/** GENERALES: 5 escenarios (H1–H5). Solo H1 y H2 se reportan por GDH/Acceso. */
export const GENERALES_SCENARIOS: BdScenario[] = [
  { code: 'H1_GENERALES', hx: 'H1', title: 'Colaboradores Cesados con cuenta activa', flagKey: 'Cesado Activo', reportable: true, sheet: 'GENERALES' },
  { code: 'H2_GENERALES', hx: 'H2', title: 'Usuarios no identificados o sin sustento', flagKey: 'No Identificado', reportable: true, sheet: 'GENERALES' },
  { code: 'H3_GENERALES', hx: 'H3', title: 'Usuarios sin uso más de 90 días', flagKey: 'Sin Uso 90d', reportable: false, sheet: 'GENERALES' },
  { code: 'H4_GENERALES', hx: 'H4', title: 'Usuarios que no fueron cesados oportunamente', flagKey: 'No Cesado Oportunamente', reportable: false, sheet: 'GENERALES' },
  { code: 'H5_GENERALES', hx: 'H5', title: 'Usuarios Deshabilitados mayor a 6 meses', flagKey: 'Deshabilitado 180d', reportable: false, sheet: 'GENERALES' },
];

/** VIDA: 3 escenarios (H1–H3). Solo H1 y H2 se reportan por GDH/Acceso. */
export const VIDA_SCENARIOS: BdScenario[] = [
  { code: 'H1_VIDA', hx: 'H1', title: 'Colaboradores Cesados con cuenta activa', flagKey: 'Cesado Activo', reportable: true, sheet: 'VIDA' },
  { code: 'H2_VIDA', hx: 'H2', title: 'Usuarios no identificados o sin sustento', flagKey: 'No Identificado', reportable: true, sheet: 'VIDA' },
  { code: 'H3_VIDA', hx: 'H3', title: 'Usuarios sin uso más de 90 días', flagKey: 'Sin Uso 90d', reportable: false, sheet: 'VIDA' },
];

/* ── Helpers de conteo (mismas reglas que el resumen de Usuarios) ──────── */

function normalize(value: unknown): string {
  return String(value ?? '').trim().toUpperCase();
}

function isPositive(value: unknown): boolean {
  const v = normalize(value);
  return !['', 'NO', '0', 'FALSE', 'N', 'NULL', '-', 'N/A'].includes(v);
}

/**
 * Clasifica el Responsable de una fila de forma EXCLUYENTE:
 *  - 'AMBOS'   -> contiene GDH y ACCESO(S)  (p.ej. "GDH | ACCESOS")
 *  - 'GDH'     -> solo GDH
 *  - 'ACCESOS' -> solo ACCESO(S)
 *  - 'OTRO'    -> vacío, "-", TECNOLOGIA, etc.
 */
export type ResponsableTipo = 'GDH' | 'ACCESOS' | 'AMBOS' | 'OTRO';

export function classifyResponsible(value: unknown): ResponsableTipo {
  const v = normalize(value);
  const hasGdh = v.includes('GDH');
  const hasAcc = v.includes('ACCESO');
  if (hasGdh && hasAcc) return 'AMBOS';
  if (hasGdh) return 'GDH';
  if (hasAcc) return 'ACCESOS';
  return 'OTRO';
}

/** Filas de un escenario (flag positiva). */
export function rowsForScenario(rows: Row[], scenario: BdScenario): Row[] {
  return rows.filter((row) => isPositive((row as Record<string, unknown>)[scenario.flagKey]));
}

function monitoreoOf(row: Row): string {
  return String((row as Record<string, unknown>)[KEY_MONITOREO] ?? '').trim();
}

/** Valores distintos del agrupador, en orden de aparición. */
export function monitoreoValues(rows: Row[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const row of rows) {
    const v = monitoreoOf(row);
    if (v && !seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}

export interface ResumenCell {
  total: number;
  /** Solo GDH. */
  gdh: number;
  /** Solo ACCESOS. */
  accesos: number;
  /** GDH | ACCESOS (ambos). */
  ambos: number;
}

/** Conteo de un escenario para un "monitoreo" concreto. */
export function cellFor(rows: Row[], scenario: BdScenario, monitoreo: string): ResumenCell {
  const scoped = rowsForScenario(rows, scenario).filter((r) => monitoreoOf(r) === monitoreo);
  const cell: ResumenCell = { total: scoped.length, gdh: 0, accesos: 0, ambos: 0 };
  for (const r of scoped) {
    const tipo = classifyResponsible((r as Record<string, unknown>).Responsable);
    if (tipo === 'GDH') cell.gdh += 1;
    else if (tipo === 'ACCESOS') cell.accesos += 1;
    else if (tipo === 'AMBOS') cell.ambos += 1;
  }
  return cell;
}

/* ── Estilos Excel ─────────────────────────────────────────────────────── */

function box(cell: ExcelJS.Cell, fill?: string, bold = false) {
  if (fill) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
  cell.border = {
    top: { style: 'thin', color: { argb: '000000' } },
    left: { style: 'thin', color: { argb: '000000' } },
    bottom: { style: 'thin', color: { argb: '000000' } },
    right: { style: 'thin', color: { argb: '000000' } },
  };
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  cell.font = { name: 'Calibri', size: 11, bold };
}

const FILL_TITLE = 'F8CBAD';
const FILL_GROUP = 'FCE4D6';
const FILL_LINK = 'DDEBF7';
const FILL_MONITOREO = 'FCE4D6';
const FILL_TOTAL = 'E2EFDA';

/**
 * Dibuja una tabla-matriz (GENERALES o VIDA) en la hoja "Escenarios".
 * Devuelve la siguiente fila libre.
 */
function writeMatrix(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  tableTitle: string,
  scenarios: BdScenario[],
  rows: Row[],
): number {
  const monitoreos = monitoreoValues(rows);
  const subCols = scenarios.map((s) => (s.reportable ? 4 : 1));
  const totalCols = 1 + subCols.reduce((a, b) => a + b, 0);
  const lastCol = totalCols; // col 1 = etiqueta

  const rTitle = startRow;
  const rGroup = startRow + 1;
  const rLink = startRow + 2;
  const rHead = startRow + 3;
  const rData0 = startRow + 4;

  // Título de la tabla (merge en toda la fila).
  sheet.mergeCells(rTitle, 1, rTitle, lastCol);
  const titleCell = sheet.getCell(rTitle, 1);
  titleCell.value = tableTitle;
  box(titleCell, FILL_TITLE, true);

  // Col A: "Escenarios de monitoreo" abarca group+link+head.
  sheet.mergeCells(rGroup, 1, rHead, 1);
  const aCell = sheet.getCell(rGroup, 1);
  aCell.value = 'Escenarios de monitoreo';
  box(aCell, FILL_MONITOREO, true);

  // Grupo (título escenario) + link (Hx) por escenario.
  let col = 2;
  scenarios.forEach((s, i) => {
    const span = subCols[i];
    sheet.mergeCells(rGroup, col, rGroup, col + span - 1);
    const g = sheet.getCell(rGroup, col);
    g.value = s.title;
    box(g, FILL_GROUP, true);

    sheet.mergeCells(rLink, col, rLink, col + span - 1);
    const l = sheet.getCell(rLink, col);
    l.value = { text: `${s.hx}  ${s.sheet}`, hyperlink: `#'${s.code}'!A1` };
    box(l, FILL_LINK, true);
    l.font = { name: 'Calibri', size: 11, bold: true, color: { argb: '0563C1' }, underline: true };

    // Sub-cabeceras.
    const subHeaders = s.reportable
      ? ['Hallazgos inicial', 'Reportar GDH', 'Reportar Acceso', 'GDH | ACCESOS']
      : ['Hallazgos inicial'];
    subHeaders.forEach((h, k) => {
      const c = sheet.getCell(rHead, col + k);
      c.value = h;
      box(c, FILL_GROUP, true);
    });

    col += span;
  });

  // Filas de datos.
  const totals: ResumenCell[] = scenarios.map(() => ({ total: 0, gdh: 0, accesos: 0, ambos: 0 }));
  monitoreos.forEach((m, ri) => {
    const r = rData0 + ri;
    const label = sheet.getCell(r, 1);
    label.value = m;
    box(label, undefined, true);
    label.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

    let c = 2;
    scenarios.forEach((s, i) => {
      const cell = cellFor(rows, s, m);
      totals[i].total += cell.total;
      totals[i].gdh += cell.gdh;
      totals[i].accesos += cell.accesos;
      totals[i].ambos += cell.ambos;

      const values = s.reportable
        ? [cell.total, cell.gdh, cell.accesos, cell.ambos]
        : [cell.total];
      values.forEach((v, k) => {
        const cc = sheet.getCell(r, c + k);
        cc.value = v;
        box(cc);
      });
      c += subCols[i];
    });
  });

  // Fila TOTAL.
  const rTotal = rData0 + monitoreos.length;
  const totalLabel = sheet.getCell(rTotal, 1);
  totalLabel.value = 'TOTAL';
  box(totalLabel, FILL_TOTAL, true);
  let tc = 2;
  scenarios.forEach((s, i) => {
    const values = s.reportable
      ? [totals[i].total, totals[i].gdh, totals[i].accesos, totals[i].ambos]
      : [totals[i].total];
    values.forEach((v, k) => {
      const cc = sheet.getCell(rTotal, tc + k);
      cc.value = v;
      box(cc, FILL_TOTAL, true);
    });
    tc += subCols[i];
  });

  return rTotal + 2; // deja una fila en blanco
}

/** Hoja de detalle por escenario (idéntica al patrón de Usuarios). */
function buildDetailSheet(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  columns: ColumnDef[],
  rows: Row[],
) {
  const sheet = workbook.addWorksheet(sheetName, { views: [{ state: 'frozen', ySplit: 3 }] });

  sheet.columns = columns.map((c) => ({
    key: c.key,
    width: c.widthPx ? Math.max(12, Math.round(c.widthPx / 7)) : 18,
  }));

  sheet.mergeCells('B1:C1');
  const back = sheet.getCell('B1');
  back.value = { text: 'VOLVER A ESCENARIOS', hyperlink: `#'Escenarios'!A1` };
  back.font = { color: { argb: '0563C1' }, underline: true, bold: true };
  back.alignment = { horizontal: 'center', vertical: 'middle' };

  const headerRow = sheet.getRow(3);
  columns.forEach((col, idx) => {
    const group = colorGroups[col.group];
    const cell = headerRow.getCell(idx + 1);
    cell.value = col.header;
    styleHeader(cell, group.fill, group.text);
  });
  headerRow.height = 24;

  rows.forEach((row) => {
    const excelRow = sheet.addRow([]);
    columns.forEach((col, idx) => {
      writeCell(excelRow.getCell(idx + 1), (row as Record<string, unknown>)[col.key], col.isDate);
    });
  });

  sheet.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3, column: columns.length } };
}

/**
 * Genera el libro de resumen BD:
 *  - Hoja "Escenarios": matriz GENERALES (H1–H5) + matriz VIDA (H1–H3).
 *  - Una hoja de detalle por escenario (H1_GENERALES… / H1_VIDA…) con TODAS las
 *    columnas del hallazgo, filtradas a ese escenario, e hipervínculo de regreso.
 */
export async function exportResumenBdExcel(
  vida: Row[],
  generales: Row[],
  fileName = 'resumen-hallazgos-base-de-datos.xlsx',
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Certificación de Base de Datos';
  workbook.created = new Date();

  const summary = workbook.addWorksheet('Escenarios', { views: [{ state: 'frozen', ySplit: 0 }] });
  summary.getColumn(1).width = 30;
  for (let i = 2; i <= 14; i++) summary.getColumn(i).width = 13;

  let next = writeMatrix(summary, 1, 'Base de Datos SOX GENERALES', GENERALES_SCENARIOS, generales);
  writeMatrix(summary, next + 1, 'Base de Datos SOX VIDA', VIDA_SCENARIOS, vida);

  for (const s of GENERALES_SCENARIOS) {
    buildDetailSheet(workbook, s.code, bdGeneralesColumns, rowsForScenario(generales, s));
  }
  for (const s of VIDA_SCENARIOS) {
    buildDetailSheet(workbook, s.code, bdVidaColumns, rowsForScenario(vida, s));
  }

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    withTimestamp(fileName),
  );
}
