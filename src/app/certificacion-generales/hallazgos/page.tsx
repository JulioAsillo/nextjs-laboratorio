import { redirect } from 'next/navigation';

/**
 * "Hallazgos" es un grupo del sidebar (sin página propia). Si alguien entra a
 * /certificacion-generales/hallazgos, lo mandamos al primer hallazgo.
 * Mismo criterio que /certificacion-perfiles/hallazgos.
 */
export default function HallazgosGeneralesIndexPage() {
  redirect('/certificacion-generales/hallazgos/generales-especiales');
}
