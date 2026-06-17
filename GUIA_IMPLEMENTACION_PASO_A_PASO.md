# GUÍA PRÁCTICA: Implementación Paso a Paso

**Tiempo estimado:** 3-4 horas  
**Dificultad:** Media (reorganización mecánica + integración de nuevos archivos)

---

## FASE 1: Preparación (15 minutos)

### 1.1 Crear rama de trabajo

```bash
cd nextjs-laboratorio
git checkout -b feat/v0.7-reorganizacion-seguridad-perfiles
```

### 1.2 Instalar nuevas dependencias

```bash
npm install zod jose
```

Verificar que se agregó a `package.json`:
```bash
npm list zod jose
```

### 1.3 Actualizar .gitignore

Reemplazar contenido de `.gitignore` con el archivo proporcionado.

```bash
# Copiar
cp /path/a/.gitignore .gitignore
```

---

## FASE 2: Crear Infraestructura de Seguridad (20 minutos)

Estos archivos van directamente en `src/lib/`, son usados por toda la app.

### 2.1 Crear `src/lib/env.ts`

```bash
# Copiar archivo env.ts → src/lib/env.ts
cp /path/a/env.ts src/lib/env.ts
```

**Verificar:** TypeScript no debe mostrar errores

```bash
npx tsc --noEmit
```

### 2.2 Crear `src/lib/schemas.ts`

```bash
cp /path/a/schemas.ts src/lib/schemas.ts
```

**Verificar imports:** Zod debe estar disponible

```bash
npm list zod
```

### 2.3 Crear `src/lib/rate-limit.ts`

```bash
cp /path/a/rate-limit.ts src/lib/rate-limit.ts
```

**Este archivo NO tiene dependencias externas**, solo `next/headers`.

### 2.4 Crear `src/middleware.ts`

**IMPORTANTE:** Middleware va en la raíz de `src/`, no en `src/lib/`

```bash
cp /path/a/middleware.ts src/middleware.ts
```

**Verificar path:**
```
src/
├── middleware.ts       ← Aquí, no en src/lib/
├── app/
├── features/
├── lib/
└── ...
```

### 2.5 Crear `.env.example`

```bash
cp /path/a/.env.example ./.env.example
```

**Luego, crear `.env.local` (no se commitea):**

```bash
cp .env.example .env.local
```

**Contenido de `.env.local` (para desarrollo):**
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NODE_ENV=development
```

---

## FASE 3: Actualizar Configuración de Next.js (10 minutos)

### 3.1 Crear `next.config.ts`

Reemplazar `next.config.js` con `next.config.ts`:

```bash
# Renombrar viejo
mv next.config.js next.config.js.bak

# Copiar nuevo
cp /path/a/next.config.ts ./next.config.ts
```

### 3.2 Actualizar `package.json`

Cambiar versión a v0.7.0 y agregar dependencias:

```json
{
  "version": "0.7.0",
  "dependencies": {
    // ... existentes ...
    "zod": "^3.22.4",
    "jose": "^5.0.0"
  }
}
```

### 3.3 Testing de build

```bash
npm run build
```

Debe completarse sin errores. Si hay warning sobre CSP, es normal en desarrollo.

---

## FASE 4: Crear Módulo de Certificación de Perfiles (45 minutos)

### 4.1 Crear estructura de carpetas

```bash
mkdir -p src/features/perfiles/components
mkdir -p src/features/perfiles/cargar
mkdir -p src/features/perfiles/hallazgos
mkdir -p src/features/perfiles/resumen
mkdir -p src/features/perfiles/data
mkdir -p src/app/certificacion-perfiles/hallazgos/generar-resumen
mkdir -p src/app/certificacion-perfiles/cargar-informacion
```

### 4.2 Crear archivos de features

```bash
# API y configuración
cp /path/a/perfiles-api.ts src/features/perfiles/api.ts
cp /path/a/perfiles-columns.ts src/features/perfiles/perfiles-columns.ts

# Crear keys.ts (SWR cache keys)
cat > src/features/perfiles/keys.ts << 'EOF'
export const perfilesKeys = {
  all: ['perfiles'] as const,
  hallazgos: () => [...perfilesKeys.all, 'hallazgos'] as const,
  fuentes: () => [...perfilesKeys.all, 'fuentes'] as const,
}
EOF
```

### 4.3 Crear páginas (App Router)

**Página principal - hallazgos:**

```bash
cat > src/app/certificacion-perfiles/hallazgos/page.tsx << 'EOF'
import { fetchHallazgosPerfiles } from '@/features/perfiles/api'

