import type { ColumnDef } from './columns';

/** Clave del campo Escenario en el reporte de AD (escenarios concatenados con " + "). */
export const KEY_AD_ESCENARIO = 'Escenario';

/**
 * Columnas del hallazgo de Active Directory (endpoint /hallazgos/ad -> data.reporte_ad).
 * Las `key` coinciden EXACTAMENTE con los campos del JSON del backend.
 * Grupos de color reutilizando el tema:
 *  C1 identidad AD · C2 DNI vs Usuario · C3 contraseña · C4 logins · C5 GDH · C6 cese/escenario.
 */
export const adColumns: ColumnDef[] = [
  { key: 'Dominio', header: 'Dominio', group: 'C1', widthPx: 110 },
  { key: 'Usuario', header: 'Usuario', group: 'C1', widthPx: 150 },
  { key: 'Nombre', header: 'Nombre', group: 'C1', widthPx: 180 },
  { key: 'Email', header: 'Email', group: 'C1', widthPx: 200 },
  { key: 'Rol', header: 'Rol', group: 'C1', widthPx: 140 },
  { key: 'DNI_AD', header: 'DNI_AD', group: 'C1', widthPx: 120 },

  { key: 'DNI_dnivsuser', header: 'DNI_dnivsuser', group: 'C2', widthPx: 150 },
  { key: 'TIPO_dnivsuser', header: 'TIPO_dnivsuser', group: 'C2', widthPx: 150 },
  { key: 'Usuario_dnivsuser', header: 'Usuario_dnivsuser', group: 'C2', widthPx: 170 },
  { key: 'COMENTARIO_dnivsuser', header: 'COMENTARIO_dnivsuser', group: 'C2', widthPx: 240 },

  { key: 'Descripción', header: 'Descripción', group: 'C1', widthPx: 220 },
  { key: 'Fecha Creación', header: 'Fecha Creación', group: 'C1', widthPx: 160 },
  { key: 'Fecha Cambio', header: 'Fecha Cambio', group: 'C1', widthPx: 160 },

  { key: 'passwordneverexpires', header: 'passwordneverexpires', group: 'C3', widthPx: 180 },
  { key: 'cannotchangepassword', header: 'cannotchangepassword', group: 'C3', widthPx: 190 },
  { key: 'passwordlastset', header: 'passwordlastset', group: 'C3', widthPx: 170 },

  { key: 'title', header: 'title', group: 'C1', widthPx: 140 },
  { key: 'Department', header: 'Department', group: 'C1', widthPx: 160 },
  { key: 'Company', header: 'Company', group: 'C1', widthPx: 160 },
  { key: 'StreetAddress', header: 'StreetAddress', group: 'C1', widthPx: 180 },
  { key: 'Estado', header: 'Estado', group: 'C1', widthPx: 120 },

  { key: 'Fecha Ultimo Login AD', header: 'Fecha Ultimo Login AD', group: 'C4', widthPx: 190 },
  { key: 'Fecha Ultimo Login Entra', header: 'Fecha Ultimo Login Entra', group: 'C4', widthPx: 200 },

  { key: 'Activo GDH', header: 'Activo GDH', group: 'C5', widthPx: 120 },
  { key: 'Fecha Alta', header: 'Fecha Alta', group: 'C5', widthPx: 150 },
  { key: 'Cesado GDH', header: 'Cesado GDH', group: 'C5', widthPx: 120 },
  { key: 'Fecha Cese', header: 'Fecha Cese', group: 'C5', widthPx: 150 },

  { key: 'Ticket Cese', header: 'Ticket Cese', group: 'C6', widthPx: 150 },
  { key: 'Fecha Cierre Ticket Cese', header: 'Fecha Cierre Ticket Cese', group: 'C6', widthPx: 210 },
  { key: 'Escenario', header: 'Escenario', group: 'C6', widthPx: 260 },
  { key: 'Cesado Activo', header: 'Cesado Activo', group: 'C6', widthPx: 130 },
  { key: 'Login Post Cese', header: 'Login Post Cese', group: 'C6', widthPx: 150 },
  { key: 'No Identificado', header: 'No Identificado', group: 'C6', widthPx: 150 },
  { key: 'Sin Uso 90d', header: 'Sin Uso 90d', group: 'C6', widthPx: 130 },
  { key: 'Deshabilitado 180d', header: 'Deshabilitado 180d', group: 'C6', widthPx: 170 },
  { key: 'Contraseña no Expira', header: 'Contraseña no Expira', group: 'C6', widthPx: 180 },
  { key: 'No Puede Cambiar Contraseña', header: 'No Puede Cambiar Contraseña', group: 'C6', widthPx: 220 },
];
