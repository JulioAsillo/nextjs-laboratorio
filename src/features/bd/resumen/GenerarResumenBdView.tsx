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
import { parseDetailExcelBd } from './import-excel-bd';
import { buildResumenBd, type ResumenBd, type ResumenMatrix } from './resumen-bd';
import { exportResumenBdExcel } from './export-resumen-bd';
import type { HallazgoAplicacion } from '@/types/hallazgo';

const nf = new Intl.NumberFormat('es-PE');

interface Resultado {
  fileName: string;
  resumen: ResumenBd;
}

export function GenerarResumenBdView() {
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
      const { vida, generales } = await parseDetailExcelBd(file);
      if (!vida.length && !generales.length) {
        throw new Error('No se encontraron filas de datos en las hojas VIDA / GENERALES.');
      }
      setResultado({ fileName: file.name, resumen: buildResumenBd(generales, vida) });
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
      await exportResumenBdExcel(resultado.resumen.rowsVida, resultado.resumen.rowsGenerales);
    } finally {
      setDownloading(false);
    }
  }

  function reset() {
    setResultado(null);
    setError(null);
  }

  const totalRows = resultado
    ? resultado.resumen.rowsVida.length + resultado.resumen.rowsGenerales.length
    : 0;
  const totalHallazgos = resultado
    ? resultado.resumen.generales.grandTotal + resultado.resumen.vida.grandTotal
    : 0;

  return (
    <AppShell
      title="Generar Resumen"
      breadcrumb={['Certificación de Base de Datos', 'Hallazgo Base de Datos', 'Generar Resumen']}
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-5">
        {/* Instrucciones */}
        <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5 shadow-ambient">
          <h2 className="text-headline-sm text-on-surface">¿Cómo funciona?</h2>
          <ol className="mt-3 space-y-2 text-body-md text-on-surface-variant">
            <li>
              <span className="font-semibold text-on-surface">1.</span> En{' '}
              <span className="font-semibold text-on-surface">Hallazgo Base de Datos</span> exporta
              el Excel de detalle (hojas <code className="font-mono">VIDA</code> y{' '}
              <code className="font-mono">GENERALES</code>).
            </li>
            <li>
              <span className="font-semibold text-on-surface">2.</span> Llena la columna{' '}
              <span className="font-semibold text-on-surface">Responsable</span> con{' '}
              <code className="font-mono">GDH</code> o <code className="font-mono">ACCESOS</code> (y{' '}
              <span className="font-semibold text-on-surface">Comentario</span> si aplica) y guarda.
            </li>
            <li>
              <span className="font-semibold text-on-surface">3.</span> Sube aquí ese archivo y
              descarga el resumen por escenarios (GENERALES H1–H5 · VIDA H1–H3).
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
                  Arrastra el Excel de Base de Datos aquí o haz clic para seleccionarlo
                </p>
                <p className="text-body-md text-on-surface-variant">Formato .xlsx · hojas VIDA y GENERALES</p>
              </>
            )}
            <input ref={inputRef} type="file" accept=".xlsx" className="hidden" onChange={onInputChange} />
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

            <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">
              <Stat label="Registros (V+G)" value={totalRows} />
              <Stat label="Escenarios" value={resultado.resumen.generales.scenarios.length + resultado.resumen.vida.scenarios.length} />
              <Stat label="Total Hallazgos" value={totalHallazgos} />
            </div>

            <div className="flex flex-col gap-5 border-t border-outline-variant p-5">
              <MatrixTable title="Base de Datos SOX GENERALES" matrix={resultado.resumen.generales} />
              <MatrixTable title="Base de Datos SOX VIDA" matrix={resultado.resumen.vida} />
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

/** Vista previa de una matriz (GENERALES o VIDA). Reportables muestran G/A. */
function MatrixTable({ title, matrix }: { title: string; matrix: ResumenMatrix }) {
  return (
    <div className="overflow-hidden rounded-md border border-outline-variant">
      <div className="border-b border-outline-variant bg-surface-container px-4 py-2 text-body-md font-semibold text-on-surface">
        {title}
      </div>
      <div className="thin-scroll max-h-80 overflow-auto">
        <table className="min-w-full text-table-data">
          <thead className="sticky top-0 bg-surface-container-low">
            <tr className="text-left text-on-surface-variant">
              <th className="px-3 py-2">Escenario de monitoreo</th>
              {matrix.scenarios.map((s) => (
                <th key={s.code} className="px-3 py-2 text-right" title={s.title}>
                  {s.hx}
                  {s.reportable && (
                    <span className="ml-1 text-label-caps uppercase text-on-surface-variant/70">·G/A</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.monitoreos.map((m) => (
              <tr key={m} className="border-t border-outline-variant/50">
                <td className="px-3 py-1.5 font-medium text-on-surface">{m}</td>
                {matrix.scenarios.map((s) => {
                  const c = matrix.cells[m][s.code];
                  return (
                    <td key={s.code} className="px-3 py-1.5 text-right tabular-nums">
                      {c.total}
                      {s.reportable && (
                        <span className="ml-1 text-on-surface-variant/70">
                          ({c.gdh}/{c.accesos})
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="border-t-2 border-outline bg-surface-container-high font-semibold text-on-surface">
              <td className="px-3 py-2">TOTAL</td>
              {matrix.scenarios.map((s) => {
                const t = matrix.totals[s.code];
                return (
                  <td key={s.code} className="px-3 py-2 text-right tabular-nums">
                    {t.total}
                    {s.reportable && (
                      <span className="ml-1 text-on-surface-variant/70">
                        ({t.gdh}/{t.accesos})
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
