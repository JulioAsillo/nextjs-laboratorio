import type { ColorGroupId } from './theme';

/**
 * Definición central de columnas de Hallazgos - Aplicaciones.
 *
 * `key`     -> nombre EXACTO del campo en cada objeto de data.reporte_apps (con espacios/acentos).
 * `header`  -> texto de cabecera (UI y Excel).
 * `group`   -> grupo de color (C1..C6).
 * `widthPx` -> ancho en píxeles en la tabla web (virtualización).
 * `width`   -> ancho (en caracteres) en el Excel exportado.
 *
 * ÚNICO lugar a tocar para agregar/quitar columnas o recolorearlas.
 */
export interface ColumnDef {
  key: string;
  header: string;
  group: ColorGroupId;
  widthPx: number;
  width?: number;
}

// Claves usadas también por la lógica de resumen (evita strings mágicos sueltos).
export const KEY_ESCENARIO = 'Escenario';
export const KEY_APLICACION = 'Aplicación';
export const KEY_RESPONSABLE = 'Responsable';

export const columns: ColumnDef[] = [
  // --- C1: Datos base de la aplicación ---
  { key: 'Tipo Aplicación', header: 'Tipo Aplicación', group: 'C1', widthPx: 150, width: 18 },
  { key: 'Aplicación', header: 'Aplicación', group: 'C1', widthPx: 180, width: 22 },
  { key: 'Usuario', header: 'Usuario', group: 'C1', widthPx: 150, width: 18 },
  { key: 'Estado', header: 'Estado', group: 'C1', widthPx: 120, width: 14 },
  { key: 'Fecha Creación', header: 'Fecha Creación', group: 'C1', widthPx: 150, width: 16 },
  { key: 'Fecha Ultimo Login', header: 'Fecha Ultimo Login', group: 'C1', widthPx: 150, width: 16 },

  // --- C2: DNI vs Usuario ---
  { key: 'DNI', header: 'DNI', group: 'C2', widthPx: 120, width: 14 },
  { key: 'TIPO_dnivsuser', header: 'TIPO_dnivsuser', group: 'C2', widthPx: 160, width: 18 },
  { key: 'Usuario_dnivsuser', header: 'Usuario_dnivsuser', group: 'C2', widthPx: 180, width: 20 },
  { key: 'COMENTARIO_dnivsuser', header: 'COMENTARIO_dnivsuser', group: 'C2', widthPx: 260, width: 30 },

  // --- C1: Tipo Colaborador ---
  { key: 'Tipo Colaborador', header: 'Tipo Colaborador', group: 'C1', widthPx: 160, width: 18 },

  // --- C3: AD PPS ---
  { key: 'Username AD PPS', header: 'Username AD PPS', group: 'C3', widthPx: 180, width: 20 },
  { key: 'DNI AD PPS', header: 'DNI AD PPS', group: 'C3', widthPx: 150, width: 16 },

  // --- C4: AD VIDA ---
  { key: 'Username AD VIDA', header: 'Username AD VIDA', group: 'C4', widthPx: 180, width: 20 },
  { key: 'DNI AD VIDA', header: 'DNI AD VIDA', group: 'C4', widthPx: 150, width: 16 },

  // --- C5: GDH ---
  { key: 'Activo GDH', header: 'Activo GDH', group: 'C5', widthPx: 120, width: 14 },
  { key: 'Fecha Alta', header: 'Fecha Alta', group: 'C5', widthPx: 150, width: 16 },
  { key: 'Cesado GDH', header: 'Cesado GDH', group: 'C5', widthPx: 120, width: 14 },
  { key: 'Fecha Cese', header: 'Fecha Cese', group: 'C5', widthPx: 150, width: 16 },

  // --- C6: Ticket Cese / Escenario ---
  { key: 'Ticket Cese', header: 'Ticket Cese', group: 'C6', widthPx: 150, width: 16 },
  { key: 'Fecha Cierre Ticket Cese', header: 'Fecha Cierre Ticket Cese', group: 'C6', widthPx: 210, width: 22 },
  { key: 'Escenario', header: 'Escenario', group: 'C6', widthPx: 180, width: 18 },
  { key: 'Responsable', header: 'Responsable', group: 'C6', widthPx: 150, width: 20 },
  { key: 'Comentario', header: 'Comentario', group: 'C6', widthPx: 150, width: 20 },
];

/** Ancho total en px (suma de columnas) para el contenedor con scroll horizontal. */
export const totalWidthPx = columns.reduce((acc, c) => acc + c.widthPx, 0);

/** Template de CSS grid compartido por cabecera y filas (alineación perfecta). */
export const gridTemplate = columns.map((c) => `${c.widthPx}px`).join(' ');
