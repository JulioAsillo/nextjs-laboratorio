'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * Lee `?focus={fuenteId}` de la URL (lo genera la paleta de comandos al elegir
 * una fuente) y desplaza/resalta la card correspondiente. La card debe tener
 * `id="fuente-{fuenteId}"`.
 */
export function useFocusCard(): void {
  const params = useSearchParams();
  const focus = params.get('focus');

  useEffect(() => {
    if (!focus) return;
    const el = document.getElementById(`fuente-${focus}`);
    if (!el) return;

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const RING = ['ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-surface'];
    el.classList.add(...RING);
    const t = setTimeout(() => el.classList.remove(...RING), 2200);
    return () => clearTimeout(t);
  }, [focus]);
}
