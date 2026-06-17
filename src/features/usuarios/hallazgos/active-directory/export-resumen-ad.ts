import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { adColumns } from './ad-columns';
import { colorGroups } from '@/lib/theme';
import { writeCell } from '@/lib/excel/cell-format';
import { styleHeader } from '@/lib/excel/style';
import type { HallazgoAplicacion } from '@/types/hallazgo';

type Row = HallazgoAplicacion;

export type ScenarioDef = {
  code: string;
  title: string;
  flagKey: string;
};

export const scenarios: ScenarioDef[] = [
  { code: 'H1_AD', title: 'Colaboradores Cesados con cuenta activa', flagKey: 'Cesado Activo' },
  { code: 'H2_AD', title: 'Usuarios con acceso posterior al cese del empleado', flagKey: 'Login Post Cese' },
  { code: 'H3_AD', title: 'Usuarios no identificados o sin sustento', flagKey: 'No Identificado' },
  { code: 'H4_AD', title: 'Identificación de usuarios sin uso más de 90 días de inactividad', flagKey: 'Sin Uso 90d' },
  { code: 'H5_AD', title: 'Identificación de usuarios deshabilitados más de 6 meses (AD) que no fueron eliminados', flagKey: 'Deshabilitado 180d' },
  { code: 'H6_AD', title: 'Usuarios con contraseña que no expire', flagKey: 'Contraseña no Expira' },
  { code: 'H7_AD', title: 'Usuarios que no pueden cambiar su contraseña', flagKey: 'No Puede Cambiar Contraseña' },
];

function normalize(value: unknown): string {
  return String(value ?? '').trim().toUpperCase();
}

function isPositive(value: unknown): boolean {
  const v = normalize(value);
  return !['', 'NO', '0', 'FALSE', 'N', 'NULL', '-', 'N/A'].includes(v);
}

/**
 * Clasifica el Responsable de forma EXCLUYENTE.
 * "GDH | ACCESOS" / "ACCESOS | GDH" -> AMBOS.
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

export function countByResponsible(rows: Row[], responsible: 'GDH' | 'ACCESOS' | 'AMBOS'): number {
  return rows.filter(
    (row) => classifyResponsible((row as Record<string, unknown>).Responsable) === responsible,
  ).length;
}

/** Junta los comentarios distintos y no vacíos de un escenario. */
function collectComentarios(rows: Row[]): string {
  const seen = new Set<string>();
  for (const row of rows) {
    const c = String((row as Record<string, unknown>).Comentario ?? '').trim();
    if (c) seen.add(c);
  }
  return Array.from(seen).join(' | ');
}

export function rowsForScenario(rows: Row[], scenario: ScenarioDef): Row[] {
  return rows.filter((row) => isPositive((row as Record<string, unknown>)[scenario.flagKey]));
}

function styleSummaryCell(cell: ExcelJS.Cell, fill: string, bold = false) {
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: fill },
  };
  cell.border = {
    top: { style: 'thin', color: { argb: '000000' } },
    left: { style: 'thin', color: { argb: '000000' } },
    bottom: { style: 'thin', color: { argb: '000000' } },
    right: { style: 'thin', color: { argb: '000000' } },
  };
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  cell.font = { name: 'Calibri', size: 11, bold };
}

function styleDataCell(cell: ExcelJS.Cell) {
  cell.border = {
    top: { style: 'thin', color: { argb: '000000' } },
    left: { style: 'thin', color: { argb: '000000' } },
    bottom: { style: 'thin', color: { argb: '000000' } },
    right: { style: 'thin', color: { argb: '000000' } },
  };
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  cell.font = { name: 'Calibri', size: 11 };
}

