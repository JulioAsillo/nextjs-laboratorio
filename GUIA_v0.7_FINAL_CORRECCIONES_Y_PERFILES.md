# GUÍA v0.7 — Correcciones de migración + Módulo Certificación de Perfiles

**Proyecto:** `nextjs-laboratorio`
**Punto de partida real del repo:** reorganización de carpetas y archivos de seguridad **ya aplicados**, pero con bugs de integración pendientes + módulo Perfiles aún no creado.
**Objetivo de esta guía:** dejar el repo compilando y navegable, corregir los 5 bugs detectados, y agregar **Certificación de Perfiles** siguiendo el patrón real del módulo BD (no el snippet ingenuo de la guía original).

> Convención de entrega: cada bloque es un **archivo completo** listo para pegar. Los marcados con ✏️ **reemplazan** un archivo existente; los marcados con ➕ son **archivos nuevos**.

---

## PARTE A — Correcciones críticas (lo que dejó rota la migración)

### A.1 ✏️ `src/config/navigation.ts` — rutas apuntan a la carpeta vieja

**Bug:** las carpetas se renombraron a `app/certificacion-usuarios/…`, pero la navegación sigue apuntando a `/certificacion/…`. Resultado: el módulo Usuarios da **404** y el sidebar no se "scopea".

```ts
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
```

---

### A.2 ✏️ `src/config/certifications.ts` — `basePath` corregido + alta de Perfiles

**Bug 1:** `basePath: '/certificacion'` nunca matchea `/certificacion-usuarios/*`, así que `activeCertification()` no resuelve y el sidebar no se scopea.
**Bug 2 (a propósito):** aquí mismo damos de alta el módulo Perfiles, así aparece solo en el lanzador (`/`) y en el command palette (ambos derivan de este array vía `search-index.ts`). No hay que tocar el Sidebar ni la landing.

```ts
import type { LucideIcon } from 'lucide-react';
import { ShieldCheck, Database, Users, FileSearch, FileSpreadsheet, Upload } from 'lucide-react';
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
  /** Prefijo de ruta de la certificación (p.ej. "/certificacion-usuarios"). */
  basePath: string;
  /** Árbol de navegación que se muestra en el sidebar al entrar. */
  nav: NavItem[];
}

/* Navegación de "Certificación de Usuarios": reutiliza el árbol ya existente
   (los hijos del item raíz de navigation.ts), sin duplicarlo. */
const usuariosNav: NavItem[] = navigation[0]?.children ?? [];

/* Navegación genérica de "Certificación de Base de Datos". */
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

/* Navegación de "Certificación de Perfiles" (nuevo módulo, mockado). */
const perfilesNav: NavItem[] = [
  {
    label: 'Hallazgo de Perfiles',
    href: '/certificacion-perfiles/hallazgos',
    icon: FileSearch,
    children: [
      {
        label: 'Generar Resumen',
        href: '/certificacion-perfiles/hallazgos/generar-resumen',
        icon: FileSpreadsheet,
      },
    ],
  },
  {
    label: 'Cargar Información',
    href: '/certificacion-perfiles/cargar-informacion',
    icon: Upload,
  },
];

export const certifications: Certification[] = [
  {
    id: 'usuarios',
    label: 'Certificación de Usuarios',
    description: 'Hallazgos de acceso de usuarios en aplicaciones y Active Directory.',
    icon: ShieldCheck,
    basePath: '/certificacion-usuarios', // ← corregido (antes: /certificacion)
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
    description: 'Auditoría de perfiles de aplicación, dueños y segregación de funciones.',
    icon: Users,
    basePath: '/certificacion-perfiles',
    nav: perfilesNav,
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
```

---

### A.3 ✏️ `src/lib/env.ts` — valida la variable correcta y la deja usable

**Bug:** validaba `NEXT_PUBLIC_API_URL`, pero toda la app usa `NEXT_PUBLIC_API_BASE_URL`. Además nunca se importaba. Lo corregimos y agregamos las vars opcionales que usan BD y Perfiles para evitar `undefined` silenciosos.

