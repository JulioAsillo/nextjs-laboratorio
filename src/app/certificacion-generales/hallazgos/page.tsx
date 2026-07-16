import { redirect } from 'next/navigation';
import { DEFAULT_HALLAZGO_ID } from '@/features/generales/hallazgos/registry';
import { hallazgoHref } from '@/features/generales/hallazgos/types';

/** /certificacion-generales/hallazgos -> primer hallazgo del registry. */
export default function HallazgosIndexPage() {
  redirect(hallazgoHref(DEFAULT_HALLAZGO_ID));
}
