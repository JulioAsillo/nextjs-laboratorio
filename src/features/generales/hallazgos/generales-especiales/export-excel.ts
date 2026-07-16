import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { withTimestamp } from '@/lib/excel/filename';
import { colorGroups } from '@/lib/theme';
import { writeCell } from '@/lib/excel/cell-format';
import { styleHeader } from '@/lib/excel/style';
import type { HallazgoAplicacion } from '@/types/hallazgo';
import { generalesEspecialesColumns } from './columns';

/**
 * Exporta el hallazgo "Generales y Especiales" a un libro de una sola hoja
 * (datos completos), con cabeceras coloreadas por grupo, autofiltro y panel
 * congelado. Mismo contrato que el resto de hallazgos.
 *
 * Cuando exista el "Generar Resumen" de este hallazgo, se agregan aquí la hoja
 * RESUMEN y las hojas de detalle, tal como en `perfiles/activos-gdh/export-excel.ts`.
 */
export async function exportGeneralesEspecialesToExcel(
  rows: HallazgoAplicacion[],
  fileName = 'hallazgo-generales-especiales.xlsx',
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Certificación de Generales y Especiales';
  workbook.created = new Date();

  const columns = generalesEspecialesColumns;
  const sheet = workbook.addWorksheet('GENERALES Y ESPECIALES', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });
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

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    withTimestamp(fileName),
  );
}
