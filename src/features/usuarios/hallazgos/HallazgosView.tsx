'use client';

import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Download, RefreshCw, Loader2, Search, Play, CalendarClock, DatabaseZap } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { PaginationControls } from '@/components/PaginationControls';
import { useTextFilter } from '@/lib/text-filter';
import { useHallazgoCache } from '@/lib/use-hallazgo-cache';
import { DataTable } from './components/DataTable';
import { useHallazgos } from './use-hallazgos';
import type { ColumnDef } from './aplicaciones/columns';
import type { HallazgoAplicacion } from '@/types/hallazgo';

const nf = new Intl.NumberFormat('es-PE');
const dtf = new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

interface HallazgosViewProps<S> {
  title: string;
  breadcrumb: string[];
  /** Clave SWR (ver features/hallazgos/keys.ts). */
  swrKey: string;
  /**
   * Fetcher de filas. Puede aceptar opcionalmente una fecha de referencia
   * (YYYY-MM-DD); Aplicaciones la ignora, AD la envía como `?fecha_ref=`.
   */
  fetcher: (fechaRef?: string) => Promise<HallazgoAplicacion[]>;
  columns: ColumnDef[];
  /** Path del endpoint, solo para el mensaje de error (p.ej. "/hallazgos/apps"). */
  endpointHint: string;
  /** Cálculo del resumen (debe ser una referencia estable de módulo). */
  summarize: (rows: HallazgoAplicacion[]) => S;
  /** Render del resumen ya calculado (cards). */
  renderSummary: (summary: S) => ReactNode;
  /** Exportación opcional (Aplicaciones la usa; AD no). */
  onExport?: (rows: HallazgoAplicacion[]) => Promise<void>;
  /**
   * Si es `true`, muestra el selector de fecha de referencia y la envía al
   * fetcher como `?fecha_ref=`. Aplica a todos los hallazgos menos Aplicaciones.
   */
  withFechaRef?: boolean;
  /** Filas por página. Por defecto 50. */
  pageSize?: number;
}

/** Selector de fecha de referencia (calendario nativo, estilo corporativo). */
function FechaRefField({
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
      <span className="text-label-caps uppercase">Fecha de referencia</span>
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
  withFechaRef = false,
  pageSize = 50,
}: HallazgosViewProps<S>) {
  const { data, error, isValidating, mutate } = useHallazgos(swrKey, fetcher);

  const loaded = data !== undefined;
  const allRows = useMemo(() => data ?? [], [data]);
  const keys = useMemo(() => columns.map((c) => c.key), [columns]);

  const { query, setQuery, deferredQuery, filtered: rows, isFiltering } = useTextFilter(allRows, keys);
  const summary = useMemo(() => summarize(rows), [rows, summarize]);

  // Estado de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(rows.length / pageSize)), [rows.length, pageSize]);
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, currentPage, pageSize]);

  // Reset a página 1 cuando cambia el filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [deferredQuery]);

  const [fechaRef, setFechaRef] = useState('');
  const [generating, setGenerating] = useState(false);
  const busy = generating || isValidating;

  // Persistencia en IndexedDB (sobrevive al F5). Clave por dataset.
  const cache = useHallazgoCache<HallazgoAplicacion[]>(`hallazgos:${swrKey}`);
  const hydratedRef = useRef(false);

  // Al montar: si no hay datos en memoria, rehidrata desde la caché y muestra
  // el banner. La consulta al backend sigue siendo manual (Actualizar).
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    if (data !== undefined) return;
    (async () => {
      const env = await cache.hydrate();
      if (!env) return;
      await mutate(env.data, { revalidate: false });
      cache.setMeta({ savedAt: env.savedAt, fechaRef: env.fechaRef });
      if (env.fechaRef) setFechaRef(env.fechaRef);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Dispara la consulta al backend y persiste el resultado. Con `withFechaRef`,
   * inyecta el resultado vía `mutate(promise)` para poder pasar la fecha; si no,
   * revalida el fetcher enlazado por SWR (comportamiento original de Aplicaciones).
   */
  async function trigger() {
    if (busy) return;
    if (!withFechaRef) {
      const fresh = (await mutate()) as HallazgoAplicacion[] | undefined;
      if (fresh) await cache.remember(fresh);
      return;
    }
    setGenerating(true);
    try {
      const fresh = (await mutate(fetcher(fechaRef || undefined), { revalidate: false })) as
        | HallazgoAplicacion[]
        | undefined;
      if (fresh) await cache.remember(fresh, fechaRef || undefined);
    } finally {
      setGenerating(false);
    }
  }

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
            {withFechaRef && <FechaRefField value={fechaRef} onChange={setFechaRef} disabled={busy} />}
            <Button
              variant="ghost"
              icon={<RefreshCw size={16} className={busy ? 'animate-spin' : ''} />}
              onClick={trigger}
              disabled={busy}
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
      {!loaded && !busy && !error && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-outline-variant bg-surface-container-lowest p-12 text-center shadow-ambient">
          <p className="text-body-lg text-on-surface">Aún no has generado los hallazgos.</p>
          <p className="max-w-md text-body-md text-on-surface-variant">
            {withFechaRef
              ? 'Elige la fecha de referencia y genera. La consulta al backend solo se ejecuta cuando lo pides.'
              : 'La consulta al backend solo se ejecuta cuando lo pides.'}
          </p>
          {withFechaRef && <FechaRefField value={fechaRef} onChange={setFechaRef} />}
          <Button icon={<Play size={16} />} onClick={trigger}>
            Generar Hallazgos
          </Button>
        </div>
      )}

      {busy && !loaded && (
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
          <Button variant="ghost" icon={<RefreshCw size={16} />} onClick={trigger}>
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
                <strong className="font-semibold text-on-surface">Actualizar</strong> para refrescar.
              </span>
            </div>
          )}
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
              {(isFiltering || busy) && <Loader2 size={14} className="animate-spin" />}
              {nf.format(rows.length)} registro{rows.length === 1 ? '' : 's'}
              {deferredQuery.trim() && ` de ${nf.format(allRows.length)}`}
            </p>
          </div>

          <DataTable rows={paginatedRows} columns={columns} />

          {totalPages > 1 && (
            <div className="flex justify-center py-4">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                disabled={busy}
              />
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