function buildDetailSheet(workbook: ExcelJS.Workbook, sheetName: string, rows: Row[]) {
  const sheet = workbook.addWorksheet(sheetName, {
    views: [{ state: 'frozen', ySplit: 3 }],
  });

  sheet.columns = adColumns.map((c) => ({
    key: c.key,
    width: c.widthPx ? Math.max(12, Math.round(c.widthPx / 7)) : 18,
  }));

  sheet.mergeCells('B1:C1');
  const back = sheet.getCell('B1');
  back.value = { text: 'VOLVER A ESCENARIOS', hyperlink: `#'Escenarios'!A1` };
  back.font = { color: { argb: '0563C1' }, underline: true, bold: true };
  back.alignment = { horizontal: 'center', vertical: 'middle' };

  const headerRow = sheet.getRow(3);
  adColumns.forEach((col, idx) => {
    const group = colorGroups[col.group];
    const cell = headerRow.getCell(idx + 1);
    cell.value = col.header;
    styleHeader(cell, group.fill, group.text);
  });
  headerRow.height = 24;

  rows.forEach((row) => {
    const excelRow = sheet.addRow([]);
    adColumns.forEach((col, idx) => {
      writeCell(excelRow.getCell(idx + 1), (row as Record<string, unknown>)[col.key], col.isDate);
    });
  });

  sheet.autoFilter = {
    from: { row: 3, column: 1 },
    to: { row: 3, column: adColumns.length },
  };
}

export async function exportResumenAdExcel(
  rows: Row[],
  fileName = 'resumen-hallazgos-active-directory.xlsx',
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Certificación de Usuarios';
  workbook.created = new Date();

  const summary = workbook.addWorksheet('Escenarios', {
    views: [{ state: 'frozen', ySplit: 4 }],
  });

  summary.columns = [
    { width: 42 }, // A Escenario
    { width: 16 }, // B Total
    { width: 16 }, // C GDH
    { width: 18 }, // D ACCESOS
    { width: 18 }, // E GDH | ACCESOS
    { width: 14 }, // F Hoja
    { width: 38 }, // G comentario/resumen libre
  ];

  summary.mergeCells('B2:F2');
  summary.getCell('B2').value = 'AD';
  styleSummaryCell(summary.getCell('B2'), 'F7DCCB', true);

  summary.mergeCells('B3:F3');
  summary.getCell('B3').value = 'VIDA-PPS';
  styleSummaryCell(summary.getCell('B3'), 'D9E6F2', true);

  const headers = [
    { cell: 'A4', value: 'Escenarios de monitoreo', fill: 'FCE4D6' },
    { cell: 'B4', value: 'N° Hallazgos', fill: 'FFFFFF' },
    { cell: 'C4', value: 'Hallazgos GDH', fill: 'FFFFFF' },
    { cell: 'D4', value: 'Hallazgos ACCESOS', fill: 'FFFFFF' },
    { cell: 'E4', value: 'Hallazgos GDH | ACCESOS', fill: 'FFFFFF' },
    { cell: 'F4', value: 'Hallazgos', fill: 'D9E6F2' },
    { cell: 'G4', value: 'Comentario', fill: 'FFFFFF' },
  ];

  headers.forEach(({ cell, value, fill }) => {
    summary.getCell(cell).value = value;
    styleSummaryCell(summary.getCell(cell), fill, true);
  });

  let rowIndex = 5;
  for (const scenario of scenarios) {
    const scenarioRows = rowsForScenario(rows, scenario);
    const total = scenarioRows.length;
    const gdh = countByResponsible(scenarioRows, 'GDH');
    const accesos = countByResponsible(scenarioRows, 'ACCESOS');
    const ambos = countByResponsible(scenarioRows, 'AMBOS');

    summary.getCell(`A${rowIndex}`).value = scenario.title;
    summary.getCell(`B${rowIndex}`).value = total;
    summary.getCell(`C${rowIndex}`).value = gdh;
    summary.getCell(`D${rowIndex}`).value = accesos;
    summary.getCell(`E${rowIndex}`).value = ambos;
    summary.getCell(`F${rowIndex}`).value = {
      text: scenario.code,
      hyperlink: `#'${scenario.code}'!A1`,
    };
    summary.getCell(`G${rowIndex}`).value = collectComentarios(scenarioRows);

    ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach((col) =>
      styleDataCell(summary.getCell(`${col}${rowIndex}`)),
    );

    summary.getCell(`F${rowIndex}`).font = {
      name: 'Calibri',
      size: 11,
      color: { argb: '0563C1' },
      underline: true,
    };

    buildDetailSheet(workbook, scenario.code, scenarioRows);
    rowIndex += 1;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    fileName,
  );
}