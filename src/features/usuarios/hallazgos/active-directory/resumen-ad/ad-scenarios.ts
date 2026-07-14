import type { ScenarioDef } from '@/lib/resumen/scenario-engine';
import { adColumns } from '../ad-columns';

/* ------------------------------------------------------------------ *
 *  CONFIG ÚNICA del Resumen de Active Directory.
 *
 *  Esto es a los resúmenes lo que `fuentes.ts` es a "Cargar Información":
 *  el único lugar que tocas. Por cada escenario declaras:
 *
 *    - flagKey   : columna de escenario del reporte de AD. Su valor es 'X'
 *                  cuando la fila pertenece al escenario, y vacío si no.
 *    - matchMode : 'exactX' -> la pertenencia se decide ÚNICAMENTE por esa
 *                  columna. El backend ya resolvió toda la lógica de negocio
 *                  (tipo de usuario, estado, periodo de corte, etc.); el
 *                  resumen se limita a contar las X.
 *    - requireResponsible : `Responsable` debe estar poblado. Una fila con X
 *                  pero sin Responsable es un dato inválido: NO cuenta en el
 *                  resumen y NO aparece en la hoja de detalle.
 *    - columns   : columnas que se PINTAN en la hoja de detalle (las "amarillas").
 *
 *  CONTEO INCLUSIVO: una fila con X en varias columnas de escenario aparece
 *  y cuenta en cada uno de esos escenarios. Por eso la suma de los totales
 *  por escenario puede superar el número de filas del reporte.
 *
 *  Nota: como toda fila contada tiene Responsable poblado, en AD se cumple
 *  siempre que `gdh + accesos >= total` (y == total salvo valores combinados
 *  tipo "GDH | ACCESOS", que suman en ambas columnas).
 *
 *  Para una certificación NUEVA:
 *    1) Copia este archivo (p.ej. `bd-scenarios.ts`).
 *    2) Cambia `flagKey` y `columns` de cada escenario.
 *    3) Apúntalo desde su `export-resumen-xx.ts` (igual que hace AD).
 *  El motor en `@/lib/resumen/scenario-engine` hace todo lo demás.
 * ------------------------------------------------------------------ */

/** Todas las keys de AD, en orden de `ad-columns.ts`. */
const ALL_KEYS = adColumns.map((c) => c.key);

/** Columnas "de escenario" (no se muestran salvo la propia del Hx). */
const SCENARIO_FLAGS = [
  'Cesado Activo',
  'Login Post Cese',
  'No Identificado',
  'Sin Uso 90d',
  'Deshabilitado 180d',
  'Contraseña no Expira',
  'No Puede Cambiar Contraseña',
];

/** Devuelve ALL_KEYS pero ocultando las columnas de escenario de OTROS Hx. */
function allKeepingOnlyFlag(keep: string): string[] {
  return ALL_KEYS.filter((k) => !SCENARIO_FLAGS.includes(k) || k === keep);
}

export const adScenarios: ScenarioDef[] = [
  {
    code: 'H1_AD',
    title: 'Colaboradores Cesados con cuenta activa',
    flagKey: 'Cesado Activo',
    matchMode: 'exactX',
    requireResponsible: true,
    columns: [
      'Dominio', 'Usuario', 'Nombre', 'Email', 'DNI_AD', 'DNI_dnivsuser',
      'TIPO_dnivsuser', 'Descripción', 'Fecha Creación', 'title', 'Estado',
      'Fecha Ultimo Login AD', 'Fecha Ultimo Login Entra', 'Cesado GDH',
      'Fecha Cese', 'Ticket Cese', 'Fecha Cierre Ticket Cese', 'Escenario',
      'Responsable', 'Comentario',
    ],
  },
  {
    code: 'H2_AD',
    title: 'Usuarios con acceso posterior al cese del empleado',
    flagKey: 'Login Post Cese',
    matchMode: 'exactX',
    requireResponsible: true,
    columns: [
      'Dominio', 'Usuario', 'Nombre', 'Email', 'DNI_dnivsuser', 'TIPO_dnivsuser',
      'Descripción', 'Fecha Creación', 'title', 'StreetAddress', 'Estado',
      'Fecha Ultimo Login AD', 'Fecha Ultimo Login Entra', 'Activo GDH',
      'Fecha Alta', 'Cesado GDH', 'Fecha Cese', 'Escenario', 'Responsable',
      'Comentario',
    ],
  },
  {
    code: 'H3_AD',
    title: 'Usuarios no identificados o sin sustento',
    flagKey: 'No Identificado',
    matchMode: 'exactX',
    requireResponsible: true,
    columns: [
      'Dominio', 'Usuario', 'Nombre', 'DNI_AD', 'DNI_dnivsuser', 'TIPO_dnivsuser',
      'Descripción', 'Fecha Creación', 'Estado', 'Fecha Ultimo Login AD',
      'Fecha Ultimo Login Entra', 'Activo GDH', 'Cesado GDH', 'Escenario',
      'Responsable', 'Comentario',
    ],
  },
  {
    code: 'H4_AD',
    title: 'Identificación de usuarios sin uso más de 90 días de inactividad',
    flagKey: 'Sin Uso 90d',
    matchMode: 'exactX',
    requireResponsible: true,
    columns: [
      'Dominio', 'Usuario', 'Nombre', 'Email', 'DNI_AD', 'DNI_dnivsuser',
      'TIPO_dnivsuser', 'Fecha Creación', 'title', 'StreetAddress', 'Estado',
      'Fecha Ultimo Login AD', 'Fecha Ultimo Login Entra', 'Activo GDH',
      'Fecha Alta', 'Cesado GDH', 'Fecha Cese', 'Escenario', 'Responsable',
      'Comentario',
    ],
  },
  {
    code: 'H5_AD',
    title: 'Identificación de usuarios deshabilitados más de 6 meses (AD) que no fueron eliminados',
    flagKey: 'Deshabilitado 180d',
    matchMode: 'exactX',
    requireResponsible: true,
    columns: [
      'Dominio', 'Usuario', 'Nombre', 'Email', 'DNI_AD', 'DNI_dnivsuser',
      'TIPO_dnivsuser', 'Descripción', 'Fecha Creación', 'title', 'StreetAddress',
      'Estado', 'Fecha Ultimo Login AD', 'Fecha Ultimo Login Entra', 'Activo GDH',
      'Fecha Alta', 'Cesado GDH', 'Fecha Cese', 'Escenario', 'Responsable',
      'Comentario',
    ],
  },
  {
    code: 'H6_AD',
    title: 'Usuarios con contraseña que no expire',
    flagKey: 'Contraseña no Expira',
    matchMode: 'exactX',
    requireResponsible: true,
    // Amarillas del inicio + su propia columna de escenario + Responsable/Comentario.
    columns: [
      'Dominio', 'Usuario', 'Nombre', 'Email', 'Contraseña no Expira',
      'Responsable', 'Comentario',
    ],
  },
  {
    code: 'H7_AD',
    title: 'Usuarios que no pueden cambiar su contraseña',
    flagKey: 'No Puede Cambiar Contraseña',
    matchMode: 'exactX',
    requireResponsible: true,
    // "Déjalo como tal": todas las columnas, pero solo su propia columna de
    // escenario (oculta las otras 6).
    columns: allKeepingOnlyFlag('No Puede Cambiar Contraseña'),
  },
];
