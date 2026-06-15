'use client';

import { useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { ColumnDef } from '../columns';
import { colorGroups } from '@/lib/theme';
import type { HallazgoAplicacion } from '@/types/hallazgo';

const ROW_HEIGHT = 36;

interface DataTableProps {
  rows: HallazgoAplicacion[];
  columns: ColumnDef[];
}

/**
 * Tabla virtualizada por filas. Recibe las columnas por props, así sirve para
 * cualquier hallazgo (Aplicaciones, Active Directory, etc.).
 */
export function DataTable({ rows, columns }: DataTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const totalWidthPx = useMemo(() => columns.reduce((acc, c) => acc + c.widthPx, 0), [columns]);
  const gridTemplate = useMemo(() => columns.map((c) => `${c.widthPx}px`).join(' '), [columns]);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 16,
  });

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-10 text-center text-body-md text-on-surface-variant">
        No hay hallazgos para mostrar.
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="thin-scroll h-[calc(100vh-19rem)] overflow-auto rounded-lg border border-outline-variant bg-surface-container-lowest shadow-ambient"
    >
      <div style={{ width: totalWidthPx, minWidth: '100%' }}>
        <div className="sticky top-0 z-20" style={{ display: 'grid', gridTemplateColumns: gridTemplate }}>
          {columns.map((col) => {
            const g = colorGroups[col.group];
            return (
              <div
                key={col.key}
                className="truncate px-4 py-2.5 text-label-caps uppercase"
                style={{ backgroundColor: g.fill, color: g.text }}
                title={col.header}
              >
                {col.header}
              </div>
            );
          })}
        </div>

        <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
          {rowVirtualizer.getVirtualItems().map((vItem) => {
            const row = rows[vItem.index];
            const zebra = vItem.index % 2 === 1;
            return (
              <div
                key={vItem.key}
                className="absolute left-0 top-0 w-full hover:bg-surface-container-low"
                style={{
                  height: vItem.size,
                  transform: `translateY(${vItem.start}px)`,
                  display: 'grid',
                  gridTemplateColumns: gridTemplate,
                  backgroundColor: zebra ? 'rgb(var(--surface-container-low))' : 'transparent',
                  borderBottom: '1px solid rgb(var(--outline-variant))',
                }}
              >
                {columns.map((col) => {
                  const value = row[col.key];
                  const empty = value == null || value === '';
                  return (
                    <div
                      key={col.key}
                      className="flex items-center truncate px-4 text-table-data text-on-surface-variant"
                      title={empty ? '' : String(value)}
                    >
                      {empty ? <span className="text-outline-variant">—</span> : String(value)}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
