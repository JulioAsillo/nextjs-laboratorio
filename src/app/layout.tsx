// src/app/layout.tsx
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

/**
 * Inter auto-hospedada (sin red en build ni runtime).
 * Fuente variable: un solo .woff2 cubre los pesos 100–900.
 * Subset latín (incluye acentos y ñ del español).
 */
const inter = localFont({
  src: './fonts/Inter-variable.woff2',
  variable: '--font-inter',
  weight: '100 900',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Certificaciones',
  description: 'Hallazgos de certificación de usuarios y de bases de datos',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
