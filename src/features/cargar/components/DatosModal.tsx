'use client';

import { useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { X, CalendarClock } from 'lucide-react';
import { fetchDatosApp, deriveColumns, type DatosResult } from '../datos';
import { datosKey } from '../keys';
import { PaginatedTable } from './PaginatedTable';

interface DatosModalProps {
  appsKey: string;
  title: string;
  onClose: () => void;
}

export function DatosModal({ appsKey, title, onClose }: DatosModalProps) {
  // Lee de la caché ya sembrada por "Cargar Todos" / "Cargar". No revalida solo.
  const { data } = useSWR<DatosResult>(datosKey(appsKey), () => fetchDatosApp(appsKey), {
    revalidateOnMount: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
  });

  const rows = useMemo(() => data?.rows ?? [], [data]);
  const columns = useMemo(() => deriveColumns(rows), [rows]);

  // Cierre con Escape + bloqueo de scroll de fondo.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex h-[86vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-ambient">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-outline-variant bg-surface-container-lowest px-5 py-4">
          <div>
            <h2 className="text-headline-md text-on-surface">{title}</h2>
            {data?.fechaCorte && data.fechaCorte !== '-' && (
              <p className="mt-0.5 flex items-center gap-1.5 text-label-caps uppercase text-on-surface-variant">
                <CalendarClock size={13} /> Corte: {data.fechaCorte}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-md p-1.5 text-on-surface-variant transition hover:bg-surface-container hover:text-on-surface"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-hidden p-5">
          {rows.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest text-body-md text-on-surface-variant">
              No hay datos cargados para esta fuente.
            </div>
          ) : (
            <PaginatedTable rows={rows} columns={columns} />
          )}
        </div>
      </div>
    </div>
  );
}
