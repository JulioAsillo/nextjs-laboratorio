'use client';

import { useCallback, useMemo, useState } from 'react';
import { useSWRConfig } from 'swr';
import { Loader2, DownloadCloud } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { FuenteCard } from '@/components/cargar/FuenteCard';
import { DatosModal } from '@/components/cargar/DatosModal';
import { Button } from '@/components/ui/Button';
import { fuentes } from '@/config/fuentes';
import { fetchDatosApp, type DatosResult } from '@/lib/datos';

const GROUPS = ['Aplicaciones', 'Otros Reportes'] as const;

interface ModalState {
  appsKey: string;
  title: string;
}

export default function CargarInformacionPage() {
  const { mutate } = useSWRConfig();

  // Conteo de filas por appsKey ya cargado en memoria (caché SWR).
  const [loaded, setLoaded] = useState<Record<string, number>>({});
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [bulk, setBulk] = useState({ active: false, done: 0, total: 0 });
  const [modal, setModal] = useState<ModalState | null>(null);

  // appsKeys disponibles (las fuentes sin appsKey, como Entra ID, se omiten).
  const appsKeys = useMemo(
    () => fuentes.map((f) => f.appsKey).filter((k): k is string => !!k),
    [],
  );

  const loadOne = useCallback(
    async (appsKey: string) => {
      setLoadingKey(appsKey);
      try {
        const res = (await mutate(['datos', appsKey], fetchDatosApp(appsKey), {
          revalidate: false,
        })) as DatosResult | undefined;
        setLoaded((prev) => ({ ...prev, [appsKey]: res?.rows.length ?? 0 }));
      } catch {
        setLoaded((prev) => ({ ...prev, [appsKey]: prev[appsKey] ?? 0 }));
      } finally {
        setLoadingKey(null);
      }
    },
    [mutate],
  );

  // Carga secuencial de todas las fuentes (una por una).
  async function handleLoadAll() {
    if (bulk.active) return;
    setBulk({ active: true, done: 0, total: appsKeys.length });
    for (let i = 0; i < appsKeys.length; i++) {
      await loadOne(appsKeys[i]);
      setBulk((b) => ({ ...b, done: i + 1 }));
    }
    setBulk((b) => ({ ...b, active: false }));
  }

  const withData = appsKeys.filter((k) => (loaded[k] ?? 0) > 0).length;

  return (
    <AppShell
      title="Cargar Información"
      breadcrumb={['Certificación de Usuarios', 'Cargar Información']}
      actions={
        <>
          <span className="rounded-md bg-surface-container px-3 py-1.5 text-body-md text-on-surface-variant">
            {bulk.active
              ? `Cargando ${bulk.done}/${bulk.total}…`
              : `${withData}/${appsKeys.length} fuentes con datos`}
          </span>
          <Button
            icon={bulk.active ? <Loader2 size={16} className="animate-spin" /> : <DownloadCloud size={16} />}
            onClick={handleLoadAll}
            disabled={bulk.active}
          >
            Cargar Todos
          </Button>
        </>
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
                  <FuenteCard
                    key={f.id}
                    fuente={f}
                    loadedCount={f.appsKey ? loaded[f.appsKey] : undefined}
                    loadingData={f.appsKey ? loadingKey === f.appsKey : false}
                    onLoadOne={f.appsKey ? () => loadOne(f.appsKey!) : undefined}
                    onView={
                      f.appsKey && (loaded[f.appsKey] ?? 0) > 0
                        ? () => setModal({ appsKey: f.appsKey!, title: f.label })
                        : undefined
                    }
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {modal && (
        <DatosModal appsKey={modal.appsKey} title={modal.title} onClose={() => setModal(null)} />
      )}
    </AppShell>
  );
}
