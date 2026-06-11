# Certificación de Usuarios

Frontend en **Next.js 14 (App Router) + TypeScript + Tailwind** para visualizar y exportar

## Stack

- **Next.js 14** (App Router, RSC + client components donde aplica)
- **TypeScript** estricto
- **Tailwind CSS** con tokens del sistema de diseño *Corporate Minimalist Certification*
- **SWR** para fetching, caché y refresh
- **ExcelJS + file-saver** para exportar `.xlsx` con cabeceras coloreadas
- **lucide-react** para iconografía

## Puesta en marcha

```bash
npm install
cp .env.local.example .env.local   # ajusta la URL del backend
npm run dev                         # http://localhost:3000
```

Si el backend no responde en desarrollo, la app cae automáticamente al mock
`public/mock-hallazgos.json` para que la UI siga siendo demostrable. En producción,
`fetchHallazgos()` propaga el error (sin fallback).

### Backend

El endpoint esperado devuelve un **array JSON** (o `{ "data": [...] }`) donde cada objeto
usa exactamente las claves definidas en `src/lib/columns.ts`. Hay un ejemplo en
`backend-example/main.py` (FastAPI con CORS).

```
GET {NEXT_PUBLIC_API_BASE_URL}{NEXT_PUBLIC_HALLAZGOS_ENDPOINT}
→ http://localhost:8000/api/certificacion/hallazgos/aplicaciones
```

## Dónde tocar para escalar

| Quiero… | Archivo |
|---|---|
| Agregar/quitar columnas, cambiar su color o su ancho | `src/lib/columns.ts` |
| Cambiar los 6 colores de cabecera (UI + Excel) | `src/lib/theme.ts` → `colorGroups` |
| Cambiar colores/lógica de las cards de escenario | `src/lib/summary.ts` |
| Agregar items al sidebar | `src/config/navigation.ts` |
| Nueva sección/página | `src/app/certificacion/.../page.tsx` |
| Lógica de exportación | `src/lib/export-excel.ts` |
| Cliente del backend / shape de respuesta | `src/lib/api.ts` |

## Rendimiento (90k+ registros)

- **Tabla virtualizada** con `@tanstack/react-virtual`: solo se montan en el DOM las filas
  visibles (+ overscan), sin importar cuántas filas lleguen. Cabecera y filas comparten un
  CSS grid (`gridTemplate` en `columns.ts`) para alinear columnas con scroll horizontal.
- **Resumen O(n)**: `computeSummary()` calcula en una sola pasada el conteo por escenario y
  el total de aplicaciones distintas.
- **Búsqueda no bloqueante**: el filtro global usa `useDeferredValue`, así el input no se
  congela mientras filtra sobre 90k filas.

## Contrato del backend

```
GET http://localhost:8000/hallazgos/apps
→ { "data": { "reporte_apps": [ { ...campos... }, ... ] } }
```

> Importante: las **claves** de cada objeto en `reporte_apps` deben coincidir con `key` en
> `src/lib/columns.ts`. Si tu backend usa otros nombres de campo, ajústalos ahí (es el único lugar).

## Mapeo de colores (grupos C1–C6)

| Grupo | Significado | Hex | Columnas |
|---|---|---|---|
| C1 | Aplicación | `#006386` | Tipo Aplicación, Aplicación, Usuario, Grupo/Perfil, Estado, Fecha Creación, Ultimo Login, Tipo Colaborador |
| C2 | DNI vs Usuario | `#006d38` | DNI, TIPO_dnivsuser, Usuario_dnivsuser, COMENTARIO_dnivsuser |
| C3 | AD PPS | `#964400` | Username AD PPS, DNI AD PPS |
| C4 | AD VIDA | `#283044` | Username AD VIDA, DNI AD VIDA |
| C5 | GDH | `#6e7880` | Activo GDH, Fecha Alta, Cesado GDH, Fecha Cese |
| C6 | Ticket Cese | `#ba1a1a` | Ticket Cese, Fecha Cierre Ticket Cese, Escenario, Responsable |

## Estructura

```
src/
├── app/                      # rutas (App Router)
│   ├── layout.tsx
│   ├── page.tsx              # redirige a la primera sección
│   └── certificacion/hallazgos/aplicaciones/page.tsx
├── components/
│   ├── layout/               # Sidebar, AppShell (topbar + shell)
│   ├── table/                # DataTable, ColorLegend
│   └── ui/                   # Button
├── config/navigation.ts      # árbol del sidebar
├── lib/                      # api, columns, export-excel, theme
└── types/hallazgo.ts         # tipos del dominio
```
