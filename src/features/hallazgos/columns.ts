import type { ColorGroupId } from '@/lib/theme';

export interface ColumnDef {
  key: string;
  header: string;
  group: ColorGroupId;
  widthPx: number;
  width?: number;
  isDate?: boolean;
}

export const KEY_ESCENARIO = 'Escenario';
export const KEY_APLICACION = 'Aplicación';
export const KEY_RESPONSABLE = 'Responsable';

export const columns: ColumnDef[] = [
  // --- C1 ---
  { key: 'Tipo Aplicación', header: 'Tipo Aplicación', group: 'C1', widthPx: 150, width: 18 },
  { key: 'Aplicación', header: 'Aplicación', group: 'C1', widthPx: 180, width: 22 },
  { key: 'Usuario', header: 'Usuario', group: 'C1', widthPx: 150, width: 18 },
  { key: 'Estado', header: 'Estado', group: 'C1', widthPx: 120, width: 14 },
  { key: 'Estado Entra ID', header: 'Estado Entra ID', group: 'C1', widthPx: 120, width: 14 },
  { key: 'Fecha Creación', header: 'Fecha Creación', group: 'C1', widthPx: 150, width: 16, isDate: true },
  { key: 'Fecha Ultimo Login', header: 'Fecha Ultimo Login', group: 'C1', widthPx: 150, width: 16, isDate: true },

  // --- C2 ---
  { key: 'DNI', header: 'DNI', group: 'C2', widthPx: 120, width: 14 },
  { key: 'TIPO_dnivsuser', header: 'TIPO_dnivsuser', group: 'C2', widthPx: 160, width: 18 },
  { key: 'Usuario_dnivsuser', header: 'Usuario_dnivsuser', group: 'C2', widthPx: 180, width: 20 },
  { key: 'COMENTARIO_dnivsuser', header: 'COMENTARIO_dnivsuser', group: 'C2', widthPx: 260, width: 30 },

  // --- C1 ---
  { key: 'Tipo Colaborador', header: 'Tipo Colaborador', group: 'C1', widthPx: 160, width: 18 },

  // --- C3 ---
  { key: 'Username AD PPS', header: 'Username AD PPS', group: 'C3', widthPx: 180, width: 20 },
  { key: 'DNI AD PPS', header: 'DNI AD PPS', group: 'C3', widthPx: 150, width: 16 },

  // --- C4 ---
  { key: 'Username AD VIDA', header: 'Username AD VIDA', group: 'C4', widthPx: 180, width: 20 },
  { key: 'DNI AD VIDA', header: 'DNI AD VIDA', group: 'C4', widthPx: 150, width: 16 },

  // --- C5 ---
  { key: 'Activo GDH', header: 'Activo GDH', group: 'C5', widthPx: 120, width: 14 },
  { key: 'Fecha Alta', header: 'Fecha Alta', group: 'C5', widthPx: 150, width: 16, isDate: true },
  { key: 'Cesado GDH', header: 'Cesado GDH', group: 'C5', widthPx: 120, width: 14 },
  { key: 'Fecha Cese', header: 'Fecha Cese', group: 'C5', widthPx: 150, width: 16, isDate: true },

  // --- C6 ---
  { key: 'Ticket Cese', header: 'Ticket Cese', group: 'C6', widthPx: 150, width: 16 },
  { key: 'Fecha Cierre Ticket Cese', header: 'Fecha Cierre Ticket Cese', group: 'C6', widthPx: 210, width: 22, isDate: true },
  { key: 'Escenario', header: 'Escenario', group: 'C6', widthPx: 180, width: 18 },
  { key: 'Responsable', header: 'Responsable', group: 'C6', widthPx: 150, width: 20 },
  { key: 'Comentario', header: 'Comentario', group: 'C6', widthPx: 150, width: 20 },
];

export const totalWidthPx = columns.reduce((acc, c) => acc + c.widthPx, 0);
export const gridTemplate = columns.map((c) => `${c.widthPx}px`).join(' ');

/* ── Subconjuntos de columnas para las hojas de detalle del Resumen ── */
const byKey = new Map(columns.map((c) => [c.key, c]));

function pickColumns(keys: string[]): ColumnDef[] {
  return keys.map((k) => byKey.get(k)).filter((c): c is ColumnDef => Boolean(c));
}

// H1 (Escenario 1 · Cesados Activos)
export const h1Columns: ColumnDef[] = pickColumns([
  'Aplicación', 'Usuario', 'Estado', 'Fecha Creación', 'Fecha Ultimo Login',
  'DNI', 'Tipo Colaborador', 'Username AD PPS', 'Username AD VIDA',
  'Activo GDH', 'Cesado GDH', 'Fecha Cese', 'Ticket Cese',
  'Fecha Cierre Ticket Cese', 'Escenario', 'Responsable', 'Comentario',
]);

// H2 (Escenario 2 · No Identificados): igual que H1 pero SIN "Fecha Cese".
export const h2Columns: ColumnDef[] = pickColumns([
  'Aplicación', 'Usuario', 'Estado', 'Fecha Creación', 'Fecha Ultimo Login',
  'DNI', 'Tipo Colaborador', 'Username AD PPS', 'Username AD VIDA',
  'Activo GDH', 'Cesado GDH', 'Ticket Cese',
  'Fecha Cierre Ticket Cese', 'Escenario', 'Responsable', 'Comentario',
]);
