'use client';

import { AlertTriangle } from 'lucide-react';
import type { PerfilesSummary } from '../summary';

const nf = new Intl.NumberFormat('es-PE');

/**
 * Tarjetas-resumen del Hallazgo de Perfiles: total de registros + número de
 * "Incorrecto" por cada validación contra la Matriz de Roles.
 */
export function PerfilesSummaryCards({ summary }: { summary: PerfilesSummary }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 shadow-ambient">
        <p className="text-label-caps uppercase text-on-surface-variant">Registros</p>
        <p className="mt-1 text-headline-md text-on-surface">{nf.format(summary.total)}</p>
      </div>
      {summary.stats.map((s) => (
        <div
          key={s.key}
          className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 shadow-ambient"
          title={`${s.label} · incorrectos`}
        >
          <p className="flex items-center gap-1 truncate text-label-caps uppercase text-on-surface-variant">
            <AlertTriangle size={11} className="shrink-0 text-error" /> {s.label}
          </p>
          <p className="mt-1 text-headline-md text-error">{nf.format(s.incorrectos)}</p>
        </div>
      ))}
    </div>
  );
}
