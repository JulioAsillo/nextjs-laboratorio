'use client';

import { useCallback, useRef, useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { parseDetailExcel } from '@/features/hallazgos/resumen/import-excel';
import { buildResumen, type Resumen } from '@/features/hallazgos/resumen/resumen';
import { exportResumenExcel } from '@/features/hallazgos/resumen/export-resumen-excel';
import type { HallazgoAplicacion } from '@/types/hallazgo';

const nf = new Intl.NumberFormat('es-PE');

interface Resultado {
  fileName: string;
  resumen: Resumen;
  detailRows: HallazgoAplicacion[];
}

export default function GenerarResumenPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  const processFile = useCallback(async (file: File) => {
    setError(null);
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      setError('El archivo debe ser .xlsx (el mismo que exporta la app).');
      return;
    }
    setProcessing(true);
    try {
      const detailRows = await parseDetailExcel(file);
      if (!detailRows.length) throw new Error('No se encontraron filas de datos en el archivo.');
      const resumen = buildResumen(detailRows);
      setResultado({ fileName: file.name, resumen, detailRows });
    } catch (err) {
      setResultado(null);
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
    if (!resultado) return;
    setDownloading(true);
    try {
      await exportResumenExcel(resultado.resumen, resultado.detailRows);
    } finally {
      setDownloading(false);
    }
  }

  function reset() {
    setResultado(null);
    setError(null);
  }

  const total = resultado?.resumen.total;

  return (
    <AppShell
      title="Generar Resumen"
      breadcrumb={['Certificación de Usuarios', 'Hallazgos', 'Aplicaciones', 'Generar Resumen']}
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-5">
        {/* Instrucciones */}
        <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5 shadow-ambient">
          <h2 className="text-headline-sm text-on-surface">¿Cómo funciona?</h2>
          <ol className="mt-3 space-y-2 text-body-md text-on-surface-variant">
            <li>
              <span className="font-semibold text-on-surface">1.</span> En{' '}
              <span className="font-semibold text-on-surface">Aplicaciones</span> exporta el Excel
              de detalle.
            </li>
            <li>
              <span className="font-semibold text-on-surface">2.</span> Llena la columna{' '}
              <span className="font-semibold text-on-surface">Responsable</span> con{' '}
              <code className="font-mono">GDH</code> o <code className="font-mono">ACCESOS</code> y
              guarda.
            </li>
            <li>
              <span className="font-semibold text-on-surface">3.</span> Sube aquí ese mismo archivo
              y descarga el resumen por escenarios.
            </li>
          </ol>
        </div>

        {/* Zona de carga / resultado */}
        {!resultado ? (
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
                  Arrastra el Excel aquí o haz clic para seleccionarlo
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
                <FileSpreadsheet size={15} /> {resultado.fileName}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
              <Stat label="Aplicaciones" value={resultado.resumen.rows.length} />
              <Stat label="Cesados (H1)" value={total!.h1Total} />
              <Stat label="No Identificados (H2)" value={total!.h2Total} />
              <Stat label="Total Hallazgos" value={total!.h1Total + total!.h2Total} />
            </div>

            {/* Vista previa */}
            <div className="thin-scroll max-h-72 overflow-auto border-t border-outline-variant">
              <table className="min-w-full text-table-data">
                <thead className="sticky top-0 bg-surface-container">
                  <tr className="text-left text-on-surface-variant">
                    <th className="px-4 py-2">Aplicación</th>
                    <th className="px-4 py-2 text-right">H1 N°</th>
                    <th className="px-4 py-2 text-right">H1 GDH</th>
                    <th className="px-4 py-2 text-right">H1 ACC</th>
                    <th className="px-4 py-2 text-right">H2 N°</th>
                    <th className="px-4 py-2 text-right">H2 GDH</th>
                    <th className="px-4 py-2 text-right">H2 ACC</th>
                  </tr>
                </thead>
                <tbody>
                  {resultado.resumen.rows.map((r) => (
                    <tr key={r.aplicacion} className="border-t border-outline-variant/50">
                      <td className="px-4 py-1.5 text-on-surface">{r.aplicacion}</td>
                      <td className="px-4 py-1.5 text-right">{r.h1Total}</td>
                      <td className="px-4 py-1.5 text-right">{r.h1Gdh}</td>
                      <td className="px-4 py-1.5 text-right">{r.h1Accesos}</td>
                      <td className="px-4 py-1.5 text-right">{r.h2Total}</td>
                      <td className="px-4 py-1.5 text-right">{r.h2Gdh}</td>
                      <td className="px-4 py-1.5 text-right">{r.h2Accesos}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-outline bg-surface-container-high font-semibold text-on-surface">
                    <td className="px-4 py-2">TOTAL</td>
                    <td className="px-4 py-2 text-right">{total!.h1Total}</td>
                    <td className="px-4 py-2 text-right">{total!.h1Gdh}</td>
                    <td className="px-4 py-2 text-right">{total!.h1Accesos}</td>
                    <td className="px-4 py-2 text-right">{total!.h2Total}</td>
                    <td className="px-4 py-2 text-right">{total!.h2Gdh}</td>
                    <td className="px-4 py-2 text-right">{total!.h2Accesos}</td>
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
