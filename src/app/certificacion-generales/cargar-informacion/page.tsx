import { Suspense } from 'react';
import CargarGeneralesView from '@/features/generales/cargar/CargarGeneralesView';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CargarGeneralesView />
    </Suspense>
  );
}
