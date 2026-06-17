import {headers} from 'next/headers'


/**
 * 
 * Obtiene la IP del cliente de manera confiable (respeta x-forwarded-for en proxy)
 */
export async function getClientIp(): Promise<string> {
    const headersList = await headers()
    return headersList.get('x-forwarded-for')?.split(',')[0].trim() ||
        headersList.get('x-real-ip') ||
        'unknown'
}

/**
 * 
 * Simulación en memoria de rate limiting (PRODUCCIÓN: usar Redis via Upstash)
 * 
 * En desarrollo/testing: permite. En producción: implementar con Redis
 * 
 */

const rateLimitStore = new Map<string, {count: number, resetAt: number}>()

export async function checkRateLimit(
    ip: string,
    limit: number = 10,
    windowSeconds: number = 60
    ): Promise<{allowed: boolean; remaining: number }> {
        if (process.env.NODE_ENV === 'development') {
            return { allowed: true, remaining: limit}
        }

    const now = Date.now()
    const entry = rateLimitStore.get(ip)

    if (!entry || entry.resetAt < now){
        rateLimitStore.set(ip, { count: 1, resetAt: now + windowSeconds * 1000 })
        return { allowed: true, remaining: limit - 1 }
    }

    if (entry.count >= limit){
        return { allowed: false, remaining: 0 }
    }

    entry.count++
    return { allowed: true, remaining: limit - entry.count }
}

