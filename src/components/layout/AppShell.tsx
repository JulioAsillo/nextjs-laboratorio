'use client';

import { Fragment, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { activeCertification, activeTrail, landingHref } from '@/config/certifications';
import { TopBar } from './TopBar';

interface AppShellProps {
  title: string;
  /** Migas de respaldo (texto) por si la ruta no está en el árbol de navegación. */
  breadcrumb: string[];
  actions?: ReactNode;
  children: ReactNode;
}

interface Crumb {
  label: string;
  href?: string;
}

export function AppShell({ title, breadcrumb, actions, children }: AppShellProps) {
  const pathname = usePathname();
  const cert = activeCertification(pathname);
  const trail = cert ? activeTrail(cert.nav, pathname) : [];

  /* Migas derivadas automáticamente de la navegación activa (estilo Odoo): así
     el control panel SIEMPRE refleja la opción que el usuario tocó en el toolbar,
     y los segmentos son navegables. Si la ruta no está en el árbol, se usa el
     `breadcrumb` de texto que pasa la página (respaldo, sin enlaces). */
  const crumbs: Crumb[] =
    cert && trail.length
      ? [
          { label: cert.label, href: landingHref(cert) },
          ...trail.map((item) => ({ label: item.label, href: item.href })),
        ]
      : breadcrumb.map((label) => ({ label }));

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TopBar />

      <header className="flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-outline-variant bg-surface-container-lowest px-6 py-3">
        <div className="min-w-0">
          <nav
            aria-label="Ruta de navegación"
            className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-label-caps uppercase tracking-wider"
          >
            {crumbs.map((crumb, i) => {
              const isLast = i === crumbs.length - 1;
              return (
                <Fragment key={`${crumb.label}-${i}`}>
                  {i > 0 && (
                    <span aria-hidden className="select-none text-on-surface-variant/40">
                      ›
                    </span>
                  )}
                  {crumb.href && !isLast ? (
                    <Link
                      href={crumb.href}
                      className="rounded-sm text-on-surface-variant transition hover:text-primary"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span
                      aria-current={isLast ? 'page' : undefined}
                      className={clsx(
                        'truncate',
                        isLast ? 'font-semibold text-on-surface' : 'text-on-surface-variant',
                      )}
                    >
                      {crumb.label}
                    </span>
                  )}
                </Fragment>
              );
            })}
          </nav>
          <h1 className="truncate text-headline-md text-on-surface">{title}</h1>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </header>

      <main className="flex-1 overflow-auto bg-surface p-6">{children}</main>
    </div>
  );
}