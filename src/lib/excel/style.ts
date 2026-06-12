import type ExcelJS from 'exceljs';

/**
 * Helpers de estilo para hojas Excel, compartidos por export-excel y
 * export-resumen-excel (antes estaban duplicados: `toArgb`/`argb`, `styleHeader`,
 * `thinBorder` vivían en cada archivo de exportación).
 */

/** Hex (#rrggbb) -> ARGB de ExcelJS (FFrrggbb). */
export const argb = (hex: string): string => 'FF' + hex.replace('#', '').toUpperCase();

/** Borde fino uniforme del color indicado. */
export function thinBorder(hex: string): Partial<ExcelJS.Borders> {
  const b = { style: 'thin' as const, color: { argb: argb(hex) } };
  return { top: b, bottom: b, left: b, right: b };
}

/** Estilo estándar de cabecera: relleno sólido, texto bold centrado y borde blanco. */
export function styleHeader(cell: ExcelJS.Cell, fillHex: string, textHex = '#ffffff'): void {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(fillHex) } };
  cell.font = { color: { argb: argb(textHex) }, bold: true, size: 11 };
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  cell.border = thinBorder('#ffffff');
}
