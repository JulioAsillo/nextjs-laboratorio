import * as XLSX from 'xlsx';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LECTOR ÚNICO "TODO COMO TEXTO"  (.csv / .xls / .xlsx)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * PROBLEMA QUE RESUELVE
 * ---------------------
 * SheetJS infiere tipos y, peor, RENDERIZA las fechas con orden US:
 *
 *  1) CSV: interpreta "05/12/2025" como fecha y la reescribe -> "12/5/25".
 *     Con hora, "01/02/2024 13:45:01" -> "1/2/24" (la hora se pierde entera).
 *
 *  2) XLS/XLSX: el texto mostrado `.w` NO es de fiar. Los formatos INTEGRADOS de
 *     Excel (14 = "m/d/yy", 22 = "m/d/yy h:mm", etc.) son dependientes del
 *     locale: Excel en es-PE los muestra como dd/mm/yyyy, pero SheetJS los
 *     renderiza SIEMPRE en orden US. Una fecha del 9 de febrero (serial 46062)
 *     sale como `.w = "2/9/26"` -> se lee como 2 de setiembre. Día y mes
 *     INVERTIDOS, en silencio.
 *
 *  3) Números largos (códigos/IDs) con formato "General" pueden salir en
 *     notación científica.
 *
 * ESTRATEGIA (cero inferencia, cero ambigüedad)
 * ---------------------------------------------
 *  - CSV: se decodifica a texto (UTF-8 con fallback windows-1252, sin BOM) y se
 *    parsea con `raw: true`. SheetJS no adivina NADA: sale lo que está escrito.
 *
 *  - XLS/XLSX: `cellDates: false` + `cellNF: true`. La celda de fecha queda como
 *    SERIAL (número) + su formato (`z`). El serial es la ÚNICA verdad absoluta
 *    (no depende de locale ni de formato), así que la fecha se construye desde
 *    el serial con `SSF.parse_date_code` y se emite SIEMPRE como dd/mm/yyyy
 *    (+ HH:mm:ss solo si la celda tiene hora). `.w` se ignora por completo.
 *
 *  - Resto de números: valor crudo como string. Jamás notación científica.
 *
 * Resultado: `Record<string, string>` por fila. Nunca `null`/`undefined`/`Date`.
 */

/** Reemplazo U+FFFD: señal de que la decodificación UTF-8 falló. */
const REPLACEMENT = '\uFFFD';

/** Decodifica bytes a texto: UTF-8 y, si hay basura, reintenta windows-1252. */
function decodeText(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const utf8 = new TextDecoder('utf-8').decode(bytes);
  if (!utf8.includes(REPLACEMENT)) return utf8.replace(/^\uFEFF/, '');
  try {
    return new TextDecoder('windows-1252').decode(bytes).replace(/^\uFEFF/, '');
  } catch {
    return utf8.replace(/^\uFEFF/, '');
  }
}

function isCsv(fileName: string): boolean {
  return /\.(csv|txt)$/i.test(fileName);
}

const pad = (n: number) => (n < 10 ? `0${n}` : String(n));

/* ── SSF: tipado mínimo (xlsx@0.18.5 lo expone como `any`) ───────────────── */
interface DateCode { y: number; m: number; d: number; H: number; M: number; S: number }
const SSF = XLSX.SSF as {
  is_date?: (fmt: string) => boolean;
  parse_date_code?: (v: number, opts?: { date1904?: boolean }) => DateCode | null;
  _table?: Record<number, string>;
};

/** Resuelve el string de formato de una celda (`z` puede ser id numérico). */
function formatOf(z: unknown): string | undefined {
  if (typeof z === 'string') return z;
  if (typeof z === 'number') return SSF._table?.[z];
  return undefined;
}

/** ¿El formato de la celda es de fecha/hora? */
function isDateFormat(z: unknown): boolean {
  const fmt = formatOf(z);
  if (!fmt) return false;
  try {
    return SSF.is_date?.(fmt) ?? false;
  } catch {
    return false;
  }
}

/** ¿El formato incluye componente de HORA? (h, H o s fuera de literales) */
function hasTimeToken(z: unknown): boolean {
  const fmt = formatOf(z);
  if (!fmt) return false;
  return /[hHs]/.test(fmt.replace(/\[[^\]]*\]/g, '').replace(/"[^"]*"/g, ''));
}

/**
 * Convierte un SERIAL de Excel a texto determinístico dd/mm/yyyy.
 * El serial es independiente del locale: aquí NO hay ambigüedad día/mes posible.
 *  - serial < 1  -> solo hora  -> HH:mm:ss
 *  - con hora    -> dd/mm/yyyy HH:mm:ss
 *  - sin hora    -> dd/mm/yyyy
 */
function serialToText(serial: number, date1904: boolean, withTime: boolean): string {
  const p = SSF.parse_date_code?.(serial, { date1904 });
  if (!p) return String(serial);

  const time = `${pad(p.H)}:${pad(p.M)}:${pad(p.S)}`;
  if (serial > 0 && serial < 1) return time; // celda de solo hora
  const date = `${pad(p.d)}/${pad(p.m)}/${p.y}`;
  const hasTime = withTime || p.H !== 0 || p.M !== 0 || p.S !== 0;
  return hasTime ? `${date} ${time}` : date;
}

