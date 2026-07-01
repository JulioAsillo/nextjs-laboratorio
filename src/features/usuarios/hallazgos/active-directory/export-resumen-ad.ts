import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { withTimestamp } from '@/lib/excel/filename';
import { adColumns } from './ad-columns';
import { adScenarios } from './resumen-ad/ad-scenarios';
import { colorGroups } from '@/lib/theme';
import { writeCell } from '@/lib/excel/cell-format';
import { styleHeader } from '@/lib/excel/style';
import {
  rowsForScenario,
  countByResponsible,
  collectComentarios,
  type ScenarioDef,
  type ScenarioContext,
} from '@/lib/resumen/scenario-engine';
import type { ColumnDef } from '../aplicaciones/columns';
import type { HallazgoAplicacion } from '@/types/hallazgo';

type Row = HallazgoAplicacion;

// Re-export para compatibilidad / acceso desde otros módulos si hiciera falta.
export { rowsForScenario, countByResponsible, classifyResponsible } from '@/lib/resumen/scenario-engine';
export type { ResponsableTipo } from '@/lib/resumen/scenario-engine';
export const scenarios = adScenarios;

export interface ExportResumenAdOptions {
  /** Mes de ejecución 'YYYY-MM' (mes de la fecha de corte) para H2. */
  mesEjecucion?: string;
  fileName?: string;
}

function styleSummaryCell(cell: ExcelJS.Cell, fill: string, bold = false) {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
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

/** Resuelve las columnas (ColumnDef) que se pintan en un escenario, en el orden de la config. */
function columnsForScenario(scenario: ScenarioDef): ColumnDef[] {
  const byKey = new Map(adColumns.map((c) => [c.key, c]));
  return scenario.columns
    .map((key) => byKey.get(key))
    .filter((c): c is ColumnDef => Boolean(c));
}

function buildDetailSheet(workbook: ExcelJS.Workbook, scenario: ScenarioDef, rows: Row[]) {
  const cols = columnsForScenario(scenario);

  const sheet = workbook.addWorksheet(scenario.code, {
    views: [{ state: 'frozen', ySplit: 3 }],
  });

  sheet.columns = cols.map((c) => ({
    key: c.key,
    width: c.widthPx ? Math.max(12, Math.round(c.widthPx / 7)) : 18,
  }));

  sheet.mergeCells('B1:C1');
  const back = sheet.getCell('B1');
  back.value = { text: 'VOLVER A ESCENARIOS', hyperlink: `#'Escenarios'!A1` };
  back.font = { color: { argb: '0563C1' }, underline: true, bold: true };
  back.alignment = { horizontal: 'center', vertical: 'middle' };

  const headerRow = sheet.getRow(3);
  cols.forEach((col, idx) => {
    const group = colorGroups[col.group];
    const cell = headerRow.getCell(idx + 1);
    cell.value = col.header;
    styleHeader(cell, group.fill, group.text);
  });
  headerRow.height = 24;

  rows.forEach((row) => {
    const excelRow = sheet.addRow([]);
    cols.forEach((col, idx) => {
      writeCell(excelRow.getCell(idx + 1), (row as Record<string, unknown>)[col.key], col.isDate);
    });
  });

  sheet.autoFilter = {
    from: { row: 3, column: 1 },
    to: { row: 3, column: cols.length },
  };
}

export async function exportResumenAdExcel(
  rows: Row[],
  options: ExportResumenAdOptions = {},
): Promise<void> {
  const { mesEjecucion, fileName = 'resumen-hallazgos-active-directory.xlsx' } = options;
  const ctx: ScenarioContext = { mesEjecucion };

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
    { width: 38 }, // G comentario
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
  for (const scenario of adScenarios) {
    const scenarioRows = rowsForScenario(rows, scenario, ctx);
    const total = scenarioRows.length;
    const gdh = countByResponsible(scenarioRows, 'GDH');
    const accesos = countByResponsible(scenarioRows, 'ACCESOS');
    const ambos = countByResponsible(scenarioRows, 'AMBOS');

    summary.getCell(`A${rowIndex}`).value = scenario.title;
    summary.getCell(`B${rowIndex}`).value = total;
    summary.getCell(`C${rowIndex}`).value = gdh;
    summary.getCell(`D${rowIndex}`).value = accesos;
    summary.getCell(`E${rowIndex}`).value = ambos;
    summary.getCell(`G${rowIndex}`).value = collectComentarios(scenarioRows);

    // "Si no hay hallazgos no se considera": queda en 0, sin hoja ni hipervínculo.
    if (total > 0) {
      summary.getCell(`F${rowIndex}`).value = {
        text: scenario.code,
        hyperlink: `#'${scenario.code}'!A1`,
      };
      buildDetailSheet(workbook, scenario, scenarioRows);
    } else {
      summary.getCell(`F${rowIndex}`).value = scenario.code;
    }

    ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach((col) =>
      styleDataCell(summary.getCell(`${col}${rowIndex}`)),
    );

    if (total > 0) {
      summary.getCell(`F${rowIndex}`).font = {
        name: 'Calibri',
        size: 11,
        color: { argb: '0563C1' },
        underline: true,
      };
    }

    rowIndex += 1;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    withTimestamp(fileName),
  );
}
