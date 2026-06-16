'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Search, CornerDownLeft } from 'lucide-react';
import { certifications, landingHref } from '@/config/certifications';
import { searchEntries, type SearchEntry } from '@/lib/search-index';

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo<SearchEntry[]>(() => searchEntries(query, 20), [query]);
  const searching = query.trim() !== '';

  // El cursor arranca en el buscador (estilo Odoo: entras y ya tipeas).
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Reset del cursor de selección al cambiar el texto.
  useEffect(() => setActive(0), [query]);

  // Ctrl/Cmd+K reenfoca el buscador desde cualquier parte del lanzador.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function go(entry: SearchEntry | undefined) {
    if (entry) router.push(entry.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!searching || results.length === 0) {
      if (e.key === 'Escape') setQuery('');
      return;
    }
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
      setQuery('');
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      {/* Encabezado */}
      <header className="border-b border-outline-variant bg-surface-container-lowest">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary font-bold text-on-primary shadow-ambient">
            C
          </div>
          <div className="leading-tight">
            <h1 className="text-headline-sm text-on-surface">Certificaciones</h1>
            <p className="text-label-caps uppercase tracking-wider text-on-surface-variant">
              Auditoría · Interno
            </p>
          </div>
        </div>
      </header>

      {/* Cuerpo */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <div className="mb-6">
          <h2 className="text-display-lg text-on-surface">Selecciona una certificación</h2>
          <p className="mt-2 max-w-2xl text-body-lg text-on-surface-variant">
            O empieza a escribir para saltar directo a un hallazgo o fuente de cualquier
            certificación.
          </p>
        </div>

        {/* Buscador en vivo (estilo Odoo) */}
        <div className="relative mb-8">
          <div className="flex items-center gap-3 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 shadow-ambient focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30">
            <Search size={18} className="shrink-0 text-on-surface-variant" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Buscar módulo, hallazgo o fuente…  (p. ej. «Active», «PPS»)"
              className="w-full bg-transparent py-3.5 text-body-lg text-on-surface outline-none placeholder:text-on-surface-variant/70"
            />
            {searching ? (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="shrink-0 text-label-caps uppercase text-on-surface-variant hover:text-on-surface"
              >
                Limpiar
              </button>
            ) : (
              <kbd className="hidden shrink-0 rounded border border-outline-variant px-1.5 py-0.5 text-label-caps text-on-surface-variant sm:inline">
                Ctrl K
              </kbd>
            )}
          </div>

          {/* Resultados en vivo */}
          {searching && (
            <div className="mt-2 overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest shadow-ambient">
              {results.length === 0 ? (
                <p className="px-4 py-6 text-center text-body-md text-on-surface-variant">
                  Sin resultados para «{query}».
                </p>
              ) : (
                <div className="thin-scroll max-h-[60vh] overflow-y-auto py-1.5">
                  {results.map((entry, i) => {
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
                        {isActive && <CornerDownLeft size={15} className="shrink-0 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tarjetas (solo cuando no se está buscando) */}
        {!searching && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {certifications.map((cert) => {
              const Icon = cert.icon;
              return (
                <Link
                  key={cert.id}
                  href={landingHref(cert)}
                  className="group flex flex-col rounded-lg border border-outline-variant bg-surface-container-lowest p-6 shadow-ambient transition hover:border-primary"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-on-primary">
                      <Icon size={24} />
                    </span>
                    <ArrowRight
                      size={20}
                      className="mt-1 text-outline-variant transition group-hover:translate-x-0.5 group-hover:text-primary"
                    />
                  </div>
                  <h3 className="mt-4 text-headline-sm text-on-surface">{cert.label}</h3>
                  <p className="mt-1.5 text-body-md text-on-surface-variant">{cert.description}</p>

                  <div className="mt-4 flex flex-wrap gap-1.5 border-t border-outline-variant/70 pt-4">
                    {cert.nav.map((item) => (
                      <span
                        key={item.label}
                        className="rounded bg-surface-container-low px-2 py-0.5 text-label-caps uppercase text-on-surface-variant"
                      >
                        {item.label}
                      </span>
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <footer className="border-t border-outline-variant px-6 py-4 text-center text-label-caps uppercase tracking-wider text-on-surface-variant/70">
        v0.5 · Interno
      </footer>
    </div>
  );
}