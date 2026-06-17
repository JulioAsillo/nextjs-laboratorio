import { z } from 'zod';

export const FileUploadSchema = z.object({
    fileName: z.string()
        .min(1, 'Nombre de archivo requerido')
        .max(255, 'Nombre de archivo demasiado largo')
        .regex(/^[\w\-. ]+$/, 'Caracteres inválidos en nombre de archivo'),
    fileSize: z.number()
        .positive('El tamaño del archivo debe ser positivo')
        .max(25 * 1024 * 1024, 'El archivo no puede exceder los 25MB'),
    fileType: z.string()
        .refine(
            (type) => ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(type),
            'Solo CSV y XLSX permitidos'
        ),
})

export const FechaCorteSchema = z.object({
    fechaCorte: z.string()
        .refine((date) => !isNaN(Date.parse(date)), 'Formato de Fecha inválido')
        .transform((date) => new Date(date)),
})

export const BusquedaSchema = z.object({
    q: z.string().max(100).optional(),
    página: z.coerce.number().int().min(1).default(1),
    límite: z.coerce.number().int().min(1).max(100).default(20),
})

