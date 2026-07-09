/**
 * Catálogo de fuentes de "Cargar Información".
 *
 * Cada `Fuente` es una CARD y puede tener uno o varios `slots` de carga:
 *  - Apps normales: 1 slot.
 *  - Active Directory: 2 slots (AD PPS + AD Vida) que suben por separado pero
 *    se consultan juntos en /datos/apps/ad (trae columna `origen`: PPS/VIDA).
 *  - GDH: 2 slots (Activos + Cesados) que se consultan juntos en /datos/apps/gdh
 *    (trae `isActivo` / `isCesado`).
 *
 * Campos:
 *  - `slots[].fileName` -> POST /datos/upload?file_name={fileName}
 *  - `slots[].columns`  -> cabeceras EXACTAS esperadas del Excel (validación al subir)
 *  - `appsKey`          -> GET /datos/apps/{appsKey} (vista DataTable).
 *                          `undefined` = aún sin endpoint (p.ej. Entra ID).
 */
export interface UploadSlot {
  fileName: string;
  /** Etiqueta del slot. Vacía o ausente cuando la card tiene un solo slot. */
  label?: string;
  columns: string[];
  /** Permite subir varios archivos con la misma estructura (CRM, Datalake). */
  multiple?: boolean;
  /**
   * Si es true, al unificar varios archivos se agrega una última columna
   * `ORIGIN_FILE` con el nombre del archivo de origen de cada registro.
   * Solo aplica con `multiple: true` (lo usan Vida/Generales en BD).
   */
  originFile?: boolean;
}

export interface Fuente {
  id: string;
  label: string;
  group: 'Aplicaciones' | 'Otros Reportes';
  appsKey?: string;
  slots: UploadSlot[];
}

export const FORMATOS = ['.csv', '.xls', '.xlsx'] as const;

// Cabeceras de los reportes de Active Directory (idénticas para PPS y Vida).
const AD_COLUMNS = ['SAMACCOUNTNAME', 'EMAILADDRESS', 'LASTLOGONDATE', 'DISPLAYNAME', 'IPPHONE', 'WHENCREATED', 'WHENCHANGED', 'FACSIMILETELEPHONENUMBER', 'DESCRIPTION', 'ENABLED', 'PASSWORDNEVEREXPIRES', 'CANNOTCHANGEPASSWORD', 'PASSWORDLASTSET', 'TITLE', 'DEPARTMENT', 'COMPANY', 'STREETADDRESS'];

