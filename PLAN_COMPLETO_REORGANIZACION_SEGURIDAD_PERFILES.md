# Plan Completo: Reorganización + Seguridad + Certificación de Perfiles

**Proyecto:** nextjs-laboratorio v0.6 → v0.7  
**Fecha:** Junio 2026  
**Objetivo:** Reorganizar arquitectura, agregar capas de seguridad críticas, y lanzar módulo de Certificación de Perfiles

---

## 1. ANÁLISIS DE CAMBIOS DE CARPETAS

### 1.1 Problema Actual

```
src/app
├── certificacion/              ← Módulo Usuarios (OK)
│   ├── cargar-informacion/
│   └── hallazgos/
└── certificacion-bd/           ← Módulo BD (OK)
    ├── cargar-informacion/
    └── hallazgos/

src/features
├── cargar/                     ← PERTENECE A USUARIOS, mal ubicado
├── hallazgos/                  ← PERTENECE A USUARIOS, mal ubicado
├── bd/                         ← OK: Módulo BD
│   ├── cargar/
│   └── resumen/
```

### 1.2 Estructura Deseada

```
src/app
├── certificacion-usuarios/     ← Renombrado para claridad
│   ├── cargar-informacion/
│   └── hallazgos/
├── certificacion-bd/           ← Sin cambios
│   ├── cargar-informacion/
│   └── hallazgos/
└── certificacion-perfiles/     ← NUEVA
    ├── cargar-informacion/
    └── hallazgos/

src/features
├── usuarios/                   ← NUEVA carpeta contenedora
│   ├── cargar/                 ← Movida desde src/features/cargar
│   ├── hallazgos/              ← Movida desde src/features/hallazgos
│   └── resumen/                ← Extraída de hallazgos
├── bd/                         ← Sin cambios
│   ├── cargar/
│   ├── hallazgos/
│   └── resumen/
└── perfiles/                   ← NUEVA
    ├── cargar/
    ├── hallazgos/
    ├── resumen/
    └── data/                   ← Mock data
```

### 1.3 Archivos a Renombrar/Mover

| Archivo Actual | Nuevo Nombre | Motivo |
|---|---|---|
| `/src/app/certificacion/` | `/src/app/certificacion-usuarios/` | Claridad + consistencia |
| `/src/features/cargar/` | `/src/features/usuarios/cargar/` | Agrupar por módulo |
| `/src/features/hallazgos/` | `/src/features/usuarios/hallazgos/` | Agrupar por módulo |
| `/src/features/hallazgos/resumen/` | `/src/features/usuarios/resumen/` | Resumen es un subdominio |

### 1.4 Imports que Necesitan Actualización

**Archivos que importan desde `features/cargar`:**
```bash
grep -r "from.*features/cargar" src/ --include="*.ts" --include="*.tsx"
```

Resultado esperado:
- `src/app/certificacion/cargar-informacion/page.tsx`
- Posibles archivos en `src/config/`

**Archivos que importan desde `features/hallazgos`:**
- `src/app/certificacion/hallazgos/*/page.tsx`

**Después del movimiento:** Cambiar a:
- `from '@/features/usuarios/cargar'`
- `from '@/features/usuarios/hallazgos'`

---

## 2. MEDIDAS DE SEGURIDAD A IMPLEMENTAR

### 2.1 Medidas Críticas (Implementar YA)

Según el artículo de Rod Alexanderson, estas son aplicables a un proyecto que aún crece:

#### ✅ A. Variables de Entorno + Zod Validation

**Archivo nuevo:** `src/lib/env.ts`

```typescript
import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url().optional().default('http://localhost:8000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

export const env = envSchema.parse(process.env)
```

**Crear `.env.example`** (añadir a git):
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NODE_ENV=development
```

**`.env.local`** (agregar a `.gitignore`):
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NODE_ENV=development
```

#### ✅ B. Validación de Inputs con Zod

**Archivo nuevo:** `src/lib/schemas.ts`

```typescript
import { z } from 'zod'

// Validación para uploads de archivos
export const FileUploadSchema = z.object({
  fileName: z.string()
    .min(1, 'Nombre de archivo requerido')
    .max(255, 'Nombre demasiado largo')
    .regex(/^[\w\-. ]+$/, 'Caracteres inválidos en nombre de archivo'),
  fileSize: z.number()
    .positive('Tamaño debe ser positivo')
    .max(10 * 1024 * 1024, 'Máximo 10MB'), // 10MB
  fileType: z.string()
    .refine(
      (type) => ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(type),
      'Solo CSV y XLSX permitidos'
    ),
})

// Validación para parámetros de API
export const FechaCorteSchema = z.object({
  fechaCorte: z.string()
    .refine((date) => !isNaN(Date.parse(date)), 'Formato de fecha inválido')
    .transform((date) => new Date(date)),
})

// Validación para búsquedas/filtros
export const BusquedaSchema = z.object({
  q: z.string().max(100).optional(),
  página: z.coerce.number().int().min(1).default(1),
  límite: z.coerce.number().int().min(1).max(100).default(20),
})
```

