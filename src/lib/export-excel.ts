import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { columns } from './columns';
import { colorGroups } from './theme';
import { writeCell } from './excel-format';
import type { HallazgoAplicacion } from '@/types/hallazgo';

function toArgb(hex: string): string {
  return 'FF' + hex.replace('#', '').toUpperCase();
}

export async function exportToExcel(
  rows: HallazgoAplicacion[],
  fileName = 'hallazgos-aplicaciones.xlsx',
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Certificación de Usuarios';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Hallazgos', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  sheet.columns = columns.map((c) => ({ key: c.key, width: c.width ?? 18 }));

  const headerRow = sheet.getRow(1);
  columns.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    const group = colorGroups[col.group];
    cell.value = col.header;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: toArgb(group.fill) } };
    cell.font = { color: { argb: toArgb(group.text) }, bold: true, size: 11 };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFFFFFFF' } },
      bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
      left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
      right: { style: 'thin', color: { argb: 'FFFFFFFF' } },
    };
  });
  headerRow.height = 30;

  // Filas: las columnas isDate se escriben como FECHA real (filtrables por año).
  rows.forEach((row) => {
    const excelRow = sheet.addRow([]);
    columns.forEach((col, idx) => {
      writeCell(excelRow.getCell(idx + 1), row[col.key], col.isDate);
    });
  });

  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    fileName,
  );
}