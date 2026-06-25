'use client';

import { HallazgosView } from '@/features/usuarios/hallazgos/HallazgosView';
import { PerfilesSummaryCards } from './components/PerfilesSummaryCards';
import { fetchHallazgosPerfiles } from './api';
import { exportPerfilesToExcel } from './export-excel';
import { computePerfilesSummary, type PerfilesSummary } from './summary';
import { perfilesColumns } from './perfiles-columns';
import { PERFILES_SWR_KEYS } from './keys';

/**
 * Hallazgo de Perfiles. Reutiliza el cuerpo compartido `HallazgosView` (mismo
 * que Aplicaciones / Active Directory): fetch manual, caché en IndexedDB,
 * búsqueda, tabla virtualizada y exportación.
 *
 * No usa fecha de referencia (el endpoint /hallazgos/profiles no la recibe),
 * por eso `withFechaRef` queda en false (valor por defecto).
 */
export function HallazgosPerfilesView() {
  return (
    <HallazgosView<PerfilesSummary>
      title="Hallazgo de Perfiles"
      breadcrumb={['Certificación de Perfiles', 'Hallazgo de Perfiles']}
      swrKey={PERFILES_SWR_KEYS.hallazgoPerfiles}
      // SWR pasa la `key` como argumento al fetcher; la envolvemos para que NUNCA
      // llegue a `fetchHallazgosPerfiles` como fechaRef. El backend recibe solo
      // GET /hallazgos/profiles (sin query). El parámetro queda listo en api.ts
      // por si el backend agrega `?fecha_ref=` más adelante.
      fetcher={() => fetchHallazgosPerfiles()}
      columns={perfilesColumns}
      endpointHint="/hallazgos/profiles"
      summarize={computePerfilesSummary}
      renderSummary={(summary) => <PerfilesSummaryCards summary={summary} />}
      onExport={exportPerfilesToExcel}
    />
  );
}
