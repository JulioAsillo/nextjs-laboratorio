'use client';

import clsx from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost';
  icon?: ReactNode;
}

export function Button({
  variant = 'primary',
  icon,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center gap-2 rounded px-4 py-2 text-body-md font-semibold transition',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        'disabled:cursor-not-allowed disabled:opacity-50',
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