#### ✅ C. Rate Limiting en API Routes (Preparar Infraestructura)

**Archivo nuevo:** `src/lib/rate-limit.ts`

```typescript
import { headers } from 'next/headers'

/**
 * Obtiene la IP del cliente de manera confiable (respeta X-Forwarded-For en proxy)
 */
export async function getClientIp(): Promise<string> {
  const headersList = await headers()
  return headersList.get('x-forwarded-for')?.split(',')[0].trim() || 
         headersList.get('x-real-ip') ||
         'unknown'
}

/**
 * Simulación en-memoria de rate limiting (PRODUCCIÓN: usar Redis via Upstash)
 * 
 * En desarrollo/testing: permite. En producción: implementar con Redis.
 * Ver: https://www.rodalexanderson.com/blog/seguridad-aplicaciones-nextjs#rate-limiting-en-api-routes
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

export async function checkRateLimit(
  ip: string,
  limit: number = 10,
  windowSeconds: number = 60
): Promise<{ allowed: boolean; remaining: number }> {
  if (process.env.NODE_ENV === 'development') {
    return { allowed: true, remaining: limit } // No rate limit en dev
  }

  const now = Date.now()
  const entry = rateLimitStore.get(ip)

  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + windowSeconds * 1000 })
    return { allowed: true, remaining: limit - 1 }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 }
  }

  entry.count++
  return { allowed: true, remaining: limit - entry.count }
}
```

#### ✅ D. Content Security Policy Headers

**Archivo:** `next.config.ts` (crear/reemplazar `next.config.js`)

```typescript
import type { NextConfig } from 'next'

const cspHeader = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'", // Tailwind requiere esto
  "img-src 'self' data: https:",
  "font-src 'self'",
  "connect-src 'self' localhost:8000", // Backend local en dev
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader,
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

export default nextConfig
```

#### ✅ E. Middleware de Autenticación (Base)

**Archivo nuevo:** `src/middleware.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'

/**
 * Middleware básico para proteger rutas y validar requests.
 * 
 * Fase 1: Validaciones de seguridad global
 * Fase 2: Agregar autenticación cuando exista (JWT, sesiones, etc)
 */

// Rutas públicas (sin protección)
const PUBLIC_ROUTES = ['/', '/api/health']

// Rutas que requieren autenticación en futuro
const PROTECTED_ROUTES = ['/certificacion-usuarios', '/certificacion-bd', '/certificacion-perfiles']

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Validación 1: Rate limiting global (sin bloqueador en dev)
  // TODO: Implementar cuando Upstash esté disponible

  // Validación 2: Headers de seguridad adicionales
  const response = NextResponse.next()
  
  // Agregar headers de seguridad
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

#### ✅ F. API Route Security Wrapper

**Archivo nuevo:** `src/lib/api-utils.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { ZodSchema } from 'zod'
import { getClientIp, checkRateLimit } from './rate-limit'

/**
 * Wrapper para API Routes con validación y rate limiting integrados
 */
