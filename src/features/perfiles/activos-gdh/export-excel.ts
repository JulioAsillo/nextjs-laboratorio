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
  findingRowsFor,
  TIPO_ROL,
  SOCIEDADES,
  type ActivosGdhResumen,
  type ReporteGdhTable,
} from './resumen';

const norm = (v: unknown): string => String(v ?? '').trim().toLowerCase();

/* ═══════════════════════════ hojas de DETALLE por escenario ═══════════════════════════ */

/** Columnas extra (vacías, para llenar manualmente) al final de cada hoja de detalle. */
const EXTRA_COLS = [
  { key: 'accion_correctiva', header: 'Acción Correctiva', width: 30 },
  { key: 'comentario_detalle', header: 'Comentario', width: 30 },
];

interface Detalle {
  tipoRol: string;
  label: string; // Planilla | FFVV | Proveedores
  sociedad: string;
  sheetName: string;
  rows: HallazgoAplicacion[];
}

/** Código corto de sociedad para el nombre de hoja (Excel: máx 31 chars). */
function socShort(soc: string): string {
  const n = norm(soc);
  if (n.includes('eps')) return 'SA EPS';
  if (n.includes('cia') || n.includes('reaseg')) return 'CIA SEG';
  return soc.slice(0, 12);
}

/** Sanitiza y recorta un nombre de hoja a las reglas de Excel. */
function sanitizeSheetName(name: string): string {
  const s = name.replace(/[:\\/?*[\]]/g, ' ').replace(/\s+/g, ' ').trim();
  return s.length > 31 ? s.slice(0, 31).trim() : s;
}

/** Hipervínculo interno a otra hoja (nombre entre comillas por si tiene espacios). */
function internalLink(sheetName: string): string {
  return `#'${sheetName.replace(/'/g, "''")}'!A1`;
}

/** Escenarios (Tipo Rol × Sociedad) que tienen al menos un hallazgo -> una hoja c/u. */
function buildDetalles(rows: HallazgoAplicacion[]): Detalle[] {
  const defs = [
    { tipoRol: TIPO_ROL.planilla, label: 'Planilla' },
    { tipoRol: TIPO_ROL.ffvv, label: 'FFVV' },
    { tipoRol: TIPO_ROL.proveedor, label: 'Proveedores' },
  ];
  const out: Detalle[] = [];
  const used = new Set<string>();
  for (const d of defs) {
    for (const soc of SOCIEDADES) {
      const fr = findingRowsFor(rows, d.tipoRol, soc);
      if (!fr.length) continue; // sin hallazgos -> sin hoja
      let name = sanitizeSheetName(`${d.label} - ${socShort(soc)}`);
      let i = 2;
      while (used.has(name.toLowerCase())) name = sanitizeSheetName(`${d.label} ${socShort(soc)} ${i++}`);
      used.add(name.toLowerCase());
      out.push({ tipoRol: d.tipoRol, label: d.label, sociedad: soc, sheetName: name, rows: fr });
    }
  }
  return out;
}

/** Escribe una hoja de detalle: 17 columnas del hallazgo + Acción Correctiva + Comentario. */
function writeDetalleSheet(workbook: ExcelJS.Workbook, det: Detalle): void {
  const dataCols: ColumnDef[] = activosGdhColumns;
  const sheet = workbook.addWorksheet(det.sheetName, { views: [{ state: 'frozen', ySplit: 1 }] });
  sheet.columns = [
    ...dataCols.map((c) => ({ key: c.key, width: c.width ?? 18 })),
    ...EXTRA_COLS.map((c) => ({ key: c.key, width: c.width })),
  ];

  const headerRow = sheet.getRow(1);
  dataCols.forEach((col, idx) => {
    const g = colorGroups[col.group];
    const cell = headerRow.getCell(idx + 1);
    cell.value = col.header;
    styleHeader(cell, g.fill, g.text);
  });
  const accion = colorGroups.C8; // Escenarios (naranja) para columnas de acción
  EXTRA_COLS.forEach((col, i) => {
    const cell = headerRow.getCell(dataCols.length + 1 + i);
    cell.value = col.header;
    styleHeader(cell, accion.fill, accion.text);
  });
  headerRow.height = 30;

  det.rows.forEach((row) => {
    const excelRow = sheet.addRow([]);
    dataCols.forEach((col, idx) => {
      writeCell(excelRow.getCell(idx + 1), row[col.key], col.isDate);
    });
    // Acción Correctiva / Comentario quedan vacías para llenar a mano.
    for (let i = 0; i < EXTRA_COLS.length; i++) {
      excelRow.getCell(dataCols.length + 1 + i).value = null;
    }
  });

  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: dataCols.length + EXTRA_COLS.length },
  };
}

