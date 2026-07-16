import type { LucideIcon } from 'lucide-react';
import type { ColumnDef } from '@/features/usuarios/hallazgos/aplicaciones/columns';
import type { HallazgoAplicacion } from '@/types/hallazgo';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  DESCRIPTOR DE HALLAZGO  (Certificación de Generales y Especiales)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Patrón declarativo: un hallazgo = un objeto de configuración. La navegación,
 * la ruta y la vista son GENÉRICAS y se alimentan de este descriptor; no se
 * duplica ni el árbol del sidebar, ni la página, ni el cuerpo de la vista.
 *
 * El descriptor se parte en DOS piezas a propósito:
 *
 *   1) `HallazgoMeta`    -> metadatos puros (id, label, icon). Es lo ÚNICO que
 *      importa `config/certifications.ts` para construir el sidebar. Al ser un
 *      módulo sin dependencias pesadas, NO arrastra exceljs/file-saver al bundle
 *      de todas las páginas.
 *
 *   2) `HallazgoRuntime` -> meta + columnas + fetcher + export. Solo lo importa
 *      la ruta dinámica `/certificacion-generales/hallazgos/[hallazgo]`.
 *
 * PARA AGREGAR UN HALLAZGO NUEVO (2, 3, N):
 *   a) Crear la carpeta `features/generales/hallazgos/<mi-hallazgo>/` con
 *      `columns.ts`, `api.ts`, `export-excel.ts` e `index.ts` (el runtime).
 *   b) Añadir una entrada a `HALLAZGOS_META` en `registry.ts`.
 *   c) Añadir una línea al mapa de `runtime.ts`.
 * No se toca ni el sidebar, ni la ruta, ni la vista.
 */

export interface HallazgoMeta {
  /** Segmento de URL: /certificacion-generales/hallazgos/{id} */
  id: string;
  /** Etiqueta del sidebar / breadcrumb / título de la vista. */
  label: string;
  icon: LucideIcon;
  /** Path del endpoint, solo para el mensaje de error de la vista. */
  endpointHint: string;
  /** Si es true, la vista muestra el selector de fecha de referencia. */
  withFechaRef?: boolean;
}

export interface HallazgoRuntime extends HallazgoMeta {
  columns: ColumnDef[];
  /** Debe ser una referencia estable de módulo (no inline). */
  fetcher: (fechaRef?: string) => Promise<HallazgoAplicacion[]>;
  /** Exportación a Excel. Opcional: sin ella no se muestra el botón. */
  onExport?: (rows: HallazgoAplicacion[]) => Promise<void>;
  /** Ruta de "Generar Resumen", si el hallazgo ya la tiene. */
  resumenHref?: string;
}

/** Clave SWR derivada del id (evita mantener un keys.ts en paralelo). */
export const hallazgoSwrKey = (id: string): string => `generales-hallazgo-${id}`;

/** Href de un hallazgo dentro de la certificación. */
export const hallazgoHref = (id: string): string =>
  `/certificacion-generales/hallazgos/${id}`;
