import * as XLSX from 'xlsx';
import { readSheetAsText } from '@/lib/excel/read-as-text';

const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** Nombre de la columna de procedencia que se agrega al unificar (opt-in). */
export const ORIGIN_COLUMN = 'ORIGIN_FILE';

/**
 * Reordena/normaliza una fila a las columnas canónicas (match por cabecera
 * normalizada, tolerante a tildes/mayúsculas/espacios). Lo que no está en
 * `columns` se descarta; lo que falta queda como '' (celda de texto vacía).
 */
function normalizeRow(row: Record<string, string>, columns: string[]): Record<string, string> {
  const lut = new Map<string, string>();
  for (const [k, v] of Object.entries(row)) lut.set(norm(k), v);
  const out: Record<string, string> = {};
  for (const col of columns) {
    const v = lut.get(norm(col));
    out[col] = v == null ? '' : v;
  }
  return out;
}

/**
 * Fuerza t='s' (texto) y formato '@' (Texto) en TODAS las celdas, y elimina
 * cualquier formato numérico heredado. Con `z='@'` el backend (pandas/openpyxl)
 * lee la columna como string y no vuelve a inferir fechas.
 */
function forceAllCellsAsText(ws: XLSX.WorkSheet): void {
  for (const addr of Object.keys(ws)) {
    if (addr[0] === '!') continue;
    const cell = ws[addr] as XLSX.CellObject;
    cell.t = 's';
    cell.v = cell.v == null ? '' : String(cell.v);
    cell.z = '@';
    delete (cell as { w?: string }).w;
  }
}

export interface MergeResult {
  file: File;
  totalRows: number;
  sourceCount: number;
}

export interface MergeOptions {
  /**
   * Si se indica, se agrega esa columna como ÚLTIMA, con el `file.name` de cada
   * archivo de origen por registro. Usar `ORIGIN_COLUMN` para el caso BD.
   */
  originColumn?: string;
}

/**
 * Lee N archivos (csv/xls/xlsx) con la misma estructura, normaliza cada fila a
 * `columns` y devuelve UN solo .xlsx en memoria, listo para subir al backend.
 * Todo ocurre en el navegador (caché), sin tocar disco.
 *
 * TODAS las columnas se escriben como TEXTO (t='s', z='@'). Las fechas viajan
 * como el MISMO texto que el usuario ve en su reporte: nunca como serial de
 * Excel, nunca reformateadas por SheetJS (ver `@/lib/excel/read-as-text`).
 *
 * Si `options.originColumn` está presente, se anexa esa columna al final con el
 * nombre del archivo de origen de cada fila (no se toca el orden de `columns`).
 */
export async function mergeFilesToXlsx(
  files: File[],
  columns: string[],
  outName: string,
  options: MergeOptions = {},
): Promise<MergeResult> {
  const { originColumn } = options;
  const header = originColumn ? [...columns, originColumn] : columns;

  // AOA: primera fila = cabeceras; resto = valores (todos string).
  const aoa: string[][] = [header];

  let sourceCount = 0;
  for (const file of files) {
    const { rows } = await readSheetAsText(file);
    for (const raw of rows) {
      const normalized = normalizeRow(raw, columns);
      if (originColumn) normalized[originColumn] = file.name;
      aoa.push(header.map((col) => normalized[col] ?? ''));
    }
    sourceCount += 1;
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa, { cellDates: false }); // strings -> celdas t='s'
  forceAllCellsAsText(ws); // garantía extra: nada queda como número/fecha

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Datos');

  const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  const file = new File([out], outName, { type: XLSX_MIME });

  return { file, totalRows: aoa.length - 1, sourceCount };
}
