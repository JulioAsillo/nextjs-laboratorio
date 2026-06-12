'use client';

import { useDeferredValue, useMemo, useState } from 'react';

/**
 * Filtro de texto "en todas las columnas" reutilizable.
 * Antes estaba duplicado en aplicaciones/page, active-directory/page y PaginatedTable.
 */
export function filterRows<T extends Record<string, unknown>>(
  rows: T[],
  keys: string[],
  query: string,
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) => {
    for (let i = 0; i < keys.length; i++) {
      const v = row[keys[i]];
      if (v != null && String(v).toLowerCase().includes(q)) return true;
    }
    return false;
  });
}

/** Estado de búsqueda con `useDeferredValue` + resultado filtrado memoizado. */
export function useTextFilter<T extends Record<string, unknown>>(rows: T[], keys: string[]) {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const filtered = useMemo(() => filterRows(rows, keys, deferredQuery), [rows, keys, deferredQuery]);
  const isFiltering = query !== deferredQuery;
  return { query, setQuery, deferredQuery, filtered, isFiltering };
}
