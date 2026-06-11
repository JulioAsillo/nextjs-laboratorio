'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  UploadCloud, CheckCircle2, XCircle, Loader2, FileSpreadsheet,
  X, ChevronDown, Files, CloudUpload, Check, Table2, RefreshCw,
  Database, AlertTriangle, Layers, Trash2,
} from 'lucide-react';
import clsx from 'clsx';
import type { Fuente, UploadSlot } from '@/config/fuentes';
import { FORMATOS } from '@/config/fuentes';
import { readHeaders } from '@/lib/read-headers';
import { isAllowedFormat, validateColumns, type ColumnValidation } from '@/lib/validate-fuente';
import { uploadFuente } from '@/lib/upload-fuente';
import { mergeFilesToXlsx } from '@/lib/merge-fuente';
import { Button } from '@/components/ui/Button';

const nf = new Intl.NumberFormat('es-PE');

/* ─── localStorage helpers ─────────────────────────────────────── */
const LS_KEY = 'itsecops-upload-status-v1';
function lsRead(): Record<string, Record<string, boolean>> {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '{}'); }
  catch { return {}; }
}
function lsMarkUploaded(fuenteId: string, fileName: string) {
  const prev = lsRead();
  const next = { ...prev, [fuenteId]: { ...(prev[fuenteId] ?? {}), [fileName]: true } };
  localStorage.setItem(LS_KEY, JSON.stringify(next));
}
function lsSlotUploaded(fuenteId: string, fileName: string): boolean {
  return lsRead()[fuenteId]?.[fileName] === true;
}

/* ─── Estado de consulta al backend para esta card ─────────────── */
export type LoadStatus = 'loading' | 'ok' | 'empty' | 'error';

interface FuenteCardProps {
  fuente:       Fuente;
  loadedCount?: number;
  loadingData?: boolean;
  status?:      LoadStatus;
  onView?:      () => void;
  onLoadOne?:   () => void;
}