```ts
import { z } from 'zod';

/**
 * Validación de variables de entorno con Zod.
 *
 * IMPORTANTE: el nombre debe coincidir con el que consume el código real
 * (`http.ts`, `bd/api.ts`, `perfiles/api.ts`): NEXT_PUBLIC_API_BASE_URL.
 *
 * Para que la validación corra al arrancar, importa `env` desde algún punto
 * de entrada (ver A.6, opcional). Si una var obligatoria falta, Next falla
 * el build con un mensaje claro en lugar de romper en runtime.
 */
const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url().optional().default('http://localhost:8000'),

  // Endpoints/paths configurables (mismos defaults que el código).
  NEXT_PUBLIC_BD_HALLAZGOS_ENDPOINT: z.string().optional().default('/hallazgos/dbs'),
  NEXT_PUBLIC_BD_DBS_PATH: z.string().optional().default('/datos/dbs'),
  NEXT_PUBLIC_PERFILES_HALLAZGOS_ENDPOINT: z.string().optional().default('/hallazgos/perfiles'),

  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export const env = envSchema.parse(process.env);
```

➕ **`.env.example`** (commitear, sin valores sensibles):

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
# NEXT_PUBLIC_BD_HALLAZGOS_ENDPOINT=/hallazgos/dbs
# NEXT_PUBLIC_BD_DBS_PATH=/datos/dbs
# NEXT_PUBLIC_PERFILES_HALLAZGOS_ENDPOINT=/hallazgos/perfiles
```

---

### A.4 ✏️ `next.config.ts` — CSP que no rompe `fetch` en producción

**Bug:** `connect-src 'self' localhost:8000` (1) va **sin esquema**, así que muchos navegadores no lo matchean, y (2) no incluye la URL real del backend en producción → todos los `fetch` al API quedan bloqueados por CSP. Lo derivamos de la misma env var que usa la app.

```ts
import type { NextConfig } from 'next';

/**
 * Origen del backend para el `connect-src` de la CSP. Debe coincidir con
 * NEXT_PUBLIC_API_BASE_URL (lo que realmente consume http.ts). Si no, el
 * navegador bloquea los fetch en producción.
 */
const API_ORIGIN = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

const cspHeader = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'", // Tailwind lo requiere (migrar a nonces en el futuro)
  "img-src 'self' data: https:",
  "font-src 'self'",
  `connect-src 'self' ${API_ORIGIN}`, // ← incluye el backend real (con esquema)
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: cspHeader },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
```

---

### A.5 ✏️ `src/middleware.ts` — sin headers duplicados ni variables muertas

**Bug:** repetía `X-Content-Type-Options` y `X-Frame-Options` (ya los pone `next.config.ts`) y declaraba `pathname`, `PUBLIC_ROUTES`, `PROTECTED_ROUTES` sin usarlos → posibles errores de `@typescript-eslint/no-unused-vars` al hacer `npm run build`. Lo dejamos limpio y listo para enchufar auth en v0.8.

```ts
import { NextResponse } from 'next/server';

/**
 * Middleware global. Hoy es passthrough: los headers de seguridad se aplican
 * centralizadamente en `next.config.ts` (single source of truth).
 *
 * v0.8 — aquí entrará la autenticación (JWT httpOnly + redirección):
 *   const PROTECTED = ['/certificacion-usuarios', '/certificacion-bd', '/certificacion-perfiles'];
 *   if (PROTECTED.some((p) => req.nextUrl.pathname.startsWith(p)) && !hasSession(req)) {
 *     return NextResponse.redirect(new URL('/login', req.url));
 *   }
 */
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

---

### A.6 (Opcional) Enchufar `env` en `http.ts` y quitar `argon2`

Dos mejoras de higiene que valen la pena pero tocan archivos núcleo, decide tú:

**`src/lib/http.ts`** — para que la validación de `env.ts` sirva de algo, cambia la primera línea:

```ts
// Antes:
// const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

// Después:
import { env } from '@/lib/env';
const BASE_URL = env.NEXT_PUBLIC_API_BASE_URL;
```

**`package.json`** — quita `argon2` de `dependencies` hasta v0.8. Es un módulo nativo (node-gyp) que en red corporativa con interceptación TLS puede romper el `npm install`, y hoy no se usa:

```bash
npm uninstall argon2
```

> `jose` sí puede quedarse (es JS puro y lo usarás para JWT). Sube también `"version": "0.7.0"` en `package.json`.

---

## PARTE B — Módulo Certificación de Perfiles

Clona el patrón real de BD: carga **manual** con SWR, caché en **IndexedDB**, tabla **virtualizada** por columnas (column-driven), tarjetas de escenario y export **ExcelJS** por grupos de color. La diferencia: Perfiles es de **una sola hoja** (sin pestañas Vida/Generales), lo que simplifica la vista.

