'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:   'bg-brand-500 text-brand-fg hover:bg-brand-600 active:bg-brand-700',
        secondary: 'bg-bg-muted text-fg hover:bg-bg-muted/70 border border-border',
        outline:   'border border-border bg-bg-elevated text-fg hover:bg-bg-muted',
        ghost:     'text-fg-muted hover:bg-bg-muted hover:text-fg',
        danger:    'bg-danger text-white hover:bg-danger/90',
        link:      'text-brand-600 hover:underline underline-offset-4 dark:text-brand-500',
      },
      size: {
        sm: 'h-7  px-2.5 text-xs rounded-md',
        md: 'h-8  px-3   text-sm rounded-md',
        lg: 'h-10 px-4   text-sm rounded-md',
        icon: 'h-8 w-8 rounded-md',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...rest }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...rest} />
  ),
);
Button.displayName = 'Button';

export { buttonVariants };
