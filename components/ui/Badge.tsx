import { HTMLAttributes } from 'react'

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'accent'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
  dot?: boolean
}

const tones: Record<Tone, string> = {
  success: 'text-[var(--success)] bg-[var(--success-dim)] border-[var(--success)]',
  warning: 'text-[var(--warning)] bg-[var(--warning-dim)] border-[var(--warning)]',
  danger:  'text-[var(--danger)]  bg-[var(--danger-dim)]  border-[var(--danger)]',
  info:    'text-[var(--info)]    bg-[var(--info-dim)]    border-[var(--info)]',
  muted:   'text-[var(--text-muted)]   bg-white/5         border-white/10',
  accent:  'text-[var(--accent)]  bg-[var(--accent-dim)]  border-[var(--border-accent)]',
}

export function Badge({ tone = 'muted', dot = false, className = '', children, ...props }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-opacity-30',
        tones[tone],
        className,
      ].join(' ')}
      {...props}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />}
      {children}
    </span>
  )
}
