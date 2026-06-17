'use client';

import { FileSpreadsheet, Construction } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';

export function GenerarResumenPerfilesView() {
  return (
    <AppShell
      title="Generar Resumen — Perfiles"
      breadcrumb={['Certificación de Perfiles', 'Hallazgo de Perfiles', 'Generar Resumen']}
    >
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-outline-variant bg-surface-container-lowest p-12 text-center shadow-ambient">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <FileSpreadsheet size={24} />
        </span>
        <p className="text-body-lg text-on-surface">Resumen en preparación</p>
        <p className="flex items-center gap-2 max-w-md text-body-md text-on-surface-variant">
          <Construction size={16} className="shrink-0 text-tertiary" />
          La plantilla de resumen (hojas por escenario) se habilita cuando el backend
          defina el contrato. La estructura ya replica la del módulo BD.
        </p>
      </div>
    </AppShell>
  );
}
