'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  CalendarClock,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { parseDetailExcelAd } from '@/features/usuarios/hallazgos/active-directory/resumen-ad/import-excel-ad';
import { buildResumenAd } from '@/features/usuarios/hallazgos/active-directory/resumen-ad/resumen-ad';
import { exportResumenAdExcel } from '@/features/usuarios/hallazgos/active-directory/export-resumen-ad';
import { SWR_KEYS } from '@/features/usuarios/hallazgos/keys';
import { idbGet } from '@/lib/idb-cache';
import type { HallazgoAplicacion } from '@/types/hallazgo';

const nf = new Intl.NumberFormat('es-PE');

interface CargaResultado {
  fileName: string;
  detailRows: HallazgoAplicacion[];
}

/** 'YYYY-MM-DD…' -> 'YYYY-MM'. */
function toMonth(fecha?: string | null): string {
  if (!fecha) return '';
  const m = fecha.match(/^(\d{4})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}` : '';
}

export default function GenerarResumenActiveDirectoryPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [carga, setCarga] = useState<CargaResultado | null>(null);

  // Mes de ejecución (mes de la fecha de corte). Se precarga desde el dataset de
  // AD persistido en IndexedDB y queda editable.
  const [mesEjecucion, setMesEjecucion] = useState('');

  useEffect(() => {
    let cancel = false;
    void (async () => {
      try {
        const env = await idbGet<{ fechaRef?: string }>(SWR_KEYS.hallazgosAd);
        const mes = toMonth(env?.fechaRef);
        if (!cancel && mes) setMesEjecucion(mes);
      } catch {
        /* sin corte persistido: se deja vacío y el usuario lo ingresa */
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  // El preview se recalcula en vivo si cambia el archivo o el mes de ejecución.
  const resumen = useMemo(
    () => (carga ? buildResumenAd(carga.detailRows, { mesEjecucion: mesEjecucion || undefined }) : null),
    [carga, mesEjecucion],
  );

  const processFile = useCallback(async (file: File) => {
    setError(null);
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      setError('El archivo debe ser .xlsx (el mismo que exporta la app).');
      return;
    }
    setProcessing(true);
    try {
      const detailRows = await parseDetailExcelAd(file);
      if (!detailRows.length) throw new Error('No se encontraron filas de datos en el archivo.');
      setCarga({ fileName: file.name, detailRows });
    } catch (err) {
      setCarga(null);
      setError(err instanceof Error ? err.message : 'No se pudo procesar el archivo.');
    } finally {
      setProcessing(false);
    }
  }, []);

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) void processFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void processFile(file);
  }

  async function handleDownload() {
    if (!carga) return;
    setDownloading(true);
    try {
      await exportResumenAdExcel(carga.detailRows, { mesEjecucion: mesEjecucion || undefined });
    } finally {
      setDownloading(false);
    }
  }

  function reset() {
    setCarga(null);
    setError(null);
  }

  return (
    <AppShell
      title="Generar Resumen"
      breadcrumb={['Certificación de Usuarios', 'Hallazgos', 'Active Directory', 'Generar Resumen']}
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-5">
        {/* Instrucciones */}
        <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5 shadow-ambient">
          <h2 className="text-headline-sm text-on-surface">¿Cómo funciona?</h2>
          <ol className="mt-3 space-y-2 text-body-md text-on-surface-variant">
            <li>
              <span className="font-semibold text-on-surface">1.</span> En{' '}
              <span className="font-semibold text-on-surface">Active Directory</span> exporta el
              Excel de detalle.
            </li>
            <li>
              <span className="font-semibold text-on-surface">2.</span> Llena la columna{' '}
              <span className="font-semibold text-on-surface">Responsable</span> con{' '}
              <code className="font-mono">GDH</code>, <code className="font-mono">ACCESOS</code> o{' '}
              <code className="font-mono">GDH | ACCESOS</code> (y{' '}
              <span className="font-semibold text-on-surface">Comentario</span> si aplica) y guarda.
            </li>
            <li>
              <span className="font-semibold text-on-surface">3.</span> Sube aquí ese mismo archivo
              y descarga el resumen por escenarios (H1_AD a H7_AD).
            </li>
          </ol>
        </div>

        {/* Mes de ejecución (para el postcese de H2) */}
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-outline-variant bg-surface-container-lowest px-5 py-4 shadow-ambient">
          <CalendarClock size={18} className="text-primary" />
          <label htmlFor="mes-ejecucion" className="text-body-md font-semibold text-on-surface">
            Mes de ejecución
          </label>
          <input
            id="mes-ejecucion"
            type="month"
            value={mesEjecucion}
            onChange={(e) => setMesEjecucion(e.target.value)}
            className="rounded-md border border-outline-variant bg-surface px-3 py-1.5 text-body-md text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
          <span className="text-body-md text-on-surface-variant">
            Se toma de la fecha de corte de AD. Filtra el postcese de H2 (cesados en ese mes).
          </span>
        </div>

        {/* Zona de carga / resultado */}
        {!carga || !resumen ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 text-center transition ${
              dragOver
                ? 'border-primary bg-primary/5'
                : 'border-outline-variant bg-surface-container-lowest hover:border-primary'
            }`}
          >
            {processing ? (
              <>
                <Loader2 size={36} className="animate-spin text-primary" />
                <p className="text-body-lg text-on-surface">Procesando archivo…</p>
              </>
            ) : (
              <>
                <UploadCloud size={36} className="text-primary" />
                <p className="text-body-lg text-on-surface">
                  Arrastra el Excel de AD aquí o haz clic para seleccionarlo
                </p>
                <p className="text-body-md text-on-surface-variant">Formato .xlsx</p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={onInputChange}
            />
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest shadow-ambient">
            <div className="flex items-center gap-2 border-b border-outline-variant bg-secondary/5 px-5 py-3 text-secondary">
              <CheckCircle2 size={18} />
              <span className="text-body-md font-semibold">Resumen listo</span>
              <span className="ml-auto flex items-center gap-1.5 text-body-md text-on-surface-variant">
                <FileSpreadsheet size={15} /> {carga.fileName}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">
              <Stat label="Registros AD" value={resumen.totalRows} />
              <Stat label="Escenarios con datos" value={resumen.rows.filter((r) => r.total > 0).length} />
              <Stat label="Total Hallazgos" value={resumen.totalHallazgos} />
            </div>

            {/* Vista previa por escenario */}
            <div className="thin-scroll max-h-72 overflow-auto border-t border-outline-variant">
              <table className="min-w-full text-table-data">
                <thead className="sticky top-0 bg-surface-container">
                  <tr className="text-left text-on-surface-variant">
                    <th className="px-4 py-2">Hoja</th>
                    <th className="px-4 py-2">Escenario</th>
                    <th className="px-4 py-2 text-right">N°</th>
                    <th className="px-4 py-2 text-right">GDH</th>
                    <th className="px-4 py-2 text-right">ACCESOS</th>
                  </tr>
                </thead>
                <tbody>
                  {resumen.rows.map((r) => (
                    <tr
                      key={r.code}
                      className={`border-t border-outline-variant/50 ${r.total === 0 ? 'text-on-surface-variant/60' : ''}`}
                    >
                      <td className="px-4 py-1.5 font-semibold text-primary">{r.code}</td>
                      <td className="max-w-[360px] truncate px-4 py-1.5 text-on-surface" title={r.title}>
                        {r.title}
                      </td>
                      <td className="px-4 py-1.5 text-right">{r.total}</td>
                      <td className="px-4 py-1.5 text-right">{r.gdh}</td>
                      <td className="px-4 py-1.5 text-right">{r.accesos}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-outline bg-surface-container-high font-semibold text-on-surface">
                    <td className="px-4 py-2" colSpan={2}>
                      TOTAL
                    </td>
                    <td className="px-4 py-2 text-right">{resumen.totalHallazgos}</td>
                    <td className="px-4 py-2 text-right">
                      {resumen.rows.reduce((a, r) => a + r.gdh, 0)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {resumen.rows.reduce((a, r) => a + r.accesos, 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-outline-variant px-5 py-4">
              <Button variant="ghost" icon={<RotateCcw size={16} />} onClick={reset}>
                Procesar otro
              </Button>
              <Button
                icon={downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                onClick={handleDownload}
                disabled={downloading}
              >
                Descargar Resumen
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-body-md text-error">
            <AlertCircle size={18} /> {error}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-outline-variant bg-surface px-4 py-3">
      <p className="text-label-caps uppercase text-on-surface-variant">{label}</p>
      <p className="text-headline-md text-on-surface">{nf.format(value)}</p>
    </div>
  );
}
