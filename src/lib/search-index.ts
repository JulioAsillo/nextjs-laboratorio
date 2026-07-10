import { certifications } from '@/config/certifications';
import type { NavItem } from '@/config/navigation';
import { fuentes, bdFuentes, perfilesFuentes, type Fuente } from '@/config/fuentes';

/**
 * Índice de búsqueda global (estilo "buscador de menús" de Odoo).
 *
 * Aplana, para TODAS las certificaciones:
 *   1. Las hojas navegables del árbol (`navigation.ts` / `certifications.ts`).
 *   2. Cada fuente de "Cargar Información" (y sus slots con etiqueta, p.ej.
 *      "AD PPS"), como deep-link `…/cargar-informacion?focus={fuenteId}`.
 *
 * Cada entrada se muestra como una ruta tipo
 *   "Certificación Usuarios › Hallazgos › Active Directory"
 * y al elegirla navega a su `href`.
 */
export interface SearchEntry {
  id: string;
  certId: string;
  /** Ruta completa de migas (incluye la certificación al inicio). */
  path: string[];
  href: string;
  /** Haystack normalizado (minúsculas, sin acentos) para el match. */
  keywords: string;
}

/** minúsculas + sin acentos, para búsquedas tolerantes ("active" ≈ "Áctive"). */
export function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** "Certificación de Usuarios" -> "Certificación Usuarios" (display de migas). */
function certDisplay(label: string): string {
  return label.replace(/^Certificación de\s+/i, 'Certificación ');
}

const FUENTES_BY_CERT: Record<string, Fuente[]> = {
  usuarios: fuentes,
  'base-datos': bdFuentes,
  perfiles: perfilesFuentes,
};

/** Recorre el árbol acumulando la ruta de etiquetas hasta cada hoja con href. */
function walkNav(
  items: NavItem[],
  ancestors: string[],
  out: (path: string[], href: string) => void,
): void {
  for (const item of items) {
    const trail = [...ancestors, item.label];
    if (item.href) out(trail, item.href);
    if (item.children?.length) walkNav(item.children, trail, out);
  }
}

function buildIndex(): SearchEntry[] {
  const entries: SearchEntry[] = [];

  for (const cert of certifications) {
    const certLabel = certDisplay(cert.label);

    // 1) Páginas del árbol de navegación.
    walkNav(cert.nav, [certLabel], (path, href) => {
      entries.push({
        id: `${cert.id}:nav:${href}`,
        certId: cert.id,
        path,
        href,
        keywords: normalize(path.join(' ')),
      });
    });

    // 2) Fuentes de "Cargar Información" como deep-links con ?focus=.
    const cargarHref = `${cert.basePath}/cargar-informacion`;
    const fuentesDeCert = FUENTES_BY_CERT[cert.id] ?? [];

    for (const fuente of fuentesDeCert) {
      const base = [certLabel, 'Cargar Información'];
      const href = `${cargarHref}?focus=${fuente.id}`;
      const slotLabels = fuente.slots.map((s) => s.label).filter(Boolean) as string[];
      const fileNames = fuente.slots.map((s) => s.fileName);
      const common = [fuente.label, fuente.appsKey ?? '', fuente.group, ...slotLabels, ...fileNames];

      if (slotLabels.length > 1) {
        // Card con varios slots etiquetados (AD, GDH…): una entrada por slot.
        for (let i = 0; i < fuente.slots.length; i++) {
          const slot = fuente.slots[i];
          const path = [...base, fuente.label, slot.label ?? `Slot ${i + 1}`];
          entries.push({
            id: `${cert.id}:fuente:${fuente.id}:${i}`,
            certId: cert.id,
            path,
            href,
            keywords: normalize([...path, ...common, slot.fileName].join(' ')),
          });
        }
      } else {
        const path = [...base, fuente.label];
        entries.push({
          id: `${cert.id}:fuente:${fuente.id}`,
          certId: cert.id,
          path,
          href,
          keywords: normalize([...path, ...common].join(' ')),
        });
      }
    }
  }

  return entries;
}

/** Índice construido una sola vez (los datos de navegación son estáticos). */
export const searchIndex: SearchEntry[] = buildIndex();

/**
 * Busca entradas que matcheen TODOS los tokens del query, ordenadas por
 * relevancia (prefijo de la última miga pesa más). Devuelve hasta `limit`.
 */
export function searchEntries(query: string, limit = 12): SearchEntry[] {
  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  const scored: { entry: SearchEntry; score: number }[] = [];
  for (const entry of searchIndex) {
    const leaf = normalize(entry.path[entry.path.length - 1]);
    let score = 0;
    let matchedAll = true;
    for (const t of tokens) {
      const idx = entry.keywords.indexOf(t);
      if (idx === -1) { matchedAll = false; break; }
      score += idx;
      if (leaf.startsWith(t)) score -= 50;
      else if (leaf.includes(t)) score -= 15;
    }
    if (matchedAll) scored.push({ entry, score });
  }

  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, limit).map((s) => s.entry);
}
