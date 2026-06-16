import type { ReactNode } from 'react';
import { TopBar } from './TopBar';

interface AppShellProps {
  title: string;
  breadcrumb: string[];
  actions?: ReactNode;
  children: ReactNode;
}

export function AppShell({ title, breadcrumb, actions, children }: AppShellProps) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TopBar />

      <header className="flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-outline-variant bg-surface-container-lowest px-6 py-3">
        <div>
          <nav className="text-label-caps uppercase text-on-surface-variant">
            {breadcrumb.join('  ›  ')}
          </nav>
          <h1 className="text-headline-md text-on-surface">{title}</h1>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </header>

      <main className="flex-1 overflow-auto bg-surface p-6">{children}</main>
    </div>
  );
}
