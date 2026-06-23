'use client';

import clsx from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center gap-2 rounded font-semibold transition',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        'disabled:cursor-not-allowed disabled:opacity-50',
        // Tamaños
        size === 'sm' && 'px-3 py-1.5 text-xs',
        size === 'md' && 'px-4 py-2 text-body-md',
        size === 'lg' && 'px-5 py-2.5 text-body-lg',
        // Variantes
        variant === 'primary' &&
          'bg-primary text-on-primary hover:bg-primary-container shadow-ambient',
        variant === 'ghost' &&
          'border border-outline-variant bg-transparent text-primary hover:border-primary hover:bg-surface-container-low',
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}