> Contrato de backend **TBD**: hoy lee un mock desde `/public`. Cuando exista el endpoint, se cambia 1 archivo (`api.ts`).

### Estructura nueva

```
public/
└── mock-perfiles-hallazgos.json                    ➕

src/features/perfiles/
├── keys.ts                                         ➕
├── api.ts                                          ➕
├── perfiles-columns.ts                             ➕
├── summary.ts                                      ➕
├── export-excel.ts                                 ➕
├── HallazgosPerfilesView.tsx                       ➕
├── components/
│   └── PerfilesSummaryCards.tsx                    ➕
└── resumen/
    └── GenerarResumenPerfilesView.tsx              ➕

src/app/certificacion-perfiles/
├── hallazgos/
│   ├── page.tsx                                    ➕
│   └── generar-resumen/page.tsx                    ➕
└── cargar-informacion/page.tsx                     ➕
```

---

### B.1 ➕ `public/mock-perfiles-hallazgos.json`

Los `key` del JSON deben coincidir **exactamente** con los `key` de `perfiles-columns.ts`.

```json
{
  "data": {
    "reporte_perfiles": [
      {
        "Nombre Archivo": "perfiles_pps_2026.xlsx",
        "Perfil": "ADM_SISTEMAS",
        "Sistema": "Active Directory",
        "Tipo Perfil": "Administrador",
        "Usuarios Asignados": "14",
        "Fecha Creación": "2021-03-12",
        "Fecha Ultima Recertificación": "2024-01-10",
        "DNI Dueño": "40123456",
        "Dueño Perfil": "Gerencia TI",
        "Escenario": "Permisos Excesivos + Sin Recertificar 365d",
        "Perfil Sin Dueño": "No",
        "Permisos Excesivos": "Sí",
        "Conflicto SoD": "No",
        "Perfil Inactivo": "No",
        "Sin Recertificar 365d": "Sí",
        "Responsable": "Seguridad IT",
        "Comentario": "Revisar membresías privilegiadas."
      },
      {
        "Nombre Archivo": "perfiles_pps_2026.xlsx",
        "Perfil": "CONSULTA_RRHH",
        "Sistema": "GDH",
        "Tipo Perfil": "Consulta",
        "Usuarios Asignados": "58",
        "Fecha Creación": "2019-08-01",
        "Fecha Ultima Recertificación": "2025-11-20",
        "DNI Dueño": "",
        "Dueño Perfil": "",
        "Escenario": "Perfil Sin Dueño",
        "Perfil Sin Dueño": "Sí",
        "Permisos Excesivos": "No",
        "Conflicto SoD": "No",
        "Perfil Inactivo": "No",
        "Sin Recertificar 365d": "No",
        "Responsable": "RR.HH.",
        "Comentario": "Asignar dueño funcional."
      },
      {
        "Nombre Archivo": "perfiles_vida_2026.xlsx",
        "Perfil": "PAGOS_TOTAL",
        "Sistema": "Core Vida",
        "Tipo Perfil": "Transaccional",
        "Usuarios Asignados": "6",
        "Fecha Creación": "2020-05-22",
        "Fecha Ultima Recertificación": "2023-02-14",
        "DNI Dueño": "44788990",
        "Dueño Perfil": "Operaciones",
        "Escenario": "Conflicto SoD + Sin Recertificar 365d",
        "Perfil Sin Dueño": "No",
        "Permisos Excesivos": "No",
        "Conflicto SoD": "Sí",
        "Perfil Inactivo": "No",
        "Sin Recertificar 365d": "Sí",
        "Responsable": "Riesgo Operacional",
        "Comentario": "Crear/Aprobar pagos en el mismo perfil."
      },
      {
        "Nombre Archivo": "perfiles_vida_2026.xlsx",
        "Perfil": "LEGACY_BATCH",
        "Sistema": "Core Vida",
        "Tipo Perfil": "Servicio",
        "Usuarios Asignados": "0",
        "Fecha Creación": "2016-01-01",
        "Fecha Ultima Recertificación": "2020-01-01",
        "DNI Dueño": "",
        "Dueño Perfil": "",
        "Escenario": "Perfil Inactivo + Perfil Sin Dueño + Sin Recertificar 365d",
        "Perfil Sin Dueño": "Sí",
        "Permisos Excesivos": "No",
        "Conflicto SoD": "No",
        "Perfil Inactivo": "Sí",
        "Sin Recertificar 365d": "Sí",
        "Responsable": "Seguridad IT",
        "Comentario": "Candidato a baja."
      }
    ]
  }
}
```

