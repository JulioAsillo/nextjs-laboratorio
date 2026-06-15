import type { Fuente, UploadSlot } from '@/features/cargar/fuentes';
import { fuentes as usuariosFuentes } from '@/features/cargar/fuentes';

/**
 * Catálogo de fuentes de "Cargar Información" de la Certificación de Base de Datos.
 *
 * Reutiliza el tipo `Fuente`/`UploadSlot` de Usuarios. Para AD, GDH, Tickets y
 * DNI vs Usuarios las cabeceras son IDÉNTICAS a las de Usuarios, así que se
 * reutilizan los mismos `slots` (única fuente de verdad: features/cargar/fuentes.ts).
 *
 *  - `slots[].fileName`  -> POST {BD_ENDPOINTS.upload}?file_name={fileName}
 *  - `slots[].columns`   -> cabeceras EXACTAS esperadas del Excel (validación al subir)
 *  - `slots[].multiple`  -> permite subir varios archivos (Vida/Generales)
 *  - `slots[].originFile`-> al unificar agrega la columna ORIGIN_FILE
 *  - `appsKey`           -> GET {BD_ENDPOINTS.apps}/{appsKey} (vista DataTable).
 *
 * Grupos a renderizar. `key` coincide con `Fuente.group`; `label` es el título de la UI.
 */
export const BD_GROUPS = [
  { key: 'Aplicaciones', label: 'Bases de Datos' },
  { key: 'Otros Reportes', label: 'Otros Reportes' },
] as const;

/** Toma los slots de una fuente de Usuarios por id (cabeceras idénticas). */
function slotsDe(id: string): UploadSlot[] {
  const f = usuariosFuentes.find((x) => x.id === id);
  if (!f) throw new Error(`Fuente de Usuarios no encontrada para reutilizar: ${id}`);
  // Clona para no mutar la definición original de Usuarios.
  return f.slots.map((s) => ({ ...s, columns: [...s.columns] }));
}

/* ── Cabeceras de los reportes de Base de Datos (las que me pasaste) ── */
const VIDA_COLUMNS = [
  'USERNAME', 'TYPE', 'TYPE_DESC', 'ISACTIVE', 'ULTIMOLOGEO',
  'CREATED', 'UPDATE', 'DATABASEROLE', 'DATABASENAME', 'SERVERROLE',
];

const GENERALES_COLUMNS = [
  'USERNAME', 'ACCOUNT_STATUS', 'LOCK_DATE', 'CREATED', 'PROFILE', 'ULTIMO_LOGIN',
];

export const bdFuentes: Fuente[] = [
  // ---------- Bases de Datos ----------
  {
    id: 'bd-vida', label: 'Vida', group: 'Aplicaciones', appsKey: 'vida',
    slots: [{ fileName: 'db_vida', columns: VIDA_COLUMNS, multiple: true, originFile: true }],
  },
  {
    id: 'bd-generales', label: 'Generales', group: 'Aplicaciones', appsKey: 'generales',
    slots: [{ fileName: 'db_generales', columns: GENERALES_COLUMNS, multiple: true, originFile: true }],
  },

  // ---------- Otros Reportes (cabeceras idénticas a Usuarios) ----------
  // AD: 2 slots (AD PPS + AD Vida).
  { id: 'ad', label: 'Active Directory', group: 'Otros Reportes', appsKey: 'ad', slots: slotsDe('ad') },
  // GDH: 2 slots (Activos + Cesados).
  { id: 'gdh', label: 'GDH', group: 'Otros Reportes', appsKey: 'gdh', slots: slotsDe('gdh') },
  // Tickets de ceses.
  { id: 'tickets-ceses', label: 'Tickets Ceses', group: 'Otros Reportes', appsKey: 'tickets', slots: slotsDe('tickets-ceses') },
  // DNI vs Usuarios.
  { id: 'dni-vs-usuarios', label: 'DNI vs Usuarios', group: 'Otros Reportes', appsKey: 'dnivsuser', slots: slotsDe('dni-vs-usuarios') },
];
