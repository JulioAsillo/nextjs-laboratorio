'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

/**
 * Controles de paginación: botones Anterior/Siguiente y números de página.
 * Muestra siempre primera, última, actual y vecinas.
 */
export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
}: PaginationControlsProps) {
  const pageNumbers: (number | string)[] = [];

  // Primera página
  pageNumbers.push(1);

  // Páginas alrededor de la actual
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) pageNumbers.push('...');
  for (let i = start; i <= end; i++) {
    pageNumbers.push(i);
  }
  if (end < totalPages - 1) pageNumbers.push('...');

  // Última página
  if (totalPages > 1) pageNumbers.push(totalPages);

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        icon={<ChevronLeft size={16} />}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={disabled || currentPage === 1}
      >
        Anterior
      </Button>

      <div className="flex items-center gap-1">
        {pageNumbers.map((page, idx) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${idx}`} className="px-2 text-on-surface-variant">
                …
              </span>
            );
          }

          const isActive = page === currentPage;
          return (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              disabled={disabled}
              className={`h-8 w-8 rounded text-body-md transition ${
                isActive
                  ? 'bg-primary text-on-primary font-semibold'
                  : 'border border-outline-variant text-on-surface hover:border-primary disabled:opacity-50'
              }`}
            >
              {page}
            </button>
          );
        })}
      </div>

      <Button
        variant="ghost"
        size="sm"
        icon={<ChevronRight size={16} />}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={disabled || currentPage === totalPages}
      >
        Siguiente
      </Button>
    </div>
  );
}
