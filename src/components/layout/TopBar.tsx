'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { Check, ChevronDown, ChevronsUpDown, LayoutGrid, Search } from 'lucide-react';
import type { NavItem } from '@/config/navigation';
import { certifications, activeCertification, landingHref } from '@/config/certifications';
import { CommandPalette } from './CommandPalette';

/** ¿El pathname cae dentro de este nodo o de alguno de sus descendientes? */
function subtreeContains(item: NavItem, pathname: string): boolean {
  if (item.href && (pathname === item.href || pathname.startsWith(`${item.href}/`))) return true;
  return (item.children ?? []).some((c) => subtreeContains(c, pathname));
}

/** Cierra al hacer clic fuera del contenedor referenciado. */
function useClickOutside(onOutside: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [onOutside]);
  return ref;
}

/* ───────────────────────── Switcher de certificación ───────────────────── */
function CertSwitcher() {
  const pathname = usePathname();
  const active = activeCertification(pathname) ?? certifications[0];
  const ActiveIcon = active.icon;
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 rounded-md py-1.5 pl-1.5 pr-2.5 text-left transition hover:bg-white/[0.08]"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-on-primary shadow-ambient">
          <ActiveIcon size={16} />
        </span>
        <span className="hidden min-w-0 leading-tight sm:block">
          <span className="block text-label-caps uppercase tracking-wider text-inverse-on-surface/55">
            Certificación
          </span>
          <span className="block max-w-[14rem] truncate text-body-md font-semibold text-inverse-on-surface">
            {active.label.replace(/^Certificación de\s+/i, '')}
          </span>
        </span>
        <ChevronsUpDown size={15} className="shrink-0 text-inverse-on-surface/50" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-40 mt-1.5 w-64 overflow-hidden rounded-md border border-outline-variant bg-surface-container-lowest shadow-ambient">
          {certifications.map((c) => {
            const Icon = c.icon;
            const isActive = c.id === active.id;
            return (
              <Link
                key={c.id}
                href={landingHref(c)}
                onClick={() => setOpen(false)}
                className={clsx(
                  'flex items-center gap-2.5 px-3 py-2.5 text-body-md transition',
                  isActive ? 'bg-primary/10 text-primary' : 'text-on-surface hover:bg-surface-container-low',
                )}
              >
                <Icon size={16} className="shrink-0 opacity-70" />
                <span className="min-w-0 flex-1 truncate">{c.label.replace(/^Certificación de\s+/i, '')}</span>
                {isActive && <Check size={15} className="shrink-0 text-primary" />}
              </Link>
            );
          })}
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 border-t border-outline-variant px-3 py-2.5 text-body-md text-on-surface-variant transition hover:bg-surface-container-low"
          >
            <LayoutGrid size={16} className="shrink-0 opacity-70" />
            <span>Todas las certificaciones</span>
          </Link>
        </div>
      )}
    </div>
  );
}

/* ─────────────── Árbol desplegable de un menú (panel claro) ─────────────── */
function MenuTree({ items, depth, onNavigate }: { items: NavItem[]; depth: number; onNavigate: () => void }) {
  const pathname = usePathname();
  return (
    <div className="space-y-0.5">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.href ? pathname === item.href : false;
        return (
          <div key={item.label}>
            {item.href ? (
              <Link
                href={item.href}
                onClick={onNavigate}
                className={clsx(
                  'flex items-center gap-2.5 rounded py-1.5 pr-3 text-body-md transition',
                  isActive ? 'bg-primary/10 font-semibold text-primary' : 'text-on-surface hover:bg-surface-container-low',
                )}
                style={{ paddingLeft: 12 + depth * 14 }}
              >
                {Icon && <Icon size={15} className="shrink-0 opacity-70" />}
                <span className="truncate">{item.label}</span>
              </Link>
            ) : (
              <div
                className="flex items-center gap-2 py-1.5 pr-3 text-label-caps uppercase tracking-wider text-on-surface-variant"
                style={{ paddingLeft: 12 + depth * 14 }}
              >
                {Icon && <Icon size={14} className="shrink-0 opacity-60" />}
                <span className="truncate">{item.label}</span>
              </div>
            )}
            {item.children?.length ? (
              <MenuTree items={item.children} depth={depth + 1} onNavigate={onNavigate} />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/* ───────────────────────── Botón de menú (top bar) ─────────────────────── */
function MenuButton({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));
  const Icon = item.icon;
  const isActive = subtreeContains(item, pathname);
  const hasChildren = !!item.children?.length;

  // Hoja directa (href sin hijos): enlace simple, sin desplegable.
  if (!hasChildren && item.href) {
    return (
      <Link
        href={item.href}
        className={clsx(
          'flex items-center gap-2 rounded-md px-3 py-2 text-body-md font-medium transition',
          isActive ? 'bg-white/[0.12] text-inverse-on-surface' : 'text-inverse-on-surface/75 hover:bg-white/[0.08] hover:text-inverse-on-surface',
        )}
      >
        {Icon && <Icon size={16} className="shrink-0 opacity-80" />}
        {item.label}
      </Link>
    );
  }

  // El propio nodo (si tiene href) encabeza el árbol como primera fila.
  const treeItems: NavItem[] = item.href
    ? [{ label: item.label, href: item.href, icon: item.icon }, ...(item.children ?? [])]
    : (item.children ?? []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          'flex items-center gap-2 rounded-md px-3 py-2 text-body-md font-medium transition',
          isActive || open
            ? 'bg-white/[0.12] text-inverse-on-surface'
            : 'text-inverse-on-surface/75 hover:bg-white/[0.08] hover:text-inverse-on-surface',
        )}
      >
        {Icon && <Icon size={16} className="shrink-0 opacity-80" />}
        {item.label}
        <ChevronDown size={14} className={clsx('shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-40 mt-1.5 w-64 rounded-md border border-outline-variant bg-surface-container-lowest p-1.5 shadow-ambient">
          <MenuTree items={treeItems} depth={0} onNavigate={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────── Barra superior ──────────────────────────── */
export function TopBar() {
  const pathname = usePathname();
  const active = activeCertification(pathname) ?? certifications[0];
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Atajo global Cmd/Ctrl + K.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-1 border-b border-white/5 bg-inverse-surface px-3 text-inverse-on-surface">
        <CertSwitcher />

        <span className="mx-2 hidden h-6 w-px bg-white/10 md:block" />

        <nav className="hidden min-w-0 items-center gap-0.5 md:flex">
          {active.nav.map((item) => (
            <MenuButton key={item.label} item={item} />
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-body-md text-inverse-on-surface/70 transition hover:bg-white/[0.08] hover:text-inverse-on-surface"
          >
            <Search size={15} className="shrink-0" />
            <span className="hidden sm:inline">Buscar…</span>
            <kbd className="hidden rounded border border-white/15 px-1.5 py-0.5 text-label-caps text-inverse-on-surface/60 sm:inline">
              Ctrl K
            </kbd>
          </button>
        </div>
      </header>

      {/* Menús del módulo en móvil (debajo de la barra). */}
      <nav className="flex items-center gap-0.5 overflow-x-auto border-b border-white/5 bg-inverse-surface px-3 py-1.5 text-inverse-on-surface md:hidden">
        {active.nav.map((item) => (
          <MenuButton key={item.label} item={item} />
        ))}
      </nav>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
