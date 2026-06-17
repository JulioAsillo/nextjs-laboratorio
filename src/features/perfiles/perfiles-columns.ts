import type { ColumnDef } from '@/features/usuarios/hallazgos/aplicaciones/columns';

/**
 * Columnas del "Hallazgo de Perfiles". Los `key` coinciden EXACTAMENTE con los
 * campos del JSON (mock hoy; backend real luego). Si el backend cambia un nombre,
 * actualiza el `key` aquí — esta es la única fuente de verdad del módulo.
 *
 * Grupos de color (lib/theme.ts): C1 Identidad · C2 Dueño · C6 Responsable · C8 Escenarios.
 */

export const KEY_ESCENARIO = 'Escenario';
export const KEY_RESPONSABLE = 'Responsable';

/** Flags booleanos de escenario (orden = orden de las tarjetas-resumen). */
export const PERFILES_ESCENARIO_FLAGS = [
  'Perfil Sin Dueño',
  'Permisos Excesivos',
  'Conflicto SoD',
  'Perfil Inactivo',
  'Sin Recertificar 365d',
] as const;

const flagCol = (key: string): ColumnDef => ({ key, header: key, group: 'C8', widthPx: 150, width: 18 });

export const perfilesColumns: ColumnDef[] = [
  // C1 · Identidad del perfil
  { key: 'Nombre Archivo', header: 'Nombre Archivo', group: 'C1', widthPx: 190, width: 22 },
  { key: 'Perfil', header: 'Perfil', group: 'C1', widthPx: 180, width: 20 },
  { key: 'Sistema', header: 'Sistema', group: 'C1', widthPx: 160, width: 18 },
  { key: 'Tipo Perfil', header: 'Tipo Perfil', group: 'C1', widthPx: 150, width: 16 },
  { key: 'Usuarios Asignados', header: 'Usuarios Asignados', group: 'C1', widthPx: 160, width: 18 },
  { key: 'Fecha Creación', header: 'Fecha Creación', group: 'C1', widthPx: 150, width: 16, isDate: true },
  { key: 'Fecha Ultima Recertificación', header: 'Fecha Última Recertificación', group: 'C1', widthPx: 220, width: 24, isDate: true },

  // C2 · Dueño del perfil
  { key: 'DNI Dueño', header: 'DNI Dueño', group: 'C2', widthPx: 130, width: 14 },
  { key: 'Dueño Perfil', header: 'Dueño Perfil', group: 'C2', widthPx: 190, width: 22 },

  // C8 · Escenarios
  { key: 'Escenario', header: 'Escenario', group: 'C8', widthPx: 240, width: 28 },
  ...PERFILES_ESCENARIO_FLAGS.map(flagCol),

  // C6 · Responsable
  { key: 'Responsable', header: 'Responsable', group: 'C6', widthPx: 170, width: 20 },
  { key: 'Comentario', header: 'Comentario', group: 'C6', widthPx: 220, width: 26 },
];
