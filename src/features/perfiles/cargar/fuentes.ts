import type { Fuente } from '@/features/usuarios/cargar/fuentes';

/**
 * Catálogo de fuentes de "Cargar Información" — Certificación de Perfiles.
 *
 * Es el MISMO mecanismo que Usuarios (mismo endpoint de subida y de consulta,
 * mismas columnas obligatorias en las fuentes compartidas). Solo cambian:
 *
 *   • Se reemplaza "Exactus" (de Usuarios) por "Exactus Perfiles".
 *       - GET   /datos/apps/exactus_pfl
 *       - POST  /datos/upload?file_name=usuarios_perfiles_exactus
 *   • Se agrega "Matriz de Roles" (carga nueva, junto a AD / DNI vs Usuarios / GDH).
 *       - GET   /datos/apps/matriz_roles
 *       - POST  /datos/upload?file_name=matriz_roles
 *
 * Convenciones (idénticas a Usuarios):
 *   - `slots[].fileName` -> POST /datos/upload?file_name={fileName}
 *   - `slots[].columns`  -> cabeceras EXACTAS esperadas del Excel (validación al subir)
 *   - `appsKey`          -> GET /datos/apps/{appsKey} (vista DataTable)
 *
 * Nota: los `id` de las fuentes compartidas son los mismos que en Usuarios porque
 * apuntan al MISMO archivo/almacén del backend (su estado de subida es el mismo).
 * El estado de "cargado" de ESTA pantalla se aísla por su propia caché
 * (CACHE_KEY = 'cargar:perfiles' en CargarPerfilesView).
 */

// Cabeceras de los reportes de Active Directory (idénticas para PPS y Vida).
const AD_COLUMNS = ['SAMACCOUNTNAME', 'EMAILADDRESS', 'LASTLOGONDATE', 'DISPLAYNAME', 'IPPHONE', 'WHENCREATED', 'WHENCHANGED', 'FACSIMILETELEPHONENUMBER', 'DESCRIPTION', 'ENABLED', 'PASSWORDNEVEREXPIRES', 'CANNOTCHANGEPASSWORD', 'PASSWORDLASTSET', 'TITLE', 'DEPARTMENT', 'COMPANY', 'STREETADDRESS'];

