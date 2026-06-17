'use client';

import { Upload, Construction } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';

export default function CargarPerfilesPage() {
  return (
    <AppShell
      title="Cargar Información — Perfiles"
      breadcrumb={['Certificación de Perfiles', 'Cargar Información']}
    >
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-outline-variant bg-surface-container-lowest p-12 text-center shadow-ambient">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Upload size={24} />
        </span>
        <p className="text-body-lg text-on-surface">Carga de fuentes en preparación</p>
        <p className="flex items-center gap-2 max-w-md text-body-md text-on-surface-variant">
          <Construction size={16} className="shrink-0 text-tertiary" />
          Pendiente definir el catálogo de fuentes de Perfiles y sus endpoints.
          La UI reutilizará los componentes de carga ya existentes (FuenteCard, DatosModal).
        </p>
      </div>
    </AppShell>
  );
}