export async function safeApiHandler<T>(
  request: NextRequest,
  handler: (request: NextRequest, data: T) => Promise<NextResponse>,
  schema?: ZodSchema,
  options: { rateLimit?: { limit?: number; windowSeconds?: number } } = {}
): Promise<NextResponse> {
  try {
    // Rate limiting
    if (options.rateLimit !== false) {
      const ip = await getClientIp()
      const { allowed } = await checkRateLimit(
        ip,
        options.rateLimit?.limit,
        options.rateLimit?.windowSeconds
      )
      
      if (!allowed) {
        return NextResponse.json(
          { error: 'Demasiadas peticiones. Intenta más tarde.' },
          { status: 429 }
        )
      }
    }

    // Validación de payload si se proporciona schema
    let validatedData: T | null = null
    if (schema) {
      try {
        const body = await request.json()
        const result = schema.safeParse(body)
        
        if (!result.success) {
          return NextResponse.json(
            { error: 'Validación fallida', details: result.error.flatten() },
            { status: 400 }
          )
        }
        
        validatedData = result.data as T
      } catch (e) {
        return NextResponse.json(
          { error: 'JSON inválido' },
          { status: 400 }
        )
      }
    }

    // Ejecutar handler
    return await handler(request, validatedData as T)
  } catch (error) {
    console.error('[API Error]', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
```

#### ✅ G. .gitignore Actualizado

Agregar/verificar en `.gitignore`:

```
# Environment variables
.env
.env.local
.env.*.local
.env.development.local
.env.test.local
.env.production.local

# Secrets
.secret
*.pem
*.key

# Build output
.next
dist
out

# Dependencies
node_modules

# IDE
.vscode
.idea
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Misc
.turbo
```

#### ✅ H. package.json: Agregar Dependencias de Seguridad

```bash
npm install --save zod jose argon2
npm install --save-dev @types/node
```

**Actualizar `package.json`:**

```json
{
  "dependencies": {
    "zod": "^3.22.4",
    "jose": "^5.0.0",
    "argon2": "^0.31.0"
  }
}
```

### 2.2 Medidas Opcionales (v0.8+)

- [ ] Implementar autenticación real (JWT httpOnly cookies)
- [ ] Implementar Rate Limiting con Upstash Redis
- [ ] Implementar CSP con Nonces
- [ ] Agregar Audit Logging
- [ ] Implementar CORS configurado

---

## 3. NUEVO MÓDULO: CERTIFICACIÓN DE PERFILES

### 3.1 Estructura del Módulo

```
src/app/certificacion-perfiles/
├── cargar-informacion/
│   └── page.tsx
├── hallazgos/
│   ├── page.tsx
│   └── generar-resumen/
│       └── page.tsx
└── layout.tsx (opcional, hereda de root)

src/features/perfiles/
├── api.ts                    ← Llamadas a backend (mockear por ahora)
├── keys.ts                   ← SWR cache keys
├── perfiles-columns.ts       ← Definición de columnas
├── components/
│   ├── PerfilesSummaryCards.tsx
│   └── (componentes específicos)
├── cargar/
│   ├── CargarPerfilesView.tsx
│   ├── endpoints.ts
│   ├── upload.ts
│   └── fuentes.ts
├── hallazgos/
│   ├── HallazgosPerfilesView.tsx
│   └── export-excel.ts
├── resumen/
│   ├── GenerarResumenView.tsx
│   └── export-resumen.ts
└── data/
    ├── mock-hallazgos.json
    └── mock-fuentes.json
```

### 3.2 Mock Data

**Archivo:** `src/features/perfiles/data/mock-hallazgos.json`

```json
{
  "data": {
    "hallazgos": [
      {
        "id": "PERF-001",
        "perfil": "Administrador de Sistemas",
        "modulo": "Active Directory",
        "hallazgo": "Permisos excesivos asignados",
        "estado": "Hallazgo",
        "fecha_deteccion": "2025-06-15",
        "responsable": "Equipo IT"
      },
      {
        "id": "PERF-002",
        "perfil": "Usuario Standard",
        "modulo": "Aplicaciones",
        "hallazgo": "Acceso a módulo no necesario",
        "estado": "Consolidado",
        "fecha_deteccion": "2025-06-10",
        "responsable": "Gerente RR.HH."
      }
    ]
  }
}
```

### 3.3 Integración en `certifications.ts`

**Archivo:** `src/config/certifications.ts` (modificación)

```typescript
// Agregar import al inicio
import { Users } from 'lucide-react'

// Nueva navegación para Perfiles
const perfilesNav: NavItem[] = [
  {
    label: 'Hallazgos de Perfiles',
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
]

// Agregar a certifications array
export const certifications: Certification[] = [
  // ... módulos existentes ...
  {
    id: 'perfiles',
    label: 'Certificación de Perfiles',
    description: 'Auditoría de perfiles de usuario y asignación de roles.',
    icon: Users,
    basePath: '/certificacion-perfiles',
    nav: perfilesNav,
  },
]
```

### 3.4 Archivos Clave del Módulo Perfiles

**Archivo:** `src/features/perfiles/api.ts`

```typescript
import { env } from '@/lib/env'

interface Hallazgo {
  id: string
  perfil: string
  modulo: string
  hallazgo: string
  estado: string
  fecha_deteccion: string
  responsable: string
}

export async function fetchHallazgosPerfiles(): Promise<Hallazgo[]> {
  // TODO: Reemplazar con endpoint real cuando esté disponible
  // return fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/perfiles/hallazgos`)
  
  // Mockear por ahora
  const mock = await import('./data/mock-hallazgos.json')
  return mock.data.hallazgos
}
```

---

## 4. CHECKLIST DE MIGRACIÓN DE CARPETAS

### Fase 1: Preparación

- [ ] Crear carpeta `src/features/usuarios/`
- [ ] Crear carpetas `src/features/usuarios/cargar/`, `hallazgos/`, `resumen/`
- [ ] Crear carpeta `src/app/certificacion-usuarios/` (copia de `certificacion/`)
- [ ] Revisar todos los imports actuales:
  ```bash
  grep -r "features/cargar" src/ --include="*.ts" --include="*.tsx" | wc -l
  grep -r "features/hallazgos" src/ --include="*.ts" --include="*.tsx" | wc -l
  ```

### Fase 2: Movimiento de Archivos

Orden de movimiento (sin perder funcionalidad):

1. **Copiar** `src/features/cargar/*` → `src/features/usuarios/cargar/`
2. **Copiar** `src/features/hallazgos/*` → `src/features/usuarios/hallazgos/`
3. **Copiar** `src/app/certificacion/*` → `src/app/certificacion-usuarios/`

### Fase 3: Actualización de Imports

**Buscar y reemplazar en todos los archivos:**

```
Old: import { ... } from '@/features/cargar/
New: import { ... } from '@/features/usuarios/cargar/'

Old: import { ... } from '@/features/hallazgos/
New: import { ... } from '@/features/usuarios/hallazgos/'
```

**Archivos afectados:**
- `src/app/certificacion-usuarios/cargar-informacion/page.tsx`
- `src/app/certificacion-usuarios/hallazgos/*/page.tsx`
- Cualquier archivo en `src/` que importe de `features/cargar` o `features/hallazgos`

### Fase 4: Actualizar Configuración

- [ ] `src/config/certifications.ts` - cambiar basePath y refs
- [ ] `src/config/navigation.ts` - actualizar pathnames
- [ ] `next.config.ts` - crear (reemplazar `.js`)

### Fase 5: Limpieza

- [ ] Eliminar `src/features/cargar/` (después de confirmar copia completa)
- [ ] Eliminar `src/features/hallazgos/` (después de confirmar copia completa)
- [ ] Eliminar `src/app/certificacion/` (después de confirmar copia completa)
- [ ] Eliminar `next.config.js` (si existe)

### Fase 6: Testing

- [ ] `npm run build` - sin errores
- [ ] `npm run dev` - navegación funciona
- [ ] Verificar que rutas antiguas redirigen si es necesario
- [ ] Verificar que SWR cache keys coinciden

---

## 5. VERIFICACIÓN FINAL: Mapping de Imports

### Antes de Eliminar Carpetas Antiguas

```bash
# Verificar que NO hay referencias a carpetas viejas
grep -r "from '@/features/cargar" src/
grep -r "from '@/features/hallazgos" src/
grep -r "from '@/app/certificacion'" src/

# Deben retornar 0 líneas
```

### Validar Nuevas Rutas

```bash
grep -r "from '@/features/usuarios/cargar" src/ | wc -l    # > 0
grep -r "from '@/features/usuarios/hallazgos" src/ | wc -l # > 0
grep -r "from '@/features/bd" src/ | wc -l                 # > 0 (sin cambios)
```

---

## 6. RESUMEN DE CAMBIOS POR VERSIÓN

### v0.6 → v0.7 (AHORA)

**Cambios Críticos:**
1. ✅ Reorganizar `features/cargar` y `features/hallazgos` bajo `features/usuarios/`
2. ✅ Renombrar `src/app/certificacion/` → `src/app/certificacion-usuarios/`
3. ✅ Agregar capas de seguridad: env validation, schemas, rate-limiting base
4. ✅ Crear `next.config.ts` con CSP headers
5. ✅ Crear nuevo módulo `Certificación de Perfiles` (mockado)
6. ✅ Actualizar `certifications.ts` con Perfiles

**Impacto:**
- 0 cambios en funcionalidad existente
- Organización más clara y escalable
- Base de seguridad establecida
- Nuevo módulo listo para endpoints reales

### v0.8 (Próxima)
- Implementar autenticación real
- Conectar Upstash Redis para rate limiting
- Implementar endpoints reales de Perfiles

---

## 7. NOTAS Y DECISIONES

### ✅ Decisiones Tomadas

1. **Por qué `src/app/certificacion-usuarios/` en lugar de `/certificacion/`?**
   - Claridad: el nombre es autodescriptivo
   - Consistencia: alinea con `/certificacion-bd/` y `/certificacion-perfiles/`
   - Escalabilidad: fácil agregar más módulos

2. **Por qué mockear Perfiles ahora?**
   - No hay endpoints backend disponibles
   - Permite parallelizar trabajo frontend/backend
   - Mock data es realista y usable para testing

3. **Por qué solo medidas de seguridad "críticas"?**
   - El proyecto aún está en etapa temprana (v0.6)
   - Medidas avanzadas (autenticación, RLS) requieren más infraestructura
   - Lo crítico: validación, CSP, rate-limit base

4. **¿Los imports se "arreglan solos"?**
   - **NO**: Necesitarás actualizar manualmente los imports
   - **SÍ**: TypeScript te mostrará todos los errores de imports rotos
   - Usa Find & Replace del IDE para hacerlo rápidamente

---

## 8. COMANDOS ÚTILES PARA LA MIGRACIÓN

```bash
# 1. Ver todos los imports de cargar
grep -rn "features/cargar" src/

# 2. Ver todos los imports de hallazgos
grep -rn "features/hallazgos" src/

# 3. Copiar carpetas (Linux/Mac)
cp -r src/features/cargar src/features/usuarios/cargar
cp -r src/features/hallazgos src/features/usuarios/hallazgos

# 4. Copiar con preservación (Git-aware)
git mv src/features/cargar src/features/usuarios/cargar
git mv src/features/hallazgos src/features/usuarios/hallazgos

# 5. Validar build después de cambios
npm run build

# 6. Ver diferencias
git diff --name-status
```

---

## Archivo: Plan de Implementación por Archivos

### CREAR (Archivos Nuevos)

```
src/lib/env.ts                                    [Validación de env vars]
src/lib/schemas.ts                                [Schemas Zod globales]
src/lib/rate-limit.ts                             [Rate limiting base]
src/lib/api-utils.ts                              [Helpers API seguros]
src/middleware.ts                                 [Middleware global]
next.config.ts                                    [Config con CSP headers]
src/features/perfiles/api.ts
src/features/perfiles/keys.ts
src/features/perfiles/perfiles-columns.ts
src/features/perfiles/components/PerfilesSummaryCards.tsx
src/features/perfiles/cargar/CargarPerfilesView.tsx
src/features/perfiles/cargar/endpoints.ts
src/features/perfiles/cargar/upload.ts
src/features/perfiles/cargar/fuentes.ts
src/features/perfiles/hallazgos/HallazgosPerfilesView.tsx
src/features/perfiles/hallazgos/export-excel.ts
src/features/perfiles/resumen/GenerarResumenView.tsx
src/features/perfiles/resumen/export-resumen.ts
src/features/perfiles/data/mock-hallazgos.json
src/app/certificacion-perfiles/layout.tsx
src/app/certificacion-perfiles/cargar-informacion/page.tsx
src/app/certificacion-perfiles/hallazgos/page.tsx
src/app/certificacion-perfiles/hallazgos/generar-resumen/page.tsx
```

### MOVER/RENOMBRAR

```
src/app/certificacion/*          → src/app/certificacion-usuarios/*
src/features/cargar/*            → src/features/usuarios/cargar/*
src/features/hallazgos/*         → src/features/usuarios/hallazgos/*
next.config.js                   → DELETE (crear next.config.ts)
```

### MODIFICAR (Actualizar Imports)

```
src/config/certifications.ts                      [Agregar Perfiles]
src/config/navigation.ts                          [Actualizar paths]
package.json                                      [Agregar dependencias]
.gitignore                                        [Agregar .env*]
src/app/layout.tsx                                [Si usa imports de features]
src/app/certificacion-usuarios/*/page.tsx        [Actualizar imports]
(Cualquier otro archivo que importe de features/cargar o features/hallazgos)
```

### ELIMINAR (Después de Confirmar)

```
src/features/cargar/
src/features/hallazgos/
src/app/certificacion/
next.config.js
```

---

## Conclusión

Este plan proporciona:

1. **Arquitectura clara**: Módulos aislados, fácil de escalar
2. **Seguridad foundacional**: Variables de entorno, validación, rate-limiting base, CSP
3. **Nuevo módulo integrado**: Perfiles con datos mockados
4. **Cero disrupciones**: Cambios organizacionales sin romper funcionalidad

El movimiento de carpetas es mecánico pero requiere actualizar imports. TypeScript te guiará con errores claros.

**Tiempo estimado**: 2-3 horas (incluye testing post-cambios)
