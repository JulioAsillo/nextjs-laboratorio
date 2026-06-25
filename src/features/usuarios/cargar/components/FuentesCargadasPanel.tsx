'use client';

import type { ReactNode } from 'react';
import { CheckCircle2, Database, Inbox, Table2, AlertTriangle, UploadCloud, FileCheck2 } from 'lucide-react';

const nf = new Intl.NumberFormat('es-PE');

export type PanelMode = 'subidas' | 'consultadas';

/** Fuente cuyos archivos ya se subieron al backend (estado local de subida). */
export interface FuenteSubida {
  id: string;
  label: string;
  uploaded: number; // slots subidos
  total: number;    // slots totales de la card
  appsKey?: string;
}

/** Fuente consultada al backend (datos explorados). */
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
  mode: PanelMode;
  onModeChange: (m: PanelMode) => void;
  /** Modo "Cargadas" (subidas al backend). */
  subidas: FuenteSubida[];
  totalSubibles: number;
  /** Modo "Consultadas" (datos explorados). */
  cargadas: FuenteCargada[];
  errores?: FuenteError[];
  totalConsultables: number;
  onView: (appsKey: string, label: string) => void;
  /** Acción opcional: explorar (consultar) una fuente ya subida. */
  onExplore?: (appsKey: string) => void;
}

export function FuentesCargadasPanel({
  mode,
  onModeChange,
  subidas,
  totalSubibles,
  cargadas,
  errores = [],
  totalConsultables,
  onView,
  onExplore,
}: FuentesCargadasPanelProps) {
  const isSubidas = mode === 'subidas';
  const count = isSubidas ? subidas.length : cargadas.length;
  const total = isSubidas ? totalSubibles : totalConsultables;

  return (
    <aside className="sticky top-0 hidden w-72 shrink-0 self-start lg:block">
      <div className="flex max-h-[calc(100vh-6.5rem)] flex-col overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest shadow-ambient">
        <header className="flex shrink-0 flex-col gap-3 border-b border-outline-variant px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-headline-sm text-on-surface">Fuentes</h2>
            <span className="inline-flex items-center rounded-full bg-secondary/10 px-2 py-0.5 text-label-caps uppercase text-secondary">
              {count} / {total}
            </span>
          </div>

          {/* Toggle segmentado: el modo activo sigue al último botón, pero puedes volver al otro. */}
          <div className="flex rounded-md border border-outline-variant bg-surface-container p-0.5">
            <ModeTab active={isSubidas} onClick={() => onModeChange('subidas')} icon={<UploadCloud size={13} />} label="Cargadas" />
            <ModeTab active={!isSubidas} onClick={() => onModeChange('consultadas')} icon={<Database size={13} />} label="Consultadas" />
          </div>
        </header>

        {isSubidas ? (
          <SubidasList subidas={subidas} onExplore={onExplore} />
        ) : (
          <ConsultadasList cargadas={cargadas} errores={errores} onView={onView} />
        )}
      </div>
    </aside>
  );
}

function ModeTab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'inline-flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-1.5 text-label-caps uppercase transition ' +
        (active ? 'bg-surface-container-lowest text-primary shadow-ambient' : 'text-on-surface-variant hover:text-on-surface')
      }
    >
      {icon}
      {label}
    </button>
  );
}

/* ── Modo Cargadas (subidas al backend) ─────────────────────────── */
function SubidasList({ subidas, onExplore }: { subidas: FuenteSubida[]; onExplore?: (appsKey: string) => void }) {
  if (subidas.length === 0) {
    return (
      <Empty
        icon={<UploadCloud size={28} className="text-outline-variant" />}
        title="Aún no se han subido archivos."
        hint="Arrastra los Excel a las cards y usa “Subir todos los archivos”."
      />
    );
  }
  return (
    <div className="thin-scroll flex-1 overflow-y-auto">
      <ul className="divide-y divide-outline-variant/60">
        {subidas.map((f) => {
          const completa = f.uploaded >= f.total;
          return (
            <li key={f.id} className="flex items-center gap-2.5 px-4 py-2.5">
              <FileCheck2 size={16} className="shrink-0 text-secondary" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-body-md text-on-surface">{f.label}</p>
                <p className="flex items-center gap-1 text-label-caps uppercase text-on-surface-variant">
                  {completa ? 'Subido' : `Parcial · ${f.uploaded}/${f.total}`}
                </p>
              </div>
              {onExplore && f.appsKey && (
                <button
                  type="button"
                  onClick={() => onExplore(f.appsKey!)}
                  aria-label={`Explorar datos de ${f.label}`}
                  title="Explorar datos cargados"
                  className="shrink-0 rounded border border-outline-variant p-1.5 text-on-surface-variant transition hover:border-primary hover:text-primary"
                >
                  <Database size={14} />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ── Modo Consultadas (datos explorados del backend) ────────────── */
function ConsultadasList({
  cargadas,
  errores,
  onView,
}: {
  cargadas: FuenteCargada[];
  errores: FuenteError[];
  onView: (appsKey: string, label: string) => void;
}) {
  if (cargadas.length === 0 && errores.length === 0) {
    return (
      <Empty
        icon={<Inbox size={28} className="text-outline-variant" />}
        title="Aún no se ha consultado ninguna fuente."
        hint="Usa “Explorar datos cargados”."
      />
    );
  }
  return (
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
  );
}

function Empty({ icon, title, hint }: { icon: ReactNode; title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      {icon}
      <p className="text-body-md text-on-surface-variant">{title}</p>
      <p className="text-label-caps uppercase text-on-surface-variant/70">{hint}</p>
    </div>
  );
}
