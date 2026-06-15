'use client';

import { UploadCloud, FileSpreadsheet, Download, Construction, Layers } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';

/**
 * Generar Resumen (Base de Datos) — VISTA SOLO VISUAL.
 *
 * Maqueta de la interfaz a la espera del template definitivo. No procesa nada:
 * la zona de carga y el botón de descarga están deshabilitados a propósito.
 * Cuando exista el template, se conecta el import/export como en Usuarios.
 */
export function GenerarResumenBdView() {
  return (
    <AppShell
      title="Generar Resumen"
      breadcrumb={['Certificación de Base de Datos', 'Hallazgo Base de Datos', 'Generar Resumen']}
      actions={
        <span className="inline-flex items-center gap-1.5 rounded-md bg-tertiary/10 px-3 py-1.5 text-label-caps uppercase text-tertiary">
          <Construction size={14} /> Vista previa · pendiente de template
        </span>
      }
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-5">
        <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5 shadow-ambient">
          <h2 className="text-headline-sm text-on-surface">¿Cómo funcionará?</h2>
          <ol className="mt-3 space-y-2 text-body-md text-on-surface-variant">
            <li>
              <span className="font-semibold text-on-surface">1.</span> Exporta el Excel del{' '}
              <span className="font-semibold text-on-surface">Hallazgo Base de Datos</span> (hojas VIDA y GENERALES).
            </li>
            <li>
              <span className="font-semibold text-on-surface">2.</span> Completa el campo{' '}
              <span className="font-semibold text-on-surface">Responsable</span> donde corresponda y guarda.
            </li>
            <li>
              <span className="font-semibold text-on-surface">3.</span> Súbelo aquí para generar el resumen por
              escenarios (según el template que definamos).
            </li>
          </ol>
        </div>

        {/* Zona de carga (deshabilitada en la maqueta) */}
        <div
          aria-disabled
          className="flex cursor-not-allowed flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-outline-variant bg-surface-container-lowest p-10 text-center opacity-70"
        >
          <UploadCloud size={36} className="text-outline" />
          <p className="text-body-lg text-on-surface">Arrastra el Excel aquí o haz clic para seleccionarlo</p>
          <p className="inline-flex items-center gap-1.5 text-body-md text-tertiary">
            <Construction size={15} /> Disponible próximamente
          </p>
        </div>

        {/* Vista previa de la estructura que producirá el resumen */}
        <div className="overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest shadow-ambient">
          <div className="flex items-center gap-2 border-b border-outline-variant bg-surface-container px-5 py-3 text-on-surface-variant">
            <Layers size={16} className="text-primary" />
            <span className="text-body-md font-semibold text-on-surface">Estructura prevista del resumen</span>
            <span className="ml-auto text-label-caps uppercase">Mock</span>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <MockSheet title="Escenarios" icon={<FileSpreadsheet size={15} />} rows={6} cols={3} />
            <MockSheet title="Detalle (VIDA / GENERALES)" icon={<FileSpreadsheet size={15} />} rows={6} cols={4} />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-outline-variant px-5 py-4">
            <Button icon={<Download size={16} />} disabled>
              Descargar Resumen
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

/** Tabla esqueleto (placeholder) para insinuar el formato de cada hoja. */
function MockSheet({
  title,
  icon,
  rows,
  cols,
}: {
  title: string;
  icon: React.ReactNode;
  rows: number;
  cols: number;
}) {
  return (
    <div className="rounded-md border border-outline-variant bg-surface">
      <div className="flex items-center gap-1.5 border-b border-outline-variant px-3 py-2 text-label-caps uppercase text-on-surface-variant">
        {icon} {title}
      </div>
      <div className="space-y-2 p-3">
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="h-3 rounded bg-surface-container-high" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="h-2.5 rounded bg-surface-container-low" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
