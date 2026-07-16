import { FileSearch } from 'lucide-react';
import type { HallazgoMeta } from './types';

/**
 * Registro de hallazgos de la Certificación de Generales y Especiales.
 *
 * ÚNICA fuente de verdad del sidebar y de las rutas válidas. Hoy hay UN hallazgo;
 * agregar el segundo es añadir un objeto a este array (+ su entrada en runtime.ts).
 *
 * OJO: solo metadatos. Nada de exceljs/react aquí (ver types.ts).
 */
export const HALLAZGOS_META: HallazgoMeta[] = [
  {
    id: 'generales-especiales',
    label: 'Hallazgo Generales y Especiales',
    icon: FileSearch,
    // TODO(confirmar): endpoint real del backend.
    endpointHint: '/hallazgos/generales_especiales',
    withFechaRef: false,
  },
];

export const HALLAZGO_IDS = HALLAZGOS_META.map((h) => h.id);

export function findHallazgoMeta(id: string): HallazgoMeta | undefined {
  return HALLAZGOS_META.find((h) => h.id === id);
}

/** Primer hallazgo: landing de la certificación y destino del redirect. */
export const DEFAULT_HALLAZGO_ID = HALLAZGOS_META[0].id;
