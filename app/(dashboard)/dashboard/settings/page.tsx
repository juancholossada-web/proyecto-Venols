'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api-client'
import { UploadButton } from '@/lib/uploadthing-client'

type User = { id: string; firstName: string; lastName: string; email: string; phone?: string; role: string; avatar?: string }

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador', OPERATOR_HEAVY: 'Op. Flota Pesada',
  OPERATOR_LIGHT: 'Op. Flota Liviana', STANDARD: 'Estándar',
}

const card: React.CSSProperties = { background: 'var(--bg-surface)', border: '1px solid var(--border-accent)', borderRadius: '12px', overflow: 'hidden' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-accent)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }
const btnPrimary: React.CSSProperties = { padding: '10px 20px', background: 'var(--accent)', border: 'none', borderRadius: '8px', color: '#080E1A', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '5px' }

function PasswordField({ value, onChange, show, onToggle, placeholder }: {
  value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void; placeholder: string
}) {
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'} value={value}
        onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ ...inputStyle, paddingRight: '40px' }} required
      />
      <button type="button" onClick={onToggle} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}>
        <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>{show ? 'visibility_off' : 'visibility'}</span>
      </button>
    </div>
  )
}

function ToggleSwitch({ defaultChecked }: { defaultChecked: boolean }) {
  const [on, setOn] = useState(defaultChecked)
  return (
    <div onClick={() => setOn(!on)} style={{ width: '44px', height: '24px', borderRadius: '12px', background: on ? 'var(--success)' : 'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'white', position: 'absolute', top: '2px', left: on ? '22px' : '2px', transition: 'left 0.2s' }} />
    </div>
  )
}

export default function SettingsPage() {
  const [user, setUser]         = useState<User | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast]       = useState('')

  /* Change password */
  const [current, setCurrent]   = useState('')
  const [next, setNext]         = useState('')
  const [confirm, setConfirm]   = useState('')
  const [pwdError, setPwdError] = useState('')
  const [pwdOk, setPwdOk]       = useState(false)
  const [saving, setSaving]     = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNext, setShowNext]       = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  useEffect(() => {
    api<{ user: User }>('/api/auth/me').then(data => {
      setUser(data.user)
      setAvatarUrl(data.user.avatar || null)
    }).catch(() => {})
  }, [])

  async function handleAvatarUpload(url: string) {
    setAvatarUrl(url)
    try {
      await api('/api/auth/update-avatar', { method: 'PATCH', body: JSON.stringify({ avatar: url }) })
      const stored = localStorage.getItem('user')
      if (stored) {
        const u = JSON.parse(stored)
        localStorage.setItem('user', JSON.stringify({ ...u, avatar: url }))
        window.dispatchEvent(new CustomEvent('avatar-updated'))
      }
      showToast('Foto de perfil actualizada')
    } catch {}
  }

  async function handleChangePwd(e: React.FormEvent) {
    e.preventDefault()
    setPwdError('')
    if (next !== confirm) { setPwdError('Las contraseñas nuevas no coinciden'); return }
    if (next.length < 8)  { setPwdError('La nueva contraseña debe tener al menos 8 caracteres'); return }
    setSaving(true)
    try {
      await api('/api/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword: current, newPassword: next }) })
      setPwdOk(true)
      setCurrent(''); setNext(''); setConfirm('')
    } catch (err: any) {
      setPwdError(err?.message || 'Error al cambiar la contraseña')
    } finally {
      setSaving(false)
    }
  }

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '??'

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', background: 'var(--success)', color: 'white', padding: '10px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, zIndex: 2000 }}>
          {toast}
        </div>
      )}

      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Mi Perfil</div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Gestiona tu información y seguridad</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* ── Avatar + Info ── */}
        <div style={{ ...card, padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>

            {/* Avatar clickeable */}
            <div style={{ position: 'relative', flexShrink: 0, width: '80px', height: '80px' }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" style={{ width: '80px', height: '80px', borderRadius: '16px', objectFit: 'cover', border: '2px solid var(--border-accent)' }} />
              ) : (
                <div style={{ width: '80px', height: '80px', borderRadius: '16px', background: 'var(--accent-dim)', border: '2px solid var(--border-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '28px', fontWeight: 900, color: 'var(--accent)' }}>{initials}</span>
                </div>
              )}

              {/* Overlay hover */}
              <div className="upload-overlay" style={{ position: 'absolute', inset: 0, borderRadius: '16px', background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', opacity: 0, transition: 'opacity 0.2s', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
              >
                <span className="material-symbols-outlined" style={{ color: 'white', fontSize: '20px' }}>photo_camera</span>
                <span style={{ color: 'white', fontSize: '10px', fontWeight: 700 }}>Cambiar</span>
                <div style={{ position: 'absolute', inset: 0, opacity: 0 }}>
                  <UploadButton
                    endpoint="profileImage"
                    onUploadBegin={() => setUploading(true)}
                    onClientUploadComplete={res => { setUploading(false); if (res?.[0]?.url) handleAvatarUpload(res[0].url) }}
                    onUploadError={() => setUploading(false)}
                    appearance={{ button: { position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', padding: 0, margin: 0 }, allowedContent: { display: 'none' } }}
                  />
                </div>
              </div>

              {uploading && (
                <div style={{ position: 'absolute', inset: 0, borderRadius: '16px', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--accent)', fontSize: '24px' }}>progress_activity</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {user ? `${user.firstName} ${user.lastName}` : '—'}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{user?.email}</span>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--border-accent)', display: 'inline-block', width: 'fit-content' }}>
                {ROLE_LABELS[user?.role || ''] || user?.role}
              </span>
            </div>
          </div>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '12px' }}>
            Pasa el cursor sobre la foto para cambiarla.
          </p>
        </div>

        {/* ── Cambiar contraseña ── */}
        <details style={card}>
          <summary style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '18px 20px', cursor: 'pointer', listStyle: 'none' }}>
            <div style={{ width: '34px', height: '34px', background: 'var(--accent-dim)', border: '1px solid var(--border-accent)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: '17px', color: 'var(--accent)' }}>lock_reset</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Cambiar contraseña</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Actualiza tu contraseña de acceso</div>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>›</span>
          </summary>
          <div style={{ padding: '0 20px 20px' }}>
            {pwdOk ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '8px', background: 'rgba(39,174,96,0.1)', border: '1px solid rgba(39,174,96,0.2)' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--success)', fontSize: '20px' }}>check_circle</span>
                <span style={{ fontSize: '13px', color: 'var(--success)', fontWeight: 700 }}>Contraseña actualizada correctamente</span>
              </div>
            ) : (
              <form onSubmit={handleChangePwd} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div><label style={labelStyle}>Contraseña actual</label><PasswordField value={current} onChange={setCurrent} show={showCurrent} onToggle={() => setShowCurrent(o => !o)} placeholder="Tu contraseña actual" /></div>
                <div><label style={labelStyle}>Nueva contraseña</label><PasswordField value={next} onChange={setNext} show={showNext} onToggle={() => setShowNext(o => !o)} placeholder="Mínimo 8 caracteres" /></div>
                <div><label style={labelStyle}>Confirmar nueva contraseña</label><PasswordField value={confirm} onChange={setConfirm} show={showConfirm} onToggle={() => setShowConfirm(o => !o)} placeholder="Repite la nueva contraseña" /></div>
                {pwdError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '8px', background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.2)' }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--danger)', fontSize: '16px' }}>error</span>
                    <span style={{ fontSize: '12px', color: 'var(--danger)' }}>{pwdError}</span>
                  </div>
                )}
                <div>
                  <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
                    {saving ? 'Guardando…' : 'Actualizar contraseña'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </details>

        {/* ── Empresa ── */}
        <details style={card}>
          <summary style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '18px 20px', cursor: 'pointer', listStyle: 'none' }}>
            <div style={{ width: '34px', height: '34px', background: 'var(--accent-dim)', border: '1px solid var(--border-accent)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>EMP</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Empresa</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Datos de la organización</div>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>›</span>
          </summary>
          <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div><label style={labelStyle}>Nombre de empresa</label><input defaultValue="VENOLS C.A." style={inputStyle} /></div>
              <div><label style={labelStyle}>RIF</label><input defaultValue="J-12345678-9" style={inputStyle} /></div>
            </div>
            <div><label style={labelStyle}>Dirección</label><input defaultValue="Maracaibo, Estado Zulia, Venezuela" style={inputStyle} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div><label style={labelStyle}>Teléfono</label><input defaultValue="+58 261-7001000" style={inputStyle} /></div>
              <div><label style={labelStyle}>Email</label><input defaultValue="admin@venols.com" style={inputStyle} /></div>
            </div>
            <div><button onClick={() => showToast('Datos de empresa actualizados')} style={btnPrimary}>Guardar</button></div>
          </div>
        </details>

        {/* ── Notificaciones ── */}
        <details style={card}>
          <summary style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '18px 20px', cursor: 'pointer', listStyle: 'none' }}>
            <div style={{ width: '34px', height: '34px', background: 'var(--accent-dim)', border: '1px solid var(--border-accent)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>NTF</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Notificaciones</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Alertas y configuración de avisos</div>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>›</span>
          </summary>
          <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              { label: 'Alerta de certificaciones por vencer', desc: 'Notificar 30 días antes del vencimiento', def: true },
              { label: 'Alerta de combustible bajo', desc: 'Notificar cuando ROB < 20%', def: true },
              { label: 'Órdenes de mantenimiento críticas', desc: 'Notificar órdenes con prioridad crítica', def: true },
              { label: 'Nuevos viajes asignados', desc: 'Notificar cuando se crea un nuevo viaje', def: false },
              { label: 'Reportes semanales por email', desc: 'Resumen semanal de operaciones', def: false },
            ].map((n, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(212,149,10,0.06)' }}>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>{n.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{n.desc}</div>
                </div>
                <ToggleSwitch defaultChecked={n.def} />
              </div>
            ))}
          </div>
        </details>

        {/* ── Acerca del sistema ── */}
        <details style={card}>
          <summary style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '18px 20px', cursor: 'pointer', listStyle: 'none' }}>
            <div style={{ width: '34px', height: '34px', background: 'var(--accent-dim)', border: '1px solid var(--border-accent)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>INF</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Acerca del sistema</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Versión e información técnica</div>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>›</span>
          </summary>
          <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '13px' }}>
            {[
              ['Sistema', 'VENOLS ERP v2.0.0'],
              ['Framework', 'Next.js 16'],
              ['Base de datos', 'PostgreSQL 15+'],
              ['ORM', 'Prisma 6'],
              ['Rol actual', ROLE_LABELS[user?.role || ''] || user?.role || '—'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(212,149,10,0.06)' }}>
                <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontFamily: 'monospace' }}>{v}</span>
              </div>
            ))}
          </div>
        </details>

      </div>
    </div>
  )
}
