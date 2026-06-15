/**
 * Endpoints de "Cargar Información" de la Certificación de Base de Datos.
 *
 * El UPLOAD es el MISMO de Usuarios (/datos/upload?file_name=...). Solo cambia
 * `file_name` (db_vida / db_generales). Las fuentes 'shared' (AD/GDH/Tickets/DNI)
 * usan íntegramente los endpoints de Usuarios. Las 'dbs' (Vida/Generales) usan:
 *   - GET    /datos/dbs/{db_name}
 *   - DELETE /datos/dbs/delete?db_name={db_name}
 *
 * Configurable por entorno por si el path raíz cambia.
 */
export const BD_DBS_PATH = process.env.NEXT_PUBLIC_BD_DBS_PATH ?? '/datos/dbs';
