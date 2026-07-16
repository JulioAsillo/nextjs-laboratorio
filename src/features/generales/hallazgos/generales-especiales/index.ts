import type { HallazgoRuntime } from '../types';
import { findHallazgoMeta } from '../registry';
import { generalesEspecialesColumns } from './columns';
import { fetchHallazgosGeneralesEspeciales } from './api';
import { exportGeneralesEspecialesToExcel } from './export-excel';

const meta = findHallazgoMeta('generales-especiales')!;

/** Runtime del hallazgo: meta (del registry) + columnas + fetcher + export. */
export const generalesEspecialesRuntime: HallazgoRuntime = {
  ...meta,
  columns: generalesEspecialesColumns,
  fetcher: fetchHallazgosGeneralesEspeciales,
  onExport: exportGeneralesEspecialesToExcel,
  // resumenHref: '/certificacion-generales/hallazgos/generales-especiales/generar-resumen',
};
