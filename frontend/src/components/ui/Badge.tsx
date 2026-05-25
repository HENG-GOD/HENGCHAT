import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded font-medium whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'bg-bg-muted text-fg-muted border border-border',
        brand:   'bg-brand-500/10 text-brand-600 dark:text-brand-500',
        success: 'bg-success/10 text-success',
        warning: 'bg-warning/10 text-warning',
        danger:  'bg-danger/10 text-danger',
        info:    'bg-info/10 text-info',
        outline: 'border border-border text-fg-muted',
      },
      size: {
        sm: 'h-4 px-1.5 text-2xs',
        md: 'h-5 px-2   text-xs',
      },
    },
    defaultVariants: { variant: 'default', size: 'sm' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...rest }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...rest} />;
}
