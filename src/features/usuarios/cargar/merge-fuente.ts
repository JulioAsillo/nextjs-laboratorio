import * as XLSX from 'xlsx';

const norm = (s: string) => s.trim().replace(/\s+/g, ' ').toUpperCase();

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** Nombre de la columna de procedencia que se agrega al unificar (opt-in). */
export const ORIGIN_COLUMN = 'ORIGIN_FILE';

/* ────────────────────────────────────────────────────────────────────────
 * Fechas -> texto.
 *
 * Solo se usa como FALLBACK cuando la celda de tipo fecha no trae texto
 * mostrado (`.w`). En el caso normal se respeta EXACTAMENTE lo que el usuario
 * ve en su reporte (dd/mm/yyyy, dd/mm/yyyy HH:mm:ss, etc.), evitando imponer un
 * formato propio. Si el backend necesitara un formato canónico (p.ej. ISO
 * yyyy-mm-dd), cambiar únicamente esta función.
 * ──────────────────────────────────────────────────────────────────────── */
function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function formatDateFallback(d: Date): string {
  const date = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  const hasTime = d.getHours() || d.getMinutes() || d.getSeconds();
  if (!hasTime) return date;
  return `${date} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * Convierte CUALQUIER celda de SheetJS a texto plano determinístico.
 *  - Fechas (t='d'): se respeta el texto mostrado `.w`; si no existe, se formatea.
 *  - Booleanos (t='b'): 'TRUE' / 'FALSE'.
 *  - Números (t='n'): el valor crudo como string (sin separadores de miles ni
 *    símbolos), para no corromper códigos/importes al enviarlos al backend.
 *  - Texto / resto: el valor tal cual.
 * Nunca devuelve `null`/`undefined`: las celdas vacías quedan como ''.
 */
function cellToText(cell: XLSX.CellObject | undefined): string {
  if (!cell) return '';
  const shown = typeof cell.w === 'string' ? cell.w : undefined;

  switch (cell.t) {
    case 'd': {
      if (shown && shown.trim() !== '') return shown;
      const v = cell.v;
      if (v instanceof Date) return formatDateFallback(v);
      return v == null ? '' : String(v);
    }
    case 'b':
      return cell.v ? 'TRUE' : 'FALSE';
    case 'n':
      return cell.v == null ? '' : String(cell.v);
    case 'e':
      return ''; // errores de Excel (#N/A, #REF!...) -> vacío
    default:
      return cell.v == null ? (shown ?? '') : String(cell.v);
  }
}

interface DecodedSheet {
  headers: string[];
  rows: Record<string, string>[];
}

/**
 * Recorre la primera hoja celda por celda (preservando el TIPO real de cada
 * una) y devuelve las filas ya convertidas a texto, indexadas por su cabecera
 * original. No usa `sheet_to_json`, que reintroduce inferencia de tipos.
 */
function decodeSheetAsText(ws: XLSX.WorkSheet): DecodedSheet {
  const ref = ws['!ref'];
  if (!ref) return { headers: [], rows: [] };

  const range = XLSX.utils.decode_range(ref);
  const headers: string[] = [];

  for (let c = range.s.c; c <= range.e.c; c++) {
    const addr = XLSX.utils.encode_cell({ r: range.s.r, c });
    const text = cellToText(ws[addr] as XLSX.CellObject | undefined);
    headers.push(text || `COL_${c + 1}`);
  }

  const rows: Record<string, string>[] = [];
  for (let r = range.s.r + 1; r <= range.e.r; r++) {
    const row: Record<string, string> = {};
    let hasValue = false;
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const text = cellToText(ws[addr] as XLSX.CellObject | undefined);
      if (text !== '') hasValue = true;
      row[headers[c - range.s.c]] = text;
    }
    if (hasValue) rows.push(row); // ignora filas totalmente vacías
  }

  return { headers, rows };
}

/**
 * Lee un archivo (csv/xls/xlsx) y devuelve sus filas como texto plano.
 *  - `cellDates`: las celdas con formato de fecha llegan como `Date` reales
 *    (así se detectan aunque el backend luego las quiera como texto).
 *  - `cellText`: puebla `.w` (texto mostrado) en todas las celdas, para
 *    respetar el formato que el usuario ve.
 */
async function readRowsAsText(file: File): Promise<Record<string, string>[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true, cellText: true });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return [];
  return decodeSheetAsText(wb.Sheets[sheetName]).rows;
}

/** Reordena/normaliza una fila a las columnas canónicas (match por cabecera normalizada). */
function normalizeRow(row: Record<string, string>, columns: string[]): Record<string, string> {
  const lut = new Map<string, string>();
  for (const [k, v] of Object.entries(row)) lut.set(norm(k), v);
  const out: Record<string, string> = {};
  for (const col of columns) {
    const v = lut.get(norm(col));
    out[col] = v == null ? '' : v; // vacío como '' (no null) -> celda de texto vacía
  }
  return out;
}

/** Fuerza t='s' (texto) en todas las celdas de datos y elimina cualquier formato numérico. */
function forceAllCellsAsText(ws: XLSX.WorkSheet): void {
  for (const addr of Object.keys(ws)) {
    if (addr[0] === '!') continue;
    const cell = ws[addr] as XLSX.CellObject;
    cell.t = 's';
    cell.v = cell.v == null ? '' : String(cell.v);
    delete (cell as { w?: string }).w;
    delete (cell as { z?: string }).z;
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
 * TODAS las columnas se escriben como TEXTO (t='s'). Esto evita que las fechas
 * viajen como serial numérico de Excel (la causa de que el backend "recibiera
 * algo raro" y no procesara bien las fechas): ahora llegan como el mismo texto
 * que el usuario ve en su reporte.
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
    const rows = await readRowsAsText(file);
    for (const raw of rows) {
      const normalized = normalizeRow(raw, columns);
      if (originColumn) normalized[originColumn] = file.name;
      aoa.push(header.map((col) => normalized[col] ?? ''));
    }
    sourceCount += 1;
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa); // strings -> celdas t='s'
  forceAllCellsAsText(ws); // garantía extra: nada queda como número/fecha

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Datos');

  const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  const file = new File([out], outName, { type: XLSX_MIME });

  return { file, totalRows: aoa.length - 1, sourceCount };
}
