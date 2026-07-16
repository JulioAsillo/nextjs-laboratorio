import type { HallazgoRuntime } from './types';
import { generalesEspecialesRuntime } from './generales-especiales';

/**
 * Mapa id -> runtime. Lo consume SOLO la ruta dinámica
 * `/certificacion-generales/hallazgos/[hallazgo]`.
 *
 * Para sumar un hallazgo: una línea aquí (+ su entrada en `registry.ts`).
 * El `Record<string, ...>` se valida contra el registry en `assertRegistry()`.
 */
export const HALLAZGOS_RUNTIME: Record<string, HallazgoRuntime> = {
  [generalesEspecialesRuntime.id]: generalesEspecialesRuntime,
};

export function findHallazgoRuntime(id: string): HallazgoRuntime | undefined {
  return HALLAZGOS_RUNTIME[id];
}