---

### B.2 ➕ `src/features/perfiles/keys.ts`

```ts
/** Clave SWR del único hallazgo de la Certificación de Perfiles. */
export const PERFILES_SWR_KEYS = {
  hallazgoPerfiles: 'perfiles-hallazgo',
} as const;
```

---

### B.3 ➕ `src/features/perfiles/api.ts`

Mismo contrato que BD/AD para la fecha (`?fecha_ref=`). Hoy lee el mock de `/public`; el switch a backend real es de una línea.

```ts
import type { HallazgoAplicacion } from '@/types/hallazgo';
import { getJson } from '@/lib/http';

/**
 * Fetcher del "Hallazgo de Perfiles".
 *
 * Contrato esperado (TBD) — mismo shape que Aplicaciones/BD:
 *   GET {API_BASE}/hallazgos/perfiles?fecha_ref=YYYY-MM-DD
 *   -> { data: { reporte_perfiles: HallazgoAplicacion[] } }
 *
 * Mientras no exista el backend, se sirve un mock desde /public. Para
 * conmutar a producción: pon USE_MOCK = false (o define el endpoint real).
 */
const ENDPOINT = process.env.NEXT_PUBLIC_PERFILES_HALLAZGOS_ENDPOINT ?? '/hallazgos/perfiles';
const MOCK_URL = '/mock-perfiles-hallazgos.json';

/** Mientras el backend no exista, dejar en true. */
const USE_MOCK = true;

function pick(raw: unknown): HallazgoAplicacion[] {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const data = (obj.data && typeof obj.data === 'object' ? obj.data : obj) as Record<string, unknown>;
  for (const k of ['reporte_perfiles', 'perfiles', 'hallazgos']) {
    if (Array.isArray(data[k])) return data[k] as HallazgoAplicacion[];
  }
  return [];
}

export async function fetchHallazgosPerfiles(fechaRef?: string): Promise<HallazgoAplicacion[]> {
  if (USE_MOCK) {
    const res = await fetch(MOCK_URL, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`No se pudo cargar el mock de Perfiles (${res.status})`);
    return pick(await res.json());
  }

  // --- Producción (cuando el backend esté listo) ---
  const qs = fechaRef ? `?fecha_ref=${encodeURIComponent(fechaRef)}` : '';
  const raw = await getJson(`${ENDPOINT}${qs}`);
  return pick(raw);
}
```

---

### B.4 ➕ `src/features/perfiles/perfiles-columns.ts`

Column-driven, reutilizando el tipo `ColumnDef` y los grupos de color del tema (`C1` identidad, `C2` dueño, `C6` responsable, `C8` escenarios).

