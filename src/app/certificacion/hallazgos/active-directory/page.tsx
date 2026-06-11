'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import useSWR from 'swr';
import { RefreshCw, Loader2, Search, Play } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { DataTable } from '@/components/table/DataTable';
import { AdSummaryCards } from '@/components/table/AdSummaryCards';
import { Button } from '@/components/ui/Button';
import { fetchHallazgosAd } from '@/lib/api';
import { computeAdSummary } from '@/lib/summary-ad';
import { adColumns } from '@/lib/ad-columns';

const nf = new Intl.NumberFormat('es-PE');

export default function ActiveDirectoryPage() {
  const { data, error, isValidating, mutate } = useSWR('hallazgos-ad', fetchHallazgosAd, {
    revalidateOnMount: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
  });

  const [query, setQuery] = useState('');

  const loaded = data !== undefined;
  const deferredQuery = useDeferredValue(query);
  const allRows = useMemo(() => data ?? [], [data]);

  const rows = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (!q) return allRows;
    const keys = adColumns.map((c) => c.key);
    return allRows.filter((row) => {
      for (let i = 0; i < keys.length; i++) {
        const v = row[keys[i]];
        if (v != null && String(v).toLowerCase().includes(q)) return true;
      }
      return false;
    });
  }, [allRows, deferredQuery]);

  const summary = useMemo(() => computeAdSummary(rows), [rows]);
  const isFiltering = query !== deferredQuery;

  return (
    <AppShell
      title="Active Directory"
      breadcrumb={['Certificación de Usuarios', 'Hallazgos', 'Active Directory']}
      actions={
        loaded ? (
          <Button
            variant="ghost"
            icon={<RefreshCw size={16} className={isValidating ? 'animate-spin' : ''} />}
            onClick={() => mutate()}
            disabled={isValidating}
          >
            Actualizar
          </Button>
        ) : undefined
      }
    >
      {!loaded && !isValidating && !error && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-outline-variant bg-surface-container-lowest p-12 text-center shadow-ambient">
          <p className="text-body-lg text-on-surface">Aún no has generado los hallazgos.</p>
          <p className="max-w-md text-body-md text-on-surface-variant">
            La consulta al backend solo se ejecuta cuando lo pides.
          </p>
          <Button icon={<Play size={16} />} onClick={() => mutate()}>
            Generar Hallazgos
          </Button>
        </div>
      )}

      {isValidating && !loaded && (
        <div className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest p-10 text-on-surface-variant">
          <Loader2 size={18} className="animate-spin" /> Generando hallazgos…
        </div>
      )}

      {error && !loaded && (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-error/30 bg-error/5 p-6 text-body-md text-error">
          <span>
            No se pudo conectar con el backend. Verifica que el endpoint{' '}
            <code className="font-mono">/hallazgos/ad</code> esté activo y la variable{' '}
            <code className="font-mono">NEXT_PUBLIC_API_BASE_URL</code>.
          </span>
          <Button variant="ghost" icon={<RefreshCw size={16} />} onClick={() => mutate()}>
            Reintentar
          </Button>
        </div>
      )}

      {loaded && (
        <div className="flex flex-col gap-4">
          <AdSummaryCards summary={summary} />

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
              {(isFiltering || isValidating) && <Loader2 size={14} className="animate-spin" />}
              {nf.format(rows.length)} registro{rows.length === 1 ? '' : 's'}
              {deferredQuery.trim() && ` de ${nf.format(allRows.length)}`}
            </p>
          </div>

          <DataTable rows={rows} columns={adColumns} />
        </div>
      )}
    </AppShell>
  );
}
