'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { Download, Loader2, Search, Play, CalendarClock, DatabaseZap } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/features/usuarios/hallazgos/components/DataTable';
import { useTextFilter } from '@/lib/text-filter';
import { useHallazgoCache } from '@/lib/use-hallazgo-cache';
import type { HallazgoAplicacion } from '@/types/hallazgo';
import { fetchHallazgosPerfiles } from './api';
import { PERFILES_SWR_KEYS } from './keys';
import { perfilesColumns, PERFILES_ESCENARIO_FLAGS } from './perfiles-columns';
import { computePerfilesSummary } from './summary';
import { exportPerfilesToExcel } from './export-excel';
import { PerfilesSummaryCards } from './components/PerfilesSummaryCards';

const nf = new Intl.NumberFormat('es-PE');
const dtf = new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const ENDPOINT_HINT = '/hallazgos/perfiles';
const FLAGS = [...PERFILES_ESCENARIO_FLAGS];

const SWR_MANUAL = {
  revalidateOnMount: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  revalidateIfStale: false,
} as const;

function FechaCorteField({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="inline-flex items-center gap-2 rounded border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-body-md text-on-surface-variant focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30">
      <CalendarClock size={16} className="text-primary" />
      <span className="text-label-caps uppercase">Fecha de corte</span>
      <input
        type="date"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-body-md text-on-surface outline-none disabled:opacity-50"
      />
    </label>
  );
}

export function HallazgosPerfilesView() {
  const { mutate: globalMutate } = useSWRConfig();
  const { data, error, isValidating } = useSWR<HallazgoAplicacion[]>(
    PERFILES_SWR_KEYS.hallazgoPerfiles,
    null, // fetch SOLO manual
    SWR_MANUAL,
  );

  const loaded = data !== undefined;
  const [fechaCorte, setFechaCorte] = useState('');
  const [exporting, setExporting] = useState(false);
  const [generating, setGenerating] = useState(false);

  const rows = useMemo(() => data ?? [], [data]);
  const keys = useMemo(() => perfilesColumns.map((c) => c.key), []);
  const { query, setQuery, deferredQuery, filtered, isFiltering } = useTextFilter(rows, keys);
  const stats = useMemo(() => computePerfilesSummary(filtered, FLAGS), [filtered]);

  // Persistencia en IndexedDB (sobrevive al F5).
  const cache = useHallazgoCache<HallazgoAplicacion[]>('hallazgos:perfiles');
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    if (data !== undefined) return;
    (async () => {
      const envelope = await cache.hydrate();
      if (!envelope) return;
      await globalMutate(PERFILES_SWR_KEYS.hallazgoPerfiles, envelope.data, { revalidate: false });
      cache.setMeta({ savedAt: envelope.savedAt, fechaRef: envelope.fechaRef });
      if (envelope.fechaRef) setFechaCorte(envelope.fechaRef);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generar() {
    if (generating) return;
    setGenerating(true);
    try {
      const fresh = (await globalMutate(
        PERFILES_SWR_KEYS.hallazgoPerfiles,
        fetchHallazgosPerfiles(fechaCorte || undefined),
        { revalidate: false },
      )) as HallazgoAplicacion[] | undefined;
      if (fresh) await cache.remember(fresh, fechaCorte || undefined);
    } finally {
      setGenerating(false);
    }
  }

  async function handleExport() {
    if (!loaded || exporting) return;
    setExporting(true);
    try {
      await exportPerfilesToExcel(rows);
    } finally {
      setExporting(false);
    }
  }

  const busy = generating || isValidating;

  return (
    <AppShell
      title="Hallazgo de Perfiles"
      breadcrumb={['Certificación de Perfiles', 'Hallazgo de Perfiles']}
      actions={
        loaded ? (
          <>
            <FechaCorteField value={fechaCorte} onChange={setFechaCorte} disabled={busy} />
            <Button
              variant="ghost"
              icon={busy ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              onClick={generar}
              disabled={busy}
            >
              Generar
            </Button>
            <Button
              icon={exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              onClick={handleExport}
              disabled={exporting || rows.length === 0}
            >
              Exportar Excel
            </Button>
          </>
        ) : undefined
      }
    >
      {!loaded && !busy && !error && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-outline-variant bg-surface-container-lowest p-12 text-center shadow-ambient">
          <p className="text-body-lg text-on-surface">Aún no has generado el hallazgo.</p>
          <p className="max-w-md text-body-md text-on-surface-variant">
            Elige la fecha de corte y genera. La consulta solo se ejecuta cuando lo pides.
          </p>
          <FechaCorteField value={fechaCorte} onChange={setFechaCorte} />
          <Button icon={<Play size={16} />} onClick={generar}>
            Generar Hallazgo
          </Button>
        </div>
      )}

      {busy && !loaded && (
        <div className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest p-10 text-on-surface-variant">
          <Loader2 size={18} className="animate-spin" /> Generando hallazgo…
        </div>
      )}

      {error && !loaded && (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-error/30 bg-error/5 p-6 text-body-md text-error">
          <span>
            No se pudo obtener el hallazgo. Verifica el endpoint{' '}
            <code className="font-mono">{ENDPOINT_HINT}</code> y la variable{' '}
            <code className="font-mono">NEXT_PUBLIC_API_BASE_URL</code>.
          </span>
          <Button variant="ghost" icon={<Play size={16} />} onClick={generar}>
            Reintentar
          </Button>
        </div>
      )}

      {loaded && (
        <div className="flex flex-col gap-4">
          {cache.meta && (
            <div className="flex items-center gap-2 rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-body-md text-on-surface-variant">
              <DatabaseZap size={15} className="shrink-0 text-primary" />
              <span>
                Datos en caché del {dtf.format(cache.meta.savedAt)}
                {cache.meta.fechaRef ? ` · fecha ref ${cache.meta.fechaRef}` : ''}. Pulsa{' '}
                <strong className="font-semibold text-on-surface">Generar</strong> para refrescar.
              </span>
            </div>
          )}

          <PerfilesSummaryCards stats={stats} total={filtered.length} />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar en todas las columnas…"
                className="w-full rounded border border-outline-variant bg-surface-container-lowest py-2 pl-9 pr-3 text-body-md text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <p className="flex items-center gap-2 text-body-md text-on-surface-variant">
              {isFiltering && <Loader2 size={14} className="animate-spin" />}
              {nf.format(filtered.length)} registro{filtered.length === 1 ? '' : 's'}
              {deferredQuery.trim() && ` de ${nf.format(rows.length)}`}
            </p>
          </div>

          <DataTable rows={filtered} columns={perfilesColumns} />
        </div>
      )}
    </AppShell>
  );
}
