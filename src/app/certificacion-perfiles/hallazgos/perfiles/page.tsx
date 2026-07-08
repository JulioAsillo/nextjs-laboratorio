import { redirect } from 'next/navigation';

/**
 * "Hallazgos" es un grupo del sidebar (sin página propia). Si alguien entra a
 * /certificacion-perfiles/hallazgos (enlace viejo o la raíz del grupo), lo
 * mandamos al primer hallazgo, "Hallazgo de Perfiles".
 */
export default function HallazgosPerfilesIndexPage() {
  redirect('/certificacion-perfiles/hallazgos/perfiles');
}
