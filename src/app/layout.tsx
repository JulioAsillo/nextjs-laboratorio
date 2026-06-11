import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Certificación de Usuarios',
  description: 'Hallazgos de certificación de usuarios y aplicaciones',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
