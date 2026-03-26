import { ReactNode } from 'react'

interface FormFieldProps {
  label: string
  children: ReactNode
  className?: string
}

export function FormField({ label, children, className = '' }: FormFieldProps) {
  return (
    <div className={className}>
      <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.5px] mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}
