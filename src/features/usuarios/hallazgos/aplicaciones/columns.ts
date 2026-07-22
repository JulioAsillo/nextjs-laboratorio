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
  { key: 'tipo_aplicacion', header: 'Tipo Aplicación', group: 'C1', widthPx: 150, width: 18 },
  { key: 'aplicacion', header: 'Aplicación', group: 'C1', widthPx: 180, width: 22 },
  { key: 'usuario', header: 'Usuario', group: 'C1', widthPx: 150, width: 18 },
  { key: 'estado', header: 'Estado', group: 'C1', widthPx: 120, width: 14 },
  { key: 'fecha_creacion', header: 'Fecha Creación', group: 'C1', widthPx: 150, width: 16, isDate: true },
  { key: 'fecha_ultimo_login', header: 'Fecha Ultimo Login', group: 'C1', widthPx: 150, width: 16, isDate: true },

  // --- C2 ---
  { key: 'dni', header: 'DNI', group: 'C2', widthPx: 120, width: 14 },
  { key: 'tipo_usuario_dnivsuser', header: 'TIPO_dnivsuser', group: 'C2', widthPx: 160, width: 18 },
  { key: 'usuario_dnivsuser', header: 'Usuario_dnivsuser', group: 'C2', widthPx: 180, width: 20 },
  { key: 'comentario_dnivsuser', header: 'COMENTARIO_dnivsuser', group: 'C2', widthPx: 260, width: 30 },

  // --- C1 ---
  { key: 'tipo_colaborador', header: 'Tipo Colaborador', group: 'C1', widthPx: 160, width: 18 },
  
  // ---- C7 ---
  { key: 'estado_entra_id', header: 'Estado Entra ID', group: 'C7', widthPx: 120, width: 14 },
  { key: 'fecha_creacion_entra_id', header: 'Fecha Creacion Entra ID', group: 'C7', widthPx: 120, width: 14, isDate: true},
  { key: 'fecha_login_entra_id', header: 'Fecha Login Entra ID', group: 'C7', widthPx: 120, width: 14, isDate: true },
  { key: 'faxnumber_entra_id', header: 'FaxNumber Entra ID', group: 'C7', widthPx: 120, width: 14},

  // --- C3 ---
  { key: 'username_ad_pps', header: 'Username AD PPS', group: 'C3', widthPx: 180, width: 20 },
  { key: 'dni_ad_pps', header: 'DNI AD PPS', group: 'C3', widthPx: 150, width: 16 },

  // --- C4 ---
  { key: 'username_ad_vida', header: 'Username AD VIDA', group: 'C4', widthPx: 180, width: 20 },
  { key: 'dni_ad_vida', header: 'DNI AD VIDA', group: 'C4', widthPx: 150, width: 16 },

  // --- C5 ---
  { key: 'activo_gdh', header: 'Activo GDH', group: 'C5', widthPx: 120, width: 14 },
  { key: 'fecha_alta', header: 'Fecha Alta', group: 'C5', widthPx: 150, width: 16, isDate: true },
  { key: 'cesado_gdh', header: 'Cesado GDH', group: 'C5', widthPx: 120, width: 14 },
  { key: 'fecha_cese', header: 'Fecha Cese', group: 'C5', widthPx: 150, width: 16, isDate: true },

  // --- C6 ---
  { key: 'ticket_cese', header: 'Ticket Cese', group: 'C6', widthPx: 150, width: 16 },
  { key: 'fecha_cierre_ticket_cese', header: 'Fecha Cierre Ticket Cese', group: 'C6', widthPx: 210, width: 22, isDate: true },
  { key: 'escenario', header: 'Escenario', group: 'C6', widthPx: 180, width: 18 },
  { key: 'responsable', header: 'Responsable', group: 'C6', widthPx: 150, width: 20 },
  { key: 'comentario', header: 'Comentario', group: 'C6', widthPx: 150, width: 20 },
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
  'aplicacion', 'usuario', 'estado', 'fecha_creacion', 'fecha_ultimo_login',
  'dni', 'tipo_colaborador', 'username_ad_pps', 'username_ad_vida',
  'estado_entra_id', 'fecha_creacion_entra_id', 'fecha_login_entra_id',
  'activo_gdh', 'cesado_gdh', 'fecha_cese', 'ticket_cese',
  'fecha_cierre_ticket_cese', 'escenario', 'responsable', 'comentario',
]);

// H2 (Escenario 2 · No Identificados): igual que H1 pero SIN "Fecha Cese".
export const h2Columns: ColumnDef[] = pickColumns([
  'aplicacion', 'usuario', 'estado', 'fecha_creacion', 'fecha_ultimo_login',
  'dni', 'tipo_colaborador', 'username_ad_pps', 'username_ad_vida',
  'estado_entra_id', 'fecha_creacion_entra_id', 'fecha_login_entra_id',
  'activo_gdh', 'cesado_gdh', 'ticket_cese',
  'fecha_cierre_ticket_cese', 'escenario', 'responsable', 'comentario',
]);
