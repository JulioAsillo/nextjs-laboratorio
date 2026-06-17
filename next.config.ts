import type { NextConfig } from 'next';

/**
 * Origen del backend para el `connect-src` de la CSP. Debe coincidir con
 * NEXT_PUBLIC_API_BASE_URL (lo que realmente consume http.ts). Si no, el
 * navegador bloquea los fetch en producción.
 */
const API_ORIGIN = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

const cspHeader = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'", // Tailwind lo requiere (migrar a nonces en el futuro)
  "img-src 'self' data: https:",
  "font-src 'self'",
  `connect-src 'self' ${API_ORIGIN}`, // ← incluye el backend real (con esquema)
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: cspHeader },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;