import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { columns } from './columns';
import { colorGroups } from './theme';
import type { HallazgoAplicacion } from '@/types/hallazgo';

/** exceljs usa ARGB sin '#'. Convierte '#006386' -> 'FF006386'. */
function toArgb(hex: string): string {
  return 'FF' + hex.replace('#', '').toUpperCase();
}

/**
 * Genera y descarga un .xlsx a partir de las filas en memoria (el mismo JSON que pinta la tabla).
 * Cada cabecera se rellena con el color de su grupo (C1..C6) y el texto en su color legible.
 */
export async function exportToExcel(
  rows: HallazgoAplicacion[],
  fileName = 'hallazgos-aplicaciones.xlsx',
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Certificación de Usuarios';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Hallazgos', {
    views: [{ state: 'frozen', ySplit: 1 }], // congela la fila de cabecera
  });

  // Define columnas (clave + ancho).
  sheet.columns = columns.map((c) => ({ key: c.key, width: c.width ?? 18 }));

  // Fila de cabecera con estilo por grupo de color.
  const headerRow = sheet.getRow(1);
  columns.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    const group = colorGroups[col.group];
    cell.value = col.header;
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: toArgb(group.fill) },
    };
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

  // Filas de datos.
  rows.forEach((row) => {
    const values: Record<string, string> = {};
    columns.forEach((col) => {
      const raw = row[col.key];
      values[col.key] = raw == null ? '' : String(raw);
    });
    sheet.addRow(values);
  });

  // Autofiltro sobre todo el rango de cabeceras.
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: columns.length },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    fileName,
  );
}
