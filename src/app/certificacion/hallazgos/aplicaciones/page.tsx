'use client';

import { HallazgosView } from '@/features/hallazgos/HallazgosView';
import { SummaryCards } from '@/features/hallazgos/components/SummaryCards';
import { fetchHallazgos } from '@/features/hallazgos/api';
import { exportToExcel } from '@/features/hallazgos/export-excel';
import { computeSummary } from '@/features/hallazgos/summary';
import { columns } from '@/features/hallazgos/columns';
import { SWR_KEYS } from '@/features/hallazgos/keys';

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
