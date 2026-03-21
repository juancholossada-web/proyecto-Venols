'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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

      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('user', JSON.stringify(data.user))
      router.push('/dashboard')
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>

      {/* Panel izquierdo */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #0a1628 0%, #0f2040 50%, #1a3260 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '48px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', bottom: '-60px', left: '-40px', width: '400px', height: '400px', borderRadius: '50%', border: '1px solid rgba(212,149,10,0.15)' }} />
        <div style={{ position: 'absolute', top: '-80px', right: '-60px', width: '350px', height: '350px', borderRadius: '50%', border: '1px solid rgba(212,149,10,0.08)' }} />

        <div style={{ textAlign: 'center', zIndex: 1, marginBottom: '48px' }}>
          <div style={{ width: '80px', height: '80px', margin: '0 auto 20px', background: 'linear-gradient(135deg, #D4950A, #E8A714)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>🚢</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#e8f4fd', letterSpacing: '-0.5px' }}>VENOLS ERP</div>
          <div style={{ fontSize: '12px', color: '#D4950A', letterSpacing: '3px', marginTop: '6px', textTransform: 'uppercase' }}>Maritime Logistics Platform</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%', maxWidth: '300px', zIndex: 1 }}>
          {[
            { num: '24', label: 'Embarcaciones' },
            { num: '187', label: 'Tripulantes' },
            { num: '98.2%', label: 'Disponibilidad' },
            { num: '12', label: 'Puertos' },
          ].map((s) => (
            <div key={s.label} style={{ background: 'rgba(212,149,10,0.08)', border: '1px solid rgba(212,149,10,0.2)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '22px', fontWeight: 700, color: '#D4950A' }}>{s.num}</div>
              <div style={{ fontSize: '11px', color: '#7fa8c9', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Panel derecho */}
      <div style={{ width: '460px', background: '#060e1e', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 40px', borderLeft: '1px solid rgba(212,149,10,0.2)' }}>
        <div style={{ fontSize: '26px', fontWeight: 700, color: '#e8f4fd', marginBottom: '6px' }}>Iniciar sesión</div>
        <div style={{ fontSize: '14px', color: '#7fa8c9', marginBottom: '36px' }}>Accede a tu panel de gestión marítima</div>

        {error && (
          <div style={{ background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.3)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#e74c3c', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#7fa8c9', marginBottom: '8px' }}>Email</label>
            <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="usuario@venols.com"
              style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,149,10,0.2)', borderRadius: '10px', padding: '13px 16px', fontSize: '14px', color: '#e8f4fd', outline: 'none' }} />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#7fa8c9', marginBottom: '8px' }}>Contraseña</label>
            <input type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••"
              style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,149,10,0.2)', borderRadius: '10px', padding: '13px 16px', fontSize: '14px', color: '#e8f4fd', outline: 'none' }} />
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', background: loading ? '#555' : 'linear-gradient(135deg, #D4950A, #E8A714)', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '15px', fontWeight: 700, color: 'white', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Verificando...' : 'Ingresar al Sistema →'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#7fa8c9' }}>
          ¿No tienes cuenta?{' '}
          <Link href="/register" style={{ color: '#D4950A', fontWeight: 600 }}>Registrarse</Link>
        </div>
      </div>
    </div>
  )
}
