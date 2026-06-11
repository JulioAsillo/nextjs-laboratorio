'use client';

import { useDeferredValue, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Search,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from 'lucide-react';
import clsx from 'clsx';
import type { DatosRow, ViewColumn } from '@/lib/datos';
import { formatCell } from '@/lib/datos';

const nf = new Intl.NumberFormat('es-PE');
const PAGE_SIZES = [25, 50, 100, 200];

interface PaginatedTableProps {
  rows: DatosRow[];
  columns: ViewColumn[];
}

export function PaginatedTable({ rows, columns }: PaginatedTableProps) {
  const [query, setQuery] = useState('');
  const [pageSize, setPageSize] = useState(50);
  const [page, setPage] = useState(1);
  const deferredQuery = useDeferredValue(query);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      for (let i = 0; i < columns.length; i++) {
        const v = row[columns[i].key];
        if (v != null && String(v).toLowerCase().includes(q)) return true;
      }
      return false;
    });
  }, [rows, columns, deferredQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  // Vuelve a la primera página cuando cambia el filtro, el tamaño o el dataset.
  useEffect(() => {
    setPage(1);
  }, [deferredQuery, pageSize, rows]);

  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);
  const isFiltering = query !== deferredQuery;

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
        <div className="relative w-full max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en todas las columnas…"
            className="w-full rounded border border-outline-variant bg-surface-container-lowest py-2 pl-9 pr-3 text-body-md text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <p className="text-body-md text-on-surface-variant">
          {nf.format(filtered.length)} registro{filtered.length === 1 ? '' : 's'}
          {deferredQuery.trim() && ` de ${nf.format(rows.length)}`}
        </p>
      </div>

      {/* Tabla */}
      <div className="thin-scroll relative flex-1 overflow-auto rounded-lg border border-outline-variant bg-surface-container-lowest">
        <table className="min-w-full border-collapse">
          <thead className="sticky top-0 z-10">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  style={{ minWidth: c.minWidth }}
                  className="whitespace-nowrap border-b border-outline-variant bg-surface-container-high px-4 py-2.5 text-left text-label-caps uppercase text-on-surface-variant"
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => {
              const absolute = start + i;
              return (
                <tr
                  key={absolute}
                  className={clsx(
                    'hover:bg-surface-container-low',
                    absolute % 2 === 1 && 'bg-surface-container-low/60',
                  )}
                >
                  {columns.map((c) => {
                    const v = row[c.key];
                    if (c.type === 'bool') {
                      return (
                        <td key={c.key} className="border-b border-outline-variant/60 px-4 py-2 text-table-data">
                          {v == null || v === '' ? (
                            <span className="text-outline-variant">—</span>
                          ) : (
                            <BoolChip value={Boolean(v)} />
                          )}
                        </td>
                      );
                    }
                    const text = formatCell(v, c.type);
                    return (
                      <td
                        key={c.key}
                        title={text}
                        className="max-w-[320px] truncate border-b border-outline-variant/60 px-4 py-2 text-table-data text-on-surface-variant"
                      >
                        {text === '' ? <span className="text-outline-variant">—</span> : text}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>

        {pageRows.length === 0 && (
          <div className="px-4 py-12 text-center text-body-md text-on-surface-variant">
            {isFiltering ? 'Buscando…' : 'Sin resultados para esa búsqueda.'}
          </div>
        )}
      </div>

      {/* Paginación */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
        <label className="flex items-center gap-2 text-body-md text-on-surface-variant">
          Filas por página
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="rounded border border-outline-variant bg-surface-container-lowest px-2 py-1 text-body-md text-on-surface outline-none transition focus:border-primary"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-1">
          <PagBtn onClick={() => setPage(1)} disabled={safePage === 1} label="Primera">
            <ChevronsLeft size={16} />
          </PagBtn>
          <PagBtn onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1} label="Anterior">
            <ChevronLeft size={16} />
          </PagBtn>
          <span className="px-2 text-body-md text-on-surface">
            Página {nf.format(safePage)} de {nf.format(totalPages)}
          </span>
          <PagBtn onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} label="Siguiente">
            <ChevronRight size={16} />
          </PagBtn>
          <PagBtn onClick={() => setPage(totalPages)} disabled={safePage === totalPages} label="Última">
            <ChevronsRight size={16} />
          </PagBtn>
        </div>
      </div>
    </div>
  );
}

function BoolChip({ value }: { value: boolean }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2 py-0.5 text-label-caps uppercase',
        value ? 'bg-secondary/12 text-secondary' : 'bg-surface-container text-on-surface-variant',
      )}
    >
      {value ? 'Sí' : 'No'}
    </span>
  );
}

function PagBtn({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="rounded border border-outline-variant bg-surface-container-lowest p-1.5 text-on-surface-variant transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-outline-variant disabled:hover:text-on-surface-variant"
    >
      {children}
    </button>
  );
}
