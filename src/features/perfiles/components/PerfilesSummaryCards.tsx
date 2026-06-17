'use client';

import { AlertTriangle } from 'lucide-react';
import type { EscenarioStat } from '../summary';

const nf = new Intl.NumberFormat('es-PE');

/** Tarjetas-resumen de escenarios para el Hallazgo de Perfiles. */
export function PerfilesSummaryCards({ stats, total }: { stats: EscenarioStat[]; total: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      <div className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 shadow-ambient">
        <p className="text-label-caps uppercase text-on-surface-variant">Registros</p>
        <p className="mt-1 text-headline-md text-on-surface">{nf.format(total)}</p>
      </div>
      {stats.map((s) => (
        <div
          key={s.key}
          className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 shadow-ambient"
          title={s.label}
        >
          <p className="flex items-center gap-1 truncate text-label-caps uppercase text-on-surface-variant">
            <AlertTriangle size={11} className="shrink-0 text-tertiary" /> {s.label}
          </p>
          <p className="mt-1 text-headline-md text-tertiary">{nf.format(s.count)}</p>
        </div>
      ))}
    </div>
  );
}
