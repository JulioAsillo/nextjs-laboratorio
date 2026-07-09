import type { HallazgoAplicacion } from '@/types/hallazgo';

/**
 * Cálculo del "RESUMEN" (2da hoja) y de los subconjuntos de detalle del
 * hallazgo Activos GDH. Los conteos del resumen y las hojas de detalle usan las
 * MISMAS reglas de filtrado (una sola fuente de verdad: `findingRowsFor`).
 *
 * Reporte GDH (Planilla / FFVV), por Sociedad:
 *   - Roles    = DISTINCT de 'rol gdh' (no vacío).
 *   - Usuarios = filas con 'dni' no vacío.
 *   - Hallazgo = 'validacion rol' NO en blanco.
 *
 * Proveedores (Tipo Rol = Proveedor), por Sociedad:
 *   - Cuenta de dni    = filas con 'dni' no vacío.
 *   - Hallazgo (No existe en AD) = 'username pps' Y 'username vida' ambos
 *                                  "*No existe en AD*".
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

const esProveedor = (tipoRol: string): boolean => norm(tipoRol) === norm(TIPO_ROL.proveedor);

/**
 * Filas que son HALLAZGO en un escenario (Tipo Rol + Sociedad).
 * - Proveedor: PPS y VIDA ambos "No existe en AD".
 * - Resto (Planilla/FFVV): 'validacion rol' no en blanco.
 */
export function findingRowsFor(
  rows: HallazgoAplicacion[],
  tipoRol: string,
  sociedad: string,
): HallazgoAplicacion[] {
  const inScope = rows.filter(
    (r) => norm(r[K_TIPO_ROL]) === norm(tipoRol) && norm(r[K_SOCIEDAD]) === norm(sociedad),
  );
  return esProveedor(tipoRol)
    ? inScope.filter((r) => isNoExisteAd(r[K_USER_PPS]) && isNoExisteAd(r[K_USER_VIDA]))
    : inScope.filter((r) => hasValue(r[K_VALIDACION_ROL]));
}

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
  tipoRol: string; // 'Planilla' | 'FFVV'
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

/** DISTINCT de 'rol gdh' (no vacío). */
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
  const sociedades: ReporteSociedad[] = SOCIEDADES.map((soc) => {
    const sub = rows.filter(
      (r) => norm(r[K_TIPO_ROL]) === norm(tipoRol) && norm(r[K_SOCIEDAD]) === norm(soc),
    );
    const conHallazgo = findingRowsFor(rows, tipoRol, soc);
    return {
      sociedad: soc,
      reporte: { roles: distinctRoles(sub), usuarios: countConDni(sub) },
      hallazgos: { roles: distinctRoles(conHallazgo), usuarios: countConDni(conHallazgo) },
    };
  });
  return { tipoRol, titulo, sociedades };
}

export function buildActivosGdhResumen(rows: HallazgoAplicacion[]): ActivosGdhResumen {
  const reporteGdh = [
    reporteGdhTable(rows, TIPO_ROL.planilla, 'PLANILLA'),
    reporteGdhTable(rows, TIPO_ROL.ffvv, 'FFVV'),
  ];

  const proveedores: ProveedorSociedad[] = SOCIEDADES.map((soc) => {
    const sub = rows.filter(
      (r) => esProveedor(String(r[K_TIPO_ROL])) && norm(r[K_SOCIEDAD]) === norm(soc),
    );
    return {
      sociedad: soc,
      cuentaDni: countConDni(sub),
      noExistenAd: findingRowsFor(rows, TIPO_ROL.proveedor, soc).length,
    };
  });

  return { reporteGdh, proveedores };
}
