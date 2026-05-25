import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg:            'rgb(var(--bg) / <alpha-value>)',
        'bg-subtle':   'rgb(var(--bg-subtle) / <alpha-value>)',
        'bg-muted':    'rgb(var(--bg-muted) / <alpha-value>)',
        'bg-elevated': 'rgb(var(--bg-elevated) / <alpha-value>)',
        fg:            'rgb(var(--fg) / <alpha-value>)',
        'fg-muted':    'rgb(var(--fg-muted) / <alpha-value>)',
        'fg-subtle':   'rgb(var(--fg-subtle) / <alpha-value>)',
        border:        'rgb(var(--border) / <alpha-value>)',
        'border-strong': 'rgb(var(--border-strong) / <alpha-value>)',
        brand: {
          50:  'rgb(var(--brand-50) / <alpha-value>)',
          100: 'rgb(var(--brand-100) / <alpha-value>)',
          500: 'rgb(var(--brand-500) / <alpha-value>)',
          600: 'rgb(var(--brand-600) / <alpha-value>)',
          700: 'rgb(var(--brand-700) / <alpha-value>)',
          fg:  'rgb(var(--brand-fg) / <alpha-value>)',
        },
        success: 'rgb(var(--success) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        danger:  'rgb(var(--danger) / <alpha-value>)',
        info:    'rgb(var(--info) / <alpha-value>)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow)',
        md: 'var(--shadow-md)',
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }], // 11px
      },
    },
  },
  plugins: [],
};
export default config;
