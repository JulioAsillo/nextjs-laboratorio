'use client';

import { useMemo, useState } from 'react';
import { useSWRConfig } from 'swr';
import useSWR from 'swr';
import { Download, Loader2, Search, Play, Database, Server, CalendarClock } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/features/hallazgos/components/DataTable';
import { useTextFilter } from '@/lib/text-filter';
import type { ColumnDef } from '@/features/hallazgos/columns';
import type { HallazgoAplicacion } from '@/types/hallazgo';
import { fetchBdHallazgoDbs, type BdHallazgoDbs } from './api';
import { BD_SWR_KEYS } from './keys';
import { bdVidaColumns, bdGeneralesColumns, ESCENARIO_FLAGS_COMUNES, ESCENARIO_FLAG_GENERALES } from './bd-columns';
import { exportBdDbsToExcel } from './export-excel';
import { computeBdSummary } from './summary';
import { BdSummaryCards } from './components/BdSummaryCards';

const nf = new Intl.NumberFormat('es-PE');
const ENDPOINT_HINT = '/hallazgos/dbs';

type TabId = 'vida' | 'generales';

const VIDA_FLAGS = [...ESCENARIO_FLAGS_COMUNES];
const GENERALES_FLAGS = [...ESCENARIO_FLAGS_COMUNES, ESCENARIO_FLAG_GENERALES];

const SWR_MANUAL = {
  revalidateOnMount: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  revalidateIfStale: false,
} as const;

/** Selector de fecha de corte (calendario nativo, estilo corporativo). */
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

/** Una pestaña: búsqueda + resumen + tabla, sobre su propio set de columnas. */
function TabPanel({
  rows,
  columns,
  flags,
}: {
  rows: HallazgoAplicacion[];
  columns: ColumnDef[];
  flags: string[];
}) {
  const keys = useMemo(() => columns.map((c) => c.key), [columns]);
  const { query, setQuery, deferredQuery, filtered, isFiltering } = useTextFilter(rows, keys);
  const stats = useMemo(() => computeBdSummary(filtered, flags), [filtered, flags]);

  return (
    <div className="flex flex-col gap-4">
      <BdSummaryCards stats={stats} total={filtered.length} />

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

      <DataTable rows={filtered} columns={columns} />
    </div>
  );
}

export function HallazgosDbsView() {
  const { mutate: globalMutate } = useSWRConfig();
  const { data, error, isValidating } = useSWR<BdHallazgoDbs>(
    BD_SWR_KEYS.hallazgoDbs,
    null, // fetch SOLO manual: el disparo pasa fecha de corte explícita
    SWR_MANUAL,
  );

  const loaded = data !== undefined;
  const [fechaCorte, setFechaCorte] = useState('');
  const [tab, setTab] = useState<TabId>('vida');
  const [exporting, setExporting] = useState(false);
  const [generating, setGenerating] = useState(false);

  const vida = useMemo(() => data?.vida ?? [], [data]);
  const generales = useMemo(() => data?.generales ?? [], [data]);

  async function generar() {
    if (generating) return;
    setGenerating(true);
    try {
      await globalMutate(BD_SWR_KEYS.hallazgoDbs, fetchBdHallazgoDbs(fechaCorte || undefined), {
        revalidate: false,
      });
    } finally {
      setGenerating(false);
    }
  }

  async function handleExport() {
    if (!loaded || exporting) return;
    setExporting(true);
    try {
      await exportBdDbsToExcel(vida, generales);
    } finally {
      setExporting(false);
    }
  }

  const busy = generating || isValidating;
  const tabs: { id: TabId; label: string; count: number; icon: typeof Database }[] = [
    { id: 'vida', label: 'Vida', count: vida.length, icon: Database },
    { id: 'generales', label: 'Generales', count: generales.length, icon: Server },
  ];

  return (
    <AppShell
      title="Hallazgo Base de Datos"
      breadcrumb={['Certificación de Base de Datos', 'Hallazgo Base de Datos']}
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
              disabled={exporting || (vida.length === 0 && generales.length === 0)}
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
            Elige la fecha de corte y genera. La consulta al backend solo se ejecuta cuando lo pides.
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
            No se pudo conectar con el backend. Verifica que el endpoint{' '}
            <code className="font-mono">{ENDPOINT_HINT}</code> esté activo y la variable{' '}
            <code className="font-mono">NEXT_PUBLIC_API_BASE_URL</code>.
          </span>
          <Button variant="ghost" icon={<Play size={16} />} onClick={generar}>
            Reintentar
          </Button>
        </div>
      )}

      {loaded && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-1 border-b border-outline-variant">
            {tabs.map((t) => {
              const active = tab === t.id;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={
                    'inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-body-md font-semibold transition ' +
                    (active
                      ? 'border-primary text-primary'
                      : 'border-transparent text-on-surface-variant hover:text-on-surface')
                  }
                >
                  <Icon size={16} />
                  {t.label}
                  <span
                    className={
                      'rounded-full px-2 py-0.5 text-label-caps ' +
                      (active ? 'bg-primary/10 text-primary' : 'bg-surface-container text-on-surface-variant')
                    }
                  >
                    {nf.format(t.count)}
                  </span>
                </button>
              );
            })}
          </div>

          {tab === 'vida' ? (
            <TabPanel rows={vida} columns={bdVidaColumns} flags={VIDA_FLAGS} />
          ) : (
            <TabPanel rows={generales} columns={bdGeneralesColumns} flags={GENERALES_FLAGS} />
          )}
        </div>
      )}
    </AppShell>
  );
}
