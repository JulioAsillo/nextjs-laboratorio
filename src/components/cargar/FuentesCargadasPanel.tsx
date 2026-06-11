'use client';

import { CheckCircle2, Database, Inbox, Table2, AlertTriangle } from 'lucide-react';

const nf = new Intl.NumberFormat('es-PE');

export interface FuenteCargada {
  appsKey: string;
  label: string;
  count: number;
}

export interface FuenteError {
  appsKey: string;
  label: string;
  empty: boolean;
}

interface FuentesCargadasPanelProps {
  cargadas: FuenteCargada[];
  errores?: FuenteError[];
  total: number;
  onView: (appsKey: string, label: string) => void;
}

export function FuentesCargadasPanel({ cargadas, errores = [], total, onView }: FuentesCargadasPanelProps) {
  const vacio = cargadas.length === 0 && errores.length === 0;

  return (
    <aside className="sticky top-0 hidden w-72 shrink-0 self-start lg:block">
      <div className="flex max-h-[calc(100vh-6.5rem)] flex-col overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest shadow-ambient">
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-outline-variant px-4 py-3">
          <h2 className="text-headline-sm text-on-surface">Fuentes cargadas</h2>
          <span className="inline-flex items-center rounded-full bg-secondary/10 px-2 py-0.5 text-label-caps uppercase text-secondary">
            {cargadas.length} / {total}
          </span>
        </header>

        {vacio ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <Inbox size={28} className="text-outline-variant" />
            <p className="text-body-md text-on-surface-variant">Aún no se ha cargado ninguna fuente.</p>
            <p className="text-label-caps uppercase text-on-surface-variant/70">Usa “Cargar” o “Cargar Todos”.</p>
          </div>
        ) : (
          <div className="thin-scroll flex-1 overflow-y-auto">
            <ul className="divide-y divide-outline-variant/60">
              {cargadas.map((f) => (
                <li key={f.appsKey} className="flex items-center gap-2.5 px-4 py-2.5">
                  <CheckCircle2 size={16} className="shrink-0 text-secondary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body-md text-on-surface">{f.label}</p>
                    <p className="flex items-center gap-1 text-label-caps uppercase text-on-surface-variant">
                      <Database size={11} /> {nf.format(f.count)} registro{f.count === 1 ? '' : 's'}
                    </p>
                  </div>
                  {f.count > 0 && (
                    <button
                      type="button"
                      onClick={() => onView(f.appsKey, f.label)}
                      aria-label={`Ver datos de ${f.label}`}
                      title="Ver datos"
                      className="shrink-0 rounded border border-outline-variant p-1.5 text-on-surface-variant transition hover:border-primary hover:text-primary"
                    >
                      <Table2 size={14} />
                    </button>
                  )}
                </li>
              ))}
            </ul>

            {errores.length > 0 && (
              <div className="border-t border-outline-variant">
                <p className="flex items-center gap-1.5 px-4 pb-1 pt-3 text-label-caps uppercase text-error">
                  <AlertTriangle size={12} /> Con problemas · {errores.length}
                </p>
                <ul className="divide-y divide-outline-variant/60">
                  {errores.map((f) => (
                    <li key={f.appsKey} className="flex items-center gap-2.5 px-4 py-2 text-error">
                      <AlertTriangle size={15} className="shrink-0" />
                      <span className="min-w-0 flex-1 truncate text-body-md">{f.label}</span>
                      <span className="text-label-caps uppercase">{f.empty ? 'Sin datos' : 'Error'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}