import { NextResponse } from 'next/server';

/**
 * Middleware global. Hoy es passthrough: los headers de seguridad se aplican
 * centralizadamente en `next.config.ts` (single source of truth).
 *
 * v0.8 — aquí entrará la autenticación (JWT httpOnly + redirección):
 *   const PROTECTED = ['/certificacion-usuarios', '/certificacion-bd', '/certificacion-perfiles'];
 *   if (PROTECTED.some((p) => req.nextUrl.pathname.startsWith(p)) && !hasSession(req)) {
 *     return NextResponse.redirect(new URL('/login', req.url));
 *   }
 */
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

