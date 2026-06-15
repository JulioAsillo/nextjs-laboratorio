'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { Check, ChevronsUpDown, LayoutGrid } from 'lucide-react';
import type { NavItem } from '@/config/navigation';
import { certifications, activeCertification, landingHref } from '@/config/certifications';

function NavNode({ item, depth }: { item: NavItem; depth: number }) {
  const pathname = usePathname();
  const Icon = item.icon;
  const hasChildren = !!item.children?.length;
  const hasHref = !!item.href;
  const isActive = item.href ? pathname === item.href : false;

  return (
    <div className={hasChildren ? 'mt-0.5' : undefined}>
      {hasHref ? (
        <Link
          href={item.href!}
          aria-current={isActive ? 'page' : undefined}
          className={clsx(
            'group relative flex items-center gap-2.5 rounded-md py-2 pr-3 text-body-md transition-all duration-150',
            isActive
              ? 'bg-primary/20 font-semibold text-inverse-on-surface'
              : 'text-inverse-on-surface/75 hover:bg-white/[0.06] hover:text-inverse-on-surface',
          )}
          style={{ paddingLeft: 14 + depth * 14 }}
        >
          <span
            className={clsx(
              'absolute inset-y-1 left-0 w-1 rounded-full bg-primary-fixed-dim transition-opacity',
              isActive ? 'opacity-100' : 'opacity-0',
            )}
          />
          {Icon && (
            <Icon
              size={16}
              className={clsx(
                'shrink-0 transition-colors',
                isActive
                  ? 'text-primary-fixed-dim'
                  : 'text-inverse-on-surface/65 group-hover:text-inverse-on-surface',
              )}
            />
          )}
          <span className="truncate">{item.label}</span>
        </Link>
      ) : (
        <div
          className="flex items-center gap-2 px-3 pb-1 pt-3 text-label-caps uppercase tracking-wider text-inverse-on-surface/80"
          style={{ paddingLeft: 12 + depth * 14 }}
        >
          {Icon && <Icon size={14} className="shrink-0 text-inverse-on-surface/60" />}
          <span className="truncate">{item.label}</span>
        </div>
      )}

      {hasChildren && (
        <div className="space-y-0.5">
          {item.children!.map((child) => (
            <NavNode key={child.label} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Switcher de certificación (estilo "app menu" de Odoo). */
function CertSwitcher() {
  const pathname = usePathname();
  const active = activeCertification(pathname) ?? certifications[0];
  const ActiveIcon = active.icon;

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left transition hover:bg-white/[0.07]"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-on-primary shadow-ambient">
          <ActiveIcon size={16} />
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block text-label-caps uppercase tracking-wider text-inverse-on-surface/55">
            Certificación
          </span>
          <span className="block truncate text-body-md font-semibold text-inverse-on-surface">
            {active.label.replace(/^Certificación de\s+/i, '')}
          </span>
        </span>
        <ChevronsUpDown size={15} className="shrink-0 text-inverse-on-surface/50" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1.5 overflow-hidden rounded-md border border-white/10 bg-inverse-surface shadow-ambient">
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
                  isActive
                    ? 'bg-primary/20 text-inverse-on-surface'
                    : 'text-inverse-on-surface/80 hover:bg-white/[0.06] hover:text-inverse-on-surface',
                )}
              >
                <Icon size={16} className="shrink-0 text-inverse-on-surface/60" />
                <span className="min-w-0 flex-1 truncate">
                  {c.label.replace(/^Certificación de\s+/i, '')}
                </span>
                {isActive && <Check size={15} className="shrink-0 text-primary-fixed-dim" />}
              </Link>
            );
          })}
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 border-t border-white/10 px-3 py-2.5 text-body-md text-inverse-on-surface/80 transition hover:bg-white/[0.06] hover:text-inverse-on-surface"
          >
            <LayoutGrid size={16} className="shrink-0 text-inverse-on-surface/60" />
            <span>Todas las certificaciones</span>
          </Link>
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const active = activeCertification(pathname) ?? certifications[0];

  return (
    <aside className="hidden h-screen w-sidebar shrink-0 flex-col border-r border-white/5 bg-inverse-surface text-inverse-on-surface md:flex">
      <div className="shrink-0 border-b border-white/10 p-3">
        <CertSwitcher />
      </div>

      <nav className="thin-scroll flex-1 space-y-0.5 overflow-y-auto px-2.5 py-3">
        {active.nav.map((item) => (
          <NavNode key={item.label} item={item} depth={0} />
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/10 px-5 py-3 text-label-caps uppercase tracking-wider text-inverse-on-surface/55">
        v0.5 · Interno
      </div>
    </aside>
  );
}
