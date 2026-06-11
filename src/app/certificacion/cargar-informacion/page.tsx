'use client';

import { useCallback, useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { FuenteCard } from '@/components/cargar/FuenteCard';
import { fuentes } from '@/config/fuentes';

const GROUPS = ['Aplicaciones', 'Otros Reportes'] as const;

export default function CargarInformacionPage() {
  const [ready, setReady] = useState<Record<string, boolean>>({});

  const onReadyChange = useCallback((id: string, isReady: boolean) => {
    setReady((prev) => (prev[id] === isReady ? prev : { ...prev, [id]: isReady }));
  }, []);

  const readyCount = useMemo(() => Object.values(ready).filter(Boolean).length, [ready]);

  return (
    <AppShell
      title="Cargar Información"
      breadcrumb={['Certificación de Usuarios', 'Cargar Información']}
      actions={
        <span className="rounded-md bg-surface-container px-3 py-1.5 text-body-md text-on-surface-variant">
          {readyCount} / {fuentes.length} fuentes listas
        </span>
      }
    >
      <div className="flex flex-col gap-8">
        {GROUPS.map((group) => {
          const items = fuentes.filter((f) => f.group === group);
          return (
            <section key={group}>
              <h2 className="mb-3 text-label-caps uppercase tracking-wider text-on-surface-variant">
                {group} · {items.length}
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((f) => (
                  <FuenteCard key={f.id} fuente={f} onReadyChange={onReadyChange} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}
