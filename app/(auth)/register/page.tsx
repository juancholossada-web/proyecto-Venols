'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import VenolsLogo from '@/components/icons/VenolsLogo'

type Step = 'form' | 'otp' | 'success'

export default function RegisterPage() {
  const router = useRouter()

  const [step, setStep] = useState<Step>('form')

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', role: 'OPERATOR',
  })

  const [digits, setDigits]             = useState(['', '', '', '', '', ''])
  const inputRefs                        = useRef<(HTMLInputElement | null)[]>([])
  const [error, setError]               = useState('')
  const [loading, setLoading]           = useState(false)
  const [attemptsLeft, setAttemptsLeft] = useState(5)
  const [resendCooldown, setResendCooldown] = useState(0)

  // Temporizador de reenvío
  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  // Foco al pasar al paso OTP
  useEffect(() => {
    if (step === 'otp') setTimeout(() => inputRefs.current[0]?.focus(), 80)
  }, [step])

  // Redirección tras éxito
  useEffect(() => {
    if (step === 'success') {
      const t = setTimeout(() => router.push('/login'), 2500)
      return () => clearTimeout(t)
    }
  }, [step, router])

  // ── Paso 1: enviar formulario ──────────────────────────────
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password.length < 8)     { setError('La contraseña debe tener al menos 8 caracteres'); return }
    if (!/[A-Z]/.test(form.password)) { setError('La contraseña debe tener al menos una mayúscula'); return }
    if (!/[0-9]/.test(form.password)) { setError('La contraseña debe tener al menos un número'); return }

    setLoading(true)
    try {
      const res  = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al registrar'); return }
      setStep('otp')
      setResendCooldown(60)
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // ── Paso 2: verificar OTP ─────────────────────────────────
  async function handleVerify(code: string) {
    setError('')
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, code }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.attemptsRemaining !== undefined) setAttemptsLeft(data.attemptsRemaining)
        setError(data.error || 'Código incorrecto')
        setDigits(['', '', '', '', '', ''])
        setTimeout(() => inputRefs.current[0]?.focus(), 50)
        return
      }
      setStep('success')
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // ── Reenviar código ───────────────────────────────────────
  async function handleResend() {
    if (resendCooldown > 0) return
    setError('')
    setDigits(['', '', '', '', '', ''])
    setAttemptsLeft(5)
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al reenviar'); return }
      setResendCooldown(60)
      setTimeout(() => inputRefs.current[0]?.focus(), 80)
    } catch {
      setError('Error de conexión.')
    } finally {
      setLoading(false)
    }
  }

  // ── Handlers inputs OTP ───────────────────────────────────
  function handleDigitChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next  = [...digits]
    next[index] = digit
    setDigits(next)
    if (digit && index < 5) inputRefs.current[index + 1]?.focus()
    if (digit && index === 5) {
      const code = next.join('')
      if (code.length === 6) handleVerify(code)
    }
  }

  function handleDigitKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const next = [...digits]; next[index] = ''; setDigits(next)
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus()
      }
    }
  }

  function handleDigitPaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const next = ['', '', '', '', '', '']
    pasted.split('').forEach((d, i) => { next[i] = d })
    setDigits(next)
    inputRefs.current[Math.min(pasted.length - 1, 5)]?.focus()
    if (pasted.length === 6) handleVerify(pasted)
  }

  // ── Estilos compartidos ───────────────────────────────────
  const inp: React.CSSProperties = {
    width: '100%',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-accent)',
    borderRadius: '8px',
    padding: '11px 14px',
    fontSize: '14px',
    color: 'var(--text-primary)',
    outline: 'none',
    fontFamily: 'inherit',
  }
  const lbl: React.CSSProperties = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    marginBottom: '7px',
  }

  const roleOptions = [
    { value: 'OPERATOR',   label: 'Operador',      color: 'var(--accent)',  desc: 'Gestión de embarcaciones y rutas' },
    { value: 'TECHNICIAN', label: 'Técnico',        color: 'var(--info)',    desc: 'Mantenimiento y reportes técnicos' },
    { value: 'ADMIN',      label: 'Administrador', color: 'var(--danger)',  desc: 'Acceso total al sistema' },
  ]

  // ─────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', background: 'var(--bg-base)' }}>

      {/* Panel izquierdo */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(160deg, #0B1628 0%, #0E1F3E 55%, #132848 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '48px', borderRight: '1px solid var(--border-subtle)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <VenolsLogo size="lg" />
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', letterSpacing: '1px', marginTop: '8px' }}>
            Maritime Logistics Platform
          </div>
        </div>

        <div style={{ width: '100%', maxWidth: '300px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>
            {step === 'form' ? 'Niveles de acceso' : 'Verificación segura'}
          </div>

          {step === 'form' ? (
            roleOptions.map(r => (
              <div key={r.value} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 14px', marginBottom: '8px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-accent)', borderRadius: '10px',
              }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{r.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>{r.desc}</div>
                </div>
              </div>
            ))
          ) : (
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-accent)',
              borderRadius: '12px', padding: '20px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>📧</div>
              <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '6px' }}>
                Código enviado
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Revisa tu bandeja de entrada y carpeta de spam
              </div>
              <div style={{
                marginTop: '14px', padding: '8px 12px',
                background: 'rgba(195,160,65,0.08)', border: '1px solid rgba(195,160,65,0.2)',
                borderRadius: '8px', fontSize: '11px', color: 'var(--accent)', lineHeight: 1.5,
              }}>
                El código expira en <strong>10 minutos</strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Panel derecho */}
      <div style={{
        width: '480px', background: 'var(--bg-surface)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '48px 42px', overflowY: 'auto',
      }}>

        {/* ══ PASO 1: Formulario ══ */}
        {step === 'form' && (
          <>
            <div style={{ marginBottom: '28px' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Crear cuenta
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '6px' }}>
                Registro de nuevo usuario del sistema
              </div>
            </div>

            {error && (
              <div style={{
                background: 'var(--danger-dim)', border: '1px solid rgba(176,48,40,0.30)',
                borderRadius: '8px', padding: '10px 14px', fontSize: '13px',
                color: 'var(--danger)', marginBottom: '16px',
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleRegister}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={lbl}>Nombre</label>
                  <input style={inp} type="text" required placeholder="Juan"
                    value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
                </div>
                <div>
                  <label style={lbl}>Apellido</label>
                  <input style={inp} type="text" required placeholder="Pérez"
                    value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={lbl}>Email</label>
                <input style={inp} type="email" required placeholder="usuario@venols.com"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={lbl}>Contraseña</label>
                <input style={inp} type="password" required placeholder="Mín. 8 caracteres, 1 mayúscula, 1 número"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={lbl}>Rol</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                  style={{ ...inp, cursor: 'pointer' }}>
                  <option value="OPERATOR">Operador</option>
                  <option value="TECHNICIAN">Técnico</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>

              <button type="submit" disabled={loading} style={{
                width: '100%',
                background: loading ? 'rgba(195,160,65,0.4)' : 'var(--accent)',
                border: 'none', borderRadius: '8px', padding: '13px',
                fontSize: '14px', fontWeight: 700,
                color: loading ? 'rgba(8,14,26,0.5)' : '#080E1A',
                cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              }}>
                {loading ? 'Enviando código…' : 'Continuar'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--text-muted)' }}>
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
                Iniciar sesión
              </Link>
            </div>
          </>
        )}

        {/* ══ PASO 2: OTP ══ */}
        {step === 'otp' && (
          <>
            <div style={{ marginBottom: '28px' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Verifica tu correo
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.5 }}>
                Ingresa el código enviado a{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{form.email}</strong>
              </div>
            </div>

            {error && (
              <div style={{
                background: 'var(--danger-dim)', border: '1px solid rgba(176,48,40,0.30)',
                borderRadius: '8px', padding: '10px 14px', fontSize: '13px',
                color: 'var(--danger)', marginBottom: '20px',
              }}>
                {error}
                {attemptsLeft < 5 && attemptsLeft > 0 && (
                  <span style={{ display: 'block', marginTop: '4px', fontSize: '12px', opacity: 0.85 }}>
                    {attemptsLeft} {attemptsLeft === 1 ? 'intento restante' : 'intentos restantes'}
                  </span>
                )}
              </div>
            )}

            {/* 6 inputs individuales */}
            <div style={{ marginBottom: '28px' }}>
              <label style={{ ...lbl, marginBottom: '16px', textAlign: 'center', display: 'block' }}>
                Código de verificación
              </label>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    disabled={loading}
                    onChange={e => handleDigitChange(i, e.target.value)}
                    onKeyDown={e => handleDigitKeyDown(i, e)}
                    onPaste={handleDigitPaste}
                    style={{
                      width: '52px', height: '60px',
                      textAlign: 'center',
                      fontSize: '24px', fontWeight: 700,
                      fontFamily: 'monospace',
                      background: d ? 'rgba(195,160,65,0.08)' : 'var(--bg-input)',
                      border: d ? '2px solid var(--accent)' : '1px solid var(--border-accent)',
                      borderRadius: '10px',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      cursor: loading ? 'not-allowed' : 'text',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Botón verificar */}
            <button
              disabled={loading || digits.join('').length < 6}
              onClick={() => handleVerify(digits.join(''))}
              style={{
                width: '100%',
                background: (loading || digits.join('').length < 6)
                  ? 'rgba(195,160,65,0.3)' : 'var(--accent)',
                border: 'none', borderRadius: '8px', padding: '13px',
                fontSize: '14px', fontWeight: 700,
                color: (loading || digits.join('').length < 6) ? 'rgba(8,14,26,0.4)' : '#080E1A',
                cursor: (loading || digits.join('').length < 6) ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', marginBottom: '20px',
              }}
            >
              {loading ? 'Verificando…' : 'Verificar código'}
            </button>

            {/* Reenviar */}
            <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px' }}>
              ¿No recibiste el código?{' '}
              {resendCooldown > 0 ? (
                <span>Reenviar en <strong style={{ color: 'var(--text-primary)' }}>{resendCooldown}s</strong></span>
              ) : (
                <button onClick={handleResend} disabled={loading} style={{
                  background: 'none', border: 'none', padding: 0,
                  color: 'var(--accent)', fontWeight: 600, fontSize: '13px',
                  cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline',
                }}>
                  Reenviar código
                </button>
              )}
            </div>

            {/* Volver */}
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => { setStep('form'); setError(''); setDigits(['', '', '', '', '', '']) }}
                style={{
                  background: 'none', border: 'none', padding: 0,
                  color: 'var(--text-muted)', fontSize: '13px',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                ← Cambiar datos
              </button>
            </div>
          </>
        )}

        {/* ══ PASO 3: Éxito ══ */}
        {step === 'success' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'rgba(34,197,94,0.12)',
              border: '2px solid rgba(34,197,94,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px', fontSize: '36px', color: '#22c55e',
            }}>
              ✓
            </div>

            <div style={{ fontSize: '26px', fontWeight: 700, color: '#22c55e', marginBottom: '10px', letterSpacing: '-0.3px' }}>
              ¡Código válido!
            </div>
            <div style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Tu cuenta fue creada exitosamente.
              <br />
              Redirigiendo al inicio de sesión…
            </div>

            {/* Barra de progreso */}
            <div style={{
              marginTop: '32px', height: '3px',
              background: 'var(--border-accent)', borderRadius: '2px', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', width: '100%', background: '#22c55e',
                borderRadius: '2px',
                animation: 'fillBar 2.5s linear forwards',
                transformOrigin: 'left',
              }} />
            </div>

            <style>{`
              @keyframes fillBar {
                from { transform: scaleX(0); }
                to   { transform: scaleX(1); }
              }
            `}</style>
          </div>
        )}
      </div>
    </div>
  )
}
