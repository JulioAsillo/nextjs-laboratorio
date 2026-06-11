import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface AppShellProps {
  title: string;
  breadcrumb: string[];
  actions?: ReactNode;
  children: ReactNode;
}

export function AppShell({ title, breadcrumb, actions, children }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-6">
          <div>
            <nav className="text-label-caps uppercase text-on-surface-variant">
              {breadcrumb.join('  ›  ')}
            </nav>
            <h1 className="text-headline-md text-on-surface">{title}</h1>
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </header>
        <main className="flex-1 overflow-auto bg-surface p-6">{children}</main>
      </div>
    </div>
  );
}
