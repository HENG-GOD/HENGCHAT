import { cn } from '@/lib/cn';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  xs: 'h-5 w-5 text-2xs',
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-12 w-12 text-base',
};

function initials(name?: string | null): string {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

function colorFromString(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return `hsl(${h}, 60%, 45%)`;
}

export function Avatar({ src, name, size = 'sm', className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name ?? ''}
        className={cn(
          'rounded-full object-cover ring-1 ring-border',
          sizeMap[size],
          className,
        )}
      />
    );
  }
  const bg = name ? colorFromString(name) : '#71717a';
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full text-white font-medium select-none',
        sizeMap[size],
        className,
      )}
      style={{ backgroundColor: bg }}
    >
      {initials(name)}
    </div>
  );
}