export interface TextReadOptions {
  /** Sistema de fechas del libro (Excel para Mac 1904). Lo trae `wb.Workbook`. */
  date1904?: boolean;
}

/**
 * Convierte CUALQUIER celda a texto plano determinístico.
 *  - Fecha (t='n' con formato de fecha, o t='d'): SIEMPRE desde el serial/Date,
 *    como dd/mm/yyyy [HH:mm:ss]. `.w` se ignora (miente con formatos US).
 *  - Número: valor crudo como string (sin miles, sin científica).
 *  - Booleano: 'TRUE' / 'FALSE'.  Error de Excel: ''.
 *  - Texto: el valor tal cual.
 */
export function cellToText(cell: XLSX.CellObject | undefined, opts: TextReadOptions = {}): string {
  if (!cell) return '';
  const date1904 = opts.date1904 ?? false;

  switch (cell.t) {
    case 'd': {
      const v = cell.v;
      if (!(v instanceof Date)) return v == null ? '' : String(v);
      const date = `${pad(v.getUTCDate())}/${pad(v.getUTCMonth() + 1)}/${v.getUTCFullYear()}`;
      const H = v.getUTCHours(), M = v.getUTCMinutes(), S = v.getUTCSeconds();
      return H || M || S ? `${date} ${pad(H)}:${pad(M)}:${pad(S)}` : date;
    }
    case 'n': {
      if (typeof cell.v === 'number' && isDateFormat(cell.z)) {
        return serialToText(cell.v, date1904, hasTimeToken(cell.z));
      }
      return cell.v == null ? '' : String(cell.v); // número: crudo, jamás científica
    }
    case 'b':
      return cell.v ? 'TRUE' : 'FALSE';
    case 'e':
      return '';
    default:
      return cell.v == null ? '' : String(cell.v);
  }
}

/** Abre el archivo con las opciones anti-inferencia según su extensión. */
async function readWorkbook(file: File, sheetRows?: number): Promise<XLSX.WorkBook> {
  const buffer = await file.arrayBuffer();

  if (isCsv(file.name)) {
    // `raw: true` => el parser CSV no interpreta fechas ni números: todo string.
    return XLSX.read(decodeText(buffer), {
      type: 'string',
      raw: true,
      cellDates: false,
      cellNF: false,
      cellText: false,
      ...(sheetRows ? { sheetRows } : {}),
    });
  }

  // XLS/XLSX: se conserva el SERIAL + su formato (`z`). No se pide `cellText`:
  // `.w` no se usa nunca.
  return XLSX.read(buffer, {
    type: 'array',
    cellDates: false,
    cellNF: true,
    cellText: false,
    cellStyles: false,
    ...(sheetRows ? { sheetRows } : {}),
  });
}

/** Lee el sistema de fechas del libro (1900 por defecto, 1904 en Excel Mac). */
function date1904Of(wb: XLSX.WorkBook): boolean {
  return wb.Workbook?.WBProps?.date1904 === true;
}

export interface SheetAsText {
  headers: string[];
  rows: Record<string, string>[];
}

/**
 * Recorre la primera hoja celda por celda (preservando el TIPO real de cada una)
 * y devuelve las filas ya convertidas a texto, indexadas por su cabecera original.
 * No usa `sheet_to_json`, que reintroduce inferencia de tipos.
 */
export function decodeSheetAsText(ws: XLSX.WorkSheet, opts: TextReadOptions = {}): SheetAsText {
  const ref = ws['!ref'];
  if (!ref) return { headers: [], rows: [] };

  const range = XLSX.utils.decode_range(ref);
  const headers: string[] = [];

  for (let c = range.s.c; c <= range.e.c; c++) {
    const addr = XLSX.utils.encode_cell({ r: range.s.r, c });
    const text = cellToText(ws[addr] as XLSX.CellObject | undefined, opts).trim();
    headers.push(text || `COL_${c + 1}`);
  }

  const rows: Record<string, string>[] = [];
  for (let r = range.s.r + 1; r <= range.e.r; r++) {
    const row: Record<string, string> = {};
    let hasValue = false;
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const text = cellToText(ws[addr] as XLSX.CellObject | undefined, opts);
      if (text !== '') hasValue = true;
      row[headers[c - range.s.c]] = text;
    }
    if (hasValue) rows.push(row); // ignora filas totalmente vacías
  }

  return { headers, rows };
}

/** Lee la primera hoja completa de un archivo como texto plano. */
export async function readSheetAsText(file: File): Promise<SheetAsText> {
  const wb = await readWorkbook(file);
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return { headers: [], rows: [] };
  return decodeSheetAsText(wb.Sheets[sheetName], { date1904: date1904Of(wb) });
}

/** Lee SOLO la primera fila (cabeceras). Eficiente: no parsea todo el archivo. */
export async function readHeadersAsText(file: File): Promise<string[]> {
  const wb = await readWorkbook(file, 1);
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return [];
  const ws = wb.Sheets[sheetName];
  const ref = ws['!ref'];
  if (!ref) return [];
  const range = XLSX.utils.decode_range(ref);
  const opts = { date1904: date1904Of(wb) };
  const out: string[] = [];
  for (let c = range.s.c; c <= range.e.c; c++) {
    const addr = XLSX.utils.encode_cell({ r: range.s.r, c });
    const text = cellToText(ws[addr] as XLSX.CellObject | undefined, opts).trim();
    if (text !== '') out.push(text);
  }
  return out;
}
