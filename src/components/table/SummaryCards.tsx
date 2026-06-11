'use client';

import { Layers } from 'lucide-react';
import type { Summary } from '@/lib/summary';
import { palette } from '@/lib/theme';

const nf = new Intl.NumberFormat('es-PE');

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest p-4 shadow-ambient">
      {/* barra de acento con el color del grupo/escenario */}
      <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: color }} />
      <div className="flex items-center justify-between gap-2 pl-1.5">
        <span className="text-label-caps uppercase text-on-surface-variant">{label}</span>
        {icon}
      </div>
      <p className="pl-1.5 text-display-lg leading-none" style={{ color }}>
        {nf.format(value)}
      </p>
    </div>
  );
}

export function SummaryCards({ summary }: { summary: Summary }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      <StatCard
        label="Total de Aplicaciones"
        value={summary.totalApps}
        color={palette.primary}
        icon={<Layers size={18} style={{ color: palette.primary }} />}
      />
      {summary.escenarios.map((e) => (
        <StatCard key={e.label} label={e.label} value={e.count} color={e.color} />
      ))}
    </div>
  );
}