/* ═══════════════════════════ hoja RESUMEN ═══════════════════════════
 * Margen: A y fila 1 vacías; tablas desde B2. B=etiquetas, C..F=datos.
 * Cada sociedad enlaza a su hoja de detalle (si existe) vía hipervínculo interno.
 */

const MARGIN_COL = 1;
const START_ROW = 2;

const TITLE_FILL = '#283044';
const HEADER_FILL = colorGroups.C1.fill;
const HEADER_TEXT = colorGroups.C1.text;
const SUB_FILL = '#D9E1F2';
const LABEL_FILL = '#EEF1FF';
const VALUE_FILL = '#FFFFFF';
const FINDING_FILL = '#FFF2CC';
const PCT_FILL = '#F2F5FB';
const BORDER = '#BDC8D0';
const LINK_TEXT = '#0F4C81';

type Fmt = {
  bold?: boolean;
  fill?: string;
  textColor?: string;
  numFmt?: string;
  align?: 'left' | 'center' | 'right';
  size?: number;
};

function applyBorder(cell: ExcelJS.Cell): void {
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
  applyBorder(cell);
}

function put(sheet: ExcelJS.Worksheet, r: number, c: number, value: ExcelJS.CellValue, fmt: Fmt = {}): void {
  const cell = sheet.getCell(r, c);
  style(cell, fmt);
  cell.value = value;
}

/** Combina un rango horizontal, lo estiliza, y opcionalmente lo vuelve hipervínculo. */
function mergePut(
  sheet: ExcelJS.Worksheet,
  r: number,
  c1: number,
  c2: number,
  value: string,
  fmt: Fmt = {},
  linkSheet?: string,
): void {
  sheet.mergeCells(r, c1, r, c2);
  for (let c = c1; c <= c2; c++) style(sheet.getCell(r, c), fmt);
  const anchor = sheet.getCell(r, c1);
  if (linkSheet) {
    anchor.value = { text: value, hyperlink: internalLink(linkSheet) };
    anchor.font = { name: 'Inter', size: fmt.size ?? 11, bold: true, underline: true, color: { argb: argb(LINK_TEXT) } };
  } else {
    anchor.value = value;
  }
}

const pct = (n: number, d: number): number => (d > 0 ? n / d : 0);

type SheetFor = (tipoRol: string, sociedad: string) => string | undefined;

function writeReporteGdh(
  sheet: ExcelJS.Worksheet,
  table: ReporteGdhTable,
  top: number,
  sheetFor: SheetFor,
): number {
  const [s1, s2] = table.sociedades;
  const [B, C, D, E, F] = [2, 3, 4, 5, 6];
  let r = top;

  mergePut(sheet, r, B, F, table.titulo.toUpperCase(), {
    bold: true, fill: TITLE_FILL, textColor: '#ffffff', align: 'left', size: 12,
  });
  sheet.getRow(r).height = 22;
  r += 1;

  mergePut(sheet, r, C, F, 'Reporte GDH', { bold: true, fill: HEADER_FILL, textColor: HEADER_TEXT });
  sheet.getRow(r).height = 18;
  r += 1;

  mergePut(sheet, r, C, D, s1.sociedad, { bold: true, fill: SUB_FILL }, sheetFor(table.tipoRol, s1.sociedad));
  mergePut(sheet, r, E, F, s2.sociedad, { bold: true, fill: SUB_FILL }, sheetFor(table.tipoRol, s2.sociedad));
  r += 1;

  put(sheet, r, C, 'Roles', { bold: true, fill: SUB_FILL });
  put(sheet, r, D, 'Usuarios', { bold: true, fill: SUB_FILL });
  put(sheet, r, E, 'Roles', { bold: true, fill: SUB_FILL });
  put(sheet, r, F, 'Usuarios', { bold: true, fill: SUB_FILL });
  r += 1;

  put(sheet, r, B, 'Reporte GDH', { bold: true, align: 'left', fill: LABEL_FILL });
  put(sheet, r, C, s1.reporte.roles, { fill: VALUE_FILL });
  put(sheet, r, D, s1.reporte.usuarios, { fill: VALUE_FILL });
  put(sheet, r, E, s2.reporte.roles, { fill: VALUE_FILL });
  put(sheet, r, F, s2.reporte.usuarios, { fill: VALUE_FILL });
  r += 1;

  put(sheet, r, B, '# Hallazgos inicial', { bold: true, align: 'left', fill: LABEL_FILL });
  put(sheet, r, C, s1.hallazgos.roles, { fill: FINDING_FILL });
  put(sheet, r, D, s1.hallazgos.usuarios, { fill: FINDING_FILL });
  put(sheet, r, E, s2.hallazgos.roles, { fill: FINDING_FILL });
  put(sheet, r, F, s2.hallazgos.usuarios, { fill: FINDING_FILL });
  r += 1;

  put(sheet, r, B, '% Hallazgos inicial', { bold: true, align: 'left', fill: LABEL_FILL });
  put(sheet, r, C, pct(s1.hallazgos.roles, s1.reporte.roles), { fill: PCT_FILL, bold: true, numFmt: '0%' });
  put(sheet, r, D, pct(s1.hallazgos.usuarios, s1.reporte.usuarios), { fill: PCT_FILL, bold: true, numFmt: '0%' });
  put(sheet, r, E, pct(s2.hallazgos.roles, s2.reporte.roles), { fill: PCT_FILL, bold: true, numFmt: '0%' });
  put(sheet, r, F, pct(s2.hallazgos.usuarios, s2.reporte.usuarios), { fill: PCT_FILL, bold: true, numFmt: '0%' });
  r += 2;

  return r;
}

