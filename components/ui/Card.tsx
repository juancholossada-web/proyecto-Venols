import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'sm' | 'md' | 'lg' | 'none'
}

const paddings = {
  none: '',
  sm:   'p-4',
  md:   'p-5',
  lg:   'p-6',
}

export function Card({ padding = 'md', className = '', children, ...props }: CardProps) {
  return (
    <div
      className={['bg-[var(--bg-surface)] border border-[var(--border-accent)] rounded-xl', paddings[padding], className].join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}
