'use client';

import useSWR from 'swr';
import type { HallazgoAplicacion } from '@/types/hallazgo';

/**
 * Config compartida: fetch SOLO manual (todas las revalidaciones desactivadas).
 * Antes estaba duplicada en aplicaciones/page y active-directory/page.
 */
const SWR_CONFIG = {
  revalidateOnMount: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  revalidateIfStale: false,
} as const;

export function useHallazgos(key: string, fetcher: () => Promise<HallazgoAplicacion[]>) {
  return useSWR(key, fetcher, SWR_CONFIG);
}
