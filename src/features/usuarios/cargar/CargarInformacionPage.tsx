'use client';

import { useCallback, useMemo, useState } from 'react';
import { useSWRConfig } from 'swr';
import clsx from 'clsx';
import { Loader2, DownloadCloud, CheckCircle2, Trash2, X, AlertTriangle } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { FuenteCard, type LoadStatus } from './components/FuenteCard';
import { FuentesCargadasPanel } from './components/FuentesCargadasPanel';
import { DatosModal } from './components/DatosModal';
import { fuentes } from './fuentes';
import { fetchDatosApp, type DatosResult } from './datos';
import { datosKey } from './keys';
import { purgeAll } from './delete-fuente';
import { clearAllUploads as lsClearAll } from './upload-status';
import { useFocusCard } from '@/lib/use-focus-card';
import { useCargarCache } from '@/lib/use-cargar-cache';
import { idbDel } from '@/lib/idb-cache';

const CACHE_KEY = 'cargar:usuarios';

const GROUPS = ['Aplicaciones', 'Otros Reportes'] as const;

interface ModalState { appsKey: string; title: string; }
interface PurgeState {
  confirming: boolean;
  running: boolean;
  result: { text: string; ok: boolean } | null;
}

export default function CargarInformacionPage() {
  const { mutate } = useSWRConfig();
  useFocusCard();

  const [loaded,     setLoaded]     = useState<Record<string, number>>({});
  const [status,     setStatus]     = useState<Record<string, LoadStatus>>({});
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [bulk,       setBulk]       = useState({ active: false, done: 0, total: 0 });
  const [modal,      setModal]      = useState<ModalState | null>(null);
  const [resetTick,  setResetTick]  = useState(0);
  const [purge,      setPurge]      = useState<PurgeState>({ confirming: false, running: false, result: null });

  useCargarCache<LoadStatus>(CACHE_KEY, loaded, status, setLoaded, setStatus);

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
      const res = (await mutate(datosKey(appsKey), fetchDatosApp(appsKey), { revalidate: false })) as DatosResult | undefined;
      const count = res?.rows.length ?? 0;
      if (count > 0) {
        setLoaded((prev) => ({ ...prev, [appsKey]: count }));
        setStatus((prev) => ({ ...prev, [appsKey]: 'ok' }));
      } else {
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

  function clearOne(appsKey: string) {
    setLoaded((prev) => { const n = { ...prev }; delete n[appsKey]; return n; });
    setStatus((prev) => { const n = { ...prev }; delete n[appsKey]; return n; });
  }

  async function handlePurgeAll() {
    setPurge((p) => ({ ...p, running: true, result: null }));
    try {
      const res = await purgeAll();
      lsClearAll();
      await idbDel(CACHE_KEY);
      setLoaded({});
      setStatus({});
      setResetTick((t) => t + 1);
      const reporte = res.reporte ?? {};
      const total = Object.keys(reporte).length;
      const eliminados = Object.values(reporte).filter((r) => r.archivo_eliminado).length;
      const errores = Object.values(reporte).filter((r) => r.status === 'error').length;
      setPurge({
        confirming: false, running: false,
        result: { ok: true, text: `Purga completada · ${eliminados}/${total} archivos eliminados${errores ? ` · ${errores} con error` : ''}` },
      });
    } catch (e) {
      setPurge({ confirming: false, running: false, result: { ok: false, text: e instanceof Error ? e.message : 'Error en la purga total' } });
    }
  }

  const cargadas = useMemo(
    () => Object.entries(status).filter(([, s]) => s === 'ok').map(([appsKey]) => ({ appsKey, label: labelByKey.get(appsKey) ?? appsKey, count: loaded[appsKey] ?? 0 })),
    [status, loaded, labelByKey],
  );
  const errores = useMemo(
    () => Object.entries(status).filter(([, s]) => s === 'error' || s === 'empty').map(([appsKey, s]) => ({ appsKey, label: labelByKey.get(appsKey) ?? appsKey, empty: s === 'empty' })),
    [status, labelByKey],
  );

  const allDone = appsKeys.length > 0 && cargadas.length === appsKeys.length;

  return (
    <AppShell
      title="Cargar Información"
      breadcrumb={['Certificación de Usuarios', 'Cargar Información']}
      actions={
        <>
          <span className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-body-md ${allDone ? 'bg-secondary/10 text-secondary' : 'bg-surface-container text-on-surface-variant'}`}>
            {allDone && <CheckCircle2 size={14} />}
            {bulk.active ? `Cargando ${bulk.done} / ${bulk.total}…` : `${cargadas.length} / ${appsKeys.length} fuentes cargadas`}
          </span>

          {purge.confirming ? (
            <div className="flex items-center gap-2">
              <span className="text-body-md text-error">¿Eliminar todo del backend?</span>
              <Button variant="ghost" onClick={() => setPurge((p) => ({ ...p, confirming: false }))} disabled={purge.running}>Cancelar</Button>
              <button
                type="button"
                onClick={handlePurgeAll}
                disabled={purge.running}
                className="inline-flex items-center gap-2 rounded bg-error px-4 py-2 text-body-md font-semibold text-white shadow-ambient transition hover:bg-error/90 disabled:opacity-50"
              >
                {purge.running ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Sí, purgar
              </button>
            </div>
          ) : (
            <>
              <Button variant="ghost" icon={<Trash2 size={16} />} onClick={() => setPurge((p) => ({ ...p, confirming: true, result: null }))}>
                Eliminar todo
              </Button>
              <Button icon={bulk.active ? <Loader2 size={16} className="animate-spin" /> : <DownloadCloud size={16} />} onClick={handleLoadAll} disabled={bulk.active}>
                Cargar Todos
              </Button>
            </>
          )}
        </>
      }
    >
      {purge.result && (
        <div className={clsx('mb-4 flex items-center justify-between gap-2 rounded-md border px-4 py-2 text-body-md', purge.result.ok ? 'border-secondary/30 bg-secondary/5 text-secondary' : 'border-error/30 bg-error/5 text-error')}>
          <span className="flex items-center gap-2">{purge.result.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />} {purge.result.text}</span>
          <button type="button" onClick={() => setPurge((p) => ({ ...p, result: null }))} aria-label="Cerrar"><X size={16} /></button>
        </div>
      )}

      <div className="flex gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-8">
          {GROUPS.map((group) => {
            const items = fuentes.filter((f) => f.group === group);
            return (
              <section key={group}>
                <h2 className="mb-3 text-label-caps uppercase tracking-wider text-on-surface-variant">{group} · {items.length}</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((f) => (
                    <div key={f.id} id={`fuente-${f.id}`} className="scroll-mt-28 rounded-lg transition-shadow">
                    <FuenteCard
                      fuente={f}
                      loadedCount={f.appsKey ? loaded[f.appsKey] : undefined}
                      loadingData={f.appsKey ? loadingKey === f.appsKey : false}
                      status={f.appsKey ? status[f.appsKey] : undefined}
                      resetSignal={resetTick}
                      onLoadOne={f.appsKey ? () => loadOne(f.appsKey!) : undefined}
                      onDeleted={f.appsKey ? () => clearOne(f.appsKey!) : undefined}
                      onView={f.appsKey && (loaded[f.appsKey] ?? 0) > 0 ? () => setModal({ appsKey: f.appsKey!, title: f.label }) : undefined}
                    />
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <FuentesCargadasPanel cargadas={cargadas} errores={errores} total={appsKeys.length} onView={(appsKey, label) => setModal({ appsKey, title: label })} />
      </div>

      {modal && <DatosModal appsKey={modal.appsKey} title={modal.title} onClose={() => setModal(null)} />}
    </AppShell>
  );
}
