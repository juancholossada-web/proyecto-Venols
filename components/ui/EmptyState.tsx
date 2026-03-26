interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon = 'inbox', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <span className="material-symbols-outlined text-[48px] text-[var(--text-muted)]">{icon}</span>
      <div>
        <p className="text-[var(--text-secondary)] font-semibold text-sm">{title}</p>
        {description && (
          <p className="text-[var(--text-muted)] text-xs mt-1">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
