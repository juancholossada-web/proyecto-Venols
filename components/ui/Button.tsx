import { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size    = 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const base = 'inline-flex items-center justify-center font-bold rounded-lg cursor-pointer transition-opacity disabled:opacity-50 disabled:cursor-not-allowed border'

const variants: Record<Variant, string> = {
  primary:   'bg-[var(--accent)] border-transparent text-[#080E1A] hover:bg-[var(--accent-hover)]',
  secondary: 'bg-transparent border-[var(--border-accent)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-accent-strong)]',
  danger:    'bg-transparent border-[var(--danger)] text-[var(--danger)] hover:bg-[var(--danger)] hover:text-white',
  ghost:     'bg-transparent border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
}

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2.5 text-[13px] gap-2',
}

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={[base, variants[variant], sizes[size], className].join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}
