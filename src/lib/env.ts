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