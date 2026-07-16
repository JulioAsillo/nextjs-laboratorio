'use client';

import { HallazgosView } from '@/features/usuarios/hallazgos/HallazgosView';
import { fetchHallazgosGeneralesEspeciales } from '@/features/generales/hallazgos/generales-especiales/api';
import { exportGeneralesEspecialesToExcel } from '@/features/generales/hallazgos/generales-especiales/export-excel';
import { generalesEspecialesColumns } from '@/features/generales/hallazgos/generales-especiales/columns';
import { GENERALES_SWR_KEYS } from '@/features/generales/hallazgos/keys';
import type { HallazgoAplicacion } from '@/types/hallazgo';

/**
 * Hallazgo "Generales y Especiales". Misma forma que
 * `app/certificacion-usuarios/hallazgos/aplicaciones/page.tsx`: la página arma el
 * `HallazgosView` compartido con las piezas de su propia carpeta de feature.
 *
 * Todavía no hay resumen (falta el contrato), así que se pasan referencias
 * ESTABLES de módulo que no producen resumen — el `useMemo` interno de
 * HallazgosView exige que no sean funciones inline. El conteo de registros lo
 * muestra la propia vista.
 *
 * TODO(Julio): cuando exista el resumen, crear
 *   features/generales/hallazgos/generales-especiales/summary.ts  -> computeSummary
 *   features/generales/hallazgos/components/GeneralesSummaryCards.tsx
 * y reemplazar `noSummary`/`renderNoSummary` aquí (igual que Aplicaciones).
 */
const noSummary = (_rows: HallazgoAplicacion[]): null => null;
const renderNoSummary = (): null => null;

export default function GeneralesEspecialesPage() {
  return (
    <HallazgosView<null>
      title="Generales y Especiales"
      breadcrumb={['Certificación de Generales y Especiales', 'Hallazgos', 'Generales y Especiales']}
      swrKey={GENERALES_SWR_KEYS.hallazgoGeneralesEspeciales}
      // SWR pasa la `key` como argumento al fetcher; se envuelve para que NUNCA
      // llegue como `fechaRef` al backend (mismo patrón que Perfiles).
      fetcher={() => fetchHallazgosGeneralesEspeciales()}
      columns={generalesEspecialesColumns}
      endpointHint="/hallazgos/generales_especiales"
      summarize={noSummary}
      renderSummary={renderNoSummary}
      onExport={exportGeneralesEspecialesToExcel}
    />
  );
}
