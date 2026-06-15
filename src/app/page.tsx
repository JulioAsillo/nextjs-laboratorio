import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { certifications, landingHref } from '@/config/certifications';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      {/* Encabezado */}
      <header className="border-b border-outline-variant bg-surface-container-lowest">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary font-bold text-on-primary shadow-ambient">
            C
          </div>
          <div className="leading-tight">
            <h1 className="text-headline-sm text-on-surface">Certificaciones</h1>
            <p className="text-label-caps uppercase tracking-wider text-on-surface-variant">
              Auditoría · Interno
            </p>
          </div>
        </div>
      </header>

      {/* Cuerpo */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <div className="mb-6">
          <h2 className="text-display-lg text-on-surface">Selecciona una certificación</h2>
          <p className="mt-2 max-w-2xl text-body-lg text-on-surface-variant">
            Cada certificación tiene sus propios hallazgos, su resumen en Excel y su carga de
            información.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {certifications.map((cert) => {
            const Icon = cert.icon;
            return (
              <Link
                key={cert.id}
                href={landingHref(cert)}
                className="group flex flex-col rounded-lg border border-outline-variant bg-surface-container-lowest p-6 shadow-ambient transition hover:border-primary"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-on-primary">
                    <Icon size={24} />
                  </span>
                  <ArrowRight
                    size={20}
                    className="mt-1 text-outline-variant transition group-hover:translate-x-0.5 group-hover:text-primary"
                  />
                </div>
                <h3 className="mt-4 text-headline-sm text-on-surface">{cert.label}</h3>
                <p className="mt-1.5 text-body-md text-on-surface-variant">{cert.description}</p>

                <div className="mt-4 flex flex-wrap gap-1.5 border-t border-outline-variant/70 pt-4">
                  {cert.nav.map((item) => (
                    <span
                      key={item.label}
                      className="rounded bg-surface-container-low px-2 py-0.5 text-label-caps uppercase text-on-surface-variant"
                    >
                      {item.label}
                    </span>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      </main>

      <footer className="border-t border-outline-variant px-6 py-4 text-center text-label-caps uppercase tracking-wider text-on-surface-variant/70">
        v0.5 · Interno
      </footer>
    </div>
  );
}
