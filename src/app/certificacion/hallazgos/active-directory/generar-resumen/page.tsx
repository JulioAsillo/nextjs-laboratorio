'use client';

import { AppShell } from '@/components/layout/AppShell';

export default function ActiveDirectoryResumenPage() {
  return (
    <AppShell
      title="Generar Resumen"
      breadcrumb={['Certificación de Usuarios', 'Hallazgos', 'Active Directory', 'Generar Resumen']}
    >
      <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-10 text-center text-body-md text-on-surface-variant shadow-ambient">
        Próximamente: resumen de hallazgos de Active Directory.
      </div>
    </AppShell>
  );
}
