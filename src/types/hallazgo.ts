/**
 * Una fila de Hallazgos - Aplicaciones.
 * Como las claves del backend llevan espacios/acentos ("Tipo Aplicación", "DNI AD PPS", etc.),
 * se modela como diccionario. Las claves válidas están centralizadas en
 * features/hallazgos/columns.ts.
 */
export type HallazgoAplicacion = Record<string, string | null>;

/**
 * Shape real del backend: { data: { reporte_apps: HallazgoAplicacion[] } }.
 * Se aceptan variantes por robustez.
 */
export type HallazgosResponse =
  | HallazgoAplicacion[]
  | { reporte_apps: HallazgoAplicacion[] }
  | { data: HallazgoAplicacion[] }
  | { data: { reporte_apps: HallazgoAplicacion[] } };
