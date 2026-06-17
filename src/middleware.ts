import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Origen del backend para `connect-src` (debe coincidir con NEXT_PUBLIC_API_BASE_URL).
 * En el runtime Edge, las NEXT_PUBLIC_* quedan inlineadas en build.
 */
const API_ORIGIN = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
const isDev = process.env.NODE_ENV !== 'production';

/**
 * CSP con nonce por request (producción) / permisiva (desarrollo).
 *
 * PROD: `script-src 'self' 'nonce-XXXX' 'strict-dynamic'`. Next.js lee el nonce
 * del header CSP del request y lo aplica automáticamente a SUS scripts inline;
 * 'strict-dynamic' propaga la confianza a los chunks que esos scripts cargan.
 *
 * DEV: Fast Refresh usa eval e inyecta inline + WebSocket de HMR, así que
 * relajamos (unsafe-eval/unsafe-inline/ws). Nunca uses nonce+strict-dynamic en dev:
 * rompería el HMR.
 *
 * `style-src` mantiene 'unsafe-inline': next/font y los atributos `style={{…}}`
 * generan estilos inline que el nonce no cubre (los nonces no aplican a atributos).
 * El riesgo de CSS inline es bajo; endurecer estilos con hashes queda para más adelante.
 */
export function middleware(request: NextRequest) {
  // Nonce solo se usa en prod, pero lo generamos siempre (barato) por simetría.
  const nonce = btoa(crypto.randomUUID());

  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'"
    : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`;

  const connectSrc = isDev
    ? `connect-src 'self' ${API_ORIGIN} ws: wss:`
    : `connect-src 'self' ${API_ORIGIN}`;

  const csp = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    connectSrc,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');

  // El nonce debe ir en los headers del REQUEST para que Next lo lea y lo
  // inyecte en sus <script>. También se setea en la respuesta (lo ve el navegador).
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);

  // v0.8 — autenticación:
  //   const PROTECTED = ['/certificacion-usuarios', '/certificacion-bd', '/certificacion-perfiles'];
  //   if (PROTECTED.some((p) => request.nextUrl.pathname.startsWith(p)) && !hasSession(request)) {
  //     return NextResponse.redirect(new URL('/login', request.url));
  //   }

  return response;
}

export const config = {
  // No tocar assets estáticos ni el favicon (no necesitan CSP propia).
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
