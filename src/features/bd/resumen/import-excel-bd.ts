import ExcelJS from 'exceljs';
import { bdVidaColumns, bdGeneralesColumns } from '../bd-columns';
import type { ColumnDef } from '@/features/hallazgos/columns';
import type { HallazgoAplicacion } from '@/types/hallazgo';

export interface BdDetail {
  vida: HallazgoAplicacion[];
  generales: HallazgoAplicacion[];
}

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
    return '';
  }
  return String(value);
}

/** Lee una hoja mapeando por el TEXTO de cabecera (fila 1) hacia las keys. */
function parseSheet(ws: ExcelJS.Worksheet | undefined, columns: ColumnDef[]): HallazgoAplicacion[] {
  if (!ws) return [];
  const headerByText = new Map(columns.map((c) => [c.header.trim().toLowerCase(), c.key]));
  const colToKey: Record<number, string> = {};
  ws.getRow(1).eachCell((cell, colNumber) => {
    const key = headerByText.get(cellToString(cell.value).trim().toLowerCase());
    if (key) colToKey[colNumber] = key;
  });
  if (Object.keys(colToKey).length === 0) return [];

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

function findSheet(wb: ExcelJS.Workbook, name: string): ExcelJS.Worksheet | undefined {
  return wb.worksheets.find((w) => w.name.trim().toLowerCase() === name.toLowerCase());
}

/**
 * Lee el Excel de DETALLE de Base de Datos (el que exporta `exportBdDbsToExcel`,
 * con hojas "VIDA" y "GENERALES", ya con Responsable y Comentario poblados).
 */
export async function parseDetailExcelBd(file: File): Promise<BdDetail> {
  const buffer = await file.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);

  const vida = parseSheet(findSheet(wb, 'VIDA'), bdVidaColumns);
  const generales = parseSheet(findSheet(wb, 'GENERALES'), bdGeneralesColumns);

  if (vida.length === 0 && generales.length === 0) {
    throw new Error(
      'No se reconocieron las hojas "VIDA" / "GENERALES". ¿Es el Excel de Base de Datos exportado por la app?',
    );
  }
  return { vida, generales };
}
