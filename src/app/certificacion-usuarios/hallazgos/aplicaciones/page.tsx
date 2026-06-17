'use client';

import { HallazgosView } from '@/features/usuarios/hallazgos/HallazgosView';
import { SummaryCards } from '@/features/usuarios/hallazgos/components/SummaryCards';
import { fetchHallazgos } from '@/features/usuarios/hallazgos/aplicaciones/api';
import { exportToExcel } from '@/features/usuarios/hallazgos/aplicaciones/export-excel';
import { computeSummary } from '@/features/usuarios/hallazgos/aplicaciones/summary';
import { columns } from '@/features/usuarios/hallazgos/aplicaciones/columns';
import { SWR_KEYS } from '@/features/usuarios/hallazgos/keys';

export default function AplicacionesPage() {
  return (
    <HallazgosView
      title="Aplicaciones"
      breadcrumb={['Certificación de Usuarios', 'Hallazgos', 'Aplicaciones']}
      swrKey={SWR_KEYS.hallazgosApps}
      fetcher={fetchHallazgos}
      columns={columns}
      endpointHint="/hallazgos/apps"
      summarize={computeSummary}
      renderSummary={(summary) => <SummaryCards summary={summary} />}
      onExport={exportToExcel}
    />
  );
}
