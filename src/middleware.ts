import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_ROUTES = ['/', '/api/health']

const PROTECTED_ROUTES = ['/certificacion-usuarios', '/certificacion-bd', '/certificacion-perfiles']

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname

    const response = NextResponse.next()

    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}

