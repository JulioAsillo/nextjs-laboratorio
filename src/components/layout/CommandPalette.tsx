'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, CornerDownLeft, ArrowRight } from 'lucide-react';
import { searchEntries, type SearchEntry } from '@/lib/search-index';

/**
 * Paleta de comandos (Cmd/Ctrl+K). Se escribe una palabra clave y aparecen
 * los destinos como rutas de árbol; Enter/clic navega al `href`.
 */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo<SearchEntry[]>(() => searchEntries(query), [query]);

  // Al abrir: limpia, enfoca y resetea el cursor.
  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      // foco tras el paint para que el input ya exista.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => setActive(0), [query]);

  if (!open) return null;

  function go(entry: SearchEntry | undefined) {
    if (!entry) return;
    onClose();
    router.push(entry.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(results[active]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-on-surface/40 px-4 pt-[12vh] backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest shadow-ambient"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-outline-variant px-4">
          <Search size={18} className="shrink-0 text-on-surface-variant" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Buscar módulo, hallazgo o fuente…  (p. ej. «Active», «PPS»)"
            className="w-full bg-transparent py-3.5 text-body-lg text-on-surface outline-none placeholder:text-on-surface-variant/70"
          />
          <kbd className="hidden shrink-0 rounded border border-outline-variant px-1.5 py-0.5 text-label-caps text-on-surface-variant sm:inline">
            ESC
          </kbd>
        </div>

        <div className="thin-scroll max-h-[52vh] overflow-y-auto py-1.5">
          {query.trim() === '' ? (
            <p className="px-4 py-6 text-center text-body-md text-on-surface-variant">
              Escribe para buscar en todas las certificaciones.
            </p>
          ) : results.length === 0 ? (
            <p className="px-4 py-6 text-center text-body-md text-on-surface-variant">
              Sin resultados para «{query}».
            </p>
          ) : (
            results.map((entry, i) => {
              const leaf = entry.path[entry.path.length - 1];
              const trail = entry.path.slice(0, -1);
              const isActive = i === active;
              return (
                <button
                  key={entry.id}
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(entry)}
                  className={
                    'flex w-full items-center gap-3 px-4 py-2.5 text-left transition ' +
                    (isActive ? 'bg-primary/10' : 'hover:bg-surface-container-low')
                  }
                >
                  <ArrowRight
                    size={15}
                    className={'shrink-0 ' + (isActive ? 'text-primary' : 'text-outline-variant')}
                  />
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block truncate text-label-caps uppercase tracking-wider text-on-surface-variant">
                      {trail.join('  ›  ')}
                    </span>
                    <span className="block truncate text-body-md font-semibold text-on-surface">
                      {leaf}
                    </span>
                  </span>
                  {isActive && (
                    <CornerDownLeft size={15} className="shrink-0 text-primary" />
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between border-t border-outline-variant px-4 py-2 text-label-caps uppercase tracking-wider text-on-surface-variant/70">
          <span>↑ ↓ navegar · ↵ abrir</span>
          <span>{results.length > 0 ? `${results.length} resultado${results.length === 1 ? '' : 's'}` : '·'}</span>
        </div>
      </div>
    </div>
  );
}
