# LEER PRIMERO — Arreglo de `npm run dev` + módulo Perfiles

## Diagnóstico (qué rompía `npm run dev`)

Tu HEAD ya tenía aplicada la Parte A (rutas, `env.ts`, `middleware.ts` correctos). El arranque se caía por **dos cosas**, no por la reorganización:

1. **`argon2` en `dependencies`.** Es un módulo nativo (node-pre-gyp). En tu entorno falla al compilar y **revienta `npm install`** → sin `node_modules`, no hay `dev`. No se usa en ningún lado todavía.
2. **`next.config.ts`.** **Next.js 14 NO soporta config en TypeScript** (eso llegó en Next 15). La guía original te hizo migrar a `.ts` y eso rompe tanto `build` como `dev`:
   > `Configuring Next.js via 'next.config.ts' is not supported.`

Además, habías agregado **Perfiles a `certifications.ts`** pero **sin crear los archivos del módulo**, así que la tarjeta Perfiles daba **404**.

Verificado tras el arreglo: `npm install` ✓, `npx tsc --noEmit` ✓, `npm run build` ✓ (15 rutas), `npm run dev` ✓ (`Ready in ~1.4s`), y `/`, `/certificacion-usuarios/...`, `/certificacion-perfiles/hallazgos` responden **200**.

---

## Pasos (5 minutos)

### 1. Quitar `argon2` y arreglar la config (lo que desbloquea `dev`)

```bash
# en la raíz del repo
npm uninstall argon2          # quita el módulo nativo que rompe el install
rm -f next.config.ts          # Next 14 no soporta config .ts
```

Copia desde el zip:
- `REEMPLAZAR/next.config.mjs` → raíz del repo (sustituye al `.ts` borrado).
- `REEMPLAZAR/package.json` → raíz (ya sin `argon2` y con `version: 0.7.0`). *Si prefieres no pisar tu package.json, basta con el `npm uninstall argon2` de arriba.*

```bash
rm -f package-lock.json && npm install
npm run dev    # debe arrancar sin errores
```

### 2. Crear el módulo Perfiles (para que la 3ª tarjeta no dé 404)

Copia **todo** lo que está bajo `CREAR/` respetando las rutas (ya vienen con la estructura real):

```
CREAR/public/mock-perfiles-hallazgos.json          → public/
CREAR/src/features/perfiles/...                     → src/features/perfiles/
CREAR/src/app/certificacion-perfiles/...            → src/app/certificacion-perfiles/
```

No hace falta tocar `certifications.ts` ni `navigation.ts`: ya tienen Perfiles dado de alta (y `search-index.ts` lo toma de ahí, así que aparece también en el buscador Ctrl/Cmd+K).

### 3. Verificar

```bash
npx tsc --noEmit
npm run build
npm run dev
```

- `http://localhost:3000` → 3 tarjetas (Usuarios, BD, **Perfiles**).
- `http://localhost:3000/certificacion-perfiles/hallazgos` → estado vacío → **Generar** carga el mock → tarjetas + tabla virtualizada + **Exportar Excel**.

---

## Contenido del zip

| Carpeta | Archivo | Acción |
|---|---|---|
| REEMPLAZAR | `next.config.mjs` | Crear (y borrar `next.config.ts`) |
| REEMPLAZAR | `package.json` | Reemplaza (sin `argon2`, v0.7.0). Opcional si haces `npm uninstall argon2` |
| CREAR | `public/mock-perfiles-hallazgos.json` | Nuevo |
| CREAR | `src/features/perfiles/*` (8 archivos) | Nuevo |
| CREAR | `src/app/certificacion-perfiles/*` (3 páginas) | Nuevo |

---

## Notas

- **El módulo Perfiles usa mock.** Lee `public/mock-perfiles-hallazgos.json`. Cuando exista el backend, en `src/features/perfiles/api.ts` pon `USE_MOCK = false`; el contrato esperado es `{ data: { reporte_perfiles: [...] } }` con `?fecha_ref=YYYY-MM-DD` (igual que BD/AD).
- **Cargar y Resumen de Perfiles** quedan como placeholders consistentes con el design system; se completan clonando `CargarBdView` / el resumen de BD cuando definas las fuentes y el contrato real.
- **Patrón seguido:** idéntico al módulo BD (carga manual SWR, caché IndexedDB, tabla virtualizada column-driven, export ExcelJS por grupos de color). Las claves de `perfiles-columns.ts` deben coincidir exactas con los campos del JSON del backend.
- **v0.8:** auth real en `middleware.ts` (ya tiene el TODO), `USE_MOCK=false`, carga real de fuentes, y rate-limit a Redis.
