const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
const APPS_PATH = process.env.NEXT_PUBLIC_APPS_PATH ?? '/datos/apps';

export type DatosRow = Record<string, unknown>;

export interface DatosResult {
  fechaCorte: string | null;
  rows: DatosRow[];
}

/** Tipo inferido de una columna para decidir cómo renderizarla. */
export type ColType = 'text' | 'bool' | 'date';

export interface ViewColumn {
  key: string;
  label: string;
  type: ColType;
  minWidth: number;
}

/** Toma el primer array que aparezca dentro de `data` (clave variable por fuente). */
function pickFirstArray(data: unknown): DatosRow[] {
  if (Array.isArray(data)) return data as DatosRow[];
  if (data && typeof data === 'object') {
    for (const v of Object.values(data as Record<string, unknown>)) {
      if (Array.isArray(v)) return v as DatosRow[];
    }
  }
  return [];
}

/** GET /datos/apps/{appsKey} -> { fecha_corte, data: { <clave>: [...] } } */
export async function fetchDatosApp(appsKey: string): Promise<DatosResult> {
  const url = `${BASE_URL}${APPS_PATH}/${appsKey}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} al consultar ${url}`);

  const payload: unknown = await res.json();
  const obj = (payload ?? {}) as Record<string, unknown>;
  const data = 'data' in obj ? obj.data : payload;
  const fechaCorte = typeof obj.fecha_corte === 'string' ? obj.fecha_corte : null;

  return { fechaCorte, rows: pickFirstArray(data) };
}

/* ------------------------------------------------------------------ */
/* Etiquetas legibles para los campos del backend (snake/camelCase).   */
/* Lo no listado cae al humanizador automático.                        */
/* ------------------------------------------------------------------ */
const LABEL_OVERRIDES: Record<string, string> = {
  // identidad / usuario
  id: 'ID', usuario: 'Usuario', username: 'Usuario', user_id: 'User ID', id_usuario: 'ID Usuario',
  nombre: 'Nombre', nombre_completo: 'Nombre Completo', nombre_usuario: 'Nombre Usuario',
  displayName: 'Nombre (Display)', apellido_paterno: 'Apellido Paterno', apellido_materno: 'Apellido Materno',
  lastname: 'Apellido', secondlastname: 'Segundo Apellido', dni: 'DNI', dni_cesado: 'DNI Cesado',
  id_federacion: 'ID Federación',
  // contacto
  correo: 'Correo', mail: 'Correo', email: 'Email', upn: 'UPN', userdomain: 'Dominio',
  // roles / permisos
  rol: 'Rol', role: 'Rol', roles: 'Roles', perfil: 'Perfil', rolename: 'Rol', nombre_rol: 'Nombre Rol',
  cod_rol: 'Cód. Rol', id_rol: 'ID Rol', roledescription: 'Descripción Rol', privilegio: 'Privilegio',
  grupo_entra: 'Grupo Entra', grupo_id: 'Grupo ID', grupo_onbase: 'Grupo OnBase',
  // estados
  isActive: 'Activo', isActivo: 'Activo GDH', isCesado: 'Cesado', esProveedor: 'Proveedor',
  estado: 'Estado', enabled: 'Habilitado',
  // fechas
  fecha_creacion: 'Fecha Creación', fecha_modificacion: 'Fecha Modificación', fecha_cambio: 'Fecha Cambio',
  fecha_alta: 'Fecha Alta', fecha_cese: 'Fecha Cese', fecha_cierre: 'Fecha Cierre',
  fecha_expiracion: 'Fecha Expiración', fecha_expiracion_pass: 'Fecha Exp. Password',
  fecha_login: 'Fecha Login', fecha_ult_login: 'Fecha Últ. Login', ult_login: 'Último Login',
  last_login: 'Último Login', last_activity: 'Última Actividad', ultima_actividad_entra: 'Últ. Actividad Entra',
  registration_date: 'Fecha Registro', lastlogin_date: 'Fecha Últ. Login', ultimo_logueo: 'Último Logueo',
  created_at: 'Creado', createdate: 'Fecha Creación', createdby: 'Creado Por', updatedby: 'Modificado Por',
  // password
  passwordneverexpires: 'Pass No Expira', cannotchangepassword: 'No Cambia Pass', passwordlastset: 'Pass Últ. Cambio',
  // perfil laboral
  title: 'Cargo', department: 'Departamento', company: 'Empresa', streetAddress: 'Dirección',
  description: 'Descripción', origen: 'Origen', cod_funcion: 'Cód. Función', funcion: 'Función',
  cod_uni_orga: 'Cód. Unidad Org.', u_organizativa: 'Unidad Organizativa',
  // login / cuentas
  login_windows: 'Login Windows', cuenta_autenticacion: 'Cuenta Autenticación',
  empresa_login: 'Empresa Login', descripcion_login: 'Descripción Login', codigo_identidad: 'Código Identidad',
  // codigos PPS
  codcolaborador: 'Cód. Colaborador', nomusrpps: 'Nombre Usuario PPS', numdoc: 'N° Documento',
  codperfil: 'Cód. Perfil', stsusrppsaplic: 'Estado Usr Aplic', tipousrpps: 'Tipo Usr PPS',
  fechacrea: 'Fecha Creación', fecacceso: 'Fecha Acceso', codaplic: 'Cód. Aplicación', app_name: 'Aplicación',
  // siniestros web
  acl_entry_name: 'ACL Entry Name', acl_entry_type: 'ACL Entry Type', acl_level: 'ACL Level',
  // dni vs user
  tipo_usuario: 'Tipo Usuario', comentario: 'Comentario',
  // tickets
  numero_ticket: 'N° Ticket', elemento: 'Elemento',
};

function humanize(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2') // camelCase -> camel Case
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Deriva columnas a partir de las filas que devuelve el backend.
 * - Orden: el de la primera fila + campos extra que aparezcan en otras.
 * - Tipo: inferido del primer valor no vacío (boolean -> bool, fecha ISO -> date).
 * - Label: del mapa de overrides o humanizado automáticamente.
 */
export function deriveColumns(rows: DatosRow[]): ViewColumn[] {
  if (!rows.length) return [];

  const keys: string[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    for (const k of Object.keys(row)) {
      if (!seen.has(k)) {
        seen.add(k);
        keys.push(k);
      }
    }
  }

  return keys.map((key) => {
    let type: ColType = 'text';
    for (const row of rows) {
      const v = row[key];
      if (v === null || v === undefined || v === '') continue;
      if (typeof v === 'boolean') type = 'bool';
      else if (typeof v === 'string' && (ISO_DATETIME.test(v) || ISO_DATE.test(v))) type = 'date';
      break;
    }
    const label = LABEL_OVERRIDES[key] ?? humanize(key);
    const minWidth = type === 'bool' ? 96 : type === 'date' ? 150 : Math.min(280, Math.max(120, label.length * 9 + 24));
    return { key, label, type, minWidth };
  });
}

/** Formatea el valor de una celda de texto/fecha (los bool se renderizan como chip aparte). */
export function formatCell(value: unknown, type: ColType): string {
  if (value === null || value === undefined || value === '') return '';
  if (type === 'date' && typeof value === 'string') {
    const dt = value.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
    if (dt) return `${dt[3]}/${dt[2]}/${dt[1]} ${dt[4]}:${dt[5]}`;
    const d = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (d) return `${d[3]}/${d[2]}/${d[1]}`;
    return value;
  }
  return String(value);
}