export default async function HallazgosPerfilesPage() {
  const hallazgos = await fetchHallazgosPerfiles()

  return (
    <div className="p-6">
      <h1 className="text-headline-md mb-4">Hallazgos de Perfiles</h1>
      
      <div className="bg-surface-container rounded-lg p-4">
        <p className="text-body-md text-secondary mb-4">
          Se encontraron <strong>{hallazgos.length}</strong> hallazgos
        </p>

        <table className="w-full text-table-data">
          <thead>
            <tr className="border-b border-outline-variant">
              <th className="text-left p-3">ID</th>
              <th className="text-left p-3">Perfil</th>
              <th className="text-left p-3">Hallazgo</th>
              <th className="text-left p-3">Estado</th>
              <th className="text-left p-3">Responsable</th>
            </tr>
          </thead>
          <tbody>
            {hallazgos.map((h) => (
              <tr key={h.id} className="border-b border-outline-variant hover:bg-surface-container-low">
                <td className="p-3">{h.id}</td>
                <td className="p-3">{h.perfil}</td>
                <td className="p-3">{h.hallazgo}</td>
                <td className="p-3">
                  <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    {h.estado}
                  </span>
                </td>
                <td className="p-3">{h.responsable}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
EOF
```

**Página de cargar información:**

```bash
cat > src/app/certificacion-perfiles/cargar-informacion/page.tsx << 'EOF'
'use client'

export default function CargarPerfilesPage() {
  return (
    <div className="p-6">
      <h1 className="text-headline-md mb-4">Cargar Información de Perfiles</h1>
      
      <div className="bg-surface-container rounded-lg p-6">
        <p className="text-body-md text-secondary mb-4">
          📋 Funcionalidad en desarrollo...
        </p>
        <p className="text-body-md">
          Pendiente: Implementar componente de carga de archivos (CSV/XLSX)
        </p>
      </div>
    </div>
  )
}
EOF
```

**Página de generar resumen:**

```bash
cat > src/app/certificacion-perfiles/hallazgos/generar-resumen/page.tsx << 'EOF'
'use client'

export default function GenerarResumenPerfilesPage() {
  return (
    <div className="p-6">
      <h1 className="text-headline-md mb-4">Generar Resumen - Perfiles</h1>
      
      <div className="bg-surface-container rounded-lg p-6">
        <p className="text-body-md text-secondary mb-4">
          📊 Generador de reportes en Excel
        </p>
        <p className="text-body-md">
          Pendiente: Implementar template de resumen (conexión con backend)
        </p>
      </div>
    </div>
  )
}
EOF
```

---

## FASE 5: Reorganización de Carpetas de Usuarios (1.5 horas)

**⚠️ CRÍTICO:** Hacer esto CON CUIDADO. Los imports se romperán temporalmente.

### 5.1 Crear carpeta contenedora

```bash
mkdir -p src/features/usuarios
```

### 5.2 Copiar archivos (NO mover aún)

```bash
# Copiar cargar
cp -r src/features/cargar/* src/features/usuarios/cargar/

# Copiar hallazgos
cp -r src/features/hallazgos/* src/features/usuarios/hallazgos/
```

### 5.3 Actualizar imports en todos los archivos

**Buscar y reemplazar en IDE:**

| Buscar | Reemplazar |
|--------|-----------|
| `from '@/features/cargar/` | `from '@/features/usuarios/cargar/'` |
| `from '@/features/hallazgos/` | `from '@/features/usuarios/hallazgos/'` |

**Archivos afectados:**
```bash
grep -r "from.*features/cargar" src/ --include="*.tsx" --include="*.ts"
grep -r "from.*features/hallazgos" src/ --include="*.tsx" --include="*.ts"
```

**Actualizar manualmente en:**
- `src/app/certificacion/cargar-informacion/page.tsx`
- `src/app/certificacion/hallazgos/*/page.tsx`
- Cualquier otro archivo que importe

### 5.4 Renombrar carpeta app/certificacion

```bash
# Si planeas mantener redirección temporal:
mv src/app/certificacion src/app/certificacion-usuarios

# O mejor, actualizar refs en navigation.ts primero
```

### 5.5 Actualizar navigation.ts

**En `src/config/navigation.ts`, cambiar:**

```typescript
// Antes
basePath: '/certificacion'

// Después
basePath: '/certificacion-usuarios'
```

### 5.6 Actualizar certifications.ts

Copiar el archivo proporcionado (certifications-updated.ts):

```bash
cp /path/a/certifications-updated.ts src/config/certifications.ts
```

**Cambiar en el archivo:**
```typescript
{
  id: 'usuarios',
  basePath: '/certificacion-usuarios', // Cambio aquí
  // ...
}
```

### 5.7 Validar build

```bash
npm run build
```

Si hay errores de imports, TypeScript te mostrará exactamente dónde están.

### 5.8 Eliminar carpetas antiguas

Primero, verificar que NO haya referencias:

```bash
grep -r "from.*features/cargar" src/ --include="*.tsx" --include="*.ts" | wc -l
grep -r "from.*features/hallazgos" src/ --include="*.tsx" --include="*.ts" | wc -l
```

Deben retornar 0 líneas.

**Solo entonces, eliminar:**

```bash
rm -rf src/features/cargar
rm -rf src/features/hallazgos
rm -rf src/app/certificacion  # Si no está renombrado ya
rm -f next.config.js.bak      # Si guardaste backup
```

---

## FASE 6: Testing Final (30 minutos)

### 6.1 Validar compilación

```bash
npm run build 2>&1 | tail -50
```

Debe completarse sin errores críticos.

### 6.2 Ejecutar en desarrollo

```bash
npm run dev
```

Abrir en navegador:
- http://localhost:3000 → Landing page
- http://localhost:3000/certificacion-usuarios/hallazgos/aplicaciones → Usuarios
- http://localhost:3000/certificacion-bd/hallazgos → BD
- http://localhost:3000/certificacion-perfiles/hallazgos → **PERFILES NUEVO**

### 6.3 Validar seguridad

Abrir DevTools (F12) → Network → Headers de respuesta

Buscar:
- ✅ `Content-Security-Policy` presente
- ✅ `X-Content-Type-Options: nosniff` presente
- ✅ `X-Frame-Options: DENY` presente

### 6.4 Validar variables de entorno

```bash
# En la página, en console:
node --eval "console.log(process.env.NEXT_PUBLIC_API_BASE_URL)"
```

Debe mostrar `http://localhost:8000` (o lo que configures).

### 6.5 Validar Zod

Crear un archivo de test rápido:

```bash
cat > test-zod.ts << 'EOF'
import { FileUploadSchema } from '@/lib/schemas'

const test = FileUploadSchema.safeParse({
  fileName: 'test.csv',
  fileSize: 1024,
  fileType: 'text/csv'
})

console.log(test)
EOF
```

Compila sin errores = ✅

---

## FASE 7: Limpieza y Commit (15 minutos)

### 7.1 Revisar cambios

```bash
git status
```

Esperado:
- Archivos nuevos: `src/lib/*.ts`, `src/middleware.ts`, `next.config.ts`, etc
- Archivos eliminados: `src/features/cargar/`, `src/features/hallazgos/`, `next.config.js`
- Archivos modificados: `package.json`, `tsconfig.json`, `certifications.ts`, etc

### 7.2 Agregar a staging

```bash
git add .
```

### 7.3 Crear commit

```bash
git commit -m "feat: v0.7 - Reorganización de carpetas + seguridad + Certificación de Perfiles

- Reorganizar features/cargar y features/hallazgos bajo features/usuarios/
- Renombrar /certificacion → /certificacion-usuarios
- Agregar capas de seguridad: validación Zod, rate limiting base, CSP headers
- Crear middleware global para seguridad
- Agregar nuevo módulo Certificación de Perfiles (mockado)
- Actualizar next.config.js → next.config.ts

Breaking changes:
- Rutas antiguas: /certificacion → /certificacion-usuarios
- Imports: features/cargar → features/usuarios/cargar
"
```

### 7.4 Crear PR

```bash
git push origin feat/v0.7-reorganizacion-seguridad-perfiles
```

Crear Pull Request en GitHub.

---

## Checklist de Validación Final

- [ ] Build sin errores: `npm run build`
- [ ] Dev server corre: `npm run dev`
- [ ] Landing page muestra 3 certificaciones (Usuarios, BD, **Perfiles**)
- [ ] Rutas antiguas redirigen a nuevas (si implementaste redirects)
- [ ] CSP headers presentes en DevTools
- [ ] `.env.local` está en `.gitignore`
- [ ] Zod importa correctamente en todos lados
- [ ] TypeScript sin errores: `npx tsc --noEmit`
- [ ] Middleware se ejecuta (revisar en DevTools)
- [ ] Features/Usuarios funcionan igual que antes

---

## Troubleshooting

### ❌ "Cannot find module '@/features/cargar'"

Significa que aún hay imports viejos.

**Solución:**
```bash
grep -rn "@/features/cargar" src/
# Actualizar manualmente cada línea
```

### ❌ "next.config.ts syntax error"

Asegúrate de que Next.js 14+ está instalado.

```bash
npm list next
```

Debe ser 14.2.35 o superior.

### ❌ "Zod is not defined"

Asegúrate de instalar:
```bash
npm install zod
```

### ❌ "Cannot delete directory: src/features/cargar"

Significa que todavía hay archivos siendo importados de ahí.

**Solución:**
```bash
# Buscar refs faltantes
find src -name "*.ts" -o -name "*.tsx" | xargs grep -l "features/cargar"
find src -name "*.ts" -o -name "*.tsx" | xargs grep -l "features/hallazgos"
```

---

## Próximas Fases (v0.8+)

Ahora que la base está sólida:

1. **Autenticación real** (JWT + httpOnly cookies)
2. **Backend endpoints** para Perfiles (en lugar de mock)
3. **Upstash Redis** para rate limiting en producción
4. **Audit logging** de cambios
5. **RBAC** (Role-Based Access Control)

---

## Notas Finales

- 📌 **Backup:** Antes de empezar, hacer `git stash` o rama temporal
- 📌 **Testing:** Después de cada fase mayor, hacer `npm run build`
- 📌 **Documentación:** Actualizar README.md con nuevas rutas
- 📌 **Performance:** No hay cambios de performance esperados (todo aditivo)

**¡Buena suerte! 🚀**
