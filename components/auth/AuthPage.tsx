'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Panel = 'login' | 'register'
type Step  = 'form' | 'otp' | 'success'

const ROLE_OPTIONS = [
  { value: 'STANDARD',       label: 'Estándar' },
  { value: 'OPERATOR_HEAVY', label: 'Op. Flota Pesada' },
  { value: 'OPERATOR_LIGHT', label: 'Op. Flota Liviana' },
  { value: 'ADMIN',          label: 'Administrador' },
]

export default function AuthPage({ initialPanel }: { initialPanel?: Panel }) {
  const router = useRouter()

  // ── Panel state ──────────────────────────────────────────
  const [panel, setPanel] = useState<Panel | null>(null)

  function openPanel(p: Panel) {
    setPanel(p)
    setLoginError('')
    setRegError('')
    setStep('form')
    setDigits(['', '', '', '', '', ''])
  }
  function closePanel() {
    if (loginLoading || regLoading) return
    setPanel(null)
    setLoginError('')
    setRegError('')
  }

  // ── Login state ──────────────────────────────────────────
  const [loginForm, setLoginForm]   = useState({ email: '', password: '' })
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)
    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      })
      const data = await res.json()
      if (!res.ok) { setLoginError(data.error || 'Error al iniciar sesión'); return }
      localStorage.setItem('token', data.accessToken)
      localStorage.setItem('user', JSON.stringify(data.user))
      router.push('/dashboard')
    } catch {
      setLoginError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoginLoading(false)
    }
  }

  // ── Register state ───────────────────────────────────────
  const [regForm, setRegForm] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [step, setStep]               = useState<Step>('form')
  const [digits, setDigits]           = useState(['', '', '', '', '', ''])
  const inputRefs                      = useRef<(HTMLInputElement | null)[]>([])
  const [regError, setRegError]       = useState('')
  const [regLoading, setRegLoading]   = useState(false)
  const [attemptsLeft, setAttemptsLeft] = useState(5)
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  useEffect(() => {
    if (step === 'otp') setTimeout(() => inputRefs.current[0]?.focus(), 80)
  }, [step])

  useEffect(() => {
    if (step === 'success') {
      const t = setTimeout(() => {
        setStep('form')
        openPanel('login')
      }, 2500)
      return () => clearTimeout(t)
    }
  }, [step])

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setRegError('')
    if (regForm.password.length < 8)     { setRegError('La contraseña debe tener al menos 8 caracteres'); return }
    if (!/[A-Z]/.test(regForm.password)) { setRegError('La contraseña debe tener al menos una mayúscula'); return }
    if (!/[0-9]/.test(regForm.password)) { setRegError('La contraseña debe tener al menos un número'); return }
    setRegLoading(true)
    try {
      const res  = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm),
      })
      const data = await res.json()
      if (!res.ok) { setRegError(data.error || 'Error al registrar'); return }
      setStep('otp')
      setResendCooldown(60)
    } catch {
      setRegError('Error de conexión. Intenta de nuevo.')
    } finally {
      setRegLoading(false)
    }
  }

  async function handleVerify(code: string) {
    setRegError('')
    setRegLoading(true)
    try {
      const res  = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regForm.email, code }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.attemptsRemaining !== undefined) setAttemptsLeft(data.attemptsRemaining)
        setRegError(data.error || 'Código incorrecto')
        setDigits(['', '', '', '', '', ''])
        setTimeout(() => inputRefs.current[0]?.focus(), 50)
        return
      }
      setStep('success')
    } catch {
      setRegError('Error de conexión. Intenta de nuevo.')
    } finally {
      setRegLoading(false)
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return
    setRegError('')
    setDigits(['', '', '', '', '', ''])
    setAttemptsLeft(5)
    setRegLoading(true)
    try {
      const res  = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm),
      })
      const data = await res.json()
      if (!res.ok) { setRegError(data.error || 'Error al reenviar'); return }
      setResendCooldown(60)
      setTimeout(() => inputRefs.current[0]?.focus(), 80)
    } catch {
      setRegError('Error de conexión.')
    } finally {
      setRegLoading(false)
    }
  }

  function handleDigitChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next  = [...digits]; next[index] = digit; setDigits(next)
    if (digit && index < 5) inputRefs.current[index + 1]?.focus()
    if (digit && index === 5 && next.join('').length === 6) handleVerify(next.join(''))
  }
  function handleDigitKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace') {
      if (digits[index]) { const n = [...digits]; n[index] = ''; setDigits(n) }
      else if (index > 0) inputRefs.current[index - 1]?.focus()
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

  const isOpen = panel !== null

  return (
    <>
      <style>{`
        .auth-bg {
          height: 100vh; height: 100dvh;
          background: #E8E6E2;
          display: flex; align-items: center; justify-content: center;
          position: relative; overflow: hidden;
        }
        .auth-landing {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          position: relative; z-index: 10;
          padding: clamp(16px, 4vw, 48px);
          width: 100%; max-width: clamp(320px, 70vw, 900px);
          margin: 0 auto;
        }
        .auth-logo {
          height: clamp(100px, 14vw, 210px);
          width: auto; object-fit: contain; user-select: none;
          margin-bottom: clamp(16px, 2.5vw, 28px);
        }
        .auth-subtitle {
          font-size: clamp(11px, 1.6vw, 14px);
          color: rgba(82,82,82,0.6);
          letter-spacing: clamp(1.5px, 0.4vw, 2.5px);
          text-transform: uppercase;
          margin-bottom: clamp(36px, 6vw, 64px);
          font-family: system-ui, sans-serif; text-align: center;
        }
        .auth-cta-btn {
          padding: clamp(13px, 2vw, 16px) clamp(32px, 5vw, 56px);
          background: #525252; border: none; border-radius: 10px;
          font-size: clamp(14px, 1.8vw, 16px); font-weight: 700; color: #fff;
          cursor: pointer; letter-spacing: 0.5px; font-family: system-ui, sans-serif;
          box-shadow: 0 4px 20px rgba(82,82,82,0.22);
          transition: background 0.15s, box-shadow 0.15s, transform 0.1s;
          width: clamp(220px, 70vw, 280px);
          touch-action: manipulation;
        }
        .auth-cta-btn:hover {
          background: #3D3D3D;
          box-shadow: 0 6px 28px rgba(82,82,82,0.32);
          transform: translateY(-1px);
        }
        .auth-c1 {
          position: absolute; bottom: -80px; left: -60px;
          width: clamp(180px, 32vw, 520px); height: clamp(180px, 32vw, 520px);
          border-radius: 50%; border: 1px solid rgba(82,82,82,0.08); pointer-events: none;
        }
        .auth-c2 {
          position: absolute; top: -100px; right: -80px;
          width: clamp(140px, 26vw, 440px); height: clamp(140px, 26vw, 440px);
          border-radius: 50%; border: 1px solid rgba(82,82,82,0.05); pointer-events: none;
        }
        .auth-c3 {
          position: absolute; top: 40%; left: 10%;
          width: clamp(70px, 12vw, 240px); height: clamp(70px, 12vw, 240px);
          border-radius: 50%; border: 1px solid rgba(82,82,82,0.04); pointer-events: none;
        }
        .auth-panel {
          position: fixed; top: 0; right: 0; height: 100%;
          background: var(--bg-surface);
          border-left: 1px solid rgba(240,188,0,0.12);
          z-index: 30; overflow-y: auto;
          width: min(clamp(340px, 48vw, 560px), 100vw);
          padding: clamp(52px, 5vw, 80px) clamp(18px, 4.5vw, 56px) clamp(28px, 4vw, 56px);
          box-sizing: border-box;
        }
        @media (min-width: 2560px) { .auth-panel { width: min(700px, 100vw); } }
        .auth-close {
          position: absolute;
          top: clamp(12px, 2vw, 22px); right: clamp(12px, 2vw, 22px);
          width: clamp(28px, 3.5vw, 38px); height: clamp(28px, 3.5vw, 38px);
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.5); font-size: clamp(12px, 1.6vw, 17px);
          transition: background 0.15s; font-family: system-ui, sans-serif;
        }
        .auth-close:hover { background: rgba(255,255,255,0.10); }
        .auth-panel-title {
          font-size: clamp(20px, 2.8vw, 28px); font-weight: 700;
          color: var(--text-primary); letter-spacing: -0.3px;
          margin-bottom: 6px; font-family: system-ui, sans-serif;
        }
        .auth-panel-sub {
          font-size: clamp(13px, 1.6vw, 15px);
          color: var(--text-muted); font-family: system-ui, sans-serif;
        }
        .auth-label {
          display: block; font-size: clamp(10px, 1.2vw, 12px);
          font-weight: 600; letter-spacing: 1px; text-transform: uppercase;
          color: var(--text-muted); margin-bottom: 7px; font-family: system-ui, sans-serif;
        }
        .auth-input {
          width: 100%; box-sizing: border-box;
          padding: clamp(10px, 1.4vw, 13px) clamp(12px, 1.6vw, 16px);
          background: var(--bg-input); border: 1px solid var(--border-accent);
          border-radius: 8px; font-size: clamp(13px, 1.5vw, 15px);
          color: var(--text-primary); outline: none; font-family: system-ui, sans-serif;
        }
        .auth-submit {
          width: 100%; padding: clamp(11px, 1.6vw, 14px);
          border: none; border-radius: 8px;
          font-size: clamp(13px, 1.6vw, 15px); font-weight: 700;
          font-family: system-ui, sans-serif; margin-top: 4px; transition: background 0.15s;
        }
        .auth-switch-btn {
          display: inline-block;
          padding: clamp(9px, 1.4vw, 12px) clamp(20px, 3vw, 32px);
          border: 1px solid rgba(240,188,0,0.35); border-radius: 8px;
          font-size: clamp(12px, 1.4vw, 14px); font-weight: 600;
          color: #F0BC00; background: none; cursor: pointer;
          font-family: system-ui, sans-serif;
          transition: border-color 0.15s, background 0.15s;
          touch-action: manipulation;
        }
        .auth-switch-btn:hover {
          background: rgba(240,188,0,0.07);
          border-color: rgba(240,188,0,0.6);
        }
        .auth-divider {
          margin-top: clamp(20px, 3vw, 32px);
          padding-top: clamp(16px, 2.5vw, 24px);
          border-top: 1px solid rgba(255,255,255,0.06); text-align: center;
        }
        .auth-divider-text {
          font-size: clamp(12px, 1.4vw, 14px);
          color: var(--text-muted); margin-bottom: 12px; font-family: system-ui, sans-serif;
        }
        .otp-digit {
          text-align: center; font-weight: 700; font-family: monospace;
          border-radius: 10px; outline: none;
          transition: border-color 0.15s, background 0.15s;
          width: clamp(38px, 10vw, 56px); height: clamp(46px, 12vw, 64px);
          font-size: clamp(18px, 4vw, 26px);
        }
        .auth-success-icon {
          width: clamp(56px, 8vw, 80px); height: clamp(56px, 8vw, 80px);
          border-radius: 50%;
          background: rgba(34,197,94,0.12); border: 2px solid rgba(34,197,94,0.4);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto clamp(16px, 3vw, 28px);
          font-size: clamp(24px, 5vw, 40px); color: #22c55e;
        }
        @media (max-width: 768px) {
          .auth-input, .otp-digit { font-size: 16px !important; }
          .auth-cta-btn, .auth-submit, .auth-switch-btn { touch-action: manipulation; }
        }
        @keyframes fillBar { from { transform: scaleX(0); } to { transform: scaleX(1); } }
      `}</style>

      <div className="auth-bg">
        <div className="auth-c1" />
        <div className="auth-c2" />
        <div className="auth-c3" />

        {/* ── Landing ── */}
        <div className="auth-landing">
          <img src="/logo-final-3.png" alt="VENOLS" className="auth-logo" draggable={false} />
          <p className="auth-subtitle">Maritime Logistics Platform</p>
          <button className="auth-cta-btn" onClick={() => openPanel(initialPanel ?? 'login')}>
            {initialPanel === 'register' ? 'Crear Cuenta' : 'Ingresar al Sistema'}
          </button>
        </div>

        {/* ── Overlay ── */}
        <div
          onClick={closePanel}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)',
            zIndex: 20,
            opacity: isOpen ? 1 : 0,
            pointerEvents: isOpen ? 'auto' : 'none',
            transition: 'opacity 0.25s ease',
          }}
        />

        {/* ── Panel ── */}
        <div
          className="auth-panel"
          style={{ transform: isOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.3s cubic-bezier(0.32,0.72,0,1)' }}
        >
          <button className="auth-close" onClick={closePanel}>✕</button>

          {/* ════ LOGIN ════ */}
          {panel === 'login' && (
            <>
              <div style={{ marginBottom: 'clamp(18px, 3vw, 28px)' }}>
                <div className="auth-panel-title">Iniciar sesión</div>
                <div className="auth-panel-sub" style={{ marginTop: '6px' }}>Accede a tu panel de gestión marítima</div>
              </div>

              {loginError && (
                <div style={{ background: 'var(--danger-dim)', border: '1px solid rgba(176,48,40,0.30)', borderRadius: '8px', padding: '10px 14px', fontSize: 'clamp(12px,1.4vw,14px)', color: 'var(--danger)', marginBottom: '16px', fontFamily: 'system-ui,sans-serif' }}>
                  {loginError}
                </div>
              )}

              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 2vw, 18px)' }}>
                <div>
                  <label className="auth-label">Email</label>
                  <input className="auth-input" type="email" required value={loginForm.email}
                    onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} placeholder="usuario@venols.com" />
                </div>
                <div>
                  <label className="auth-label">Contraseña</label>
                  <input className="auth-input" type="password" required value={loginForm.password}
                    onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} placeholder="••••••••" />
                </div>
                <button className="auth-submit" type="submit" disabled={loginLoading}
                  style={{ background: loginLoading ? 'rgba(240,188,0,0.4)' : '#F0BC00', color: loginLoading ? 'rgba(17,17,17,0.5)' : '#111', cursor: loginLoading ? 'not-allowed' : 'pointer' }}>
                  {loginLoading ? 'Verificando…' : 'Ingresar al Sistema'}
                </button>
              </form>

              <div className="auth-divider">
                <p className="auth-divider-text">¿No tienes cuenta?</p>
                <button className="auth-switch-btn" onClick={() => openPanel('register')}>Crear cuenta</button>
              </div>
            </>
          )}

          {/* ════ REGISTER — PASO 1 ════ */}
          {panel === 'register' && step === 'form' && (
            <>
              <div style={{ marginBottom: 'clamp(18px, 3vw, 28px)' }}>
                <div className="auth-panel-title">Crear cuenta</div>
                <div className="auth-panel-sub" style={{ marginTop: '6px' }}>Registro de nuevo usuario del sistema</div>
              </div>

              {regError && (
                <div style={{ background: 'var(--danger-dim)', border: '1px solid rgba(176,48,40,0.30)', borderRadius: '8px', padding: '10px 14px', fontSize: 'clamp(12px,1.4vw,14px)', color: 'var(--danger)', marginBottom: '16px', fontFamily: 'system-ui,sans-serif' }}>
                  {regError}
                </div>
              )}

              <form onSubmit={handleRegister}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(8px,1.5vw,14px)', marginBottom: 'clamp(10px,1.5vw,14px)' }}>
                  <div>
                    <label className="auth-label">Nombre</label>
                    <input className="auth-input" type="text" required placeholder="Juan"
                      value={regForm.firstName} onChange={e => setRegForm({ ...regForm, firstName: e.target.value })} />
                  </div>
                  <div>
                    <label className="auth-label">Apellido</label>
                    <input className="auth-input" type="text" required placeholder="Pérez"
                      value={regForm.lastName} onChange={e => setRegForm({ ...regForm, lastName: e.target.value })} />
                  </div>
                </div>
                <div style={{ marginBottom: 'clamp(10px,1.5vw,14px)' }}>
                  <label className="auth-label">Email</label>
                  <input className="auth-input" type="email" required placeholder="usuario@venols.com"
                    value={regForm.email} onChange={e => setRegForm({ ...regForm, email: e.target.value })} />
                </div>
                <div style={{ marginBottom: 'clamp(10px,1.5vw,14px)' }}>
                  <label className="auth-label">Contraseña</label>
                  <input className="auth-input" type="password" required placeholder="Mín. 8 caracteres, 1 mayúscula, 1 número"
                    value={regForm.password} onChange={e => setRegForm({ ...regForm, password: e.target.value })} />
                </div>
                <div style={{ marginBottom: 'clamp(16px,2.5vw,24px)' }}>
                  <label className="auth-label">Acceso</label>
                  <div className="auth-input" style={{ cursor: 'default', opacity: 0.75, color: 'var(--text-muted)', fontFamily: 'system-ui,sans-serif' }}>
                    Estándar
                  </div>
                </div>
                <button className="auth-submit" type="submit" disabled={regLoading}
                  style={{ background: regLoading ? 'rgba(240,188,0,0.4)' : '#F0BC00', color: regLoading ? 'rgba(17,17,17,0.5)' : '#111', cursor: regLoading ? 'not-allowed' : 'pointer' }}>
                  {regLoading ? 'Enviando código…' : 'Continuar'}
                </button>
              </form>

              <div className="auth-divider">
                <p className="auth-divider-text">¿Ya tienes cuenta?</p>
                <button className="auth-switch-btn" onClick={() => openPanel('login')}>Iniciar sesión</button>
              </div>
            </>
          )}

          {/* ════ REGISTER — PASO 2: OTP ════ */}
          {panel === 'register' && step === 'otp' && (
            <>
              <div style={{ marginBottom: 'clamp(18px,3vw,28px)' }}>
                <div className="auth-panel-title">Verifica tu correo</div>
                <div className="auth-panel-sub" style={{ marginTop: '8px', lineHeight: 1.5 }}>
                  Ingresa el código enviado a <strong style={{ color: 'var(--text-primary)' }}>{regForm.email}</strong>
                </div>
              </div>

              {regError && (
                <div style={{ background: 'var(--danger-dim)', border: '1px solid rgba(176,48,40,0.30)', borderRadius: '8px', padding: '10px 14px', fontSize: 'clamp(12px,1.4vw,14px)', color: 'var(--danger)', marginBottom: '20px', fontFamily: 'system-ui,sans-serif' }}>
                  {regError}
                  {attemptsLeft < 5 && attemptsLeft > 0 && (
                    <span style={{ display: 'block', marginTop: '4px', fontSize: '12px', opacity: 0.85 }}>
                      {attemptsLeft} {attemptsLeft === 1 ? 'intento restante' : 'intentos restantes'}
                    </span>
                  )}
                </div>
              )}

              <div style={{ marginBottom: 'clamp(20px,3vw,32px)' }}>
                <label className="auth-label" style={{ marginBottom: '16px', textAlign: 'center', display: 'block' }}>Código de verificación</label>
                <div style={{ display: 'flex', gap: 'clamp(6px,1.5vw,12px)', justifyContent: 'center' }}>
                  {digits.map((d, i) => (
                    <input key={i} ref={el => { inputRefs.current[i] = el }} className="otp-digit"
                      type="text" inputMode="numeric" maxLength={1} value={d} disabled={regLoading}
                      onChange={e => handleDigitChange(i, e.target.value)}
                      onKeyDown={e => handleDigitKeyDown(i, e)}
                      onPaste={handleDigitPaste}
                      style={{ background: d ? 'rgba(240,188,0,0.08)' : 'var(--bg-input)', border: d ? '2px solid #F0BC00' : '1px solid var(--border-accent)', color: 'var(--text-primary)', cursor: regLoading ? 'not-allowed' : 'text' }}
                    />
                  ))}
                </div>
              </div>

              <button className="auth-submit" disabled={regLoading || digits.join('').length < 6}
                onClick={() => handleVerify(digits.join(''))}
                style={{ background: (regLoading || digits.join('').length < 6) ? 'rgba(240,188,0,0.3)' : '#F0BC00', color: (regLoading || digits.join('').length < 6) ? 'rgba(17,17,17,0.4)' : '#111', cursor: (regLoading || digits.join('').length < 6) ? 'not-allowed' : 'pointer', marginBottom: 'clamp(14px,2.5vw,22px)' }}>
                {regLoading ? 'Verificando…' : 'Verificar código'}
              </button>

              <div style={{ textAlign: 'center', fontSize: 'clamp(12px,1.5vw,14px)', color: 'var(--text-muted)', marginBottom: '10px', fontFamily: 'system-ui,sans-serif' }}>
                ¿No recibiste el código?{' '}
                {resendCooldown > 0
                  ? <span>Reenviar en <strong style={{ color: 'var(--text-primary)' }}>{resendCooldown}s</strong></span>
                  : <button onClick={handleResend} disabled={regLoading} style={{ background: 'none', border: 'none', padding: 0, color: '#F0BC00', fontWeight: 600, fontSize: 'inherit', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}>Reenviar código</button>
                }
              </div>
              <div style={{ textAlign: 'center' }}>
                <button onClick={() => { setStep('form'); setRegError(''); setDigits(['','','','','','']) }}
                  style={{ background: 'none', border: 'none', padding: 0, color: 'var(--text-muted)', fontSize: 'clamp(12px,1.5vw,14px)', cursor: 'pointer', fontFamily: 'system-ui,sans-serif' }}>
                  ← Cambiar datos
                </button>
              </div>
            </>
          )}

          {/* ════ REGISTER — PASO 3: Éxito ════ */}
          {panel === 'register' && step === 'success' && (
            <div style={{ textAlign: 'center', paddingTop: 'clamp(20px,5vw,48px)' }}>
              <div className="auth-success-icon">✓</div>
              <div style={{ fontSize: 'clamp(20px,3.5vw,28px)', fontWeight: 700, color: '#22c55e', marginBottom: '10px', letterSpacing: '-0.3px', fontFamily: 'system-ui,sans-serif' }}>¡Código válido!</div>
              <div style={{ fontSize: 'clamp(13px,1.8vw,16px)', color: 'var(--text-muted)', lineHeight: 1.6, fontFamily: 'system-ui,sans-serif' }}>
                Tu cuenta fue creada exitosamente.<br />Redirigiendo al inicio de sesión…
              </div>
              <div style={{ marginTop: 'clamp(20px,4vw,36px)', height: '3px', background: 'var(--border-accent)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '100%', background: '#22c55e', borderRadius: '2px', animation: 'fillBar 2.5s linear forwards', transformOrigin: 'left' }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
