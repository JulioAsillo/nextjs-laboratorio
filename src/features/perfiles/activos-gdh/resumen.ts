import type { HallazgoAplicacion } from '@/types/hallazgo';

/**
 * Cálculo del "RESUMEN" (2da hoja) del hallazgo Activos GDH.
 *
 * Dos tipos de tabla:
 *
 * 1) Reporte GDH (para Tipo Rol = Planilla y FFVV), por Sociedad:
 *      - Roles    = conteo DISTINCT de 'rol gdh' (no vacío) en el subconjunto.
 *      - Usuarios = filas con 'dni' no vacío en el subconjunto.
 *    Y "# Hallazgos inicial" = lo mismo pero solo sobre filas donde
 *    'validacion rol' NO está en blanco. "% Hallazgos inicial" = hallazgos/reporte.
 *
 * 2) Proveedores (Tipo Rol = Proveedor), por Sociedad:
 *      - Cuenta de dni    = filas con 'dni' no vacío.
 *      - No existen en AD = filas donde 'username pps' Y 'username vida' son
 *                           ambos "*No existe en AD*" (match tolerante).
 *      - % No existen     = noExistenAd / cuentaDni.
 */

export const TIPO_ROL = {
  planilla: 'Planilla',
  ffvv: 'FFVV',
  proveedor: 'Proveedor',
} as const;

/** Sociedades en el orden en que se muestran como columnas del resumen. */
export const SOCIEDADES = ['PACIFICO CIA SEG Y REASEG', 'Pacifico SA EPS'] as const;

// Claves del backend (idénticas al JSON / a columns.ts).
const K_TIPO_ROL = 'tipo rol';
const K_SOCIEDAD = 'sociedad';
const K_ROL_GDH = 'rol gdh';
const K_DNI = 'dni';
const K_VALIDACION_ROL = 'validacion rol';
const K_USER_PPS = 'username pps';
const K_USER_VIDA = 'username vida';

const norm = (v: unknown): string => String(v ?? '').trim().toLowerCase();
const hasValue = (v: unknown): boolean => String(v ?? '').trim() !== '';
/** "*No existe en AD*" y variantes; match tolerante por contenido. */
const isNoExisteAd = (v: unknown): boolean => norm(v).includes('no existe en ad');

export interface RolUsuario {
  roles: number;
  usuarios: number;
}
export interface ReporteSociedad {
  sociedad: string;
  reporte: RolUsuario; // Reporte GDH
  hallazgos: RolUsuario; // # Hallazgos inicial
}
export interface ReporteGdhTable {
  titulo: string; // 'PLANILLA' | 'FFVV'
  sociedades: ReporteSociedad[];
}
export interface ProveedorSociedad {
  sociedad: string;
  cuentaDni: number; // total: filas con DNI
  noExistenAd: number; // PPS y VIDA ambos "*No existe en AD*"
}
export interface ActivosGdhResumen {
  reporteGdh: ReporteGdhTable[]; // Planilla, FFVV
  proveedores: ProveedorSociedad[];
}

/** DISTINCT de 'rol gdh' (no vacío, sin distinguir espacios sobrantes). */
function distinctRoles(rows: HallazgoAplicacion[]): number {
  const set = new Set<string>();
  for (const r of rows) {
    const rol = String(r[K_ROL_GDH] ?? '').trim();
    if (rol) set.add(rol);
  }
  return set.size;
}

/** Filas con 'dni' no vacío. */
function countConDni(rows: HallazgoAplicacion[]): number {
  return rows.reduce((acc, r) => acc + (hasValue(r[K_DNI]) ? 1 : 0), 0);
}

function reporteGdhTable(
  rows: HallazgoAplicacion[],
  tipoRol: string,
  titulo: string,
): ReporteGdhTable {
  const delTipo = rows.filter((r) => norm(r[K_TIPO_ROL]) === norm(tipoRol));
  const sociedades: ReporteSociedad[] = SOCIEDADES.map((soc) => {
    const sub = delTipo.filter((r) => norm(r[K_SOCIEDAD]) === norm(soc));
    const conHallazgo = sub.filter((r) => hasValue(r[K_VALIDACION_ROL]));
    return {
      sociedad: soc,
      reporte: { roles: distinctRoles(sub), usuarios: countConDni(sub) },
      hallazgos: { roles: distinctRoles(conHallazgo), usuarios: countConDni(conHallazgo) },
    };
  });
  return { titulo, sociedades };
}

export function buildActivosGdhResumen(rows: HallazgoAplicacion[]): ActivosGdhResumen {
  const reporteGdh = [
    reporteGdhTable(rows, TIPO_ROL.planilla, 'PLANILLA'),
    reporteGdhTable(rows, TIPO_ROL.ffvv, 'FFVV'),
  ];

  const proveedorRows = rows.filter((r) => norm(r[K_TIPO_ROL]) === norm(TIPO_ROL.proveedor));
  const proveedores: ProveedorSociedad[] = SOCIEDADES.map((soc) => {
    const sub = proveedorRows.filter((r) => norm(r[K_SOCIEDAD]) === norm(soc));
    const noExistenAd = sub.reduce(
      (acc, r) => acc + (isNoExisteAd(r[K_USER_PPS]) && isNoExisteAd(r[K_USER_VIDA]) ? 1 : 0),
      0,
    );
    return { sociedad: soc, cuentaDni: countConDni(sub), noExistenAd };
  });

  return { reporteGdh, proveedores };
}
