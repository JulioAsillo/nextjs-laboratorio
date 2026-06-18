import type { ColumnDef } from '@/features/usuarios/hallazgos/aplicaciones/columns';

/**
 * Columnas del "Hallazgo de Perfiles". Los `key` coinciden EXACTAMENTE con los
 * campos del JSON que devuelve el backend:
 *
 *   GET {API_BASE}/hallazgos/profiles -> { data: { reporte_perfiles: [...] } }
 *
 * Esta es la ÚNICA fuente de verdad de columnas del módulo. Si el backend cambia
 * el nombre de un campo (espacios, acentos, mayúsculas), se actualiza el `key` aquí.
 *
 * Grupos de color (lib/theme.ts), mismo criterio por ORIGEN del dato que en Usuarios:
 *   C1  Aplicación / Exactus Perfiles · C2  DNI vs Usuarios · C5  GDH ·
 *   C3  AD PPS · C4  AD VIDA · C9  Rol Final (calculado) · C10  Matriz de Roles.
 */

export const KEY_ROL_FINAL = 'Rol Final';

/** Validaciones contra la Matriz de Roles (valor "Correcto"/"Incorrecto"). */
export const PERFILES_VALIDACIONES = ['Rol+App', 'Rol+App+Perfil', 'Rol+Perfil'] as const;

export const perfilesColumns: ColumnDef[] = [
  // --- C1 · Aplicación / Exactus Perfiles ---
  { key: 'Aplicación', header: 'Aplicación', group: 'C1', widthPx: 180, width: 22 },
  { key: 'Asignación', header: 'Asignación', group: 'C1', widthPx: 150, width: 16 },
  { key: 'Usuario', header: 'Usuario', group: 'C1', widthPx: 160, width: 18 },

  // --- C2 · DNI vs Usuarios ---
  { key: 'DNI', header: 'DNI', group: 'C2', widthPx: 130, width: 14 },
  { key: 'TIPO_dnivsuser', header: 'TIPO_dnivsuser', group: 'C2', widthPx: 160, width: 18 },
  { key: 'Usuario_dnivsuser', header: 'Usuario_dnivsuser', group: 'C2', widthPx: 180, width: 20 },
  { key: 'COMENTARIO_dnivsuser', header: 'COMENTARIO_dnivsuser', group: 'C2', widthPx: 260, width: 30 },

  // --- C1 · Aplicación / Exactus Perfiles ---
  { key: 'Estado', header: 'Estado', group: 'C1', widthPx: 120, width: 14 },
  { key: 'Perfil', header: 'Perfil', group: 'C1', widthPx: 180, width: 20 },
  { key: 'Fecha Creación', header: 'Fecha Creación', group: 'C1', widthPx: 150, width: 16, isDate: true },
  { key: 'Fecha Login', header: 'Fecha Login', group: 'C1', widthPx: 150, width: 16, isDate: true },

  // --- C5 · GDH ---
  { key: 'Tipo Colaborador', header: 'Tipo Colaborador', group: 'C5', widthPx: 160, width: 18 },
  { key: 'Rol GDH', header: 'Rol GDH', group: 'C5', widthPx: 180, width: 20 },

  // --- C3 · AD PPS ---
  { key: 'Rol AD PPS', header: 'Rol AD PPS', group: 'C3', widthPx: 180, width: 20 },

  // --- C4 · AD VIDA ---
  { key: 'Rol AD VIDA', header: 'Rol AD VIDA', group: 'C4', widthPx: 180, width: 20 },

  // --- C9 · Rol Final (calculado) ---
  { key: 'Rol Final', header: 'Rol Final', group: 'C9', widthPx: 180, width: 20 },

  // --- C10 · Matriz de Roles (Correcto / Incorrecto) ---
  { key: 'Rol+App', header: 'Rol+App', group: 'C10', widthPx: 130, width: 14 },
  { key: 'Rol+App+Perfil', header: 'Rol+App+Perfil', group: 'C10', widthPx: 150, width: 16 },
  { key: 'Rol+Perfil', header: 'Rol+Perfil', group: 'C10', widthPx: 130, width: 14 },
];

export const totalWidthPx = perfilesColumns.reduce((acc, c) => acc + c.widthPx, 0);
export const gridTemplate = perfilesColumns.map((c) => `${c.widthPx}px`).join(' ');