export const fuentes: Fuente[] = [
  // ---------- Aplicaciones ----------
  {
    id: 'acselx', label: 'Acselx', group: 'Aplicaciones', appsKey: 'acselx',
    slots: [{ fileName: 'usuarios_acselx', columns: ['CODUSRPPS', 'CODPERFIL', 'STSUSRPPSAPLIC', 'STSUSRPPS', 'CODAPLIC', 'CODCOLABORADOR', 'NOMUSRPPS', 'NUMDOC', 'TIPOUSRPPS', 'FECHACREA', 'FECACCESO'] }],
  },
  {
    id: 'addactis', label: 'Addactis', group: 'Aplicaciones', appsKey: 'addactis',
    slots: [{ fileName: 'usuarios_addactis', columns: ['USER NAME', 'USER DOMAIN'] }],
  },
  {
    id: 'billing-center', label: 'Billing Center', group: 'Aplicaciones', appsKey: 'billingcenter',
    slots: [{ fileName: 'usuarios_billing_center', columns: ['USERNAME', 'ROLENAME', 'NAME', 'LASTNAME', 'SECONDLASTNAME', 'ROLEDESCRIPTION', 'FECHA_CREACION', 'ESTADO'] }],
  },
  {
    id: 'botmaker', label: 'Botmaker', group: 'Aplicaciones', appsKey: 'botmaker',
    slots: [{ fileName: 'usuarios_botmaker', columns: ['EMAIL', 'ROLE', 'ACTIVE', 'REGISTRATION_DATE', 'LAST_LOGIN_DATE'] }],
  },
  {
    id: 'cgweb', label: 'Carta de Garantía Web', group: 'Aplicaciones', appsKey: 'cgweb',
    slots: [{ fileName: 'usuarios_cgweb', columns: ['CODUSRPPS', 'CODAPLIC', 'CODCOLABORADOR', 'NOMUSRPPS', 'NUMDOC', 'CODPERFIL', 'STSUSRPPSAPLIC', 'STSUSRPPS', 'TIPOUSRPPS', 'FECHACREA', 'FECACCESO'] }],
  },
  {
    id: 'claim-center', label: 'Claim Center', group: 'Aplicaciones', appsKey: 'claim-center',
    slots: [{ fileName: 'usuarios_claim_center', columns: ['USERNAME', 'ROLENAME', 'NAME', 'LASTNAME', 'SECONDLASTNAME', 'ROLEDESCRIPTION', 'FECHA_CREACION', 'ESTADO'] }],
  },
  {
    id: 'contact-manager', label: 'Contact Manager', group: 'Aplicaciones', appsKey: 'contact-manager',
    slots: [{ fileName: 'usuarios_contact_manager', columns: ['USERNAME', 'ROLENAME', 'NAME', 'LASTNAME', 'SECONDLASTNAME', 'ROLEDESCRIPTION', 'FECHA_CREACION', 'ESTADO'] }],
  },
  {
    id: 'crm', label: 'CRM', group: 'Aplicaciones', appsKey: 'crm',
    slots: [{ fileName: 'usuarios_crm', multiple: true, columns: ['ID', 'DISPLAYNAME', 'MAIL', 'USERPRINCIPALNAME'] }],
  },
  {
    id: 'datalake', label: 'Datalake', group: 'Aplicaciones', appsKey: 'datalake',
    slots: [{ fileName: 'usuarios_datalake', multiple: true, columns: ['ID', 'MAIL', 'USERPRINCIPALNAME', 'DISPLAYNAME'] }],
  },
  {
    id: 'eas', label: 'EAS', group: 'Aplicaciones', appsKey: 'eas',
    slots: [{ fileName: 'usuarios_eas', columns: ['USER_ID', 'USER_NAME', 'GROUP_ID', 'FECHAEXPIRACION_CUENTA', 'CUENTAAUTENTICACION_WINDOWS', 'FECHAEXPIRACION_PASSWORD', 'FECHAULTIMOLOGIN', 'INDICADORBLOQUEADO'] }],
  },
  {
    id: 'exactus', label: 'Exactus', group: 'Aplicaciones', appsKey: 'exactus',
    slots: [{ fileName: 'usuarios_exactus', columns: ['USUARIO', 'ACTIVO', 'CREATEDBY', 'NOMBRE', 'CREATEDATE', 'UPDATEDBY'] }],
  },
  {
    id: 'monokera', label: 'Monokera', group: 'Aplicaciones', appsKey: 'monokera',
    slots: [{ fileName: 'usuarios_monokera', columns: ['CORREO ELECTRÓNICO', 'ROLES', 'NOMBRE DEL USUARIO', 'ESTADO'] }],
  },
  {
    id: 'onbase', label: 'Onbase', group: 'Aplicaciones', appsKey: 'onbase',
    slots: [{ fileName: 'usuarios_onbase', columns: ['USUARIO', 'GRUPO ONBASE', 'NOMBRE COMPLETO', 'CORREO', 'ÚLTIMO LOGUEO'] }],
  },
  {
    id: 'pms', label: 'Pms', group: 'Aplicaciones', appsKey: 'pms',
    slots: [{ fileName: 'usuarios_pms', columns: ['LOGIN_SISTEMA', 'EMPRESA_LOGIN', 'DESCRIPCION_LOGIN', 'CODIGO_IDENTIDAD', 'PRIVILEGIO', 'PERFIL', 'ESTADO', 'LOGIN_WINDOWS', 'ACTIVO_BLOQUEADO', 'FECHA_EXPIRACION'] }],
  },
  {
    id: 'policycenter', label: 'Policy Center', group: 'Aplicaciones', appsKey: 'policycenter',
    slots: [{ fileName: 'usuarios_policycenter', columns: ['USERNAME', 'ROLENAME', 'NAME', 'LASTNAME', 'SECONDLASTNAME', 'ROLEDESCRIPTION', 'FECHA_CREACION', 'ESTADO'] }],
  },
  {
    id: 'prophet', label: 'PROPHET', group: 'Aplicaciones', appsKey: 'prophet',
    slots: [{ fileName: 'usuarios_prophet', columns: ['CORREO'] }],
  },
  {
    id: 'qualys', label: 'Qualys', group: 'Aplicaciones', appsKey: 'qualys',
    slots: [{ fileName: 'usuarios_qualys', columns: ['EMAIL', 'ROLE', 'NAME', 'STATUS', 'CREATED', 'LAST LOGIN'] }],
  },
  {
    id: 'salesforce', label: 'Salesforce', group: 'Aplicaciones', appsKey: 'salesforce',
    slots: [{ fileName: 'usuarios_salesforce', columns: ['ID DE FEDERACION', 'PERFIL', 'ACTIVO', 'ULTIMO INICIO DE SESION'] }],
  },
  {
    id: 'segcen', label: 'Segcen', group: 'Aplicaciones', appsKey: 'segcen',
    slots: [{ fileName: 'usuarios_segcen', columns: ['ID USUARIO', 'ID ROL', 'APELLIDO PATERNO', 'APELLIDO MATERNO', 'NOMBRES', 'EMAIL', 'FECHA DE CREACIÓN', 'FECHA DE MODIFICACIÓN', 'ESTADO', 'NOMBRE DE ROL'] }],
  },
  {
    id: 'siniestros-web', label: 'Siniestros Web', group: 'Aplicaciones', appsKey: 'siniestrosweb',
    slots: [{ fileName: 'usuarios_siniestros_web', columns: ['ACL ENTRY NAME', 'ACL ENTRY TYPE', 'ACL LEVEL'] }],
  },
  {
    id: 'sox-vida', label: 'Sox Vida', group: 'Aplicaciones', appsKey: 'sox-vida',
    slots: [{ fileName: 'usuarios_sox_vida', columns: ['IDUSUARIO', 'NOMBRE_APLICACION', 'CODIGO_ROL', 'APELLIDO_PATERNO', 'APELLIDO_MATERNO', 'NOMBRES', 'NOMBRE_ROL', 'BLOQUEADO', 'AUDITORIA_CREACION', 'AUDITORIA_MODIFICACION'] }],
  },
  {
    id: 'ssa', label: 'SSA', group: 'Aplicaciones', appsKey: 'ssa',
    slots: [{ fileName: 'usuarios_ssa', columns: ['CODUSRPPS', 'CODCOLABORADOR', 'NOMUSRPPS', 'MAIL', 'STSUSRPPS'] }],
  },
  {
    id: 'app_login', label: 'App Login', group: 'Aplicaciones', appsKey: 'app_login',
    slots: [{ fileName: 'app_login', columns: ['IDUSUARIO', 'NOMBRE_APLICACION', 'ULTIMOLOGEO'] }],
  },
  // ---------- Otros Reportes ----------
  {
    id: 'ad', label: 'Active Directory', group: 'Otros Reportes', appsKey: 'ad',
    slots: [
      { fileName: 'ad_pps', label: 'AD PPS', columns: AD_COLUMNS },
      { fileName: 'ad_vida', label: 'AD Vida', columns: AD_COLUMNS },
    ],
  },
  {
    id: 'gdh', label: 'GDH', group: 'Otros Reportes', appsKey: 'gdh',
    slots: [
      { fileName: 'activos_gdh', label: 'Activos GDH', columns: ['NÚMERO ID', 'NOMBRES', 'APELLIDO PATERNO', 'APELLIDO MATERNO', 'GRUPO DE PERSONAL', 'CÓDIGO FUNCIÓN', 'FUNCIÓN', 'CÓDIGO DE UN.ORG.', 'UNIDAD ORGANIZATIVA', 'FECHA', 'SOCIEDAD', 'AREA DE NOMINA', 'AREA BCP', 'DIVISIÓN BCP', 'CÓDIGO SERVICIO', 'TEXTO SERVICIO', 'CÓDIGO JEFE', 'NOMBRE DEL JEFE', 'Nº PERS.'] },
      { fileName: 'cesados_gdh', label: 'Cesados GDH', columns: ['NÚMERO ID', 'NOMBRES', 'APELLIDO PATERNO', 'APELLIDO MATERNO', 'GRUPO DE PERSONAL', 'FUNCIÓN', 'UNIDAD ORGANIZATIVA', 'FECHA', 'SOCIEDAD'] },
    ],
  },
  {
    id: 'dni-vs-usuarios', label: 'DNI vs Usuarios', group: 'Otros Reportes', appsKey: 'dnivsuser',
    slots: [{ fileName: 'dni_vs_usuarios', columns: ['USERNAME', 'TIPO', 'USUARIO', 'DNI', 'COMENTARIO'] }],
  },
  {
    id: 'entra-id', label: 'Entra ID', group: 'Otros Reportes', appsKey: 'entraid',
    slots: [{ fileName: 'entra_id', columns: ['ID', 'SIGNINACTIVITY', 'USERPRINCIPALNAME', 'MAIL', 'ACCOUNTENABLED', 'CREATEDDATETIME', 'FAXNUMBER', 'POSTALCODE', 'STREETADDRESS' ] }],
  },
  {
    id: 'tickets-ceses', label: 'Tickets Ceses', group: 'Otros Reportes', appsKey: 'tickets',
    slots: [{ fileName: 'tickets_ceses', columns: ['CREADO', 'NUMERO ID', 'INGRESA EL DNI DE LA PERSONA A CESAR', 'ELEMENTO', 'NÚMERO', 'CERRADO'] }],
  },
];
