import type { ColumnDef } from '@/features/usuarios/hallazgos/aplicaciones/columns';

/**
 * Columnas del hallazgo "Activos GDH" (Certificación de Perfiles).
 *
 * Los `key` coinciden EXACTAMENTE con los campos del JSON que devuelve el backend:
 *
 *   GET {API_BASE}/hallazgos/activos-gdh -> { cert_activos: [...] }
 *
 * Esta es la ÚNICA fuente de verdad de columnas del hallazgo. Los nombres van en
 * minúscula con espacios/underscore tal cual los emite el backend; si cambian
 * (mayúsculas, acentos, espacios), se actualiza el `key` aquí.
 *
 * Son las 17 columnas completas (15 datos + 2 validaciones). Las validaciones se
 * muestran tal como llegan (sin lógica Correcto/Incorrecto). NO hay columnas de
 * Responsable ni Comentario de escenario, ni fechas.
 *
 * Grupos de color (lib/theme.ts), por ORIGEN del dato:
 *   C5  GDH (colaborador activo) · C2  DNI vs Usuarios ·
 *   C3  AD PPS · C4  AD VIDA · C10  Matriz de Roles (existe + validaciones).
 */
export const activosGdhColumns: ColumnDef[] = [
  // --- C5 · GDH (colaborador activo) ---
  { key: 'nombre colaborador', header: 'Nombre Colaborador', group: 'C5', widthPx: 240, width: 30 },
  { key: 'dni', header: 'DNI', group: 'C5', widthPx: 120, width: 14 },
  { key: 'sociedad', header: 'Sociedad', group: 'C5', widthPx: 140, width: 16 },
  { key: 'funcion', header: 'Funcion', group: 'C5', widthPx: 140, width: 16 },
  { key: 'unidad organizativa', header: 'Unidad Organizativa', group: 'C5', widthPx: 180, width: 24 },
  { key: 'servicio', header: 'Servicio', group: 'C5', widthPx: 150, width: 20 },

  // --- C2 · DNI vs Usuarios ---
  { key: 'tipo_dnivsuser', header: 'TIPO_dnivsuser', group: 'C2', widthPx: 160, width: 18 },
  { key: 'usuario_dnivsuser', header: 'Usuario_dnivsuser', group: 'C2', widthPx: 180, width: 20 },
  { key: 'comentario_dnivsuser', header: 'COMENTARIO_dnivsuser', group: 'C2', widthPx: 260, width: 30 },

  // --- C5 · GDH (rol) ---
  { key: 'tipo rol', header: 'Tipo Rol', group: 'C5', widthPx: 150, width: 16 },
  { key: 'rol gdh', header: 'Rol GDH', group: 'C5', widthPx: 180, width: 20 },
  { key: 'jefe gdh', header: 'Jefe GDH', group: 'C5', widthPx: 180, width: 20 },

  // --- C10 · Matriz de Roles ---
  { key: 'existe en mr', header: 'Existe en MR', group: 'C10', widthPx: 140, width: 16 },

  // --- C3 · AD PPS ---
  { key: 'username pps', header: 'Username PPS', group: 'C3', widthPx: 170, width: 18 },
  { key: 'rol pps', header: 'Rol PPS', group: 'C3', widthPx: 170, width: 18 },
  { key: 'dni pps', header: 'DNI PPS', group: 'C3', widthPx: 130, width: 14 },
  { key: 'jefe pps', header: 'Jefe PPS', group: 'C3', widthPx: 180, width: 20 },
  // --- C4 · AD VIDA ---
  { key: 'username vida', header: 'Username VIDA', group: 'C4', widthPx: 170, width: 18 },
  { key: 'rol vida', header: 'Rol VIDA', group: 'C4', widthPx: 170, width: 18 },
  { key: 'dni vida', header: 'DNI VIDA', group: 'C4', widthPx: 130, width: 14 },
  { key: 'jefe vida', header: 'Jefe VIDA', group: 'C4', widthPx: 180, width: 20 },

  // --- C10 · Matriz de Roles (validaciones, se muestran tal cual) ---
  { key: 'validacion rol', header: 'Validación Rol', group: 'C10', widthPx: 200, width: 24 },
  { key: 'validacion dni', header: 'Validación DNI', group: 'C10', widthPx: 200, width: 24 },
];

export const totalWidthPx = activosGdhColumns.reduce((acc, c) => acc + c.widthPx, 0);
export const gridTemplate = activosGdhColumns.map((c) => `${c.widthPx}px`).join(' ');