```ts
import type { ColumnDef } from '@/features/usuarios/hallazgos/aplicaciones/columns';

/**
 * Columnas del "Hallazgo de Perfiles". Los `key` coinciden EXACTAMENTE con los
 * campos del JSON (mock hoy; backend real luego). Si el backend cambia un nombre,
 * actualiza el `key` aquí — esta es la única fuente de verdad del módulo.
 *
 * Grupos de color (lib/theme.ts): C1 Identidad · C2 Dueño · C6 Responsable · C8 Escenarios.
 */

export const KEY_ESCENARIO = 'Escenario';
export const KEY_RESPONSABLE = 'Responsable';

/** Flags booleanos de escenario (orden = orden de las tarjetas-resumen). */
export const PERFILES_ESCENARIO_FLAGS = [
  'Perfil Sin Dueño',
  'Permisos Excesivos',
  'Conflicto SoD',
  'Perfil Inactivo',
  'Sin Recertificar 365d',
] as const;

const flagCol = (key: string): ColumnDef => ({ key, header: key, group: 'C8', widthPx: 150, width: 18 });

export const perfilesColumns: ColumnDef[] = [
  // C1 · Identidad del perfil
  { key: 'Nombre Archivo', header: 'Nombre Archivo', group: 'C1', widthPx: 190, width: 22 },
  { key: 'Perfil', header: 'Perfil', group: 'C1', widthPx: 180, width: 20 },
  { key: 'Sistema', header: 'Sistema', group: 'C1', widthPx: 160, width: 18 },
  { key: 'Tipo Perfil', header: 'Tipo Perfil', group: 'C1', widthPx: 150, width: 16 },
  { key: 'Usuarios Asignados', header: 'Usuarios Asignados', group: 'C1', widthPx: 160, width: 18 },
  { key: 'Fecha Creación', header: 'Fecha Creación', group: 'C1', widthPx: 150, width: 16, isDate: true },
  { key: 'Fecha Ultima Recertificación', header: 'Fecha Última Recertificación', group: 'C1', widthPx: 220, width: 24, isDate: true },

  // C2 · Dueño del perfil
  { key: 'DNI Dueño', header: 'DNI Dueño', group: 'C2', widthPx: 130, width: 14 },
  { key: 'Dueño Perfil', header: 'Dueño Perfil', group: 'C2', widthPx: 190, width: 22 },

  // C8 · Escenarios
  { key: 'Escenario', header: 'Escenario', group: 'C8', widthPx: 240, width: 28 },
  ...PERFILES_ESCENARIO_FLAGS.map(flagCol),

  // C6 · Responsable
  { key: 'Responsable', header: 'Responsable', group: 'C6', widthPx: 170, width: 20 },
  { key: 'Comentario', header: 'Comentario', group: 'C6', widthPx: 220, width: 26 },
];
```

---

### B.5 ➕ `src/features/perfiles/summary.ts`

Conteo de flags activos. Mantiene aislado el módulo (lógica propia, no importa de BD).

```ts
import type { HallazgoAplicacion } from '@/types/hallazgo';

export interface EscenarioStat {
  key: string;
  label: string;
  count: number;
}

const NEGATIVOS = new Set(['', 'no', '0', 'false', 'n', '-', 'null', 'none']);

/** Un flag se cuenta como activo si su valor no es vacío/negativo. */
export function isFlagOn(value: unknown): boolean {
  if (value == null) return false;
  return !NEGATIVOS.has(String(value).trim().toLowerCase());
}

/** Cuenta cuántas filas tienen activo cada flag de escenario. */
export function computePerfilesSummary(
  rows: HallazgoAplicacion[],
  flags: readonly string[],
): EscenarioStat[] {
  return flags.map((key) => ({
    key,
    label: key,
    count: rows.reduce((acc, row) => acc + (isFlagOn(row[key]) ? 1 : 0), 0),
  }));
}
```

---

### B.6 ➕ `src/features/perfiles/components/PerfilesSummaryCards.tsx`

```tsx
'use client';

import { AlertTriangle } from 'lucide-react';
import type { EscenarioStat } from '../summary';

const nf = new Intl.NumberFormat('es-PE');

/** Tarjetas-resumen de escenarios para el Hallazgo de Perfiles. */
export function PerfilesSummaryCards({ stats, total }: { stats: EscenarioStat[]; total: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      <div className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 shadow-ambient">
        <p className="text-label-caps uppercase text-on-surface-variant">Registros</p>
        <p className="mt-1 text-headline-md text-on-surface">{nf.format(total)}</p>
      </div>
      {stats.map((s) => (
        <div
          key={s.key}
          className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 shadow-ambient"
          title={s.label}
        >
          <p className="flex items-center gap-1 truncate text-label-caps uppercase text-on-surface-variant">
            <AlertTriangle size={11} className="shrink-0 text-tertiary" /> {s.label}
          </p>
          <p className="mt-1 text-headline-md text-tertiary">{nf.format(s.count)}</p>
        </div>
      ))}
    </div>
  );
}
```

---

### B.7 ➕ `src/features/perfiles/export-excel.ts`

