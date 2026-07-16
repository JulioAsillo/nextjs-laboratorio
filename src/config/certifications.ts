import type { LucideIcon } from 'lucide-react';
import { ShieldCheck, Database, FileSearch, FileSpreadsheet, Upload, UsersIcon, AppWindow, Network, FileStack } from 'lucide-react';
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
    children: [
      {
        label: 'Generar Resumen',
        href: '/certificacion-bd/hallazgos/generar-resumen',
        icon: FileSpreadsheet,
      },
    ],
  },
  {
    label: 'Cargar Información',
    href: '/certificacion-bd/cargar-informacion',
    icon: Upload,
  },
];

const perfilesNav: NavItem[] = [
  {
    label: 'Hallazgos',
    icon: FileSearch,
    children: [
      {
        label: 'Hallazgo de Perfiles',
        href: '/certificacion-perfiles/hallazgos/perfiles',
        icon: AppWindow,
        children: [
          {
            label: 'Generar Resumen',
            href: '/certificacion-perfiles/hallazgos/perfiles/generar-resumen',
            icon: FileSpreadsheet,
          },
        ],
      },
      {
        label: 'Activos GDH',
        href: '/certificacion-perfiles/hallazgos/activos-gdh',
        icon: Network,
      },
    ],
  },
  {
    label: 'Cargar Información',
    href: '/certificacion-perfiles/cargar-informacion',
    icon: Upload,
  },
];

/* Navegación de "Certificación de Generales y Especiales". Misma estructura que
   Usuarios y Perfiles: un grupo "Hallazgos" que contiene un item por hallazgo, y
   "Cargar Información" como hoja aparte.

   Para agregar el hallazgo Nº 2: un objeto hermano dentro de `children`. Si ese
   hallazgo tiene su "Generar Resumen", va como `children` suyo (ver Aplicaciones
   o Hallazgo de Perfiles). */
const generalesNav: NavItem[] = [
  {
    label: 'Hallazgos',
    icon: FileSearch,
    children: [
      {
        label: 'Generales y Especiales',
        href: '/certificacion-generales/hallazgos/generales-especiales',
        icon: AppWindow,
        // Cuando exista el resumen de este hallazgo:
        // children: [
        //   {
        //     label: 'Generar Resumen',
        //     href: '/certificacion-generales/hallazgos/generales-especiales/generar-resumen',
        //     icon: FileSpreadsheet,
        //   },
        // ],
      },
      // <- Hallazgo Nº 2 aquí (mismo shape).
    ],
  },
  {
    label: 'Cargar Información',
    href: '/certificacion-generales/cargar-informacion',
    icon: Upload,
  },
];

export const certifications: Certification[] = [
  {
    id: 'usuarios',
    label: 'Certificación de Usuarios',
    description: 'Hallazgos de acceso de usuarios en aplicaciones y Active Directory.',
    icon: ShieldCheck,
    basePath: '/certificacion-usuarios',
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
  {
    id: 'perfiles',
    label: 'Certificación de Perfiles',
    description: 'Auditoría de perfiles de aplicación, dueños y segregación de funciones',
    icon: UsersIcon,
    basePath: '/certificacion-perfiles',
    nav: perfilesNav,
  },
  {
    id: 'generales-especiales',
    label: 'Certificación de Generales y Especiales',
    description: 'Hallazgos de la certificación de Generales y Especiales.',
    icon: FileStack,
    basePath: '/certificacion-generales',
    nav: generalesNav,
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

/**
 * Cadena de items de navegación (de raíz a hoja) cuyo subárbol coincide con el
 * pathname. Recorre primero los hijos para que gane la coincidencia más
 * profunda (la hoja real), y luego el href propio del nodo.
 *
 * Ej.: en /certificacion-usuarios/hallazgos/active-directory/generar-resumen
 * devuelve [Hallazgos, Active Directory, Generar Resumen].
 */
export function activeTrail(items: NavItem[], pathname: string): NavItem[] {
  for (const item of items) {
    if (item.children?.length) {
      const childTrail = activeTrail(item.children, pathname);
      if (childTrail.length) return [item, ...childTrail];
    }
    if (item.href && (pathname === item.href || pathname.startsWith( `${item.href}/`))) {
      return [item];
    }
  }
  return [];
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
