import { Suspense } from 'react';
import CargarBdView from '@/features/bd/cargar/CargarBdView';

export default function CargarInformacionBdPage() {
  return (
    <Suspense fallback={null}>
      <CargarBdView />
    </Suspense>
  );
}
