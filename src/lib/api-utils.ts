/**
 * Helper para crear una respuesta de error estándar
 */
export function errorResponse(
  message: string,
  status: number = 400,
  details?: Record<string, unknown>
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(details && { details }),
    },
    { status }
  )
}

/**
 * Validar que el método HTTP sea el esperado
 * 
 * Uso:
 *   if (!validateMethod(request, 'POST')) {
 *     return errorResponse('Método no permitido', 405)
 *   }
 */
export function validateMethod(
  request: NextRequest,
  ...allowedMethods: string[]
): boolean {
  return allowedMethods.includes(request.method.toUpperCase())
}

/**
 * Extraer y validar query parameters
 * 
 * Uso:
 *   const params = getQueryParams(request, BusquedaSchema)
 *   if (!params.success) return errorResponse('Parámetros inválidos', 400, params.error)
 */
export function getQueryParams<T>(
  request: NextRequest,
  schema?: ZodSchema
): { success: boolean; data?: T; error?: unknown } {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams)

    if (!schema) {
      return { success: true, data: searchParams as T }
    }

    const result = schema.safeParse(searchParams)
    if (!result.success) {
      return { success: false, error: result.error.flatten() }
    }

    return { success: true, data: result.data as T }
  } catch (error) {
    return { success: false, error }
  }
}