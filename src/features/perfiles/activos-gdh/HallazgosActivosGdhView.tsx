'use client';

import { HallazgosView } from '@/features/usuarios/hallazgos/HallazgosView';
import type { HallazgoAplicacion } from '@/types/hallazgo';
import { fetchHallazgosActivosGdh } from './api';
import { exportActivosGdhToExcel } from './export-excel';
import { activosGdhColumns } from './columns';
import { PERFILES_SWR_KEYS } from '../keys';

/**
 * Hallazgo "Activos GDH". Reutiliza el cuerpo compartido `HallazgosView` (mismo
 * que Aplicaciones / Active Directory / Perfiles): fetch manual, caché en
 * IndexedDB, búsqueda, tabla virtualizada y exportación.
 *
 * De momento NO tiene resumen (el contrato no está definido) ni Generar Resumen.
 * `HallazgosView` exige `summarize`/`renderSummary`, así que se pasan referencias
 * estables que no producen resumen; el conteo de registros lo muestra la propia
 * vista. El endpoint no recibe fecha de referencia -> `withFechaRef` en false.
 */

// Referencia de módulo estable (no inline) para el `useMemo` de HallazgosView.
const noSummary = (_rows: HallazgoAplicacion[]): null => null;
const renderNoSummary = (): null => null;

export function HallazgosActivosGdhView() {
  return (
    <HallazgosView<null>
      title="Activos GDH"
      breadcrumb={['Certificación de Perfiles', 'Hallazgos', 'Activos GDH']}
      swrKey={PERFILES_SWR_KEYS.hallazgoActivosGdh}
      fetcher={() => fetchHallazgosActivosGdh()}
      columns={activosGdhColumns}
      endpointHint="/hallazgos/activos-gdh"
      summarize={noSummary}
      renderSummary={renderNoSummary}
      onExport={exportActivosGdhToExcel}
    />
  );
}
