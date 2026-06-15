/**
 * Endpoints de "Cargar Información" de la Certificación de Base de Datos.
 *
 * ⚠️ EJEMPLOS / provisionales: el backend aún no expone estas rutas.
 * Reemplaza los defaults (o define las variables NEXT_PUBLIC_BD_*) con las URLs
 * reales cuando estén disponibles. El GET de "Ver datos" por card resuelve a
 * `${apps}/${appsKey}` (p.ej. /bd/datos/apps/vida, /bd/datos/apps/generales, …).
 */
export const BD_ENDPOINTS = {
  apps: process.env.NEXT_PUBLIC_BD_APPS_PATH ?? '/bd/datos/apps',
  upload: process.env.NEXT_PUBLIC_BD_UPLOAD_PATH ?? '/bd/datos/upload',
  delete: process.env.NEXT_PUBLIC_BD_DELETE_PATH ?? '/bd/datos/apps/delete',
} as const;
