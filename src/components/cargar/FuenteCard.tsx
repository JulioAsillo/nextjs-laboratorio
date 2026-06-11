'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  XCircle,
  Loader2,
  FileSpreadsheet,
  X,
  ChevronDown,
  Files,
  CloudUpload,
  Check,
  Table2,
  RefreshCw,
  Database,
} from 'lucide-react';
import clsx from 'clsx';
import type { Fuente, UploadSlot } from '@/config/fuentes';
import { FORMATOS } from '@/config/fuentes';
import { readHeaders } from '@/lib/read-headers';
import { isAllowedFormat, validateColumns, type ColumnValidation } from '@/lib/validate-fuente';
import { uploadFuente } from '@/lib/upload-fuente';
import { Button } from '@/components/ui/Button';

const nf = new Intl.NumberFormat('es-PE');

/* ============================ Card ============================ */

interface FuenteCardProps {
  fuente: Fuente;
  /** Filas cargadas en memoria para su appsKey. `undefined` = aún sin cargar. */
  loadedCount?: number;
  /** Este appsKey se está cargando ahora. */
  loadingData?: boolean;
  /** Abrir el modal con el DataTable. */
  onView?: () => void;
  /** Cargar (GET) solo esta fuente. */
  onLoadOne?: () => void;
}

