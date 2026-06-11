'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { navigation, type NavItem } from '@/config/navigation';

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
            'group relative flex items-center gap-2.5 rounded-md py-2 pr-3 text-body-md transition-all duration-150 text-[#bdc8d0]',
            isActive
              ? 'bg-primary/15 font-semibold text-inverse-on-surface'
              : 'text-inverse-on-surface/65 hover:bg-white/[0.06] hover:text-inverse-on-surface',
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
                  : 'text-inverse-on-surface/50 group-hover:text-inverse-on-surface/80',
              )}
            />
          )}
          <span className="truncate">{item.label}</span>
        </Link>
      ) : (
        <div
          className="flex items-center gap-2 px-3 pb-1 pt-3 text-label-caps uppercase tracking-wider text-inverse-on-surface/70 text-[#bdc8d0]"
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

export function Sidebar() {
  return (
    <aside className="hidden h-screen w-sidebar shrink-0 flex-col border-r border-white/5 bg-inverse-surface md:flex">
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-white/10 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary font-bold text-on-primary shadow-ambient">
          C
        </div>
        <div className="leading-tight">
          <span className="block text-headline-sm text-inverse-on-surface">Certificación</span>
        </div>
      </div>

      <nav className="thin-scroll flex-1 space-y-0.5 overflow-y-auto px-2.5 py-3">
        {navigation.map((item) => (
          <NavNode key={item.label} item={item} depth={0} />
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/10 px-5 py-3 text-label-caps uppercase tracking-wider text-inverse-on-surface/55">
        v0.5 · Interno
      </div>
    </aside>
  );
}
