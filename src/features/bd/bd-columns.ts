import type { ColumnDef } from '@/features/usuarios/hallazgos/aplicaciones/columns';

/**
 * Definiciones de columnas para el "Hallazgo Base de Datos".
 *
 * Los `key` coinciden EXACTAMENTE con los campos del JSON del backend
 * (incluyendo espacios, acentos y el typo "Userame" tal cual lo devuelve la API).
 * Si en el backend corriges "Userame" -> "Username", actualiza también el `key` aquí.
 *
 * Grupos de color (lib/theme.ts):
 *   C1 Identidad BD · C2 DNI vs Usuario · C3 AD PPS · C4 AD VIDA
 *   C5 GDH · C6 Ticket/Responsable · C8 Escenarios (naranja)
 */

export const KEY_ESCENARIO = 'Escenario';
export const KEY_RESPONSABLE = 'Responsable';

/** Flags booleanos de escenario comunes a ambas hojas. */
export const ESCENARIO_FLAGS_COMUNES = [
  'Cesado Activo', 'Login Post Cese', 'No Identificado', 'Sin Uso 90d', 'Deshabilitado 180d',
] as const;
/** Flag adicional exclusivo de Generales. */
export const ESCENARIO_FLAG_GENERALES = 'No Cesado Oportunamente';

/* ── Bloques reutilizados entre Vida y Generales ───────────────────── */
const BLOQUE_PERSONA: ColumnDef[] = [
  { key: 'DNI', header: 'DNI', group: 'C2', widthPx: 120, width: 14 },
  { key: 'TIPO_dnivsuser', header: 'Tipo (DNI vs User)', group: 'C2', widthPx: 170, width: 18 },
  { key: 'USUARIO_dnivsuser', header: 'Usuario (DNI vs User)', group: 'C2', widthPx: 190, width: 20 },
  { key: 'COMENTARIO_dnivsuser', header: 'Comentario (DNI vs User)', group: 'C2', widthPx: 240, width: 28 },
];

const BLOQUE_AD: ColumnDef[] = [
  { key: 'Username AD PPS', header: 'Username AD PPS', group: 'C3', widthPx: 180, width: 20 },
  { key: 'DNI AD PPS', header: 'DNI AD PPS', group: 'C3', widthPx: 150, width: 16 },
  { key: 'Username AD VIDA', header: 'Username AD VIDA', group: 'C4', widthPx: 180, width: 20 },
  { key: 'DNI AD VIDA', header: 'DNI AD VIDA', group: 'C4', widthPx: 150, width: 16 },
];

const BLOQUE_GDH: ColumnDef[] = [
  { key: 'Activo GDH', header: 'Activo GDH', group: 'C5', widthPx: 120, width: 14 },
  { key: 'Fecha Alta', header: 'Fecha Alta', group: 'C5', widthPx: 150, width: 16, isDate: true },
  { key: 'Cesado GDH', header: 'Cesado GDH', group: 'C5', widthPx: 120, width: 14 },
  { key: 'Fecha Cese', header: 'Fecha Cese', group: 'C5', widthPx: 150, width: 16, isDate: true },
];

const BLOQUE_TICKET: ColumnDef[] = [
  { key: 'Ticket Cese', header: 'Ticket Cese', group: 'C6', widthPx: 150, width: 16 },
  { key: 'Fecha Cierre Ticket Cese', header: 'Fecha Cierre Ticket Cese', group: 'C6', widthPx: 210, width: 22, isDate: true },
];

const flagCol = (key: string): ColumnDef => ({ key, header: key, group: 'C8', widthPx: 140, width: 16 });

const BLOQUE_RESPONSABLE: ColumnDef[] = [
  { key: 'Responsable', header: 'Responsable', group: 'C6', widthPx: 150, width: 20 },
  { key: 'Comentario', header: 'Comentario', group: 'C6', widthPx: 200, width: 24 },
];

/* ── Hoja VIDA ─────────────────────────────────────────────────────── */
export const bdVidaColumns: ColumnDef[] = [
  // C1 · Identidad de la cuenta de BD
  { key: 'Nombre Archivo', header: 'Nombre Archivo', group: 'C1', widthPx: 180, width: 22 },
  { key: 'Userame', header: 'Usuario', group: 'C1', widthPx: 160, width: 18 },
  { key: 'Type', header: 'Type', group: 'C1', widthPx: 110, width: 12 },
  { key: 'Type Desc', header: 'Type Desc', group: 'C1', widthPx: 160, width: 18 },
  { key: 'DB Name', header: 'DB Name', group: 'C1', widthPx: 170, width: 20 },
  { key: 'Server Role', header: 'Server Role', group: 'C1', widthPx: 150, width: 16 },
  { key: 'DB Role', header: 'DB Role', group: 'C1', widthPx: 150, width: 16 },
  { key: 'Estado', header: 'Estado', group: 'C1', widthPx: 110, width: 12 },
  { key: 'Fecha Creación', header: 'Fecha Creación', group: 'C1', widthPx: 150, width: 16, isDate: true },
  { key: 'Fecha Actualizacion', header: 'Fecha Actualización', group: 'C1', widthPx: 160, width: 18, isDate: true },
  { key: 'Fecha Login', header: 'Fecha Login', group: 'C1', widthPx: 150, width: 16, isDate: true },

  ...BLOQUE_PERSONA,
  ...BLOQUE_AD,
  ...BLOQUE_GDH,
  ...BLOQUE_TICKET,

  // C8 · Escenarios
  { key: 'Escenario', header: 'Escenario', group: 'C8', widthPx: 200, width: 22 },
  ...ESCENARIO_FLAGS_COMUNES.map(flagCol),

  ...BLOQUE_RESPONSABLE,
];

/* ── Hoja GENERALES ────────────────────────────────────────────────── */
export const bdGeneralesColumns: ColumnDef[] = [
  // C1 · Identidad de la cuenta de BD
  { key: 'Nombre Archivo', header: 'Nombre Archivo', group: 'C1', widthPx: 180, width: 22 },
  { key: 'Userame', header: 'Usuario', group: 'C1', widthPx: 160, width: 18 },
  { key: 'Perfil', header: 'Perfil', group: 'C1', widthPx: 150, width: 16 },
  { key: 'Estado', header: 'Estado', group: 'C1', widthPx: 110, width: 12 },
  { key: 'Fecha Bloqueo', header: 'Fecha Bloqueo', group: 'C1', widthPx: 150, width: 16, isDate: true },
  { key: 'Fecha Creación', header: 'Fecha Creación', group: 'C1', widthPx: 150, width: 16, isDate: true },
  { key: 'Fecha Login', header: 'Fecha Login', group: 'C1', widthPx: 150, width: 16, isDate: true },

  ...BLOQUE_PERSONA,
  ...BLOQUE_AD,
  ...BLOQUE_GDH,
  ...BLOQUE_TICKET,

  // C8 · Escenarios (Generales suma "No Cesado Oportunamente")
  { key: 'Escenario', header: 'Escenario', group: 'C8', widthPx: 200, width: 22 },
  ...ESCENARIO_FLAGS_COMUNES.map(flagCol),
  flagCol(ESCENARIO_FLAG_GENERALES),

  ...BLOQUE_RESPONSABLE,
];
