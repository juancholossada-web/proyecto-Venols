'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import VenolsLogo from '@/components/icons/VenolsLogo'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm]     = useState({ email: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al iniciar sesión'); return }
      localStorage.setItem('token', data.accessToken)
      localStorage.setItem('user', JSON.stringify(data.user))
      router.push('/dashboard')
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg-base)]">

      {/* ── Panel izquierdo — oculto en móvil ── */}
      <div className="hidden md:flex flex-1 flex-col items-center justify-center px-12 py-16 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0B1628 0%, #0E1F3E 55%, #132848 100%)', borderRight: '1px solid var(--border-subtle)' }}>

        {/* Círculos decorativos */}
        <div className="absolute -bottom-20 -left-16 w-96 h-96 rounded-full border border-[var(--border-accent)] pointer-events-none" />
        <div className="absolute -top-24 -right-20 w-80 h-80 rounded-full border border-[var(--border-subtle)] pointer-events-none" />

        {/* Brand */}
        <div className="text-center z-10 mb-12">
          <div className="flex justify-center mb-5">
            <VenolsLogo size="lg" />
          </div>
          <p className="text-[13px] text-[var(--text-muted)] tracking-[1px] mt-2">
            Maritime Logistics Platform
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs z-10">
          {[
            { num: '24',    label: 'Embarcaciones' },
            { num: '187',   label: 'Tripulantes' },
            { num: '98.2%', label: 'Disponibilidad' },
            { num: '12',    label: 'Puertos' },
          ].map(s => (
            <div key={s.label}
              className="bg-white/[0.03] border border-[var(--border-accent)] rounded-xl p-4 text-center">
              <div className="font-mono text-[22px] font-bold text-[var(--accent)]">{s.num}</div>
              <div className="text-[10px] text-[var(--text-muted)] mt-1 uppercase tracking-[1px]">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Panel derecho — formulario ── */}
      <div className="w-full md:w-[460px] flex flex-col justify-center px-6 py-10 sm:px-10 md:px-11 bg-[var(--bg-surface)]">

        {/* Logo visible solo en móvil */}
        <div className="flex justify-center mb-8 md:hidden">
          <VenolsLogo size="md" />
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Iniciar sesión</h1>
          <p className="text-[14px] text-[var(--text-muted)] mt-1.5">
            Accede a tu panel de gestión marítima
          </p>
        </div>

        {error && (
          <div className="bg-[var(--danger-dim)] border border-[var(--danger)]/30 rounded-lg px-4 py-2.5 text-[13px] text-[var(--danger)] mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-[1px] mb-1.5">
              Email
            </label>
            <input
              type="email" required
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="usuario@venols.com"
              className="w-full px-3.5 py-3 bg-[var(--bg-input)] border border-[var(--border-accent)] rounded-lg text-[14px] text-[var(--text-primary)] outline-none focus:border-[var(--border-accent-strong)] placeholder:text-[var(--text-muted)] transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-[1px] mb-1.5">
              Contraseña
            </label>
            <input
              type="password" required
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              className="w-full px-3.5 py-3 bg-[var(--bg-input)] border border-[var(--border-accent)] rounded-lg text-[14px] text-[var(--text-primary)] outline-none focus:border-[var(--border-accent-strong)] placeholder:text-[var(--text-muted)] transition-colors"
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full py-3.5 rounded-lg text-[14px] font-bold text-[#080E1A] bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-1"
          >
            {loading ? 'Verificando…' : 'Ingresar al Sistema'}
          </button>
        </form>

        <p className="text-center mt-6 text-[13px] text-[var(--text-muted)]">
          ¿No tienes cuenta?{' '}
          <Link href="/register" className="text-[var(--accent)] font-semibold hover:underline">
            Registrarse
          </Link>
        </p>
      </div>
    </div>
  )
}
