'use client';

import { HallazgosView } from '@/features/usuarios/hallazgos/HallazgosView';
import type { HallazgoAplicacion } from '@/types/hallazgo';
import { hallazgoSwrKey, type HallazgoRuntime } from './types';

/**
 * Vista genérica de CUALQUIER hallazgo de la Certificación de Generales y
 * Especiales. Reutiliza el cuerpo compartido `HallazgosView` (fetch manual,
 * caché IndexedDB, búsqueda, tabla virtualizada y exportación) y se configura
 * por completo desde el descriptor.
 *
 * Al no tener resumen definido todavía, se pasan referencias ESTABLES de módulo
 * que no producen resumen (requisito del `useMemo` interno de HallazgosView).
 * Cuando un hallazgo tenga resumen, se agregan `summarize`/`renderSummary` al
 * descriptor y se leen aquí.
 */
const noSummary = (_rows: HallazgoAplicacion[]): null => null;
const renderNoSummary = (): null => null;

export function HallazgoGenericView({ hallazgo }: { hallazgo: HallazgoRuntime }) {
  return (
    <HallazgosView<null>
      key={hallazgo.id}
      title={hallazgo.label}
      breadcrumb={['Certificación de Generales y Especiales', 'Hallazgos', hallazgo.label]}
      swrKey={hallazgoSwrKey(hallazgo.id)}
      fetcher={(fechaRef) => hallazgo.fetcher(fechaRef)}
      columns={hallazgo.columns}
      endpointHint={hallazgo.endpointHint}
      summarize={noSummary}
      renderSummary={renderNoSummary}
      onExport={hallazgo.onExport}
      withFechaRef={hallazgo.withFechaRef}
    />
  );
}