export const fuentes: Fuente[] = [
  // ---------- Aplicaciones ----------
  {
    id: 'acselx', label: 'Acselx', group: 'Aplicaciones', appsKey: 'acselx',
    slots: [{ fileName: 'usuarios_acselx', columns: ['CODUSRPPS', 'CODPERFIL', 'STSUSRPPSAPLIC', 'STSUSRPPS', 'CODAPLIC', 'CODCOLABORADOR', 'NOMUSRPPS', 'NUMDOC', 'TIPOUSRPPS', 'FECHACREA', 'FECACCESO'] }],
  },
  {
    id: 'onbase', label: 'Onbase', group: 'Aplicaciones', appsKey: 'onbase',
    slots: [{ fileName: 'usuarios_onbase', columns: ['USUARIO', 'GRUPO ONBASE', 'NOMBRE COMPLETO', 'CORREO', 'ÚLTIMO LOGUEO'] }],
  },
  {
    id: 'sox-vida', label: 'Sox Vida', group: 'Aplicaciones', appsKey: 'sox-vida',
    slots: [{ fileName: 'usuarios_sox_vida', columns: ['IDUSUARIO', 'NOMBRE_APLICACION', 'CODIGO_ROL', 'APELLIDO_PATERNO', 'APELLIDO_MATERNO', 'NOMBRES', 'NOMBRE_ROL', 'BLOQUEADO', 'AUDITORIA_CREACION', 'AUDITORIA_MODIFICACION'] }],
  },
  {
    id: 'eas', label: 'EAS', group: 'Aplicaciones', appsKey: 'eas',
    slots: [{ fileName: 'usuarios_eas', columns: ['USER_ID', 'USER_NAME', 'GROUP_ID', 'FECHAEXPIRACION_CUENTA', 'CUENTAAUTENTICACION_WINDOWS', 'FECHAEXPIRACION_PASSWORD', 'FECHAULTIMOLOGIN', 'INDICADORBLOQUEADO'] }],
  },
  {
    id: 'billing-center', label: 'Billing Center', group: 'Aplicaciones', appsKey: 'billingcenter',
    slots: [{ fileName: 'usuarios_billing_center', columns: ['USERNAME', 'ROLENAME', 'NAME', 'LASTNAME', 'SECONDLASTNAME', 'ROLEDESCRIPTION', 'FECHA_CREACION', 'ESTADO'] }],
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
    id: 'policycenter', label: 'Policy Center', group: 'Aplicaciones', appsKey: 'policycenter',
    slots: [{ fileName: 'usuarios_policycenter', columns: ['USERNAME', 'ROLENAME', 'NAME', 'LASTNAME', 'SECONDLASTNAME', 'ROLEDESCRIPTION', 'FECHA_CREACION', 'ESTADO'] }],
  },
  {
    id: 'prophet', label: 'Prophet', group: 'Aplicaciones', appsKey: 'prophet',
    slots: [{ fileName: 'usuarios_prophet', columns: ['CORREO'] }],
  },
  {
    id: 'pms', label: 'PMS', group: 'Aplicaciones', appsKey: 'pms',
    slots: [{ fileName: 'usuarios_pms', columns: ['LOGIN_SISTEMA', 'EMPRESA_LOGIN', 'DESCRIPCION_LOGIN', 'CODIGO_IDENTIDAD', 'PRIVILEGIO', 'PERFIL', 'ESTADO', 'LOGIN_WINDOWS', 'ACTIVO_BLOQUEADO', 'FECHA_EXPIRACION'] }],
  },
  {
    id: 'salesforce', label: 'Salesforce', group: 'Aplicaciones', appsKey: 'salesforce',
    slots: [{ fileName: 'usuarios_salesforce', columns: ['ID DE FEDERACION', 'PERFIL', 'ACTIVO', 'ULTIMO INICIO DE SESION'] }],
  },
  {
    id: 'siniestros-web', label: 'Siniestros Web', group: 'Aplicaciones', appsKey: 'siniestrosweb',
    slots: [{ fileName: 'usuarios_siniestros_web', columns: ['ACL ENTRY NAME', 'ACL ENTRY TYPE', 'ACL LEVEL'] }],
  },
  {
    id: 'botmaker', label: 'Botmaker', group: 'Aplicaciones', appsKey: 'botmaker',
    slots: [{ fileName: 'usuarios_botmaker', columns: ['EMAIL', 'ROLE', 'ACTIVE', 'REGISTRATION_DATE', 'LAST_LOGIN_DATE'] }],
  },
  {
    // Reemplaza a "Exactus" de Usuarios: mismas columnas, distinto destino/consulta.
    id: 'exactus-perfiles', label: 'Exactus Perfiles', group: 'Aplicaciones', appsKey: 'exactus_pfl',
    slots: [{ fileName: 'usuarios_perfiles_exactus', columns: ['USUARIO', 'GRUPO', 'NOMBRE', 'ESTADO', 'FECHA CREACION', 'TIPO'] }],
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
    // Carga NUEVA, exclusiva de Perfiles.
    id: 'matriz-roles', label: 'Matriz de Roles', group: 'Otros Reportes', appsKey: 'matriz_roles',
    slots: [{ fileName: 'matriz_roles', columns: ['ROL', 'PERFIL ROL DEL ACTIVO', 'NOMBRE DEL ACTIVO', 'TIPO DE ROL', 'CODIGO FUNCION', 'FUNCION', 'CODIGO UO', 'UNIDAD ORGANIZATIVA', 'TIPO DE ACTIVO', 'DESCRIPCION', 'TICKET', 'MODIFIED', 'CREATED'] }],
  },
  {
    id: 'dni-vs-usuarios', label: 'DNI vs Usuarios', group: 'Otros Reportes', appsKey: 'dnivsuser',
    slots: [{ fileName: 'dni_vs_usuarios', columns: ['USERNAME', 'TIPO', 'USUARIO', 'DNI', 'COMENTARIO'] }],
  },
  {
    id: 'gdh', label: 'GDH', group: 'Otros Reportes', appsKey: 'gdh',
    slots: [
      { fileName: 'activos_gdh', label: 'Activos GDH', columns: ['NÚMERO ID', 'NOMBRES', 'APELLIDO PATERNO', 'APELLIDO MATERNO', 'GRUPO DE PERSONAL', 'CÓDIGO FUNCIÓN', 'FUNCIÓN', 'CÓDIGO DE UN.ORG.', 'UNIDAD ORGANIZATIVA', 'FECHA'] },
      { fileName: 'cesados_gdh', label: 'Cesados GDH', columns: ['NÚMERO ID', 'NOMBRES', 'APELLIDO PATERNO', 'APELLIDO MATERNO', 'GRUPO DE PERSONAL', 'FUNCIÓN', 'UNIDAD ORGANIZATIVA', 'FECHA'] },
    ],
  },
];
