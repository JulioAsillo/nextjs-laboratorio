import type { Fuente, UploadSlot } from '@/features/cargar/fuentes';
import { fuentes as usuariosFuentes } from '@/features/cargar/fuentes';

/**
 * Catálogo de fuentes de "Cargar Información" de la Certificación de Base de Datos.
 *
 * `kind` decide el backend al consultar/eliminar (el UPLOAD es siempre el mismo
 * endpoint de Usuarios `/datos/upload`, solo cambia `file_name`):
 *   - 'dbs'    -> Vida/Generales: GET /datos/dbs/{file_name}, DELETE /datos/dbs/delete?db_name={file_name}
 *   - 'shared' -> AD/GDH/Tickets/DNI: MISMOS endpoints que Usuarios
 *                 (GET /datos/apps/{appsKey}, DELETE /datos/apps/delete?app_name={appsKey})
 *
 * Para 'shared' las cabeceras son IDÉNTICAS a Usuarios, así que se reutilizan
 * sus `slots` (única fuente de verdad: features/cargar/fuentes.ts). Como comparten
 * backend, la card refleja "Cargado" al consultar (mismos datos que Usuarios).
 *
 * Vida/Generales: multi-archivo -> se unifican en 1 .xlsx con columna ORIGIN_FILE.
 */
export interface BdFuente extends Fuente {
  kind: 'dbs' | 'shared';
}

export const BD_GROUPS = [
  { key: 'Aplicaciones', label: 'Bases de Datos' },
  { key: 'Otros Reportes', label: 'Otros Reportes' },
] as const;

/** Toma los slots de una fuente de Usuarios por id (cabeceras idénticas). */
function slotsDe(id: string): UploadSlot[] {
  const f = usuariosFuentes.find((x) => x.id === id);
  if (!f) throw new Error(`Fuente de Usuarios no encontrada para reutilizar: ${id}`);
  return f.slots.map((s) => ({ ...s, columns: [...s.columns] }));
}

/* ── Cabeceras obligatorias de los reportes de Base de Datos ────────── */
const VIDA_COLUMNS = [
  'USERNAME', 'TYPE', 'TYPE_DESC', 'ISACTIVE', 'ULTIMOLOGEO',
  'CREATED', 'UPDATE', 'DATABASEROLE', 'DATABASENAME', 'SERVERROLE',
];

const GENERALES_COLUMNS = [
  'USERNAME', 'ACCOUNT_STATUS', 'LOCK_DATE', 'CREATED', 'PROFILE', 'ULTIMO_LOGIN',
];

export const bdFuentes: BdFuente[] = [
  // ---------- Bases de Datos (backend propio /datos/dbs) ----------
  {
    id: 'bd-vida', label: 'Vida', group: 'Aplicaciones', kind: 'dbs', appsKey: 'db_vida',
    slots: [{ fileName: 'db_vida', columns: VIDA_COLUMNS, multiple: true, originFile: true }],
  },
  {
    id: 'bd-generales', label: 'Generales', group: 'Aplicaciones', kind: 'dbs', appsKey: 'db_generales',
    slots: [{ fileName: 'db_generales', columns: GENERALES_COLUMNS, multiple: true, originFile: true }],
  },

  // ---------- Otros Reportes (MISMO backend que Usuarios) ----------
  { id: 'ad', label: 'Active Directory', group: 'Otros Reportes', kind: 'shared', appsKey: 'ad', slots: slotsDe('ad') },
  { id: 'gdh', label: 'GDH', group: 'Otros Reportes', kind: 'shared', appsKey: 'gdh', slots: slotsDe('gdh') },
  { id: 'tickets-ceses', label: 'Tickets Ceses', group: 'Otros Reportes', kind: 'shared', appsKey: 'tickets', slots: slotsDe('tickets-ceses') },
  { id: 'dni-vs-usuarios', label: 'DNI vs Usuarios', group: 'Otros Reportes', kind: 'shared', appsKey: 'dnivsuser', slots: slotsDe('dni-vs-usuarios') },
];