function writeProveedores(
  sheet: ExcelJS.Worksheet,
  resumen: ActivosGdhResumen,
  top: number,
  sheetFor: SheetFor,
): number {
  const [p1, p2] = resumen.proveedores;
  const [B, C, D] = [2, 3, 4];
  let r = top;

  mergePut(sheet, r, B, D, 'PROVEEDORES', {
    bold: true, fill: TITLE_FILL, textColor: '#ffffff', align: 'left', size: 12,
  });
  sheet.getRow(r).height = 22;
  r += 1;

  put(sheet, r, B, '', { fill: SUB_FILL });
  mergePut(sheet, r, C, C, p1.sociedad, { bold: true, fill: SUB_FILL }, sheetFor(TIPO_ROL.proveedor, p1.sociedad));
  mergePut(sheet, r, D, D, p2.sociedad, { bold: true, fill: SUB_FILL }, sheetFor(TIPO_ROL.proveedor, p2.sociedad));
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

function addResumenSheet(workbook: ExcelJS.Workbook, rows: HallazgoAplicacion[], sheetFor: SheetFor): void {
  const resumen = buildActivosGdhResumen(rows);
  const sheet = workbook.addWorksheet('RESUMEN', { views: [{ showGridLines: false }] });

  sheet.getColumn(MARGIN_COL).width = 3;
  sheet.getColumn(2).width = 24;
  for (let c = 3; c <= 6; c++) sheet.getColumn(c).width = 17;
  sheet.getRow(1).height = 8;

  let r = START_ROW;
  for (const table of resumen.reporteGdh) r = writeReporteGdh(sheet, table, r, sheetFor);
  writeProveedores(sheet, resumen, r, sheetFor);
}

/* ═══════════════════════════ hoja de datos + orquestación ═══════════════════════════ */

/**
 * Exporta el hallazgo "Activos GDH" en un solo libro (desde el botón Export):
 *   1) "ACTIVOS GDH" -> todos los datos.
 *   2) "RESUMEN"     -> conteos/%; cada sociedad enlaza a su hoja de detalle.
 *   3) Hojas de detalle por escenario con hallazgos (Planilla/FFVV/Proveedores
 *      × Sociedad) + columnas Acción Correctiva y Comentario.
 */
export async function exportActivosGdhToExcel(
  rows: HallazgoAplicacion[],
  fileName = 'hallazgo-activos-gdh.xlsx',
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Certificación de Perfiles';
  workbook.created = new Date();

  // 1) Hoja de datos completa.
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

  // Escenarios con hallazgos -> hojas de detalle + lookup para hipervínculos.
  const detalles = buildDetalles(rows);
  const sheetFor: SheetFor = (tipoRol, sociedad) =>
    detalles.find((d) => norm(d.tipoRol) === norm(tipoRol) && norm(d.sociedad) === norm(sociedad))?.sheetName;

  // 2) RESUMEN (con enlaces).
  addResumenSheet(workbook, rows, sheetFor);

  // 3) Hojas de detalle.
  for (const det of detalles) writeDetalleSheet(workbook, det);

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    withTimestamp(fileName),
  );
}
