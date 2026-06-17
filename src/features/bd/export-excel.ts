import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { colorGroups } from '@/lib/theme';
import { writeCell } from '@/lib/excel/cell-format';
import { styleHeader } from '@/lib/excel/style';
import type { ColumnDef } from '@/features/usuarios/hallazgos/aplicaciones/columns';
import type { HallazgoAplicacion } from '@/types/hallazgo';
import { bdVidaColumns, bdGeneralesColumns } from './bd-columns';

function addSheet(
  workbook: ExcelJS.Workbook,
  name: string,
  columns: ColumnDef[],
  rows: HallazgoAplicacion[],
) {
  const sheet = workbook.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 1 }] });
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
}

/**
 * Exporta el Hallazgo Base de Datos a un único libro con DOS hojas:
 * "VIDA" y "GENERALES", cada una con sus columnas y fechas reales (filtrables por año).
 */
export async function exportBdDbsToExcel(
  vida: HallazgoAplicacion[],
  generales: HallazgoAplicacion[],
  fileName = 'hallazgo-base-de-datos.xlsx',
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Certificación de Base de Datos';
  workbook.created = new Date();

  addSheet(workbook, 'VIDA', bdVidaColumns, vida);
  addSheet(workbook, 'GENERALES', bdGeneralesColumns, generales);

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    fileName,
  );
}
