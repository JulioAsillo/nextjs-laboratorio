import * as XLSX from 'xlsx';

const norm = (s: string) => s.trim().replace(/\s+/g, ' ').toUpperCase();

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

async function readRows(file: File): Promise<Record<string, unknown>[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return [];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[sheetName], { defval: null });
}

/** Reordena/normaliza una fila a las columnas canónicas (match por cabecera normalizada). */
function normalizeRow(row: Record<string, unknown>, columns: string[]) {
  const lut = new Map<string, unknown>();
  for (const [k, v] of Object.entries(row)) lut.set(norm(k), v);
  const out: Record<string, unknown> = {};
  for (const col of columns) {
    const v = lut.get(norm(col));
    out[col] = v === undefined ? null : v;
  }
  return out;
}

export interface MergeResult {
  file: File;
  totalRows: number;
  sourceCount: number;
}

/**
 * Lee N archivos (csv/xls/xlsx) con la misma estructura, normaliza cada fila a
 * `columns` y devuelve UN solo .xlsx en memoria, listo para subir al backend.
 * Todo ocurre en el navegador (caché), sin tocar disco.
 */
export async function mergeFilesToXlsx(
  files: File[],
  columns: string[],
  outName: string,
): Promise<MergeResult> {
  const merged: Record<string, unknown>[] = [];

  for (const file of files) {
    const rows = await readRows(file);
    for (const row of rows) merged.push(normalizeRow(row, columns));
  }

  const ws = XLSX.utils.json_to_sheet(merged, { header: columns });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Datos');

  const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  const file = new File([out], outName, { type: XLSX_MIME });

  return { file, totalRows: merged.length, sourceCount: files.length };
}
