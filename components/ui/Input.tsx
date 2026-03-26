import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

const base = 'w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-accent)] rounded-lg text-[var(--text-primary)] text-[13px] outline-none focus:border-[var(--border-accent-strong)] placeholder:text-[var(--text-muted)] transition-colors'

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={[base, className].join(' ')} {...props} />
}

export function Select({ className = '', children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={[base, 'cursor-pointer', className].join(' ')} {...props}>
      {children}
    </select>
  )
}

export function Textarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={[base, 'resize-none', className].join(' ')} {...props} />
}
