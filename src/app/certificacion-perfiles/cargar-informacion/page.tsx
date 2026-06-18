import { Suspense } from 'react';
import CargarPerfilesView from '@/features/perfiles/cargar/CargarPerfilesView';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CargarPerfilesView />
    </Suspense>
  );
}
