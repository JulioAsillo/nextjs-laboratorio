'use client';

import { useCallback, useMemo, useState } from 'react';
import { useSWRConfig } from 'swr';
import { Loader2, DownloadCloud, CheckCircle2 } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { FuenteCard, type LoadStatus } from '@/components/cargar/FuenteCard';
import { FuentesCargadasPanel } from '@/components/cargar/FuentesCargadasPanel';
import { DatosModal } from '@/components/cargar/DatosModal';
import { Button } from '@/components/ui/Button';
import { fuentes } from '@/config/fuentes';
import { fetchDatosApp, type DatosResult } from '@/lib/datos';

const GROUPS = ['Aplicaciones', 'Otros Reportes'] as const;

interface ModalState {
  appsKey: string;
  title:   string;
}

export default function CargarInformacionPage() {
  const { mutate } = useSWRConfig();

  const [loaded,     setLoaded]     = useState<Record<string, number>>({});
  const [status,     setStatus]     = useState<Record<string, LoadStatus>>({});
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [bulk,       setBulk]       = useState({ active: false, done: 0, total: 0 });
  const [modal,      setModal]      = useState<ModalState | null>(null);

  const appsKeys = useMemo(
    () => fuentes.map((f) => f.appsKey).filter((k): k is string => !!k),
    [],
  );

  const labelByKey = useMemo(() => {
    const m = new Map<string, string>();
    for (const f of fuentes) if (f.appsKey) m.set(f.appsKey, f.label);
    return m;
  }, []);

  const loadOne = useCallback(async (appsKey: string) => {
    setLoadingKey(appsKey);
    setStatus((prev) => ({ ...prev, [appsKey]: 'loading' }));
    try {
      const res = (await mutate(['datos', appsKey], fetchDatosApp(appsKey), {
        revalidate: false,
      })) as DatosResult | undefined;
      const count = res?.rows.length ?? 0;
      if (count > 0) {
        setLoaded((prev) => ({ ...prev, [appsKey]: count }));
        setStatus((prev) => ({ ...prev, [appsKey]: 'ok' }));
      } else {
        // Respondió pero sin filas -> se marca vacío (rojo) y no entra al panel.
        setLoaded((prev) => { const n = { ...prev }; delete n[appsKey]; return n; });
        setStatus((prev) => ({ ...prev, [appsKey]: 'empty' }));
      }
    } catch {
      setLoaded((prev) => { const n = { ...prev }; delete n[appsKey]; return n; });
      setStatus((prev) => ({ ...prev, [appsKey]: 'error' }));
    } finally {
      setLoadingKey(null);
    }
  }, [mutate]);

  async function handleLoadAll() {
    if (bulk.active) return;
    setBulk({ active: true, done: 0, total: appsKeys.length });
    for (let i = 0; i < appsKeys.length; i++) {
      await loadOne(appsKeys[i]);
      setBulk((b) => ({ ...b, done: i + 1 }));
    }
    setBulk((b) => ({ ...b, active: false }));
  }

  // Cargadas OK (en orden de carga) y errores/vacíos, para el panel derecho.
  const cargadas = useMemo(
    () =>
      Object.entries(status)
        .filter(([, s]) => s === 'ok')
        .map(([appsKey]) => ({
          appsKey,
          label: labelByKey.get(appsKey) ?? appsKey,
          count: loaded[appsKey] ?? 0,
        })),
    [status, loaded, labelByKey],
  );

  const errores = useMemo(
    () =>
      Object.entries(status)
        .filter(([, s]) => s === 'error' || s === 'empty')
        .map(([appsKey, s]) => ({
          appsKey,
          label: labelByKey.get(appsKey) ?? appsKey,
          empty: s === 'empty',
        })),
    [status, labelByKey],
  );

  const allDone = appsKeys.length > 0 && cargadas.length === appsKeys.length;

  return (
    <AppShell
      title="Cargar Información"
      breadcrumb={['Certificación de Usuarios', 'Cargar Información']}
      actions={
        <>
          <span
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-body-md ${
              allDone ? 'bg-secondary/10 text-secondary' : 'bg-surface-container text-on-surface-variant'
            }`}
          >
            {allDone && <CheckCircle2 size={14} />}
            {bulk.active
              ? `Cargando ${bulk.done} / ${bulk.total}…`
              : `${cargadas.length} / ${appsKeys.length} fuentes cargadas`}
          </span>

          <Button
            icon={bulk.active
              ? <Loader2 size={16} className="animate-spin" />
              : <DownloadCloud size={16} />}
            onClick={handleLoadAll}
            disabled={bulk.active}
          >
            Cargar Todos
          </Button>
        </>
      }
    >
      <div className="flex gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-8">
          {GROUPS.map((group) => {
            const items = fuentes.filter((f) => f.group === group);
            return (
              <section key={group}>
                <h2 className="mb-3 text-label-caps uppercase tracking-wider text-on-surface-variant">
                  {group} · {items.length}
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((f) => (
                    <FuenteCard
                      key={f.id}
                      fuente={f}
                      loadedCount={f.appsKey ? loaded[f.appsKey] : undefined}
                      loadingData={f.appsKey ? loadingKey === f.appsKey : false}
                      status={f.appsKey ? status[f.appsKey] : undefined}
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

        <FuentesCargadasPanel
          cargadas={cargadas}
          errores={errores}
          total={appsKeys.length}
          onView={(appsKey, label) => setModal({ appsKey, title: label })}
        />
      </div>

      {modal && (
        <DatosModal appsKey={modal.appsKey} title={modal.title} onClose={() => setModal(null)} />
      )}
    </AppShell>
  );
}