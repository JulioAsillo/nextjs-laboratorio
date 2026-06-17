'use client';

import { HallazgosView } from '@/features/usuarios/hallazgos/HallazgosView';
import { AdSummaryCards } from '@/features/usuarios/hallazgos/components/AdSummaryCards';
import { fetchHallazgosAd } from '@/features/usuarios/hallazgos/aplicaciones/api';
import { exportAdToExcel } from '@/features/usuarios/hallazgos/active-directory/export-excel-ad';
import { computeAdSummary } from '@/features/usuarios/hallazgos/active-directory/summary-ad';
import { adColumns } from '@/features/usuarios/hallazgos/active-directory/ad-columns';
import { SWR_KEYS } from '@/features/usuarios/hallazgos/keys';

export default function ActiveDirectoryPage() {
  return (
    <HallazgosView
      title="Active Directory"
      breadcrumb={['Certificación de Usuarios', 'Hallazgos', 'Active Directory']}
      swrKey={SWR_KEYS.hallazgosAd}
      fetcher={fetchHallazgosAd}
      columns={adColumns}
      endpointHint="/hallazgos/ad"
      summarize={computeAdSummary}
      renderSummary={(summary) => <AdSummaryCards summary={summary} />}
      onExport={exportAdToExcel}
      withFechaRef
    />
  );
}