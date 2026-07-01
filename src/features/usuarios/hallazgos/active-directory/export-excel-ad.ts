import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { withTimestamp } from '@/lib/excel/filename';
import { adColumns } from './ad-columns';
import { colorGroups } from '@/lib/theme';
import { writeCell } from '@/lib/excel/cell-format';
import { styleHeader } from '@/lib/excel/style';
import type { HallazgoAplicacion } from '@/types/hallazgo';

export async function exportAdToExcel(
  rows: HallazgoAplicacion[],
  fileName = 'hallazgos-active-directory.xlsx',
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Certificación de Usuarios';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Hallazgos AD', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  sheet.columns = adColumns.map((c) => ({ key: c.key, width: c.widthPx ? c.widthPx / 7 : 18 }));

  const headerRow = sheet.getRow(1);
  adColumns.forEach((col, idx) => {
    const group = colorGroups[col.group];
    const cell = headerRow.getCell(idx + 1);
    cell.value = col.header;
    styleHeader(cell, group.fill, group.text);
  });
  headerRow.height = 30;

  rows.forEach((row) => {
    const excelRow = sheet.addRow([]);
    adColumns.forEach((col, idx) => {
      writeCell(excelRow.getCell(idx + 1), row[col.key], col.isDate);
    });
  });

  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: adColumns.length },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    withTimestamp(fileName),
  );
}
