/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  CATÁLOGO MAESTRO ÚNICO DE FUENTES  ("Cargar Información")
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Única fuente de verdad para TODAS las certificaciones (Usuarios, Base de Datos,
 * Perfiles y las que vengan). Sustituye a los antiguos:
 *    - features/usuarios/cargar/fuentes.ts
 *    - features/bd/cargar/fuentes.ts
 *    - features/perfiles/cargar/fuentes.ts
 *
 * DISEÑO
 * ------
 *  1) `COLUMNS`: los CONJUNTOS DE COLUMNAS se declaran UNA sola vez. Aquí es
 *     donde se agrega/edita una columna a validar y el cambio se propaga a todas
 *     las certificaciones que usan ese conjunto.
 *
 *  2) Cada certificación arma SU PROPIA lista de fuentes (`fuentes`,
 *     `perfilesFuentes`, `bdFuentes`) referenciando esos conjuntos. Una misma
 *     app puede aparecer en varias certificaciones con distinto
 *     `appsKey` / `fileName` / `label`, pero compartiendo las mismas columnas.
 *
 *  Para sumar una fuente a una nueva certificación: agrega su entrada a la lista
 *  de esa cert apuntando al conjunto de `COLUMNS` correspondiente. Una línea.
 *
 * VALIDACIÓN TOLERANTE A TILDES
 * -----------------------------
 *  La comparación de cabeceras (validate-fuente.ts → `normHeader`) ignora tildes,
 *  mayúsculas y espacios repetidos. Por eso el header canónico se escribe UNA vez
 *  (p. ej. "ÁREA DE NÓMINA") y el Excel es aceptado con o sin tildes.
 *
 * CONVENCIONES (idénticas al esquema anterior)
 *  - `slots[].fileName` -> POST /datos/upload?file_name={fileName}
 *  - `slots[].columns`  -> cabeceras esperadas del Excel (validación al subir)
 *  - `appsKey`          -> GET /datos/apps/{appsKey} (vista DataTable).
 *                          `undefined` = aún sin endpoint.
 */

/* ═══════════════════════════════ Tipos ═══════════════════════════════════ */

