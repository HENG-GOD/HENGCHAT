'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...rest }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-8 w-full rounded-md border border-border bg-bg-elevated px-2.5 text-sm text-fg',
        'placeholder:text-fg-subtle',
        'transition-colors',
        'focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/20',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...rest}
    />
  ),
);
Input.displayName = 'Input';

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...rest }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'flex w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm text-fg',
      'placeholder:text-fg-subtle resize-none',
      'transition-colors',
      'focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/20',
      'disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    {...rest}
  />
));
Textarea.displayName = 'Textarea';

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...rest }, ref) => (
  <select
    ref={ref}
    className={cn(
      'flex h-8 w-full rounded-md border border-border bg-bg-elevated px-2 text-sm text-fg',
      'focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/20',
      'disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    {...rest}
  >
    {children}
  </select>
));
Select.displayName = 'Select';
