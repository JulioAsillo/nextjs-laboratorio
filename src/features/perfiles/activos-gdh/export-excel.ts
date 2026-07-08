import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { withTimestamp } from '@/lib/excel/filename';
import { colorGroups } from '@/lib/theme';
import { writeCell } from '@/lib/excel/cell-format';
import { styleHeader, argb } from '@/lib/excel/style';
import type { ColumnDef } from '@/features/usuarios/hallazgos/aplicaciones/columns';
import type { HallazgoAplicacion } from '@/types/hallazgo';
import { activosGdhColumns } from './columns';
import {
  buildActivosGdhResumen,
  type ActivosGdhResumen,
  type ReporteGdhTable,
} from './resumen';

/* ─────────────────────────── hoja RESUMEN ───────────────────────────
 * Layout con margen: columna A y fila 1 vacías; las tablas arrancan en B2.
 *   B      = columna de etiquetas
 *   C..F   = datos (Reporte GDH: 2 sociedades × Roles/Usuarios)
 *   C..D   = datos (Proveedores: 2 sociedades)
 */

const MARGIN_COL = 1; // A
const LABEL_COL = 2; // B
const START_ROW = 2; // -> B2

// Paleta corporativa (Corporate Minimalist).
const TITLE_FILL = '#283044'; // banda de título de sección (inverse-surface)
const HEADER_FILL = colorGroups.C1.fill; // "Reporte GDH" (azul primario)
const HEADER_TEXT = colorGroups.C1.text; // blanco
const SUB_FILL = '#D9E1F2'; // sub-cabeceras (sociedad / Roles-Usuarios)
const LABEL_FILL = '#EEF1FF'; // columna de etiquetas
const VALUE_FILL = '#FFFFFF'; // valores "Reporte GDH" / "Cuenta de dni"
const FINDING_FILL = '#FFF2CC'; // resalte de hallazgos (ámbar suave)
const PCT_FILL = '#F2F5FB'; // filas de porcentaje
const BORDER = '#BDC8D0'; // outline-variant

type Fmt = {
  bold?: boolean;
  fill?: string;
  textColor?: string;
  numFmt?: string;
  align?: 'left' | 'center' | 'right';
  size?: number;
};

function border(cell: ExcelJS.Cell): void {
  const b = { style: 'thin' as const, color: { argb: argb(BORDER) } };
  cell.border = { top: b, left: b, bottom: b, right: b };
}

function style(cell: ExcelJS.Cell, fmt: Fmt): void {
  cell.font = {
    name: 'Inter',
    size: fmt.size ?? 11,
    bold: fmt.bold ?? false,
    color: fmt.textColor ? { argb: argb(fmt.textColor) } : undefined,
  };
  if (fmt.fill) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(fmt.fill) } };
  cell.alignment = { vertical: 'middle', horizontal: fmt.align ?? 'center' };
  if (fmt.numFmt) cell.numFmt = fmt.numFmt;
  border(cell);
}

/** Escribe una celda simple. */
function put(sheet: ExcelJS.Worksheet, r: number, c: number, value: ExcelJS.CellValue, fmt: Fmt = {}): void {
  const cell = sheet.getCell(r, c);
  cell.value = value;
  style(cell, fmt);
}

/** Combina un rango horizontal y lo estiliza en todas sus celdas (bordes limpios). */
function mergePut(
  sheet: ExcelJS.Worksheet,
  r: number,
  c1: number,
  c2: number,
  value: ExcelJS.CellValue,
  fmt: Fmt = {},
): void {
  sheet.mergeCells(r, c1, r, c2);
  for (let c = c1; c <= c2; c++) style(sheet.getCell(r, c), fmt);
  sheet.getCell(r, c1).value = value;
}

const pct = (n: number, d: number): number => (d > 0 ? n / d : 0);