export interface UploadSlot {
  fileName: string;
  /** Etiqueta del slot. Ausente cuando la card tiene un solo slot. */
  label?: string;
  columns: string[];
  /** Permite subir varios archivos con la misma estructura (CRM, Datalake). */
  multiple?: boolean;
  /**
   * Si es true, al unificar varios archivos se agrega una última columna
   * `ORIGIN_FILE` con el nombre del archivo de origen. Solo con `multiple: true`
   * (lo usan Vida/Generales en BD).
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

/**
 * Fuente de Base de Datos. `kind` decide el backend al consultar/eliminar
 * (el UPLOAD siempre es el mismo endpoint `/datos/upload`, solo cambia `file_name`):
 *   - 'dbs'    -> Vida/Generales: GET /datos/dbs/{file_name},
 *                 DELETE /datos/dbs/delete?db_name={file_name}
 *   - 'shared' -> AD/GDH/Tickets/DNI: MISMOS endpoints que Usuarios
 *                 (GET /datos/apps/{appsKey}, DELETE /datos/apps/delete?app_name={appsKey})
 */
export interface BdFuente extends Fuente {
  kind: 'dbs' | 'shared';
}

/** Formatos de archivo aceptados al subir. */
export const FORMATOS = ['.csv', '.xls', '.xlsx'] as const;

/* ══════════════════════ Conjuntos de columnas (única verdad) ══════════════
 *
 * Editar una columna a validar = editar aquí. Se propaga a toda cert que lo use.
 * Nota: la validación ignora tildes (ver validate-fuente.ts), así que el header
 * canónico se escribe una sola vez.
 */
export const COLUMNS = {
  /* ---- Compartidas por varias certificaciones ---- */
  acselx: ['CODUSRPPS', 'CODPERFIL', 'STSUSRPPSAPLIC', 'STSUSRPPS', 'CODAPLIC', 'CODCOLABORADOR', 'NOMUSRPPS', 'NUMDOC', 'TIPOUSRPPS', 'FECHACREA', 'FECACCESO'],
  onbase: ['USUARIO', 'GRUPO ONBASE', 'NOMBRE COMPLETO', 'CORREO', 'ÚLTIMO LOGUEO'],
  soxVida: ['IDUSUARIO', 'NOMBRE_APLICACION', 'CODIGO_ROL', 'APELLIDO_PATERNO', 'APELLIDO_MATERNO', 'NOMBRES', 'NOMBRE_ROL', 'BLOQUEADO', 'AUDITORIA_CREACION', 'AUDITORIA_MODIFICACION'],
  eas: ['USER_ID', 'USER_NAME', 'GROUP_ID', 'FECHAEXPIRACION_CUENTA', 'CUENTAAUTENTICACION_WINDOWS', 'FECHAEXPIRACION_PASSWORD', 'FECHAULTIMOLOGIN', 'INDICADORBLOQUEADO'],
  /** Guidewire y afines: Billing / Claim / Contact / Policy Center (misma estructura). */
  guidewire: ['USERNAME', 'ROLENAME', 'NAME', 'LASTNAME', 'SECONDLASTNAME', 'ROLEDESCRIPTION', 'FECHA_CREACION', 'ESTADO'],
  prophet: ['CORREO'],
  pms: ['LOGIN_SISTEMA', 'EMPRESA_LOGIN', 'DESCRIPCION_LOGIN', 'CODIGO_IDENTIDAD', 'PRIVILEGIO', 'PERFIL', 'ESTADO', 'LOGIN_WINDOWS', 'ACTIVO_BLOQUEADO', 'FECHA_EXPIRACION'],
  salesforce: ['ID DE FEDERACION', 'PERFIL', 'ACTIVO', 'ULTIMO INICIO DE SESION'],
  siniestrosWeb: ['ACL ENTRY NAME', 'ACL ENTRY TYPE', 'ACL LEVEL'],
  botmaker: ['EMAIL', 'ROLE', 'ACTIVE', 'REGISTRATION_DATE', 'LAST_LOGIN_DATE'],
  /** Active Directory: idéntico para AD PPS y AD Vida. */
  ad: ['SAMACCOUNTNAME', 'EMAILADDRESS', 'LASTLOGONDATE', 'DISPLAYNAME', 'IPPHONE', 'WHENCREATED', 'WHENCHANGED', 'FACSIMILETELEPHONENUMBER', 'DESCRIPTION', 'ENABLED', 'PASSWORDNEVEREXPIRES', 'CANNOTCHANGEPASSWORD', 'PASSWORDLASTSET', 'TITLE', 'DEPARTMENT', 'COMPANY', 'STREETADDRESS'],
  gdhActivos: ['NÚMERO ID', 'NOMBRES', 'APELLIDO PATERNO', 'APELLIDO MATERNO', 'GRUPO DE PERSONAL', 'CÓDIGO FUNCIÓN', 'FUNCIÓN', 'CÓDIGO DE UN.ORG.', 'UNIDAD ORGANIZATIVA', 'FECHA', 'SOCIEDAD', 'ÁREA DE NÓMINA', 'AREA BCP', 'DIVISIÓN BCP', 'CÓDIGO SERVICIO', 'TEXTO SERVICIO', 'CÓDIGO JEFE', 'NOMBRE DEL JEFE', 'Nº PERS.'],
  gdhCesados: ['NÚMERO ID', 'NOMBRES', 'APELLIDO PATERNO', 'APELLIDO MATERNO', 'GRUPO DE PERSONAL', 'FUNCIÓN', 'UNIDAD ORGANIZATIVA', 'FECHA', 'SOCIEDAD'],
  dniVsUsuarios: ['USERNAME', 'TIPO', 'USUARIO', 'DNI', 'COMENTARIO'],
  entraId: ['ID', 'SIGNINACTIVITY', 'USERPRINCIPALNAME', 'MAIL', 'ACCOUNTENABLED', 'CREATEDDATETIME', 'FAXNUMBER', 'POSTALCODE', 'STREETADDRESS'],
  ticketsCeses: ['CREADO', 'NUMERO ID', 'INGRESA EL DNI DE LA PERSONA A CESAR', 'ELEMENTO', 'NÚMERO', 'CERRADO'],

  /* ---- Solo Usuarios ---- */
  addactis: ['USER NAME', 'USER DOMAIN'],
  cgweb: ['CODUSRPPS', 'CODAPLIC', 'CODCOLABORADOR', 'NOMUSRPPS', 'NUMDOC', 'CODPERFIL', 'STSUSRPPSAPLIC', 'STSUSRPPS', 'TIPOUSRPPS', 'FECHACREA', 'FECACCESO'],
  crm: ['ID', 'DISPLAYNAME', 'MAIL', 'USERPRINCIPALNAME'],
  datalake: ['ID', 'MAIL', 'USERPRINCIPALNAME', 'DISPLAYNAME'],
  monokera: ['CORREO ELECTRÓNICO', 'ROLES', 'NOMBRE DEL USUARIO', 'ESTADO'],
  qualys: ['EMAIL', 'ROLE', 'NAME', 'STATUS', 'CREATED', 'LAST LOGIN'],
  segcen: ['ID USUARIO', 'ID ROL', 'APELLIDO PATERNO', 'APELLIDO MATERNO', 'NOMBRES', 'EMAIL', 'FECHA DE CREACIÓN', 'FECHA DE MODIFICACIÓN', 'ESTADO', 'NOMBRE DE ROL'],
  ssa: ['CODUSRPPS', 'CODCOLABORADOR', 'NOMUSRPPS', 'MAIL', 'STSUSRPPS'],
  appLogin: ['IDUSUARIO', 'NOMBRE_APLICACION', 'ULTIMOLOGEO'],
  exactus: ['USUARIO', 'ACTIVO', 'CREATEDBY', 'NOMBRE', 'CREATEDATE', 'UPDATEDBY'],

  /* ---- Solo Perfiles ---- */
  exactusPerfiles: ['USUARIO', 'GRUPO', 'NOMBRE', 'ESTADO', 'FECHA CREACION', 'TIPO'],
  matrizRoles: ['ROL', 'PERFIL ROL DEL ACTIVO', 'NOMBRE DEL ACTIVO', 'TIPO DE ROL', 'CODIGO FUNCION', 'FUNCION', 'CODIGO UO', 'UNIDAD ORGANIZATIVA', 'TIPO DE ACTIVO', 'DESCRIPCION', 'TICKET', 'MODIFIED', 'CREATED'],

  /* ---- Solo Base de Datos ---- */
  bdVida: ['USERNAME', 'TYPE', 'TYPE_DESC', 'ISACTIVE', 'ULTIMOLOGEO', 'CREATED', 'UPDATE', 'DATABASEROLE', 'DATABASENAME', 'SERVERROLE'],
  bdGenerales: ['USERNAME', 'ACCOUNT_STATUS', 'LOCK_DATE', 'CREATED', 'PROFILE', 'ULTIMO_LOGIN'],

  /* ---- Solo Generales y Especiales ---- */
  usuarios_autorizados: ['NOMBRES Y APELLIDOS', 'EQUIPO / CHAPTER', 'EMPRESA', 'CORREO', 'JEFE / CHAPTER LEAD', 'USUARIO DE RED', 'BD EPPS UC', 'BD DBPRODN UC', 'BD OWEB UC', 'BD ODW1 UC', 'BD DBPRODN2 AE', 'BD IGWPRD AE', 'BD EPPS AE', 'BD IGWPRD AC', 'BD EPPS AC' ],
  epps_ae: ['USERID', 'USERHOST', 'TERMINAL', 'LOGOFF$TIME', 'OBJ$NAME', 'SPARE1', 'NTIMESTAMP#', 'ACTION#'],
  epps_ac: ['USERID', 'USERHOST', 'TERMINAL', 'LOGOFF$TIME', 'OBJ$NAME', 'SPARE1', 'NTIMESTAMP#', 'ACTION#'],
  igwprd_ac: ['USERID', 'USERHOST', 'TERMINAL', 'LOGOFF$TIME', 'OBJ$NAME', 'SPARE1', 'NTIMESTAMP#', 'ACTION#'],

} satisfies Record<string, string[]>;

/* Helper interno: card de un solo slot (el caso más común). */
function one(fileName: string, columns: string[], extra?: Omit<UploadSlot, 'fileName' | 'columns'>): UploadSlot[] {
  return [{ fileName, columns, ...extra }];
}

/* ═══════════════════════ Certificación de USUARIOS ═══════════════════════ */

export const fuentes: Fuente[] = [
  // ---------- Aplicaciones ----------
  { id: 'acselx', label: 'Acselx', group: 'Aplicaciones', appsKey: 'acselx', slots: one('usuarios_acselx', COLUMNS.acselx) },
  { id: 'addactis', label: 'Addactis', group: 'Aplicaciones', appsKey: 'addactis', slots: one('usuarios_addactis', COLUMNS.addactis) },
  { id: 'billing-center', label: 'Billing Center', group: 'Aplicaciones', appsKey: 'billingcenter', slots: one('usuarios_billing_center', COLUMNS.guidewire) },
  { id: 'botmaker', label: 'Botmaker', group: 'Aplicaciones', appsKey: 'botmaker', slots: one('usuarios_botmaker', COLUMNS.botmaker) },
  { id: 'cgweb', label: 'Carta de Garantía Web', group: 'Aplicaciones', appsKey: 'cgweb', slots: one('usuarios_cgweb', COLUMNS.cgweb) },
  { id: 'claim-center', label: 'Claim Center', group: 'Aplicaciones', appsKey: 'claim-center', slots: one('usuarios_claim_center', COLUMNS.guidewire) },
  { id: 'contact-manager', label: 'Contact Manager', group: 'Aplicaciones', appsKey: 'contact-manager', slots: one('usuarios_contact_manager', COLUMNS.guidewire) },
  { id: 'crm', label: 'CRM', group: 'Aplicaciones', appsKey: 'crm', slots: one('usuarios_crm', COLUMNS.crm, { multiple: true }) },
  { id: 'datalake', label: 'Datalake', group: 'Aplicaciones', appsKey: 'datalake', slots: one('usuarios_datalake', COLUMNS.datalake, { multiple: true }) },
  { id: 'eas', label: 'EAS', group: 'Aplicaciones', appsKey: 'eas', slots: one('usuarios_eas', COLUMNS.eas) },
  { id: 'exactus', label: 'Exactus', group: 'Aplicaciones', appsKey: 'exactus', slots: one('usuarios_exactus', COLUMNS.exactus) },
  { id: 'monokera', label: 'Monokera', group: 'Aplicaciones', appsKey: 'monokera', slots: one('usuarios_monokera', COLUMNS.monokera) },
  { id: 'onbase', label: 'Onbase', group: 'Aplicaciones', appsKey: 'onbase', slots: one('usuarios_onbase', COLUMNS.onbase) },
  { id: 'pms', label: 'Pms', group: 'Aplicaciones', appsKey: 'pms', slots: one('usuarios_pms', COLUMNS.pms) },
  { id: 'policycenter', label: 'Policy Center', group: 'Aplicaciones', appsKey: 'policycenter', slots: one('usuarios_policycenter', COLUMNS.guidewire) },
  { id: 'prophet', label: 'PROPHET', group: 'Aplicaciones', appsKey: 'prophet', slots: one('usuarios_prophet', COLUMNS.prophet) },
  { id: 'qualys', label: 'Qualys', group: 'Aplicaciones', appsKey: 'qualys', slots: one('usuarios_qualys', COLUMNS.qualys) },
  { id: 'salesforce', label: 'Salesforce', group: 'Aplicaciones', appsKey: 'salesforce', slots: one('usuarios_salesforce', COLUMNS.salesforce) },
  { id: 'segcen', label: 'Segcen', group: 'Aplicaciones', appsKey: 'segcen', slots: one('usuarios_segcen', COLUMNS.segcen) },
  { id: 'siniestros-web', label: 'Siniestros Web', group: 'Aplicaciones', appsKey: 'siniestrosweb', slots: one('usuarios_siniestros_web', COLUMNS.siniestrosWeb) },
  { id: 'sox-vida', label: 'Sox Vida', group: 'Aplicaciones', appsKey: 'sox-vida', slots: one('usuarios_sox_vida', COLUMNS.soxVida) },
  { id: 'ssa', label: 'SSA', group: 'Aplicaciones', appsKey: 'ssa', slots: one('usuarios_ssa', COLUMNS.ssa) },
  { id: 'app_login', label: 'App Login', group: 'Aplicaciones', appsKey: 'app_login', slots: one('app_login', COLUMNS.appLogin) },

  // ---------- Otros Reportes ----------
  {
    id: 'ad', label: 'Active Directory', group: 'Otros Reportes', appsKey: 'ad',
    slots: [
      { fileName: 'ad_pps', label: 'AD PPS', columns: COLUMNS.ad },
      { fileName: 'ad_vida', label: 'AD Vida', columns: COLUMNS.ad },
    ],
  },
  {
    id: 'gdh', label: 'GDH', group: 'Otros Reportes', appsKey: 'gdh',
    slots: [
      { fileName: 'activos_gdh', label: 'Activos GDH', columns: COLUMNS.gdhActivos },
      { fileName: 'cesados_gdh', label: 'Cesados GDH', columns: COLUMNS.gdhCesados },
    ],
  },
  { id: 'dni-vs-usuarios', label: 'DNI vs Usuarios', group: 'Otros Reportes', appsKey: 'dnivsuser', slots: one('dni_vs_usuarios', COLUMNS.dniVsUsuarios) },
  { id: 'entra-id', label: 'Entra ID', group: 'Otros Reportes', appsKey: 'entraid', slots: one('entra_id', COLUMNS.entraId) },
  { id: 'tickets-ceses', label: 'Tickets Ceses', group: 'Otros Reportes', appsKey: 'tickets', slots: one('tickets_ceses', COLUMNS.ticketsCeses) },
];

/* ═══════════════════════ Certificación de PERFILES ═══════════════════════
 *
 * Mismo mecanismo que Usuarios. Diferencias:
 *   • "Exactus Perfiles" reemplaza a "Exactus" (distinto appsKey/fileName y
 *     conjunto de columnas propio).
 *   • Se agrega "Matriz de Roles" (carga nueva, exclusiva de Perfiles).
 *   • No incluye Tickets Ceses.
 *
 * Los `id` de las fuentes compartidas coinciden con Usuarios porque apuntan al
 * MISMO archivo/almacén del backend; el estado de "cargado" de ESTA pantalla se
 * aísla por su propia caché (CACHE_KEY = 'cargar:perfiles').
 */
export const perfilesFuentes: Fuente[] = [
  // ---------- Aplicaciones ----------
  { id: 'acselx', label: 'Acselx', group: 'Aplicaciones', appsKey: 'acselx', slots: one('usuarios_acselx', COLUMNS.acselx) },
  { id: 'onbase', label: 'Onbase', group: 'Aplicaciones', appsKey: 'onbase', slots: one('usuarios_onbase', COLUMNS.onbase) },
  { id: 'sox-vida', label: 'Sox Vida', group: 'Aplicaciones', appsKey: 'sox-vida', slots: one('usuarios_sox_vida', COLUMNS.soxVida) },
  { id: 'eas', label: 'EAS', group: 'Aplicaciones', appsKey: 'eas', slots: one('usuarios_eas', COLUMNS.eas) },
  { id: 'billing-center', label: 'Billing Center', group: 'Aplicaciones', appsKey: 'billingcenter', slots: one('usuarios_billing_center', COLUMNS.guidewire) },
  { id: 'claim-center', label: 'Claim Center', group: 'Aplicaciones', appsKey: 'claim-center', slots: one('usuarios_claim_center', COLUMNS.guidewire) },
  { id: 'contact-manager', label: 'Contact Manager', group: 'Aplicaciones', appsKey: 'contact-manager', slots: one('usuarios_contact_manager', COLUMNS.guidewire) },
  { id: 'policycenter', label: 'Policy Center', group: 'Aplicaciones', appsKey: 'policycenter', slots: one('usuarios_policycenter', COLUMNS.guidewire) },
  { id: 'prophet', label: 'Prophet', group: 'Aplicaciones', appsKey: 'prophet', slots: one('usuarios_prophet', COLUMNS.prophet) },
  { id: 'pms', label: 'PMS', group: 'Aplicaciones', appsKey: 'pms', slots: one('usuarios_pms', COLUMNS.pms) },
  { id: 'salesforce', label: 'Salesforce', group: 'Aplicaciones', appsKey: 'salesforce', slots: one('usuarios_salesforce', COLUMNS.salesforce) },
  { id: 'siniestros-web', label: 'Siniestros Web', group: 'Aplicaciones', appsKey: 'siniestrosweb', slots: one('usuarios_siniestros_web', COLUMNS.siniestrosWeb) },
  { id: 'botmaker', label: 'Botmaker', group: 'Aplicaciones', appsKey: 'botmaker', slots: one('usuarios_botmaker', COLUMNS.botmaker) },
  // Reemplaza a "Exactus" de Usuarios: distinto destino/consulta y columnas propias.
  { id: 'exactus-perfiles', label: 'Exactus Perfiles', group: 'Aplicaciones', appsKey: 'exactus_pfl', slots: one('usuarios_perfiles_exactus', COLUMNS.exactusPerfiles) },

  // ---------- Otros Reportes ----------
  {
    id: 'ad', label: 'Active Directory', group: 'Otros Reportes', appsKey: 'ad',
    slots: [
      { fileName: 'ad_pps', label: 'AD PPS', columns: COLUMNS.ad },
      { fileName: 'ad_vida', label: 'AD Vida', columns: COLUMNS.ad },
    ],
  },
  {
    id: 'gdh', label: 'GDH', group: 'Otros Reportes', appsKey: 'gdh',
    slots: [
      { fileName: 'activos_gdh', label: 'Activos GDH', columns: COLUMNS.gdhActivos },
      { fileName: 'cesados_gdh', label: 'Cesados GDH', columns: COLUMNS.gdhCesados },
    ],
  },
  // Carga NUEVA, exclusiva de Perfiles.
  { id: 'matriz-roles', label: 'Matriz de Roles', group: 'Otros Reportes', appsKey: 'matriz_roles', slots: one('matriz_roles', COLUMNS.matrizRoles) },
  { id: 'dni-vs-usuarios', label: 'DNI vs Usuarios', group: 'Otros Reportes', appsKey: 'dnivsuser', slots: one('dni_vs_usuarios', COLUMNS.dniVsUsuarios) },
  { id: 'entra-id', label: 'Entra ID', group: 'Otros Reportes', appsKey: 'entraid', slots: one('entra_id', COLUMNS.entraId) },
];

/* ═════════════ Certificación de GENERALES Y ESPECIALES ═══════════════════
 *
 * Mismo mecanismo que Usuarios/Perfiles: esta lista referencia los conjuntos de
 * `COLUMNS` de arriba. El estado de "cargado" de esta pantalla se aísla por su
 * propia caché (CACHE_KEY = 'cargar:generales').
 *
 * ⚠️ TODO(Julio): confirmar la lista definitiva de fuentes. De momento se
 * incluyen solo las compartidas ("Otros Reportes"), que ya existen en el backend
 * y no requieren endpoints nuevos. Agregar una fuente propia es UNA línea:
 *   1) si sus columnas son nuevas -> agregarlas a `COLUMNS` arriba;
 *   2) agregar aquí `{ id, label, group, appsKey, slots: one(fileName, COLUMNS.x) }`.
 */
export const generalesFuentes: Fuente[] = [
  // ---------- Aplicaciones ----------
  // TODO(Julio): fuentes propias de Generales y Especiales.
  { id: 'usuarios_autorizados', label: 'Listas Usuarios Autorizados', group: 'Aplicaciones', appsKey: 'usuarios_autorizados', slots: one('usuarios_autorizados', COLUMNS.usuarios_autorizados) },
  { id: 'epps_ae', label: 'EPPS AE', group: 'Aplicaciones', appsKey: 'epps_ae', slots: one('epps_ae', COLUMNS.epps_ae) },
  { id: 'epps_ac', label: 'EPPS AC', group: 'Aplicaciones', appsKey: 'epps_ac', slots: one('epps_ac', COLUMNS.epps_ac) },
  { id: 'igwprd_ac', label: 'IGWPRD AC', group: 'Aplicaciones', appsKey: 'igwprd_ac', slots: one('igwprd_ac', COLUMNS.igwprd_ac) },
  // ---------- Otros Reportes (MISMO backend que Usuarios) ----------
  {
    id: 'ad', label: 'Active Directory', group: 'Otros Reportes', appsKey: 'ad',
    slots: [
      { fileName: 'ad_pps', label: 'AD PPS', columns: COLUMNS.ad },
      { fileName: 'ad_vida', label: 'AD Vida', columns: COLUMNS.ad },
    ],
  },
  {
    id: 'gdh', label: 'GDH', group: 'Otros Reportes', appsKey: 'gdh',
    slots: [
      { fileName: 'activos_gdh', label: 'Activos GDH', columns: COLUMNS.gdhActivos },
      { fileName: 'cesados_gdh', label: 'Cesados GDH', columns: COLUMNS.gdhCesados },
    ],
  },
  { id: 'dni-vs-usuarios', label: 'DNI vs Usuarios', group: 'Otros Reportes', appsKey: 'dnivsuser', slots: one('dni_vs_usuarios', COLUMNS.dniVsUsuarios) },
  { id: 'entra-id', label: 'Entra ID', group: 'Otros Reportes', appsKey: 'entraid', slots: one('entra_id', COLUMNS.entraId) },
];

/* ═══════════════════ Certificación de BASE DE DATOS ══════════════════════
 *
 * Vida/Generales: backend propio /datos/dbs, multi-archivo -> se unifican en 1
 * .xlsx con columna ORIGIN_FILE. AD/GDH/Tickets/DNI: MISMO backend que Usuarios
 * (kind 'shared'), por eso reutilizan literalmente los mismos conjuntos de columnas.
 */
export const BD_GROUPS = [
  { key: 'Aplicaciones', label: 'Bases de Datos' },
  { key: 'Otros Reportes', label: 'Otros Reportes' },
] as const;

export const bdFuentes: BdFuente[] = [
  // ---------- Bases de Datos (backend propio /datos/dbs) ----------
  { id: 'bd-vida', label: 'Vida', group: 'Aplicaciones', kind: 'dbs', appsKey: 'db_vida', slots: one('db_vida', COLUMNS.bdVida, { multiple: true, originFile: true }) },
  { id: 'bd-generales', label: 'Generales', group: 'Aplicaciones', kind: 'dbs', appsKey: 'db_generales', slots: one('db_generales', COLUMNS.bdGenerales, { multiple: true, originFile: true }) },

  // ---------- Otros Reportes (MISMO backend que Usuarios) ----------
  {
    id: 'ad', label: 'Active Directory', group: 'Otros Reportes', kind: 'shared', appsKey: 'ad',
    slots: [
      { fileName: 'ad_pps', label: 'AD PPS', columns: COLUMNS.ad },
      { fileName: 'ad_vida', label: 'AD Vida', columns: COLUMNS.ad },
    ],
  },
  {
    id: 'gdh', label: 'GDH', group: 'Otros Reportes', kind: 'shared', appsKey: 'gdh',
    slots: [
      { fileName: 'activos_gdh', label: 'Activos GDH', columns: COLUMNS.gdhActivos },
      { fileName: 'cesados_gdh', label: 'Cesados GDH', columns: COLUMNS.gdhCesados },
    ],
  },
  { id: 'tickets-ceses', label: 'Tickets Ceses', group: 'Otros Reportes', kind: 'shared', appsKey: 'tickets', slots: one('tickets_ceses', COLUMNS.ticketsCeses) },
  { id: 'dni-vs-usuarios', label: 'DNI vs Usuarios', group: 'Otros Reportes', kind: 'shared', appsKey: 'dnivsuser', slots: one('dni_vs_usuarios', COLUMNS.dniVsUsuarios) },
];
