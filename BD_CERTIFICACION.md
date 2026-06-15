# Certificación de Base de Datos — Guía de integración

Módulo añadido **de forma aditiva**. La Certificación de Usuarios queda intacta en
`/certificacion/...`; la de BD vive en `/certificacion-bd/...`. La raíz `/` es ahora
un **lanzador estilo Odoo** con una tarjeta por certificación, y el sidebar se acota
a la certificación activa (con un selector arriba para cambiar de certificación o
volver al lanzador).

## Rutas nuevas

| Vista | Ruta |
|---|---|
| Hallazgos Aplicaciones | `/certificacion-bd/hallazgos/aplicaciones` |
| Generar Resumen (Aplicaciones) | `/certificacion-bd/hallazgos/aplicaciones/generar-resumen` |
| Hallazgos Active Directory | `/certificacion-bd/hallazgos/active-directory` |
| Generar Resumen (AD) | `/certificacion-bd/hallazgos/active-directory/generar-resumen` |
| Cargar Información | `/certificacion-bd/cargar-informacion` |

## Variables de entorno (todas opcionales)

Sin estas variables, en **desarrollo** las vistas de hallazgos caen a datos mock
(`public/mock-bd-hallazgos.json`, `public/mock-bd-ad.json`). En producción se llama
al backend real.

```bash
# Hallazgos (GET)
NEXT_PUBLIC_BD_HALLAZGOS_ENDPOINT=/bd/hallazgos/apps
NEXT_PUBLIC_BD_HALLAZGOS_AD_ENDPOINT=/bd/hallazgos/ad

# Cargar Información
NEXT_PUBLIC_BD_APPS_PATH=/bd/datos/apps          # GET  {APPS}/{appsKey}
NEXT_PUBLIC_BD_UPLOAD_PATH=/bd/datos/upload      # POST ?file_name=...
NEXT_PUBLIC_BD_DELETE_PATH=/bd/datos/apps/delete # DELETE (individual y purga total)
```

`NEXT_PUBLIC_API_BASE_URL` (compartida con Usuarios) define el host; por defecto
`http://localhost:8000`.

## Formas de respuesta esperadas

```jsonc
// GET hallazgos apps  ->  { data: { reporte_apps: [ { ...fila } ] } }
// GET hallazgos AD     ->  { data: { reporte_ad:   [ { ...fila } ] } }
// GET datos/{appsKey}  ->  { fecha_corte: "2025-12-31", data: { <clave>: [ ... ] } }
```

Las claves de cada fila deben coincidir **exactamente** (incluidos acentos y
espacios) con `src/features/bd/bd-columns.ts` (`bdColumns` / `bdAdColumns`). Hoy son
genéricas (Servidor, Base de Datos, Usuario, Escenario, Responsable, etc.); ajústalas
cuando el backend defina el formato real.

## Catálogo de fuentes

`src/features/bd/cargar/fuentes.ts` → `bdFuentes`. Grupos en `BD_GROUPS`
("Motores de Base de Datos" y "Otros Reportes"). Cambia `appsKey`, `slots[].fileName`
y `columns` según el contrato real.

## Aislamiento respecto a Usuarios

- localStorage propio: clave `itsecops-bd-upload-status-v1`.
- Claves SWR propias: `bd-hallazgos-*`, `['bd-datos', appsKey]`.
- Módulos propios bajo `src/features/bd/`; sólo reutiliza piezas presentacionales
  genéricas (DataTable, PaginatedTable, FuentesCargadasPanel, validación, tema).
