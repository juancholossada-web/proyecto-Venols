'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'OPERATOR' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return }
    if (!/[A-Z]/.test(form.password)) { setError('La contraseña debe tener al menos una mayúscula'); return }
    if (!/[0-9]/.test(form.password)) { setError('La contraseña debe tener al menos un número'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al registrar'); return }
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('user', JSON.stringify(data.user))
      router.push('/dashboard')
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const inp = { width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,149,10,0.2)', borderRadius: '10px', padding: '13px 16px', fontSize: '14px', color: '#e8f4fd', outline: 'none' }
  const lbl = { display: 'block' as const, fontSize: '11px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: '#7fa8c9', marginBottom: '8px' }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      {/* Panel izquierdo */}
      <div style={{ flex: 1, background: 'linear-gradient(135deg, #0a1628 0%, #0f2040 50%, #1a3260 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ width: '80px', height: '80px', margin: '0 auto 20px', background: 'linear-gradient(135deg, #D4950A, #E8A714)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>🚢</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#e8f4fd' }}>VENOLS ERP</div>
          <div style={{ fontSize: '12px', color: '#D4950A', letterSpacing: '3px', marginTop: '6px', textTransform: 'uppercase' }}>Maritime Logistics Platform</div>
        </div>
        {[
          { role: 'ADMIN', color: '#e74c3c', desc: 'Acceso total al sistema' },
          { role: 'OPERATOR', color: '#D4950A', desc: 'Gestión de embarcaciones y rutas' },
          { role: 'TECHNICIAN', color: '#2d9cdb', desc: 'Mantenimiento y reportes técnicos' },
        ].map(r => (
          <div key={r.role} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', marginBottom: '8px', background: 'rgba(212,149,10,0.06)', border: '1px solid rgba(212,149,10,0.12)', borderRadius: '10px', width: '100%', maxWidth: '300px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: r.color, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#e8f4fd' }}>{r.role}</div>
              <div style={{ fontSize: '11px', color: '#7fa8c9' }}>{r.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Panel derecho */}
      <div style={{ width: '460px', background: '#060e1e', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 40px', borderLeft: '1px solid rgba(212,149,10,0.2)' }}>
        <div style={{ fontSize: '26px', fontWeight: 700, color: '#e8f4fd', marginBottom: '6px' }}>Crear cuenta</div>
        <div style={{ fontSize: '14px', color: '#7fa8c9', marginBottom: '28px' }}>Registro de nuevo usuario del sistema</div>

        {error && <div style={{ background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.3)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#e74c3c', marginBottom: '16px' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div><label style={lbl}>Nombre</label><input style={inp} type="text" required placeholder="Juan" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} /></div>
            <div><label style={lbl}>Apellido</label><input style={inp} type="text" required placeholder="Pérez" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} /></div>
          </div>
          <div style={{ marginBottom: '16px' }}><label style={lbl}>Email</label><input style={inp} type="email" required placeholder="usuario@venols.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          <div style={{ marginBottom: '16px' }}><label style={lbl}>Contraseña</label><input style={inp} type="password" required placeholder="Mín. 8 chars, 1 mayúscula, 1 número" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
          <div style={{ marginBottom: '24px' }}>
            <label style={lbl}>Rol</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={{ ...inp, cursor: 'pointer' }}>
              <option value="OPERATOR">🟡 Operador</option>
              <option value="TECHNICIAN">🔵 Técnico</option>
              <option value="ADMIN">🔴 Administrador</option>
            </select>
          </div>
          <button type="submit" disabled={loading} style={{ width: '100%', background: loading ? '#555' : 'linear-gradient(135deg, #D4950A, #E8A714)', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '15px', fontWeight: 700, color: 'white', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta →'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#7fa8c9' }}>
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" style={{ color: '#D4950A', fontWeight: 600 }}>Iniciar sesión</Link>
        </div>
      </div>
    </div>
  )
}
