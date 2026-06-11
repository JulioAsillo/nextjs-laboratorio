import ExcelJS from 'exceljs';
import { columns } from './columns';
import type { HallazgoAplicacion } from '@/types/hallazgo';

/** Convierte el valor de una celda exceljs a string plano. */
function cellToString(value: ExcelJS.CellValue): string {
  if (value == null) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'object') {
    const v = value as unknown as Record<string, unknown>;
    if (typeof v.text === 'string') return v.text;
    if ('result' in v && v.result != null) return String(v.result);
    if (Array.isArray(v.richText)) {
      return (v.richText as { text?: string }[]).map((t) => t.text ?? '').join('');
    }
    if ('error' in v) return '';
    return '';
  }
  return String(value);
}

/**
 * Lee el Excel de DETALLE (el mismo que exporta el front, ya con Responsable llenado).
 * Mapea por el TEXTO de cabecera (fila 1) hacia las keys definidas en columns.ts.
 */
export async function parseDetailExcel(file: File): Promise<HallazgoAplicacion[]> {
  const buffer = await file.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);

  const ws = wb.worksheets[0];
  if (!ws) throw new Error('El archivo no contiene hojas.');

  const headerByText = new Map(columns.map((c) => [c.header.trim().toLowerCase(), c.key]));
  const colToKey: Record<number, string> = {};
  ws.getRow(1).eachCell((cell, colNumber) => {
    const key = headerByText.get(cellToString(cell.value).trim().toLowerCase());
    if (key) colToKey[colNumber] = key;
  });

  if (Object.keys(colToKey).length === 0) {
    throw new Error('No se reconocieron las cabeceras. ¿Es el Excel exportado por la app?');
  }

  const rows: HallazgoAplicacion[] = [];
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const obj: HallazgoAplicacion = {};
    let hasData = false;
    for (const [colStr, key] of Object.entries(colToKey)) {
      const str = cellToString(row.getCell(Number(colStr)).value).trim();
      obj[key] = str === '' ? null : str;
      if (str) hasData = true;
    }
    if (hasData) rows.push(obj);
  });

  return rows;
}