/**
 * Tabla "Reporte GDH" (Planilla / FFVV). 5 columnas visibles: B etiquetas,
 * C/D sociedad1, E/F sociedad2. Devuelve la siguiente fila libre.
 */
function writeReporteGdh(sheet: ExcelJS.Worksheet, table: ReporteGdhTable, top: number): number {
  const [s1, s2] = table.sociedades;
  const [B, C, D, E, F] = [2, 3, 4, 5, 6];
  let r = top;

  // Banda de título de sección.
  mergePut(sheet, r, B, F, table.titulo.toUpperCase(), {
    bold: true, fill: TITLE_FILL, textColor: '#ffffff', align: 'left', size: 12,
  });
  sheet.getRow(r).height = 22;
  r += 1;

  // "Reporte GDH" (merge C:F).
  mergePut(sheet, r, C, F, 'Reporte GDH', { bold: true, fill: HEADER_FILL, textColor: HEADER_TEXT });
  sheet.getRow(r).height = 18;
  r += 1;

  // Sociedades.
  mergePut(sheet, r, C, D, s1.sociedad, { bold: true, fill: SUB_FILL });
  mergePut(sheet, r, E, F, s2.sociedad, { bold: true, fill: SUB_FILL });
  r += 1;

  // Roles / Usuarios.
  put(sheet, r, C, 'Roles', { bold: true, fill: SUB_FILL });
  put(sheet, r, D, 'Usuarios', { bold: true, fill: SUB_FILL });
  put(sheet, r, E, 'Roles', { bold: true, fill: SUB_FILL });
  put(sheet, r, F, 'Usuarios', { bold: true, fill: SUB_FILL });
  r += 1;

  // Reporte GDH (valores).
  put(sheet, r, B, 'Reporte GDH', { bold: true, align: 'left', fill: LABEL_FILL });
  put(sheet, r, C, s1.reporte.roles, { fill: VALUE_FILL });
  put(sheet, r, D, s1.reporte.usuarios, { fill: VALUE_FILL });
  put(sheet, r, E, s2.reporte.roles, { fill: VALUE_FILL });
  put(sheet, r, F, s2.reporte.usuarios, { fill: VALUE_FILL });
  r += 1;

  // # Hallazgos inicial (resaltado).
  put(sheet, r, B, '# Hallazgos inicial', { bold: true, align: 'left', fill: LABEL_FILL });
  put(sheet, r, C, s1.hallazgos.roles, { fill: FINDING_FILL });
  put(sheet, r, D, s1.hallazgos.usuarios, { fill: FINDING_FILL });
  put(sheet, r, E, s2.hallazgos.roles, { fill: FINDING_FILL });
  put(sheet, r, F, s2.hallazgos.usuarios, { fill: FINDING_FILL });
  r += 1;

  // % Hallazgos inicial.
  put(sheet, r, B, '% Hallazgos inicial', { bold: true, align: 'left', fill: LABEL_FILL });
  put(sheet, r, C, pct(s1.hallazgos.roles, s1.reporte.roles), { fill: PCT_FILL, bold: true, numFmt: '0%' });
  put(sheet, r, D, pct(s1.hallazgos.usuarios, s1.reporte.usuarios), { fill: PCT_FILL, bold: true, numFmt: '0%' });
  put(sheet, r, E, pct(s2.hallazgos.roles, s2.reporte.roles), { fill: PCT_FILL, bold: true, numFmt: '0%' });
  put(sheet, r, F, pct(s2.hallazgos.usuarios, s2.reporte.usuarios), { fill: PCT_FILL, bold: true, numFmt: '0%' });
  r += 2; // separación

  return r;
}

