'use client';

import { notFound, useParams } from 'next/navigation';
import { HallazgoGenericView } from '@/features/generales/hallazgos/HallazgoGenericView';
import { findHallazgoRuntime } from '@/features/generales/hallazgos/runtime';

/**
 * Ruta ÚNICA de todos los hallazgos de la certificación. El segmento `[hallazgo]`
 * es el `id` del descriptor (ver features/generales/hallazgos/registry.ts).
 * Sumar un hallazgo NO requiere crear una página nueva.
 */
export default function HallazgoPage() {
  const params = useParams<{ hallazgo: string }>();
  const id = Array.isArray(params.hallazgo) ? params.hallazgo[0] : params.hallazgo;
  const hallazgo = id ? findHallazgoRuntime(id) : undefined;
  if (!hallazgo) notFound();
  return <HallazgoGenericView hallazgo={hallazgo} />;
}
