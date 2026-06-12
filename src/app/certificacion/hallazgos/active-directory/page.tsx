'use client';

import { HallazgosView } from '@/features/hallazgos/HallazgosView';
import { AdSummaryCards } from '@/features/hallazgos/components/AdSummaryCards';
import { fetchHallazgosAd } from '@/features/hallazgos/api';
import { exportAdToExcel } from '@/features/hallazgos/export-excel-ad';
import { computeAdSummary } from '@/features/hallazgos/summary-ad';
import { adColumns } from '@/features/hallazgos/ad-columns';
import { SWR_KEYS } from '@/features/hallazgos/keys';

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
    />
  );
}
