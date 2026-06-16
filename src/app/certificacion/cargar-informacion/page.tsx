import { Suspense } from 'react';
import CargarInformacionPage from '@/features/cargar/CargarInformacionPage';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CargarInformacionPage />
    </Suspense>
  );
}