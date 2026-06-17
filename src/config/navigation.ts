import type { LucideIcon } from 'lucide-react';
import { ShieldCheck, FileSearch, AppWindow, Network, FileSpreadsheet, Upload } from 'lucide-react';

/**
 * Estructura jerárquica del sidebar.
 * Un item puede tener `href` (es enlace) y además `children` (despliega sub-items).
 */
export interface NavItem {
  label: string;
  href?: string;
  icon?: LucideIcon;
  children?: NavItem[];
}

export const navigation: NavItem[] = [
  {
    label: 'Certificación de Usuarios',
    icon: ShieldCheck,
    children: [
      {
        label: 'Hallazgos',
        icon: FileSearch,
        children: [
          {
            label: 'Aplicaciones',
            href: '/certificacion-usuarios/hallazgos/aplicaciones',
            icon: AppWindow,
            children: [
              {
                label: 'Generar Resumen',
                href: '/certificacion-usuarios/hallazgos/aplicaciones/generar-resumen',
                icon: FileSpreadsheet,
              },
            ],
          },
          {
            label: 'Active Directory',
            href: '/certificacion-usuarios/hallazgos/active-directory',
            icon: Network,
            children: [
              {
                label: 'Generar Resumen',
                href: '/certificacion-usuarios/hallazgos/active-directory/generar-resumen',
                icon: FileSpreadsheet,
              },
            ],
          },
        ],
      },
      {
        label: 'Cargar Información',
        href: '/certificacion-usuarios/cargar-informacion',
        icon: Upload,
      },
    ],
  },
];
