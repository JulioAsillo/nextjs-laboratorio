import type { HallazgoAplicacion } from '@/types/hallazgo';
import { palette } from '@/lib/theme';
import { KEY_AD_ESCENARIO } from './ad-columns';

export interface EscenarioStat {
  label: string;
  count: number;
  color: string;
}

export interface AdSummary {
  escenarios: EscenarioStat[];
  totalRows: number;
}

/** Colores estables por escenario conocido. */
const KNOWN: Record<string, string> = {
  'cesado activo': palette.error,
  'actividad post cese': palette.tertiary,
  'no identificado': palette.outline,
  'sin actividad 90d': palette.secondary,
  'bloqueado 180d': palette.inverseSurface,
  'contraseña no expira': palette.primary,
  'no puede cambiar contraseña': '#007da8',
};

const CYCLE = [
  palette.primary,
  palette.secondary,
  palette.tertiary,
  palette.inverseSurface,
  palette.error,
  palette.outline,
  '#007da8',
  '#bc5800',
];

function colorFor(label: string, index: number): string {
  return KNOWN[label.toLowerCase()] ?? CYCLE[index % CYCLE.length];
}

/**
 * Cuenta por escenario. En AD el campo "Escenario" puede traer varios escenarios
 * concatenados con " + " (una fila suma a cada uno de ellos).
 */
export function computeAdSummary(rows: HallazgoAplicacion[]): AdSummary {
  const counts = new Map<string, number>();

  for (let i = 0; i < rows.length; i++) {
    const esc = (rows[i][KEY_AD_ESCENARIO] ?? '').trim();
    if (!esc) continue;
    for (const part of esc.split('+')) {
      const label = part.trim();
      if (label) counts.set(label, (counts.get(label) ?? 0) + 1);
    }
  }

  const escenarios: EscenarioStat[] = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, count], index) => ({ label, count, color: colorFor(label, index) }));

  return { escenarios, totalRows: rows.length };
}
