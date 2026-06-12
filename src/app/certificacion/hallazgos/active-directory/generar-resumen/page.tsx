'use client';

import { useState } from 'react';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { fetchHallazgosAd } from '@/features/hallazgos/api';
import { exportResumenAdExcel } from '@/features/hallazgos/export-resumen-ad';

export default function GenerarResumenActiveDirectoryPage() {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const rows = await fetchHallazgosAd();
      await exportResumenAdExcel(rows);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell
      title="Generar Resumen"
      breadcrumb={['Certificación de Usuarios', 'Hallazgos', 'Active Directory', 'Generar Resumen']}
    >
      <div className="flex flex-col gap-4 rounded-lg border border-outline-variant bg-surface-container-lowest p-6 shadow-ambient">
        <h2 className="text-body-lg font-semibold text-on-surface">Resumen Excel de Active Directory</h2>
        <p className="max-w-2xl text-body-md text-on-surface-variant">
          Genera una hoja principal de escenarios y hojas detalle por escenario (H1_AD a H7_AD).
        </p>

        <div>
          <Button
            icon={loading ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
            onClick={handleExport}
            disabled={loading}
          >
            {loading ? 'Generando resumen...' : 'Generar Resumen Excel'}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}