```ts
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { colorGroups } from '@/lib/theme';
import { writeCell } from '@/lib/excel/cell-format';
import { styleHeader } from '@/lib/excel/style';
import type { ColumnDef } from '@/features/usuarios/hallazgos/aplicaciones/columns';
import type { HallazgoAplicacion } from '@/types/hallazgo';
import { perfilesColumns } from './perfiles-columns';

/**
 * Exporta el Hallazgo de Perfiles a un libro de una hoja ("PERFILES"),
 * con cabeceras coloreadas por grupo y fechas reales (filtrables por año).
 */
export async function exportPerfilesToExcel(
  rows: HallazgoAplicacion[],
  fileName = 'hallazgo-perfiles.xlsx',
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Certificación de Perfiles';
  workbook.created = new Date();

  const columns: ColumnDef[] = perfilesColumns;
  const sheet = workbook.addWorksheet('PERFILES', { views: [{ state: 'frozen', ySplit: 1 }] });
  sheet.columns = columns.map((c) => ({ key: c.key, width: c.width ?? 18 }));

  const headerRow = sheet.getRow(1);
  columns.forEach((col, idx) => {
    const group = colorGroups[col.group];
    const cell = headerRow.getCell(idx + 1);
    cell.value = col.header;
    styleHeader(cell, group.fill, group.text);
  });
  headerRow.height = 30;

  rows.forEach((row) => {
    const excelRow = sheet.addRow([]);
    columns.forEach((col, idx) => {
      writeCell(excelRow.getCell(idx + 1), row[col.key], col.isDate);
    });
  });

  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    fileName,
  );
}
```

---

### B.8 ➕ `src/features/perfiles/HallazgosPerfilesView.tsx`

Vista principal (una sola hoja). Misma UX que BD: estado vacío → fecha de corte → Generar (manual) → caché IndexedDB con banner → búsqueda + resumen + tabla virtualizada + Exportar.

```tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { Download, Loader2, Search, Play, CalendarClock, DatabaseZap } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/features/usuarios/hallazgos/components/DataTable';
import { useTextFilter } from '@/lib/text-filter';
import { useHallazgoCache } from '@/lib/use-hallazgo-cache';
import type { HallazgoAplicacion } from '@/types/hallazgo';
import { fetchHallazgosPerfiles } from './api';
import { PERFILES_SWR_KEYS } from './keys';
import { perfilesColumns, PERFILES_ESCENARIO_FLAGS } from './perfiles-columns';
import { computePerfilesSummary } from './summary';
import { exportPerfilesToExcel } from './export-excel';
import { PerfilesSummaryCards } from './components/PerfilesSummaryCards';

const nf = new Intl.NumberFormat('es-PE');
const dtf = new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const ENDPOINT_HINT = '/hallazgos/perfiles';
const FLAGS = [...PERFILES_ESCENARIO_FLAGS];

const SWR_MANUAL = {
  revalidateOnMount: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  revalidateIfStale: false,
} as const;

function FechaCorteField({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="inline-flex items-center gap-2 rounded border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-body-md text-on-surface-variant focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30">
      <CalendarClock size={16} className="text-primary" />
      <span className="text-label-caps uppercase">Fecha de corte</span>
      <input
        type="date"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-body-md text-on-surface outline-none disabled:opacity-50"
      />
    </label>
  );
}

export function HallazgosPerfilesView() {
  const { mutate: globalMutate } = useSWRConfig();
  const { data, error, isValidating } = useSWR<HallazgoAplicacion[]>(
    PERFILES_SWR_KEYS.hallazgoPerfiles,
    null, // fetch SOLO manual
    SWR_MANUAL,
  );

  const loaded = data !== undefined;
  const [fechaCorte, setFechaCorte] = useState('');
  const [exporting, setExporting] = useState(false);
  const [generating, setGenerating] = useState(false);

  const rows = useMemo(() => data ?? [], [data]);
  const keys = useMemo(() => perfilesColumns.map((c) => c.key), []);
  const { query, setQuery, deferredQuery, filtered, isFiltering } = useTextFilter(rows, keys);
  const stats = useMemo(() => computePerfilesSummary(filtered, FLAGS), [filtered]);

  // Persistencia en IndexedDB (sobrevive al F5).
  const cache = useHallazgoCache<HallazgoAplicacion[]>('hallazgos:perfiles');
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    if (data !== undefined) return;
    (async () => {
      const envelope = await cache.hydrate();
      if (!envelope) return;
      await globalMutate(PERFILES_SWR_KEYS.hallazgoPerfiles, envelope.data, { revalidate: false });
      cache.setMeta({ savedAt: envelope.savedAt, fechaRef: envelope.fechaRef });
      if (envelope.fechaRef) setFechaCorte(envelope.fechaRef);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generar() {
    if (generating) return;
    setGenerating(true);
    try {
      const fresh = (await globalMutate(
        PERFILES_SWR_KEYS.hallazgoPerfiles,
        fetchHallazgosPerfiles(fechaCorte || undefined),
        { revalidate: false },
      )) as HallazgoAplicacion[] | undefined;
      if (fresh) await cache.remember(fresh, fechaCorte || undefined);
    } finally {
      setGenerating(false);
    }
  }

  async function handleExport() {
    if (!loaded || exporting) return;
    setExporting(true);
    try {
      await exportPerfilesToExcel(rows);
    } finally {
      setExporting(false);
    }
  }

  const busy = generating || isValidating;

  return (
    <AppShell
      title="Hallazgo de Perfiles"
      breadcrumb={['Certificación de Perfiles', 'Hallazgo de Perfiles']}
      actions={
        loaded ? (
          <>
            <FechaCorteField value={fechaCorte} onChange={setFechaCorte} disabled={busy} />
            <Button
              variant="ghost"
              icon={busy ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              onClick={generar}
              disabled={busy}
            >
              Generar
            </Button>
            <Button
              icon={exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              onClick={handleExport}
              disabled={exporting || rows.length === 0}
            >
              Exportar Excel
            </Button>
          </>
        ) : undefined
      }
    >
      {!loaded && !busy && !error && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-outline-variant bg-surface-container-lowest p-12 text-center shadow-ambient">
          <p className="text-body-lg text-on-surface">Aún no has generado el hallazgo.</p>
          <p className="max-w-md text-body-md text-on-surface-variant">
            Elige la fecha de corte y genera. La consulta solo se ejecuta cuando lo pides.
          </p>
          <FechaCorteField value={fechaCorte} onChange={setFechaCorte} />
          <Button icon={<Play size={16} />} onClick={generar}>
            Generar Hallazgo
          </Button>
        </div>
      )}

      {busy && !loaded && (
        <div className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest p-10 text-on-surface-variant">
          <Loader2 size={18} className="animate-spin" /> Generando hallazgo…
        </div>
      )}

      {error && !loaded && (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-error/30 bg-error/5 p-6 text-body-md text-error">
          <span>
            No se pudo obtener el hallazgo. Verifica el endpoint{' '}
            <code className="font-mono">{ENDPOINT_HINT}</code> y la variable{' '}
            <code className="font-mono">NEXT_PUBLIC_API_BASE_URL</code>.
          </span>
          <Button variant="ghost" icon={<Play size={16} />} onClick={generar}>
            Reintentar
          </Button>
        </div>
      )}

      {loaded && (
        <div className="flex flex-col gap-4">
          {cache.meta && (
            <div className="flex items-center gap-2 rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-body-md text-on-surface-variant">
              <DatabaseZap size={15} className="shrink-0 text-primary" />
              <span>
                Datos en caché del {dtf.format(cache.meta.savedAt)}
                {cache.meta.fechaRef ? ` · fecha ref ${cache.meta.fechaRef}` : ''}. Pulsa{' '}
                <strong className="font-semibold text-on-surface">Generar</strong> para refrescar.
              </span>
            </div>
          )}

          <PerfilesSummaryCards stats={stats} total={filtered.length} />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar en todas las columnas…"
                className="w-full rounded border border-outline-variant bg-surface-container-lowest py-2 pl-9 pr-3 text-body-md text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <p className="flex items-center gap-2 text-body-md text-on-surface-variant">
              {isFiltering && <Loader2 size={14} className="animate-spin" />}
              {nf.format(filtered.length)} registro{filtered.length === 1 ? '' : 's'}
              {deferredQuery.trim() && ` de ${nf.format(rows.length)}`}
            </p>
          </div>

          <DataTable rows={filtered} columns={perfilesColumns} />
        </div>
      )}
    </AppShell>
  );
}
```

---

### B.9 ➕ `src/features/perfiles/resumen/GenerarResumenPerfilesView.tsx`

Placeholder consistente con el design system (no usa `bg-blue-100` ni colores fuera del tema). Queda listo para enchufar el template real cuando el backend defina el contrato del resumen.

