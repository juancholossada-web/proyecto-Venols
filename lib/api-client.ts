/**
 * Cliente HTTP compartido para todas las páginas del dashboard.
 * Maneja auth token, redirección en 401 y parsing de errores.
 */

function getToken(): string {
  return typeof window !== 'undefined' ? (localStorage.getItem('token') || '') : ''
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function api<T = any>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...opts?.headers,
    },
  })

  if (res.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
    throw new Error('Sesión expirada')
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error((data as { error?: string }).error || `API ${res.status}`)
  }

  return res.json() as Promise<T>
}