/** Tabla de Proveedores (B etiquetas, C/D sociedades). */
function writeProveedores(sheet: ExcelJS.Worksheet, resumen: ActivosGdhResumen, top: number): number {
  const [p1, p2] = resumen.proveedores;
  const [B, C, D] = [2, 3, 4];
  let r = top;

  mergePut(sheet, r, B, D, 'PROVEEDORES', {
    bold: true, fill: TITLE_FILL, textColor: '#ffffff', align: 'left', size: 12,
  });
  sheet.getRow(r).height = 22;
  r += 1;

  put(sheet, r, B, '', { fill: SUB_FILL });
  put(sheet, r, C, p1.sociedad, { bold: true, fill: SUB_FILL });
  put(sheet, r, D, p2.sociedad, { bold: true, fill: SUB_FILL });
  r += 1;

  put(sheet, r, B, 'Cuenta de dni', { bold: true, align: 'left', fill: LABEL_FILL });
  put(sheet, r, C, p1.cuentaDni, { fill: VALUE_FILL });
  put(sheet, r, D, p2.cuentaDni, { fill: VALUE_FILL });
  r += 1;

  put(sheet, r, B, 'No existen en AD', { bold: true, align: 'left', fill: LABEL_FILL });
  put(sheet, r, C, p1.noExistenAd, { fill: FINDING_FILL });
  put(sheet, r, D, p2.noExistenAd, { fill: FINDING_FILL });
  r += 1;

  put(sheet, r, B, '% No existen en AD', { bold: true, align: 'left', fill: LABEL_FILL });
  put(sheet, r, C, pct(p1.noExistenAd, p1.cuentaDni), { fill: PCT_FILL, bold: true, numFmt: '0.00%' });
  put(sheet, r, D, pct(p2.noExistenAd, p2.cuentaDni), { fill: PCT_FILL, bold: true, numFmt: '0.00%' });
  r += 1;

  return r;
}

function addResumenSheet(workbook: ExcelJS.Workbook, rows: HallazgoAplicacion[]): void {
  const resumen = buildActivosGdhResumen(rows);
  const sheet = workbook.addWorksheet('RESUMEN', { views: [{ showGridLines: false }] });

  // Margen izquierdo (A) + anchos.
  sheet.getColumn(MARGIN_COL).width = 3;
  sheet.getColumn(LABEL_COL).width = 24;
  for (let c = 3; c <= 6; c++) sheet.getColumn(c).width = 17;
  sheet.getRow(1).height = 8; // margen superior

  let r = START_ROW;
  for (const table of resumen.reporteGdh) r = writeReporteGdh(sheet, table, r);
  writeProveedores(sheet, resumen, r);
}

/* ─────────────────────────── hoja de datos + export ─────────────────────────── */

/**
 * Exporta el hallazgo "Activos GDH":
 *   Hoja 1 "ACTIVOS GDH" -> datos, cabeceras coloreadas por grupo.
 *   Hoja 2 "RESUMEN"     -> conteos por Tipo Rol (Planilla / FFVV / Proveedores), desde B2.
 */
export async function exportActivosGdhToExcel(
  rows: HallazgoAplicacion[],
  fileName = 'hallazgo-activos-gdh.xlsx',
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Certificación de Perfiles';
  workbook.created = new Date();

  const columns: ColumnDef[] = activosGdhColumns;
  const sheet = workbook.addWorksheet('ACTIVOS GDH', { views: [{ state: 'frozen', ySplit: 1 }] });
  sheet.columns = columns.map((c) => ({ key: c.key, width: c.width ?? 18 }));

  const headerRow = sheet.getRow(1);
  columns.forEach((col, idx) => {
    const group = colorGroups[col.group];
    const cell = headerRow.getCell(idx + 1);
    cell.value = col.header;
    styleHeader(cell, group.fill, group.text);
  });
  headerRow.height = 30;

  rows.forEach((row) => {
    const excelRow = sheet.addRow([]);
    columns.forEach((col, idx) => {
      writeCell(excelRow.getCell(idx + 1), row[col.key], col.isDate);
    });
  });

  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };

  // Segunda hoja: RESUMEN (solo este hallazgo).
  addResumenSheet(workbook, rows);

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    withTimestamp(fileName),
  );
}