export function FuenteCard({ fuente, loadedCount, loadingData, onView, onLoadOne }: FuenteCardProps) {
  const multiSlot = fuente.slots.length > 1;
  const hasData = (loadedCount ?? -1) >= 0;
  const canView = (loadedCount ?? 0) > 0;

  return (
    <div className="flex flex-col rounded-lg border border-outline-variant bg-surface-container-lowest p-4 shadow-ambient transition">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileSpreadsheet size={18} className="text-primary" />
          <h3 className="text-headline-sm text-on-surface">{fuente.label}</h3>
        </div>
        {hasData && (
          <span className="inline-flex items-center gap-1 rounded bg-secondary/10 px-1.5 py-0.5 text-label-caps uppercase text-secondary">
            <Database size={11} /> {nf.format(loadedCount ?? 0)}
          </span>
        )}
      </div>

      {/* Slots de carga */}
      <div className={clsx('mt-3 flex flex-col gap-3', multiSlot && 'gap-4')}>
        {fuente.slots.map((slot) => (
          <SlotUploader key={slot.fileName} slot={slot} showLabel={multiSlot} />
        ))}
      </div>

      {/* Footer: datos */}
      {fuente.appsKey ? (
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-outline-variant/70 pt-3">
          <span className="text-label-caps uppercase text-on-surface-variant">
            {loadingData
              ? 'Cargando…'
              : hasData
                ? `${nf.format(loadedCount ?? 0)} registros`
                : 'Sin cargar'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onLoadOne}
              disabled={loadingData}
              aria-label="Cargar datos"
              title="Cargar datos de esta fuente"
              className="rounded border border-outline-variant bg-transparent p-1.5 text-on-surface-variant transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw size={15} className={loadingData ? 'animate-spin' : ''} />
            </button>
            <Button
              variant="ghost"
              className="px-3 py-1.5"
              icon={<Table2 size={15} />}
              onClick={onView}
              disabled={!canView || loadingData}
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

/* ======================== Slot de carga ======================== */

type Status = 'validating' | 'ok' | 'error';
type UploadStatus = 'idle' | 'uploading' | 'uploaded' | 'error';

interface FileEntry {
  id: string;
  file: File;
  status: Status;
  validation?: ColumnValidation;
  error?: string;
  uploadStatus: UploadStatus;
  uploadError?: string;
  uploadMessage?: string;
}

function SlotUploader({ slot, showLabel }: { slot: UploadSlot; showLabel: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showCols, setShowCols] = useState(false);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [uploading, setUploading] = useState(false);

  const pendientes = useMemo(
    () => files.filter((f) => f.status === 'ok' && f.uploadStatus !== 'uploaded'),
    [files],
  );

  const validateFile = useCallback(
    async (file: File): Promise<FileEntry> => {
      const id = `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`;
      const base = { id, file, uploadStatus: 'idle' as UploadStatus };
      if (!isAllowedFormat(file.name)) {
        return { ...base, status: 'error', error: 'Formato no permitido (usa .csv, .xls o .xlsx).' };
      }
      try {
        const headers = await readHeaders(file);
        if (headers.length === 0) {
          return { ...base, status: 'error', error: 'No se encontraron cabeceras en la primera fila.' };
        }
        const validation = validateColumns(slot.columns, headers);
        return { ...base, status: validation.ok ? 'ok' : 'error', validation };
      } catch {
        return { ...base, status: 'error', error: 'No se pudo leer el archivo.' };
      }
    },
    [slot.columns],
  );

  const handleFiles = useCallback(
    async (list: FileList | null) => {
      if (!list || list.length === 0) return;
      const incoming = Array.from(list);
      const selected = slot.multiple ? incoming : incoming.slice(0, 1);

      const placeholders: FileEntry[] = selected.map((file, i) => ({
        id: `tmp-${Date.now()}-${i}`,
        file,
        status: 'validating',
        uploadStatus: 'idle',
      }));
      setFiles((prev) => (slot.multiple ? [...prev, ...placeholders] : placeholders));

      const results = await Promise.all(selected.map(validateFile));
      setFiles((prev) => {
        const withoutTmp = prev.filter((f) => !f.id.startsWith('tmp-'));
        return slot.multiple ? [...withoutTmp, ...results] : results;
      });
    },
    [slot.multiple, validateFile],
  );

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  const setEntry = useCallback((id: string, patch: Partial<FileEntry>) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }, []);

  async function handleUpload() {
    if (pendientes.length === 0 || uploading) return;
    setUploading(true);
    try {
      for (const entry of pendientes) {
        setEntry(entry.id, { uploadStatus: 'uploading', uploadError: undefined });
        try {
          const result = await uploadFuente(slot.fileName, entry.file);
          setEntry(entry.id, { uploadStatus: 'uploaded', uploadMessage: result.mensaje });
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
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          {slot.label}
          {slot.multiple && (
            <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-primary">
              <Files size={11} /> Varios
            </span>
          )}
        </div>
      )}

      {/* Columnas requeridas (colapsable) */}
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
            <span
              key={c}
              className="rounded bg-surface-container-low px-1.5 py-0.5 font-mono text-[11px] text-on-surface-variant"
            >
              {c}
            </span>
          ))}
        </div>
      )}

      {/* Dropzone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void handleFiles(e.dataTransfer.files);
        }}
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
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {/* Lista de archivos */}
      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((f) => (
            <li key={f.id} className="rounded-md border border-outline-variant/70 bg-surface-container-lowest p-2">
              <div className="flex items-center gap-2">
                {f.status === 'validating' && <Loader2 size={15} className="animate-spin text-primary" />}
                {f.status === 'ok' && f.uploadStatus !== 'uploading' && (
                  <CheckCircle2 size={15} className="text-secondary" />
                )}
                {f.uploadStatus === 'uploading' && <Loader2 size={15} className="animate-spin text-primary" />}
                {f.status === 'error' && <XCircle size={15} className="text-error" />}
                <span className="flex-1 truncate text-body-md text-on-surface">{f.file.name}</span>
                {f.uploadStatus === 'uploaded' && (
                  <span className="inline-flex items-center gap-1 text-label-caps uppercase text-secondary">
                    <Check size={13} /> Subido
                  </span>
                )}
                {f.uploadStatus !== 'uploaded' && (
                  <button
                    type="button"
                    onClick={() => removeFile(f.id)}
                    className="text-on-surface-variant hover:text-error"
                    aria-label="Quitar"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {f.status === 'error' && f.error && (
                <p className="mt-1 pl-7 text-body-md text-error">{f.error}</p>
              )}
              {f.status === 'error' && f.validation && f.validation.missing.length > 0 && (
                <p className="mt-1 pl-7 text-body-md text-error">
                  Faltan columnas: {f.validation.missing.join(', ')}
                </p>
              )}
              {f.status === 'ok' && f.validation && f.validation.extra.length > 0 && (
                <p className="mt-1 pl-7 text-body-md text-on-surface-variant">
                  Válido. Columnas extra ignoradas: {f.validation.extra.join(', ')}
                </p>
              )}
              {f.uploadStatus === 'uploaded' && f.uploadMessage && (
                <p className="mt-1 pl-7 text-body-md text-secondary">{f.uploadMessage}</p>
              )}
              {f.uploadStatus === 'error' && f.uploadError && (
                <p className="mt-1 pl-7 text-body-md text-error">{f.uploadError}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Botón de subida */}
      {pendientes.length > 0 && (
        <div className="mt-3">
          <Button
            className="w-full justify-center"
            icon={uploading ? <Loader2 size={16} className="animate-spin" /> : <CloudUpload size={16} />}
            onClick={handleUpload}
            disabled={uploading}
          >
            Subir {pendientes.length} archivo{pendientes.length === 1 ? '' : 's'}
            {showLabel ? ` · ${slot.label}` : ''}
          </Button>
        </div>
      )}
    </div>
  );
}