export function FuenteCard({ fuente, loadedCount, loadingData, status, onView, onLoadOne }: FuenteCardProps) {
  const multiSlot = fuente.slots.length > 1;
  const hasData   = (loadedCount ?? -1) >= 0;
  const canView   = (loadedCount ?? 0) > 0;
  const isError   = status === 'error' || status === 'empty';

  return (
    <div
      className={clsx(
        'flex flex-col rounded-lg border bg-surface-container-lowest p-4 shadow-ambient transition',
        isError ? 'border-error/70 bg-error/[0.03]' : 'border-outline-variant',
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileSpreadsheet size={18} className={isError ? 'text-error' : 'text-primary'} />
          <h3 className="text-headline-sm text-on-surface">{fuente.label}</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <StatusBadge status={status} />
          {hasData && (
            <span className="inline-flex items-center gap-1 rounded bg-secondary/10 px-1.5 py-0.5 text-label-caps uppercase text-secondary">
              <Database size={11} /> {nf.format(loadedCount ?? 0)}
            </span>
          )}
        </div>
      </div>

      {/* Slots */}
      <div className={clsx('mt-3 flex flex-col gap-3', multiSlot && 'gap-4')}>
        {fuente.slots.map((slot) => (
          <SlotUploader key={slot.fileName} slot={slot} fuenteId={fuente.id} showLabel={multiSlot} />
        ))}
      </div>

      {/* Footer */}
      {fuente.appsKey ? (
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-outline-variant/70 pt-3">
          <span className={clsx('text-label-caps uppercase', isError ? 'text-error' : 'text-on-surface-variant')}>
            {status === 'loading'
              ? 'Cargando…'
              : status === 'error'
              ? 'Error al consultar'
              : status === 'empty'
              ? 'Sin datos'
              : canView
              ? 'Información consultada'
              : 'Sin cargar'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onLoadOne}
              disabled={loadingData}
              aria-label="Cargar datos"
              title={isError ? 'Reintentar consulta' : 'Cargar datos de esta fuente'}
              className={clsx(
                'rounded border bg-transparent p-1.5 transition disabled:cursor-not-allowed disabled:opacity-50',
                isError
                  ? 'border-error/60 text-error hover:bg-error/10'
                  : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary',
              )}
            >
              <RefreshCw size={15} className={loadingData ? 'animate-spin' : ''} />
            </button>
            <Button
              variant="ghost"
              className="px-3 py-1.5"
              icon={<Table2 size={15} />}
              onClick={onView}
              disabled={!canView || loadingData}
              title={!canView ? 'Primero carga los datos con el botón de recarga' : undefined}
            >
              Ver datos
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 border-t border-outline-variant/70 pt-3 text-label-caps uppercase text-on-surface-variant/70">
          Vista de datos próximamente
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status?: LoadStatus }) {
  if (status === 'loading') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-surface-container px-2 py-0.5 text-label-caps uppercase text-on-surface-variant">
        <Loader2 size={11} className="animate-spin" /> Cargando
      </span>
    );
  }
  if (status === 'ok') {
    return (
      <span title="Datos consultados" className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2 py-0.5 text-label-caps uppercase text-secondary">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-secondary" />
        </span>
        Cargado
      </span>
    );
  }
  if (status === 'error' || status === 'empty') {
    return (
      <span
        title={status === 'empty' ? 'El backend no devolvió datos' : 'Error al consultar el backend'}
        className="inline-flex items-center gap-1 rounded-full bg-error/10 px-2 py-0.5 text-label-caps uppercase text-error"
      >
        <AlertTriangle size={11} /> {status === 'empty' ? 'Sin datos' : 'Error'}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-container px-2 py-0.5 text-label-caps uppercase text-on-surface-variant/60">
      Sin cargar
    </span>
  );
}

/* ─── SlotUploader ──────────────────────────────────────────────── */
type Status       = 'validating' | 'ok' | 'error';
type UploadStatus = 'idle' | 'uploading' | 'uploaded' | 'error';

interface FileEntry {
  id:            string;
  file:          File;
  status:        Status;
  validation?:   ColumnValidation;
  error?:        string;
  uploadStatus:  UploadStatus;
  uploadError?:  string;
}

type MergePhase = 'idle' | 'merging' | 'uploading' | 'done' | 'error';
interface MergeState {
  phase:       MergePhase;
  sourceCount: number;
  totalRows:   number;
  message?:    string;
  error?:      string;
}
const IDLE: MergeState = { phase: 'idle', sourceCount: 0, totalRows: 0 };

interface SlotUploaderProps {
  slot:      UploadSlot;
  fuenteId:  string;
  showLabel: boolean;
}

function SlotUploader({ slot, fuenteId, showLabel }: SlotUploaderProps) {
  const inputRef                        = useRef<HTMLInputElement>(null);
  const [dragOver,     setDragOver]     = useState(false);
  const [showCols,     setShowCols]     = useState(false);
  const [showList,     setShowList]     = useState(false);
  const [files,        setFiles]        = useState<FileEntry[]>([]);
  const [uploading,    setUploading]    = useState(false);
  const [prevUploaded, setPrevUploaded] = useState(false);
  const [merge,        setMerge]        = useState<MergeState>(IDLE);

  useEffect(() => {
    setPrevUploaded(lsSlotUploaded(fuenteId, slot.fileName));
  }, [fuenteId, slot.fileName]);

  const validFiles    = useMemo(() => files.filter((f) => f.status === 'ok'), [files]);
  const pendientes    = useMemo(() => files.filter((f) => f.status === 'ok' && f.uploadStatus !== 'uploaded'), [files]);
  const okCount       = validFiles.length;
  const errCount      = useMemo(() => files.filter((f) => f.status === 'error').length, [files]);
  const uploadedCount = useMemo(() => files.filter((f) => f.uploadStatus === 'uploaded').length, [files]);

  const validateFile = useCallback(async (file: File): Promise<FileEntry> => {
    const id   = `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`;
    const base = { id, file, uploadStatus: 'idle' as UploadStatus };
    if (!isAllowedFormat(file.name))
      return { ...base, status: 'error', error: 'Formato no permitido (.csv, .xls o .xlsx).' };
    try {
      const headers = await readHeaders(file);
      if (headers.length === 0)
        return { ...base, status: 'error', error: 'Sin cabeceras en la primera fila.' };
      const validation = validateColumns(slot.columns, headers);
      return { ...base, status: validation.ok ? 'ok' : 'error', validation };
    } catch {
      return { ...base, status: 'error', error: 'No se pudo leer el archivo.' };
    }
  }, [slot.columns]);

  const handleFiles = useCallback(async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    if (slot.multiple) setMerge(IDLE); // nuevos archivos -> reinicia estado de unificación
    const incoming = Array.from(list);
    const selected = slot.multiple ? incoming : incoming.slice(0, 1);
    const placeholders: FileEntry[] = selected.map((file, i) => ({
      id: `tmp-${Date.now()}-${i}`, file, status: 'validating', uploadStatus: 'idle',
    }));
    setFiles((prev) => (slot.multiple ? [...prev, ...placeholders] : placeholders));
    const results = await Promise.all(selected.map(validateFile));
    setFiles((prev) => {
      const withoutTmp = prev.filter((f) => !f.id.startsWith('tmp-'));
      return slot.multiple ? [...withoutTmp, ...results] : results;
    });
  }, [slot.multiple, validateFile]);

  const setEntry = useCallback((id: string, patch: Partial<FileEntry>) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }, []);

  function clearAll() {
    if (uploading) return;
    setFiles([]);
    setMerge(IDLE);
  }

  async function handleUpload() {
    if (uploading) return;

    // ── Multi-archivo (CRM, Datalake): unificar TODO en un solo .xlsx ──
    if (slot.multiple) {
      if (validFiles.length === 0) return;
      setUploading(true);
      const ids = validFiles.map((v) => v.id);
      ids.forEach((id) => setEntry(id, { uploadStatus: 'uploading', uploadError: undefined }));
      setMerge({ phase: 'merging', sourceCount: validFiles.length, totalRows: 0 });
      try {
        const merged = await mergeFilesToXlsx(
          validFiles.map((v) => v.file),
          slot.columns,
          `${slot.fileName}.xlsx`,
        );
        setMerge({ phase: 'uploading', sourceCount: merged.sourceCount, totalRows: merged.totalRows });
        const result = await uploadFuente(slot.fileName, merged.file);
        ids.forEach((id) => setEntry(id, { uploadStatus: 'uploaded' }));
        lsMarkUploaded(fuenteId, slot.fileName);
        setPrevUploaded(true);
        setMerge({ phase: 'done', sourceCount: merged.sourceCount, totalRows: merged.totalRows, message: result.mensaje });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al unificar y subir.';
        ids.forEach((id) => setEntry(id, { uploadStatus: 'error', uploadError: msg }));
        setMerge((s) => ({ ...s, phase: 'error', error: msg }));
      } finally {
        setUploading(false);
      }
      return;
    }

    // ── Un archivo: subida directa ──
    if (pendientes.length === 0) return;
    setUploading(true);
    try {
      for (const entry of pendientes) {
        setEntry(entry.id, { uploadStatus: 'uploading', uploadError: undefined });
        try {
          await uploadFuente(slot.fileName, entry.file);
          setEntry(entry.id, { uploadStatus: 'uploaded' });
          lsMarkUploaded(fuenteId, slot.fileName);
          setPrevUploaded(true);
        } catch (err) {
          setEntry(entry.id, {
            uploadStatus: 'error',
            uploadError: err instanceof Error ? err.message : 'Error al subir.',
          });
        }
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={clsx(showLabel && 'rounded-md border border-outline-variant/60 bg-surface p-3')}>
      {showLabel && (
        <div className="mb-2 flex items-center gap-1.5 text-label-caps uppercase text-on-surface-variant">
          {prevUploaded ? (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-secondary" />
            </span>
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-outline-variant" />
          )}
          {slot.label}
          {slot.multiple && (
            <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-primary">
              <Files size={11} /> Varios
            </span>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowCols((s) => !s)}
        className="flex items-center gap-1 text-label-caps uppercase text-on-surface-variant hover:text-primary"
      >
        <ChevronDown size={14} className={clsx('transition', showCols && 'rotate-180')} />
        {slot.columns.length} columnas requeridas
        {!showLabel && slot.multiple && (
          <span className="ml-1 inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-primary">
            <Files size={11} /> Varios
          </span>
        )}
      </button>
      {showCols && (
        <div className="mt-2 flex flex-wrap gap-1">
          {slot.columns.map((c) => (
            <span key={c} className="rounded bg-surface-container-low px-1.5 py-0.5 font-mono text-[11px] text-on-surface-variant">
              {c}
            </span>
          ))}
        </div>
      )}

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); void handleFiles(e.dataTransfer.files); }}
        role="button"
        tabIndex={0}
        className={clsx(
          'mt-2 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed p-4 text-center transition',
          dragOver ? 'border-primary bg-primary/5' : 'border-outline-variant hover:border-primary',
        )}
      >
        <UploadCloud size={22} className="text-primary" />
        <span className="text-body-md text-on-surface-variant">
          {slot.multiple ? 'Arrastra archivos o haz clic' : 'Arrastra el archivo o haz clic'}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept={FORMATOS.join(',')}
          multiple={slot.multiple}
          className="hidden"
          onChange={(e) => { void handleFiles(e.target.files); e.target.value = ''; }}
        />
      </div>

      {/* Resumen compacto + lista colapsable */}
      {files.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between gap-2 rounded-md border border-outline-variant/70 bg-surface-container-low px-3 py-2">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-body-md text-on-surface">
              <span className="inline-flex items-center gap-1 font-semibold">
                <Files size={14} className="text-primary" /> {files.length}
              </span>
              {okCount > 0   && <span className="text-secondary">· {okCount} válido{okCount === 1 ? '' : 's'}</span>}
              {errCount > 0  && <span className="text-error">· {errCount} con error</span>}
              {uploadedCount > 0 && <span className="inline-flex items-center gap-1 text-secondary">· <Check size={12} /> {uploadedCount} subido{uploadedCount === 1 ? '' : 's'}</span>}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {!uploading && files.length > 0 && (
                <button type="button" onClick={clearAll} aria-label="Quitar todos" title="Quitar todos"
                  className="rounded p-1 text-on-surface-variant transition hover:text-error">
                  <Trash2 size={14} />
                </button>
              )}
              <button type="button" onClick={() => setShowList((s) => !s)}
                className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-label-caps uppercase text-on-surface-variant transition hover:text-primary">
                <ChevronDown size={14} className={clsx('transition', showList && 'rotate-180')} />
                {showList ? 'Ocultar' : 'Detalle'}
              </button>
            </div>
          </div>

          {showList && (
            <ul className="thin-scroll mt-2 max-h-48 space-y-1 overflow-y-auto pr-1">
              {files.map((f) => (
                <li key={f.id} className="flex items-center gap-2 rounded-md border border-outline-variant/60 bg-surface-container-lowest px-2 py-1.5">
                  {f.status === 'validating' && <Loader2 size={14} className="shrink-0 animate-spin text-primary" />}
                  {f.status === 'ok' && f.uploadStatus !== 'uploading' && f.uploadStatus !== 'uploaded' && <CheckCircle2 size={14} className="shrink-0 text-secondary" />}
                  {f.uploadStatus === 'uploading' && <Loader2 size={14} className="shrink-0 animate-spin text-primary" />}
                  {f.uploadStatus === 'uploaded' && <Check size={14} className="shrink-0 text-secondary" />}
                  {f.status === 'error' && f.uploadStatus !== 'uploading' && <XCircle size={14} className="shrink-0 text-error" />}

                  <span className="min-w-0 flex-1 truncate text-body-md text-on-surface" title={f.file.name}>
                    {f.file.name}
                  </span>

                  {f.status === 'error' && (
                    <span
                      className="shrink-0 max-w-[40%] truncate text-label-caps uppercase text-error"
                      title={f.error ?? (f.validation?.missing.length ? `Faltan: ${f.validation.missing.join(', ')}` : 'Inválido')}
                    >
                      {f.validation?.missing.length ? `Faltan ${f.validation.missing.length}` : 'Inválido'}
                    </span>
                  )}

                  {f.uploadStatus !== 'uploaded' && (
                    <button type="button" onClick={() => setFiles((p) => p.filter((e) => e.id !== f.id))}
                      className="shrink-0 text-on-surface-variant hover:text-error" aria-label="Quitar">
                      <X size={14} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* Estado de unificación (solo multi) */}
          {slot.multiple && <MergeStatus state={merge} />}
        </div>
      )}

      {/* Botón de subida */}
      {pendientes.length > 0 && (
        <div className="mt-3">
          <Button
            className="w-full justify-center"
            icon={uploading
              ? <Loader2 size={16} className="animate-spin" />
              : slot.multiple ? <Layers size={16} /> : <CloudUpload size={16} />}
            onClick={handleUpload}
            disabled={uploading}
          >
            {slot.multiple
              ? (uploading ? 'Procesando…' : `Unificar y subir ${okCount} archivo${okCount === 1 ? '' : 's'}`)
              : `Subir ${pendientes.length} archivo${pendientes.length === 1 ? '' : 's'}${showLabel ? ` · ${slot.label}` : ''}`}
          </Button>
        </div>
      )}
    </div>
  );
}

function MergeStatus({ state }: { state: MergeState }) {
  if (state.phase === 'idle') return null;
  const { phase, sourceCount, totalRows } = state;

  const base = 'mt-2 flex items-start gap-2 rounded-md border px-3 py-2 text-body-md';

  if (phase === 'merging') {
    return (
      <div className={clsx(base, 'border-primary/30 bg-primary/5 text-primary')}>
        <Loader2 size={15} className="mt-0.5 shrink-0 animate-spin" />
        <span>Unificando {nf.format(sourceCount)} archivos en uno solo…</span>
      </div>
    );
  }
  if (phase === 'uploading') {
    return (
      <div className={clsx(base, 'border-primary/30 bg-primary/5 text-primary')}>
        <Loader2 size={15} className="mt-0.5 shrink-0 animate-spin" />
        <span>Enviando al backend como 1 archivo · {nf.format(totalRows)} filas…</span>
      </div>
    );
  }
  if (phase === 'done') {
    return (
      <div className={clsx(base, 'border-secondary/30 bg-secondary/5 text-secondary')}>
        <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
        <span>
          Subido como <strong>1 archivo</strong> · {nf.format(sourceCount)} fuentes unificadas ·{' '}
          <strong>{nf.format(totalRows)}</strong> filas.
          {state.message ? ` ${state.message}` : ''}
        </span>
      </div>
    );
  }
  return (
    <div className={clsx(base, 'border-error/30 bg-error/5 text-error')}>
      <AlertTriangle size={15} className="mt-0.5 shrink-0" />
      <span>{state.error ?? 'Error al unificar y subir.'}</span>
    </div>
  );
}