import type ExcelJS from 'exceljs';

// ISO: 2024-01-15 / 2024-01-15T10:30 / 2024-01-15 10:30:45(.sss)(zona) -> zona ignorada.
const RE_ISO = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ](\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?)?/;
// D/M/Y · D-M-Y · D.M.Y, con hora opcional.
const RE_DMY = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/;

interface ParsedDate {
  date: Date;
  hasTime: boolean;
}

function build(
  y: number, mo: number, d: number, h: number, mi: number, se: number, timeFound: boolean,
): ParsedDate | null {
  if (y < 100) y += 2000;             // año de 2 dígitos -> 20xx
  if (y < 1900 || y > 2100) return null;
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59 || se > 59) return null;
  const date = new Date(y, mo - 1, d, h, mi, se);
  if (Number.isNaN(date.getTime())) return null;
  const hasTime = timeFound && !(h === 0 && mi === 0 && se === 0);
  return { date, hasTime };
}

/** Intenta interpretar un string como fecha en cualquier formato común. */
export function parseDate(value: unknown): ParsedDate | null {
  const s = String(value ?? '').trim();
  if (!s) return null;

  const iso = s.match(RE_ISO);
  if (iso) {
    return build(+iso[1], +iso[2], +iso[3], +(iso[4] ?? 0), +(iso[5] ?? 0), +(iso[6] ?? 0), iso[4] !== undefined);
  }

  const dmy = s.match(RE_DMY);
  if (dmy) {
    return build(+dmy[3], +dmy[2], +dmy[1], +(dmy[4] ?? 0), +(dmy[5] ?? 0), +(dmy[6] ?? 0), dmy[4] !== undefined);
  }

  // Último recurso: parser nativo (formatos con nombre de mes, etc.).
  const native = new Date(s);
  if (!Number.isNaN(native.getTime())) {
    return { date: native, hasTime: /\d{1,2}:\d{2}/.test(s) };
  }

  return null;
}

const FMT_DATE = 'dd/mm/yyyy';
const FMT_DATETIME = 'dd/mm/yyyy hh:mm';

/**
 * Escribe el valor en la celda. Si `isDate` y se puede parsear como fecha,
 * lo guarda como FECHA REAL de Excel (numFmt) -> filtrable por año.
 * En cualquier otro caso, como texto.
 */
export function writeCell(cell: ExcelJS.Cell, raw: unknown, isDate = false): void {
  if (raw === null || raw === undefined || raw === '') {
    cell.value = null;
    return;
  }
  if (isDate) {
    const parsed = parseDate(raw);
    if (parsed) {
      cell.value = parsed.date;
      cell.numFmt = parsed.hasTime ? FMT_DATETIME : FMT_DATE;
      return;
    }
  }
  cell.value = String(raw);
}