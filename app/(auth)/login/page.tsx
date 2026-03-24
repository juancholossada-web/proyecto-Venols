'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import VenolsLogo from '@/components/icons/VenolsLogo'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al iniciar sesión')
        return
      }

      localStorage.setItem('token', data.accessToken)
      localStorage.setItem('user', JSON.stringify(data.user))
      router.push('/dashboard')
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-accent)',
    borderRadius: '8px',
    padding: '12px 14px',
    fontSize: '14px',
    color: 'var(--text-primary)',
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    marginBottom: '7px',
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', background: 'var(--bg-base)' }}>

      {/* Left panel */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(160deg, #0B1628 0%, #0E1F3E 55%, #132848 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px',
        position: 'relative',
        overflow: 'hidden',
        borderRight: '1px solid var(--border-subtle)',
      }}>
        {/* Background decorative circles */}
        <div style={{ position: 'absolute', bottom: '-80px', left: '-60px', width: '400px', height: '400px', borderRadius: '50%', border: '1px solid var(--border-accent)' }} />
        <div style={{ position: 'absolute', top: '-100px', right: '-80px', width: '360px', height: '360px', borderRadius: '50%', border: '1px solid var(--border-subtle)' }} />

        {/* Brand */}
        <div style={{ textAlign: 'center', zIndex: 1, marginBottom: '52px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <VenolsLogo size="lg" />
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', letterSpacing: '1px', marginTop: '8px' }}>
            Maritime Logistics Platform
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%', maxWidth: '320px', zIndex: 1 }}>
          {[
            { num: '24', label: 'Embarcaciones' },
            { num: '187', label: 'Tripulantes' },
            { num: '98.2%', label: 'Disponibilidad' },
            { num: '12', label: 'Puertos' },
          ].map((s) => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-accent)',
              borderRadius: '10px',
              padding: '16px',
              textAlign: 'center',
            }}>
              <div style={{ fontFamily: 'monospace', fontSize: '22px', fontWeight: 700, color: 'var(--accent)' }}>{s.num}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '5px', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        width: '460px',
        background: 'var(--bg-surface)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '48px 42px',
      }}>
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            Iniciar sesión
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '6px' }}>
            Accede a tu panel de gestión marítima
          </div>
        </div>

        {error && (
          <div style={{
            background: 'var(--danger-dim)',
            border: '1px solid rgba(176,48,40,0.30)',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '13px',
            color: 'var(--danger)',
            marginBottom: '20px',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '18px' }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="usuario@venols.com"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={labelStyle}>Contraseña</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? 'rgba(195,160,65,0.4)' : 'var(--accent)',
              border: 'none',
              borderRadius: '8px',
              padding: '13px',
              fontSize: '14px',
              fontWeight: 700,
              color: loading ? 'rgba(8,14,26,0.5)' : '#080E1A',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              letterSpacing: '0.3px',
            }}
          >
            {loading ? 'Verificando…' : 'Ingresar al Sistema'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--text-muted)' }}>
          ¿No tienes cuenta?{' '}
          <Link href="/register" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
            Registrarse
          </Link>
        </div>
      </div>
    </div>
  )
}
