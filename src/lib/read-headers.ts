import * as XLSX from 'xlsx';

/**
 * Lee SOLO la primera fila (cabeceras) de un archivo .csv / .xls / .xlsx.
 * Usa `sheetRows: 1` para no parsear todo el archivo (eficiente con archivos grandes).
 */
export async function readHeaders(file: File): Promise<string[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array', sheetRows: 1 });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return [];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, blankrows: false });
  const first = (rows[0] ?? []) as unknown[];
  return first.map((h) => String(h ?? '').trim()).filter((h) => h !== '');
}