```tsx
'use client';

import { FileSpreadsheet, Construction } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';

export function GenerarResumenPerfilesView() {
  return (
    <AppShell
      title="Generar Resumen — Perfiles"
      breadcrumb={['Certificación de Perfiles', 'Hallazgo de Perfiles', 'Generar Resumen']}
    >
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-outline-variant bg-surface-container-lowest p-12 text-center shadow-ambient">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <FileSpreadsheet size={24} />
        </span>
        <p className="text-body-lg text-on-surface">Resumen en preparación</p>
        <p className="flex items-center gap-2 max-w-md text-body-md text-on-surface-variant">
          <Construction size={16} className="shrink-0 text-tertiary" />
          La plantilla de resumen (hojas por escenario) se habilita cuando el backend
          defina el contrato. La estructura ya replica la del módulo BD.
        </p>
      </div>
    </AppShell>
  );
}
```

---

### B.10 ➕ Páginas App Router (wrappers finos, igual que BD)

`src/app/certificacion-perfiles/hallazgos/page.tsx`

```tsx
'use client';

import { HallazgosPerfilesView } from '@/features/perfiles/HallazgosPerfilesView';

export default function HallazgoPerfilesPage() {
  return <HallazgosPerfilesView />;
}
```

`src/app/certificacion-perfiles/hallazgos/generar-resumen/page.tsx`

```tsx
'use client';

import { GenerarResumenPerfilesView } from '@/features/perfiles/resumen/GenerarResumenPerfilesView';

export default function GenerarResumenPerfilesPage() {
  return <GenerarResumenPerfilesView />;
}
```

`src/app/certificacion-perfiles/cargar-informacion/page.tsx` — placeholder consistente (la carga completa se clona de `CargarBdView` una vez se definan las `fuentes` de Perfiles y su backend):

```tsx
'use client';

import { Upload, Construction } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';

export default function CargarPerfilesPage() {
  return (
    <AppShell
      title="Cargar Información — Perfiles"
      breadcrumb={['Certificación de Perfiles', 'Cargar Información']}
    >
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-outline-variant bg-surface-container-lowest p-12 text-center shadow-ambient">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Upload size={24} />
        </span>
        <p className="text-body-lg text-on-surface">Carga de fuentes en preparación</p>
        <p className="flex items-center gap-2 max-w-md text-body-md text-on-surface-variant">
          <Construction size={16} className="shrink-0 text-tertiary" />
          Pendiente definir el catálogo de fuentes de Perfiles y sus endpoints.
          La UI reutilizará los componentes de carga ya existentes (FuenteCard, DatosModal).
        </p>
      </div>
    </AppShell>
  );
}
```

---

## Verificación final

```bash
# Tipos sin errores
npx tsc --noEmit

# Build limpio
npm run build

# Dev
npm run dev
```

Comprobaciones en el navegador:

- `http://localhost:3000` → **3 tarjetas**: Usuarios, Base de Datos, **Perfiles**.
- `http://localhost:3000/certificacion-usuarios/hallazgos/aplicaciones` → **ya no da 404** (fix A.1/A.2).
- `http://localhost:3000/certificacion-perfiles/hallazgos` → estado vacío → **Generar** carga el mock → tarjetas + tabla + **Exportar Excel**.
- DevTools → Network → Headers: `Content-Security-Policy` con `connect-src` incluyendo tu API, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` (una sola vez, sin duplicar).

Búsqueda global (Ctrl/Cmd+K en `/`): Perfiles aparece automáticamente porque `search-index.ts` deriva de `certifications`.

---

## Resumen de cambios

| # | Archivo | Tipo | Motivo |
|---|---------|------|--------|
| A.1 | `src/config/navigation.ts` | ✏️ fix | Rutas `/certificacion` → `/certificacion-usuarios` (404) |
| A.2 | `src/config/certifications.ts` | ✏️ fix + feature | `basePath` correcto + alta de Perfiles |
| A.3 | `src/lib/env.ts` + `.env.example` | ✏️ fix | Valida `NEXT_PUBLIC_API_BASE_URL` (no la var muerta) |
| A.4 | `next.config.ts` | ✏️ fix | CSP `connect-src` con esquema + backend real |
| A.5 | `src/middleware.ts` | ✏️ fix | Sin headers duplicados ni vars sin usar |
| A.6 | `http.ts` / `package.json` | opcional | Enchufar `env`; quitar `argon2` |
| B.1–B.10 | `features/perfiles/*` + `app/certificacion-perfiles/*` + mock | ➕ nuevo | Módulo Perfiles (patrón BD) |

**Próximo (v0.8):** definir contrato real de Perfiles (cambiar `USE_MOCK=false` en `api.ts`), clonar `CargarBdView` para la carga de fuentes, y enchufar auth en `middleware.ts`.
