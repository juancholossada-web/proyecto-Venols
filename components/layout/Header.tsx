'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useCallback } from 'react'
import { api } from '@/lib/api-client'

interface HeaderProps {
  user: { firstName: string; lastName: string; role: string }
  onMenuToggle: () => void
}

type NotificationItem = {
  id: string
  type: 'low_stock' | 'maintenance' | 'compliance'
  title: string
  detail: string
  severity: 'warning' | 'danger'
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN:          'Administrador',
  OPERATOR_HEAVY: 'Op. Flota Pesada',
  OPERATOR_LIGHT: 'Op. Flota Liviana',
  STANDARD:       'Estándar',
}

const TYPE_ICON: Record<string, string> = {
  low_stock:   'inventory_2',
  maintenance: 'build',
  compliance:  'description',
}

/* ─── Change Password Modal ─── */
function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [current, setCurrent]   = useState('')
  const [next, setNext]         = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)
  const [saving, setSaving]     = useState(false)

  const [showCurrent, setShowCurrent] = useState(false)
  const [showNext, setShowNext]       = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (next !== confirm) { setError('Las contraseñas nuevas no coinciden'); return }
    if (next.length < 8)  { setError('La nueva contraseña debe tener al menos 8 caracteres'); return }
    setSaving(true)
    try {
      await api('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      })
      setSuccess(true)
    } catch (err: any) {
      setError(err?.message || 'Error al cambiar la contraseña')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full bg-[#0e141e] border border-white/10 rounded-lg px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none focus:border-amber-500/60 transition-colors pr-10'

  function PasswordField({ value, onChange, show, onToggle, placeholder }: {
    value: string; onChange: (v: string) => void
    show: boolean; onToggle: () => void; placeholder: string
  }) {
    return (
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputCls}
          required
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          tabIndex={-1}
        >
          <span className="material-symbols-outlined text-[17px]">{show ? 'visibility_off' : 'visibility'}</span>
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-sm rounded-2xl border border-white/10 shadow-2xl overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-amber-500 text-[20px]">lock_reset</span>
            <span className="text-[14px] font-bold text-[var(--text-primary)]">Cambiar contraseña</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="px-5 py-5">
          {success ? (
            <div className="text-center py-4">
              <span className="material-symbols-outlined text-green-400 text-5xl block mb-3">check_circle</span>
              <p className="text-[14px] font-bold text-green-400 mb-1">Contraseña actualizada</p>
              <p className="text-[12px] text-slate-400 mb-5">Tu contraseña ha sido cambiada correctamente.</p>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-lg text-[13px] font-bold transition-colors"
                style={{ background: 'var(--accent)', color: '#080E1A' }}
              >
                Cerrar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] text-slate-500 uppercase tracking-wider mb-1.5">Contraseña actual</label>
                <PasswordField value={current} onChange={setCurrent} show={showCurrent} onToggle={() => setShowCurrent(o => !o)} placeholder="Tu contraseña actual" />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 uppercase tracking-wider mb-1.5">Nueva contraseña</label>
                <PasswordField value={next} onChange={setNext} show={showNext} onToggle={() => setShowNext(o => !o)} placeholder="Mínimo 8 caracteres" />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 uppercase tracking-wider mb-1.5">Confirmar nueva contraseña</label>
                <PasswordField value={confirm} onChange={setConfirm} show={showConfirm} onToggle={() => setShowConfirm(o => !o)} placeholder="Repite la nueva contraseña" />
              </div>

              {error && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                  <span className="material-symbols-outlined text-red-400 text-[16px]">error</span>
                  <span className="text-[12px] text-red-400">{error}</span>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-lg text-[13px] font-bold border border-white/10 text-slate-400 hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-lg text-[13px] font-bold transition-colors disabled:opacity-50"
                  style={{ background: 'var(--accent)', color: '#080E1A' }}
                >
                  {saving ? 'Guardando…' : 'Actualizar'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════ HEADER ═══════════════════════════════ */
export default function Header({ user, onMenuToggle }: HeaderProps) {
  const router   = useRouter()
  const label    = ROLE_LABELS[user.role] || user.role
  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()

  /* Notifications */
  const [notifs, setNotifs]     = useState<NotificationItem[]>([])
  const [bellOpen, setBellOpen] = useState(false)
  const [loadingNotifs, setLoadingNotifs] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)

  /* Profile menu */
  const [profileOpen, setProfileOpen]     = useState(false)
  const [showChangePwd, setShowChangePwd] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  /* ─── Fetch notifications ─── */
  const fetchNotifs = useCallback(async () => {
    setLoadingNotifs(true)
    try {
      const data = await api<NotificationItem[]>('/api/notifications')
      setNotifs(Array.isArray(data) ? data : [])
    } catch {
      setNotifs([])
    } finally {
      setLoadingNotifs(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 60_000)
    return () => clearInterval(interval)
  }, [fetchNotifs])

  /* ─── Close dropdowns on outside click ─── */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (bellOpen && bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false)
      if (profileOpen && profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [bellOpen, profileOpen])

  async function handleLogout() {
    setProfileOpen(false)
    const token = localStorage.getItem('token')
    if (token) {
      await fetch('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
    }
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.replace('/login')
  }

  const dangerCount = notifs.filter(n => n.severity === 'danger').length
  const totalCount  = notifs.length
  const badgeColor  = dangerCount > 0 ? '#e74c3c' : '#d4950a'

  return (
    <>
      <header className="h-14 lg:h-16 flex-shrink-0 bg-[#0e141e] border-b border-white/5 flex items-center justify-between px-3 sm:px-5 lg:px-6 shadow-[0_4px_24px_rgba(8,14,24,0.4)] z-30">

        {/* Left — hamburger + brand */}
        <div className="flex items-center gap-2 lg:gap-3">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 -ml-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
            aria-label="Abrir menú"
          >
            <span className="material-symbols-outlined text-[22px]">menu</span>
          </button>
          <span className="text-xl lg:text-2xl font-black tracking-tighter text-amber-500">VENOLS</span>
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest hidden xl:block">
            Sistema de Gestión Marítima
          </span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1.5 lg:gap-2">

          {/* Bell */}
          <div ref={bellRef} className="relative">
            <button
              onClick={() => { setBellOpen(o => !o); setProfileOpen(false) }}
              className="relative p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-white/5 transition-colors"
              aria-label="Notificaciones"
            >
              <span className="material-symbols-outlined text-[20px]">
                {totalCount > 0 ? 'notifications_active' : 'notifications'}
              </span>
              {totalCount > 0 && (
                <span
                  className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[10px] font-black text-white px-0.5"
                  style={{ background: badgeColor, lineHeight: 1 }}
                >
                  {totalCount > 99 ? '99+' : totalCount}
                </span>
              )}
            </button>

            {bellOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border border-white/10 shadow-2xl overflow-hidden z-50"
                style={{ background: 'var(--bg-elevated)' }}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
                  <span className="text-[13px] font-bold text-[var(--text-primary)]">Alertas del sistema</span>
                  <div className="flex items-center gap-2">
                    {dangerCount > 0 && (
                      <span className="text-[11px] font-bold text-red-400">{dangerCount} crítica{dangerCount > 1 ? 's' : ''}</span>
                    )}
                    <button
                      onClick={fetchNotifs}
                      className="p-1 rounded text-slate-500 hover:text-slate-300 transition-colors"
                      title="Actualizar"
                    >
                      <span className={`material-symbols-outlined text-[15px] ${loadingNotifs ? 'animate-spin' : ''}`}>refresh</span>
                    </button>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {loadingNotifs && notifs.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <span className="material-symbols-outlined text-slate-600 text-3xl animate-pulse">sync</span>
                    </div>
                  ) : notifs.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <span className="material-symbols-outlined text-slate-600 text-3xl block mb-2">check_circle</span>
                      <p className="text-[12px] text-slate-500">Sin alertas activas</p>
                    </div>
                  ) : (
                    notifs.map(n => (
                      <div key={n.id} className="flex items-start gap-3 px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                        <span
                          className="material-symbols-outlined text-[18px] mt-0.5 flex-shrink-0"
                          style={{ color: n.severity === 'danger' ? 'var(--danger)' : 'var(--accent)' }}
                        >
                          {TYPE_ICON[n.type]}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[12px] font-bold leading-tight" style={{ color: n.severity === 'danger' ? 'var(--danger)' : 'var(--accent)' }}>
                            {n.title}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug break-words">{n.detail}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User name — hidden on small screens */}
          <div className="hidden sm:flex flex-col items-end mr-1">
            <span className="text-[13px] font-bold text-[var(--text-primary)] leading-none">
              {user.firstName} {user.lastName}
            </span>
          </div>

          {/* Avatar → Profile menu */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => { setProfileOpen(o => !o); setBellOpen(false) }}
              className="w-8 h-8 lg:w-9 lg:h-9 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0 hover:bg-amber-500/30 hover:border-amber-500/50 transition-all cursor-pointer"
              aria-label="Menú de perfil"
            >
              <span className="text-[11px] font-black text-amber-500">{initials}</span>
            </button>

            {profileOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-60 rounded-xl border border-white/10 shadow-2xl overflow-hidden z-50"
                style={{ background: 'var(--bg-elevated)' }}
              >
                {/* User info */}
                <div className="px-4 py-3.5 border-b border-white/8">
                  <p className="text-[13px] font-bold text-[var(--text-primary)] leading-tight">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{label}</p>
                </div>

                {/* Options */}
                <div className="py-1">
                  <button
                    onClick={() => { setProfileOpen(false); setShowChangePwd(true) }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] text-slate-300 hover:bg-white/5 hover:text-[var(--text-primary)] transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px] text-slate-500">lock_reset</span>
                    Cambiar contraseña
                  </button>

                  <button
                    onClick={() => { setProfileOpen(false); router.push('/dashboard/settings') }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] text-slate-300 hover:bg-white/5 hover:text-[var(--text-primary)] transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px] text-slate-500">manage_accounts</span>
                    Mi perfil
                  </button>
                </div>

                <div className="border-t border-white/8 py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] text-red-400 hover:bg-red-500/8 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </header>

      {showChangePwd && <ChangePasswordModal onClose={() => setShowChangePwd(false)} />}
    </>
  )
}
