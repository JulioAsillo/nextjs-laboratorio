import type { ScenarioDef } from '@/lib/resumen/scenario-engine';
import { adColumns } from '../ad-columns';

/* ------------------------------------------------------------------ *
 *  CONFIG ÚNICA del Resumen de Active Directory.
 *
 *  Esto es a los resúmenes lo que `fuentes.ts` es a "Cargar Información":
 *  el único lugar que tocas. Por cada escenario declaras:
 *
 *    - flagKey : columna booleana que marca la pertenencia base.
 *    - columns : columnas que se PINTAN en la hoja de detalle (las "amarillas").
 *    - filters : filtros extra (AND) que también afectan el CONTEO del resumen.
 *
 *  Para una certificación NUEVA:
 *    1) Copia este archivo (p.ej. `bd-scenarios.ts`).
 *    2) Cambia `columns` y `filters` de cada escenario.
 *    3) Apúntalo desde su `export-resumen-xx.ts` (igual que hace AD).
 *  El motor en `@/lib/resumen/scenario-engine` hace todo lo demás.
 * ------------------------------------------------------------------ */

/** Todas las keys de AD, en orden de `ad-columns.ts`. */
const ALL_KEYS = adColumns.map((c) => c.key);

/** Columnas booleanas "de escenario" (no se muestran salvo la propia del Hx). */
const SCENARIO_FLAGS = [
  'Cesado Activo',
  'Login Post Cese',
  'No Identificado',
  'Sin Uso 90d',
  'Deshabilitado 180d',
  'Contraseña no Expira',
  'No Puede Cambiar Contraseña',
];

/** Devuelve ALL_KEYS pero ocultando las columnas booleanas de OTROS escenarios. */
function allKeepingOnlyFlag(keep: string): string[] {
  return ALL_KEYS.filter((k) => !SCENARIO_FLAGS.includes(k) || k === keep);
}

export const adScenarios: ScenarioDef[] = [
  {
    code: 'H1_AD',
    title: 'Colaboradores Cesados con cuenta activa',
    flagKey: 'Cesado Activo',
    columns: [
      'Dominio', 'Usuario', 'Nombre', 'Email', 'DNI_AD', 'DNI_dnivsuser',
      'TIPO_dnivsuser', 'Descripción', 'Fecha Creación', 'title', 'Estado',
      'Fecha Ultimo Login AD', 'Fecha Ultimo Login Entra', 'Cesado GDH',
      'Fecha Cese', 'Ticket Cese', 'Fecha Cierre Ticket Cese', 'Escenario',
      'Responsable', 'Comentario',
    ],
    filters: [
      { field: 'TIPO_dnivsuser', op: 'equals', value: 'USUARIO' },
      // Solo "Cesado Activo" exacto (excluye "Cesado Activo + algo").
      { field: 'Escenario', op: 'equals', value: 'Cesado Activo' },
    ],
  },
  {
    code: 'H2_AD',
    title: 'Usuarios con acceso posterior al cese del empleado',
    flagKey: 'Login Post Cese',
    columns: [
      'Dominio', 'Usuario', 'Nombre', 'Email', 'DNI_dnivsuser', 'TIPO_dnivsuser',
      'Descripción', 'Fecha Creación', 'title', 'StreetAddress', 'Estado',
      'Fecha Ultimo Login AD', 'Fecha Ultimo Login Entra', 'Activo GDH',
      'Fecha Alta', 'Cesado GDH', 'Fecha Cese', 'Escenario', 'Responsable',
      'Comentario',
    ],
    filters: [
      { field: 'TIPO_dnivsuser', op: 'equals', value: 'USUARIO' },
      // Postcese: solo cesados en el mes de ejecución (mes de la fecha de corte).
      // Si la fila no tiene cese en ese mes, no entra (-> si nadie entra, no se
      // crea la hoja del escenario y queda en 0).
      { field: 'Fecha Cese', op: 'monthEquals' },
    ],
  },
  {
    code: 'H3_AD',
    title: 'Usuarios no identificados o sin sustento',
    flagKey: 'No Identificado',
    columns: [
      'Dominio', 'Usuario', 'Nombre', 'DNI_AD', 'DNI_dnivsuser', 'TIPO_dnivsuser',
      'Descripción', 'Fecha Creación', 'Estado', 'Fecha Ultimo Login AD',
      'Fecha Ultimo Login Entra', 'Activo GDH', 'Cesado GDH', 'Escenario',
      'Responsable', 'Comentario',
    ],
    filters: [
      { field: 'TIPO_dnivsuser', op: 'equals', value: 'USUARIO' },
      // "Estado solo activo". Acepta Activo/Habilitado por robustez; ajusta si tu
      // columna Estado de AD usa otro término.
      { field: 'Estado', op: 'in', values: ['Activo', 'Habilitado'] },
    ],
  },
  {
    code: 'H4_AD',
    title: 'Identificación de usuarios sin uso más de 90 días de inactividad',
    flagKey: 'Sin Uso 90d',
    columns: [
      'Dominio', 'Usuario', 'Nombre', 'Email', 'DNI_AD', 'DNI_dnivsuser',
      'TIPO_dnivsuser', 'Fecha Creación', 'title', 'StreetAddress', 'Estado',
      'Fecha Ultimo Login AD', 'Fecha Ultimo Login Entra', 'Activo GDH',
      'Fecha Alta', 'Cesado GDH', 'Fecha Cese', 'Escenario', 'Responsable',
      'Comentario',
    ],
    filters: [{ field: 'Estado', op: 'in', values: ['Activo', 'Habilitado'] }],
  },
  {
    code: 'H5_AD',
    title: 'Identificación de usuarios deshabilitados más de 6 meses (AD) que no fueron eliminados',
    flagKey: 'Deshabilitado 180d',
    columns: [
      'Dominio', 'Usuario', 'Nombre', 'Email', 'DNI_AD', 'DNI_dnivsuser',
      'TIPO_dnivsuser', 'Descripción', 'Fecha Creación', 'title', 'StreetAddress',
      'Estado', 'Fecha Ultimo Login AD', 'Fecha Ultimo Login Entra', 'Activo GDH',
      'Fecha Alta', 'Cesado GDH', 'Fecha Cese', 'Escenario', 'Responsable',
      'Comentario',
    ],
    // Sin filtros extra: solo el flag.
  },
  {
    code: 'H6_AD',
    title: 'Usuarios con contraseña que no expire',
    flagKey: 'Contraseña no Expira',
    // Amarillas del inicio + su propia columna de escenario + Responsable/Comentario.
    columns: [
      'Dominio', 'Usuario', 'Nombre', 'Email', 'Contraseña no Expira',
      'Responsable', 'Comentario',
    ],
    filters: [{ field: 'TIPO_dnivsuser', op: 'equals', value: 'USUARIO' }],
  },
  {
    code: 'H7_AD',
    title: 'Usuarios que no pueden cambiar su contraseña',
    flagKey: 'No Puede Cambiar Contraseña',
    // "Déjalo como tal": todas las columnas, pero solo su propia columna de
    // escenario (oculta las otras 6 booleanas).
    columns: allKeepingOnlyFlag('No Puede Cambiar Contraseña'),
  },
];
