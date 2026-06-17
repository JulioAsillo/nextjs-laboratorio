import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { Resumen, ResumenRow } from './resumen';
import { matchesH1, matchesH2 } from './resumen';
import { h1Columns, h2Columns, KEY_ESCENARIO, type ColumnDef } from '../columns';
import { colorGroups, palette } from '@/lib/theme';
import { writeCell } from '@/lib/excel/cell-format';
import { argb, styleHeader, thinBorder } from '@/lib/excel/style';
import type { HallazgoAplicacion } from '@/types/hallazgo';

const SHEET_H1 = 'H1_APLICACIONES';
const SHEET_H2 = 'H2_APLICACIONES';

const FILL = {
  title: palette.inverseSurface,
  h1: palette.primary,
  h2: palette.secondary,
  comentario: palette.outline,
  total: '#eaedff',
};

/** Hoja de DETALLE con el set de columnas indicado (H1 o H2) y fechas reales. */
function writeDetailSheet(ws: ExcelJS.Worksheet, rows: HallazgoAplicacion[], cols: ColumnDef[]) {
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  ws.columns = cols.map((c) => ({ key: c.key, width: c.width ?? 18 }));

  const header = ws.getRow(1);
  cols.forEach((col, idx) => {
    const cell = header.getCell(idx + 1);
    const g = colorGroups[col.group];
    cell.value = col.header;
    styleHeader(cell, g.fill, g.text);
  });
  header.height = 30;

  rows.forEach((r) => {
    const excelRow = ws.addRow([]);
    cols.forEach((col, idx) => {
      writeCell(excelRow.getCell(idx + 1), r[col.key], col.isDate);
    });
  });

  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: cols.length } };
}

/** Hoja "Escenarios" (resumen con enlaces a H1/H2). */
function writeEscenariosSheet(ws: ExcelJS.Worksheet, resumen: Resumen) {
  ws.views = [{ state: 'frozen', ySplit: 6, xSplit: 2 }];
  ws.getColumn(2).width = 24;
  for (let c = 3; c <= 10; c++) ws.getColumn(c).width = 16;
  ws.getColumn(11).width = 32;

  ws.mergeCells('C3:J3');
  ws.getCell('C3').value = 'APLICACIONES SOX VIDA';
  styleHeader(ws.getCell('C3'), FILL.title);
  ws.getRow(3).height = 24;

  ws.mergeCells('C4:F4');
  ws.getCell('C4').value = 'Identificación de usuarios cesados';
  styleHeader(ws.getCell('C4'), FILL.h1);
  ws.mergeCells('G4:J4');
  ws.getCell('G4').value = 'Identificación de usuarios no identificados o sin sustento';
  styleHeader(ws.getCell('G4'), FILL.h2);
  ws.getRow(4).height = 30;

  ws.mergeCells('C5:F5');
  ws.getCell('C5').value = { text: SHEET_H1, hyperlink: `#'${SHEET_H1}'!A1` };
  styleHeader(ws.getCell('C5'), FILL.h1);
  ws.getCell('C5').font = { color: { argb: argb('#ffffff') }, bold: true, underline: true };

  ws.mergeCells('G5:J5');
  ws.getCell('G5').value = { text: SHEET_H2, hyperlink: `#'${SHEET_H2}'!A1` };
  styleHeader(ws.getCell('G5'), FILL.h2);
  ws.getCell('G5').font = { color: { argb: argb('#ffffff') }, bold: true, underline: true };

  ws.getCell('B6').value = 'Aplicación';
  styleHeader(ws.getCell('B6'), FILL.title);
  const sub = ['N° Hallazgos', 'Hallazgos GDH', 'Hallazgos ACCESOS', 'GDH | ACCESOS'];
  (['C6', 'D6', 'E6', 'F6'] as const).forEach((ref, i) => {
    ws.getCell(ref).value = sub[i];
    styleHeader(ws.getCell(ref), FILL.h1);
  });
  (['G6', 'H6', 'I6', 'J6'] as const).forEach((ref, i) => {
    ws.getCell(ref).value = sub[i];
    styleHeader(ws.getCell(ref), FILL.h2);
  });
  ws.getCell('K6').value = 'COMENTARIO';
  styleHeader(ws.getCell('K6'), FILL.comentario);
  ws.getRow(6).height = 28;

  const writeDataRow = (rowIdx: number, r: ResumenRow, isTotal = false) => {
    const values = [
      r.aplicacion,
      r.h1Total, r.h1Gdh, r.h1Accesos, r.h1Ambos,
      r.h2Total, r.h2Gdh, r.h2Accesos, r.h2Ambos,
      '',
    ];
    values.forEach((val, i) => {
      const cell = ws.getCell(rowIdx, i + 2);
      cell.value = val as ExcelJS.CellValue;
      cell.border = thinBorder('#bdc8d0');
      cell.alignment = { vertical: 'middle', horizontal: i === 0 ? 'left' : 'center' };
      if (isTotal) {
        cell.font = { bold: true, color: { argb: argb('#131b2e') } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(FILL.total) } };
      }
    });
  };

  let row = 7;
  for (const r of resumen.rows) writeDataRow(row++, r);
  writeDataRow(row, resumen.total, true);
}

export async function exportResumenExcel(
  resumen: Resumen,
  detailRows: HallazgoAplicacion[],
  fileName = 'Resumen_Aplicaciones.xlsx',
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Certificación de Usuarios';
  wb.created = new Date();

  const esc = wb.addWorksheet('Escenarios');
  const wsH1 = wb.addWorksheet(SHEET_H1);
  const wsH2 = wb.addWorksheet(SHEET_H2);

  writeEscenariosSheet(esc, resumen);

  const rowsH1 = detailRows.filter((r) => matchesH1((r[KEY_ESCENARIO] ?? '').trim()));
  const rowsH2 = detailRows.filter((r) => matchesH2((r[KEY_ESCENARIO] ?? '').trim()));
  writeDetailSheet(wsH1, rowsH1, h1Columns);
  writeDetailSheet(wsH2, rowsH2, h2Columns);

  const buf = await wb.xlsx.writeBuffer();
  saveAs(
    new Blob([buf], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    fileName,
  );
}
