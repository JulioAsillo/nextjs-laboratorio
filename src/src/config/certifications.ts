import type { LucideIcon } from 'lucide-react';
import { ShieldCheck, Database, FileSearch, Upload } from 'lucide-react';
import { navigation, type NavItem } from './navigation';

/**
 * Registro de certificaciones (estilo "apps" de Odoo).
 *
 * Cada certificación es un módulo independiente con su propio árbol de navegación
 * y su propio `basePath`. El sidebar se "scopea" a la certificación activa según
 * el pathname, y el lanzador (`/`) muestra una tarjeta por cada una.
 *
 * Para agregar una nueva certificación: añade una entrada aquí con su `nav`.
 * No hay que tocar el Sidebar ni el lanzador.
 */
export interface Certification {
  id: string;
  label: string;
  /** Descripción corta para la tarjeta del lanzador. */
  description: string;
  icon: LucideIcon;
  /** Prefijo de ruta de la certificación (p.ej. "/certificacion"). */
  basePath: string;
  /** Árbol de navegación que se muestra en el sidebar al entrar. */
  nav: NavItem[];
}

/* Navegación de "Certificación de Usuarios": reutiliza el árbol ya existente
   (los hijos del item raíz de navigation.ts), sin duplicarlo. */
const usuariosNav: NavItem[] = navigation[0]?.children ?? [];

/* Navegación genérica de "Certificación de Base de Datos". Misma estructura que
   Usuarios pero apuntando a /certificacion-bd y con dos hallazgos + cargar. */
const bdNav: NavItem[] = [
  {
    label: 'Hallazgo Base de Datos',
    href: '/certificacion-bd/hallazgos',
    icon: FileSearch,
  },
  {
    label: 'Cargar Información',
    href: '/certificacion-bd/cargar-informacion',
    icon: Upload,
  },
];

export const certifications: Certification[] = [
  {
    id: 'usuarios',
    label: 'Certificación de Usuarios',
    description: 'Hallazgos de acceso de usuarios en aplicaciones y Active Directory.',
    icon: ShieldCheck,
    basePath: '/certificacion',
    nav: usuariosNav,
  },
  {
    id: 'base-datos',
    label: 'Certificación de Base de Datos',
    description: 'Hallazgos de accesos a bases de datos y Active Directory.',
    icon: Database,
    basePath: '/certificacion-bd',
    nav: bdNav,
  },
];

/** Primer `href` que encuentra en un árbol de navegación (la "landing" del módulo). */
export function firstHref(items: NavItem[]): string | undefined {
  for (const item of items) {
    if (item.href) return item.href;
    if (item.children) {
      const nested = firstHref(item.children);
      if (nested) return nested;
    }
  }
  return undefined;
}

/** Ruta de entrada de una certificación (su primera vista con href). */
export function landingHref(cert: Certification): string {
  return firstHref(cert.nav) ?? cert.basePath;
}

/**
 * Certificación activa según el pathname. Empareja por `basePath` exacto o como
 * prefijo de segmento (evita que /certificacion-bd matchee /certificacion).
 * Si hay varias coincidencias, gana la de `basePath` más largo.
 */
export function activeCertification(pathname: string): Certification | undefined {
  const matches = certifications.filter(
    (c) => pathname === c.basePath || pathname.startsWith(`${c.basePath}/`),
  );
  if (matches.length === 0) return undefined;
  return matches.sort((a, b) => b.basePath.length - a.basePath.length)[0];
}
