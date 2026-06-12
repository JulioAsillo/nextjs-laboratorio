'use client';

import { type ReactNode, useMemo, useState } from 'react';
import { Download, RefreshCw, Loader2, Search, Play } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { useTextFilter } from '@/lib/text-filter';
import { DataTable } from './components/DataTable';
import { useHallazgos } from './use-hallazgos';
import type { ColumnDef } from './columns';
import type { HallazgoAplicacion } from '@/types/hallazgo';

const nf = new Intl.NumberFormat('es-PE');

interface HallazgosViewProps<S> {
  title: string;
  breadcrumb: string[];
  /** Clave SWR (ver features/hallazgos/keys.ts). */
  swrKey: string;
  fetcher: () => Promise<HallazgoAplicacion[]>;
  columns: ColumnDef[];
  /** Path del endpoint, solo para el mensaje de error (p.ej. "/hallazgos/apps"). */
  endpointHint: string;
  /** Cálculo del resumen (debe ser una referencia estable de módulo). */
  summarize: (rows: HallazgoAplicacion[]) => S;
  /** Render del resumen ya calculado (cards). */
  renderSummary: (summary: S) => ReactNode;
  /** Exportación opcional (Aplicaciones la usa; AD no). */
  onExport?: (rows: HallazgoAplicacion[]) => Promise<void>;
}

/**
 * Cuerpo compartido de las páginas de Hallazgos (Aplicaciones y Active Directory).
 * Antes este JSX estaba duplicado casi al 100% en ambas páginas.
 */
export function HallazgosView<S>({
  title,
  breadcrumb,
  swrKey,
  fetcher,
  columns,
  endpointHint,
  summarize,
  renderSummary,
  onExport,
}: HallazgosViewProps<S>) {
  const { data, error, isValidating, mutate } = useHallazgos(swrKey, fetcher);

  const loaded = data !== undefined;
  const allRows = useMemo(() => data ?? [], [data]);
  const keys = useMemo(() => columns.map((c) => c.key), [columns]);

  const { query, setQuery, deferredQuery, filtered: rows, isFiltering } = useTextFilter(allRows, keys);
  const summary = useMemo(() => summarize(rows), [rows, summarize]);

  const [exporting, setExporting] = useState(false);
  async function handleExport() {
    if (!onExport || !rows.length) return;
    setExporting(true);
    try {
      await onExport(rows);
    } finally {
      setExporting(false);
    }
  }

  return (
    <AppShell
      title={title}
      breadcrumb={breadcrumb}
      actions={
        loaded ? (
          <>
            <Button
              variant="ghost"
              icon={<RefreshCw size={16} className={isValidating ? 'animate-spin' : ''} />}
              onClick={() => mutate()}
              disabled={isValidating}
            >
              Actualizar
            </Button>
            {onExport && (
              <Button
                icon={exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                onClick={handleExport}
                disabled={exporting || !rows.length}
              >
                Exportar Excel
              </Button>
            )}
          </>
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
            <code className="font-mono">{endpointHint}</code> esté activo y la variable{' '}
            <code className="font-mono">NEXT_PUBLIC_API_BASE_URL</code>.
          </span>
          <Button variant="ghost" icon={<RefreshCw size={16} />} onClick={() => mutate()}>
            Reintentar
          </Button>
        </div>
      )}

      {loaded && (
        <div className="flex flex-col gap-4">
          {renderSummary(summary)}

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

          <DataTable rows={rows} columns={columns} />
        </div>
      )}
    </AppShell>
  );
}
