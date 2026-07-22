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

/**
 * Quita el BOM UTF-8 (EF BB BF) a NIVEL DE BYTES, antes de decodificar.
 *
 * Es clave hacerlo aquí y no con un `.replace(/^\uFEFF/, '')` sobre el texto:
 * si luego cae el fallback windows-1252, esos tres bytes se decodifican como el
 * fantasma "ï»¿" (ï=EF, »=BB, ¿=BF), que YA no es U+FEFF y ninguna limpieza de
 * invisibles lo atrapa. Ese "ï»¿id" es exactamente el bug del reporte de Entra
 * ID: la columna `id` no matcheaba porque llegaba como "ï»¿id".
 */
function stripBomBytes(bytes: Uint8Array): Uint8Array {
  return bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf
    ? bytes.subarray(3)
    : bytes;
}

/** Decodifica bytes a texto: UTF-8 y, si hay basura, reintenta windows-1252. */
function decodeText(buffer: ArrayBuffer): string {
  const bytes = stripBomBytes(new Uint8Array(buffer));
  const utf8 = new TextDecoder('utf-8').decode(bytes);
  if (!utf8.includes(REPLACEMENT)) return utf8;
  try {
    return new TextDecoder('windows-1252').decode(bytes);
  } catch {
    return utf8;
  }
}

function isCsv(fileName: string): boolean {
  return /\.(csv|txt)$/i.test(fileName);
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  DESANIDADO DE CSV DOBLE-ENCODEADO
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * PATOLOGÍA (reportes AD PPS / AD VIDA)
 * -------------------------------------
 * El generador serializó el CSV DOS veces: tomó una fila que ya era CSV
 *   samaccountname,"facsimiletelephonenumber","ipphone",...
 * y la volvió a escribir como UNA sola celda de otro CSV, duplicando comillas:
 *   "samaccountname,""facsimiletelephonenumber"",""ipphone"",..."
 *
 * Leído bien (RFC 4180), SheetJS ve UNA única columna cuyo nombre es toda esa
 * cadena -> las 17 columnas requeridas salen como "faltantes" y aparece 1
 * columna gigante "no reconocida". El fix reconstruye la capa interna.
 *
 * ESTRATEGIA (determinística, sin heurísticas frágiles)
 * -----------------------------------------------------
 *  - Solo se activa si el texto HUELE a doble-encodeo: empieza por `"` y su
 *    primera línea contiene `""` (comillas duplicadas a nivel de fila). Un CSV
 *    normal ni siquiera entra al bucle (coste cero en el caso común).
 *  - Se parsea; si hay >1 columna, ya está desplegado -> se devuelve tal cual.
 *  - Si hay 1 sola columna Y su cabecera contiene coma, esa celda ERA una fila
 *    CSV: se reconstruye el texto interno (cada fila = su única celda) y se
 *    repite. Máx. 3 capas por seguridad; si no hay avance, se corta.
 *
 * Una columna legítima única (p. ej. "ID" sin comas) NO se toca.
 */
function csvColCount(ws: XLSX.WorkSheet): number {
  const ref = ws['!ref'];
  if (!ref) return 0;
  const r = XLSX.utils.decode_range(ref);
  return r.e.c - r.s.c + 1;
}

function csvHeaderCell(ws: XLSX.WorkSheet): string {
  const ref = ws['!ref'];
  if (!ref) return '';
  const r = XLSX.utils.decode_range(ref);
  const cell = ws[XLSX.utils.encode_cell({ r: r.s.r, c: r.s.c })] as XLSX.CellObject | undefined;
  return cell?.v == null ? '' : String(cell.v);
}

function firstCsvSheet(text: string): XLSX.WorkSheet | null {
  const wb = XLSX.read(text, { type: 'string', raw: true, cellDates: false, cellNF: false, cellText: false });
  const name = wb.SheetNames[0];
  return name ? wb.Sheets[name] : null;
}

function looksDoubleEncoded(text: string): boolean {
  if (text.charCodeAt(0) !== 0x22 /* " */) return false;
  const nl = text.indexOf('\n');
  const firstLine = nl === -1 ? text : text.slice(0, nl);
  return firstLine.includes('""');
}

function unwrapDoubledCsv(text: string): string {
  if (!looksDoubleEncoded(text)) return text;

  let current = text;
  for (let layer = 0; layer < 3; layer++) {
    const ws = firstCsvSheet(current);
    if (!ws) return current;
    if (csvColCount(ws) !== 1) return current; // ya desplegado en columnas reales
    if (!csvHeaderCell(ws).includes(',')) return current; // 1 columna legítima (sin coma)

    const ref = ws['!ref'];
    if (!ref) return current;
    const range = XLSX.utils.decode_range(ref);
    const lines: string[] = [];
    for (let r = range.s.r; r <= range.e.r; r++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c: range.s.c })] as XLSX.CellObject | undefined;
      lines.push(cell?.v == null ? '' : String(cell.v));
    }
    const inner = lines.join('\n');
    if (inner === current) return current; // sin progreso -> corta
    current = inner;
  }
  return current;
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
    // `unwrapDoubledCsv` deshace el CSV doble-encodeado (toda la fila metida
    // como una sola celda entre comillas) antes de parsear. Filas y cabeceras
    // salen del MISMO texto ya desanidado, así que quedan siempre alineadas.
    return XLSX.read(unwrapDoubledCsv(decodeText(buffer)), {
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

/**
 * Limpia una cabecera de basura invisible SIN alterar su forma legible:
 *  - BOM / zero-width / soft-hyphen / word-joiner (se cuelan en exports)
 *  - comillas envolventes (rectas y tipográficas) que pega Excel/PowerShell
 *  - NBSP/tab/saltos -> espacio; recorta y colapsa espacios
 *
 * Se preservan tildes y mayúsculas (esto NO es `normHeader`): así la columna
 * del archivo unificado conserva su nombre real, pero sin caracteres fantasma
 * que rompan el match o ensucien el .xlsx de salida.
 */
function sanitizeHeader(s: string): string {
  return s
    .replace(/^\u00EF\u00BB\u00BF/, '') // "ï»¿" = BOM mal decodeado (solo al inicio)
    .replace(/[\uFEFF\u200B\u200C\u200D\u00AD\u2060]/g, '') // invisibles
    .replace(/[\u00A0\t\r\n]+/g, ' ') // NBSP/tab/saltos -> espacio
    .trim()
    .replace(/^["'\u201C\u2018\u201D\u2019]+|["'\u201C\u2018\u201D\u2019]+$/g, '') // comillas envolventes
    .trim()
    .replace(/\s+/g, ' '); // colapsa espacios internos
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
    const text = sanitizeHeader(cellToText(ws[addr] as XLSX.CellObject | undefined, opts));
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
    const text = sanitizeHeader(cellToText(ws[addr] as XLSX.CellObject | undefined, opts));
    if (text !== '') out.push(text);
  }
  return out;
}
