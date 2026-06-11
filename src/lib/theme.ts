/**
 * Tokens de diseño derivados del sistema "Corporate Minimalist Certification".
 * Fuente única de verdad para colores usados tanto en UI como en exportación Excel.
 *
 * Nota: Tailwind consume estos valores vía CSS variables (globals.css).
 * exceljs y cualquier render fuera del DOM los consumen directamente desde aquí.
 */

export const palette = {
  surface: '#faf8ff',
  surfaceContainerLow: '#f2f3ff',
  surfaceContainer: '#eaedff',
  surfaceContainerHigh: '#e2e7ff',
  onSurface: '#131b2e',
  onSurfaceVariant: '#3e484f',
  inverseSurface: '#283044',
  inverseOnSurface: '#eef0ff',
  outline: '#6e7880',
  outlineVariant: '#bdc8d0',
  primary: '#006386',
  onPrimary: '#ffffff',
  secondary: '#006d38',
  tertiary: '#964400',
  error: '#ba1a1a',
} as const;

/**
 * Los 6 grupos de color de cabecera.
 * Cada grupo define el relleno (fill) y el color de texto legible sobre ese relleno.
 * Estos hex se usan IDÉNTICOS en la tabla (badge de cabecera) y en el Excel exportado.
 */
export type ColorGroupId = 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6';

export interface ColorGroup {
  id: ColorGroupId;
  label: string;
  fill: string; // color de fondo de la cabecera
  text: string; // color del texto de la cabecera (siempre legible sobre fill)
}

export const colorGroups: Record<ColorGroupId, ColorGroup> = {
  C1: { id: 'C1', label: 'Aplicación', fill: palette.primary, text: '#ffffff' },
  C2: { id: 'C2', label: 'DNI vs Usuario', fill: palette.secondary, text: '#ffffff' },
  C3: { id: 'C3', label: 'AD PPS', fill: palette.tertiary, text: '#ffffff' },
  C4: { id: 'C4', label: 'AD VIDA', fill: palette.inverseSurface, text: '#ffffff' },
  C5: { id: 'C5', label: 'GDH', fill: palette.outline, text: '#ffffff' },
  C6: { id: 'C6', label: 'Ticket Cese', fill: palette.error, text: '#ffffff' },
};
