interface LoadingStateProps {
  message?: string
}

export function LoadingState({ message = 'Cargando...' }: LoadingStateProps) {
  return (
    <div className="flex items-center justify-center py-20 text-[var(--text-muted)] text-sm">
      {message}
    </div>
  )
}
