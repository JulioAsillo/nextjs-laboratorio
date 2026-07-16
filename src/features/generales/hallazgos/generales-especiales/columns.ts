import type { ColumnDef } from '@/features/usuarios/hallazgos/aplicaciones/columns';

/**
 * Columnas del hallazgo "Generales y Especiales".
 *
 * Los `key` deben coincidir EXACTAMENTE con los campos del JSON del backend
 * (mayúsculas, acentos y espacios incluidos). Esta es la única fuente de verdad
 * de columnas del hallazgo: la tabla de la UI y el Excel exportado leen de aquí.
 *
 * Grupos de color (lib/theme.ts):
 *   C1 Aplicación · C2 DNI vs Usuarios · C3 AD PPS · C4 AD VIDA · C5 GDH ·
 *   C6 Ticket Cese · C7 Entra ID · C8 Escenarios
 *
 * ⚠️ TODO(Julio): reemplazar por el esquema real. Este set es un ESQUELETO
 * calcado del hallazgo de Aplicaciones para que la vista compile y renderice.
 */
export const generalesEspecialesColumns: ColumnDef[] = [
  // --- C1 · Origen ---
  { key: 'Tipo Aplicación', header: 'Tipo Aplicación', group: 'C1', widthPx: 150, width: 18 },
  { key: 'Aplicación', header: 'Aplicación', group: 'C1', widthPx: 180, width: 22 },
  { key: 'Usuario', header: 'Usuario', group: 'C1', widthPx: 150, width: 18 },
  { key: 'Estado', header: 'Estado', group: 'C1', widthPx: 120, width: 14 },
  { key: 'Fecha Creación', header: 'Fecha Creación', group: 'C1', widthPx: 150, width: 16, isDate: true },

  // --- C2 · DNI vs Usuarios ---
  { key: 'DNI', header: 'DNI', group: 'C2', widthPx: 120, width: 14 },
  { key: 'TIPO_dnivsuser', header: 'TIPO_dnivsuser', group: 'C2', widthPx: 160, width: 18 },
  { key: 'Usuario_dnivsuser', header: 'Usuario_dnivsuser', group: 'C2', widthPx: 180, width: 20 },

  // --- C5 · GDH ---
  { key: 'Activo GDH', header: 'Activo GDH', group: 'C5', widthPx: 120, width: 14 },
  { key: 'Sociedad', header: 'Sociedad', group: 'C5', widthPx: 150, width: 18 },

  // --- C8 · Escenarios ---
  { key: 'Escenario', header: 'Escenario', group: 'C8', widthPx: 200, width: 22 },
  { key: 'Responsable', header: 'Responsable', group: 'C8', widthPx: 150, width: 20 },
  { key: 'Comentario', header: 'Comentario', group: 'C8', widthPx: 220, width: 28 },
];

export const totalWidthPx = generalesEspecialesColumns.reduce((acc, c) => acc + c.widthPx, 0);
export const gridTemplate = generalesEspecialesColumns.map((c) => `${c.widthPx}px`).join(' ');
