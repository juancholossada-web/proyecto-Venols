'use client'

import { useRouter } from 'next/navigation'

interface HeaderProps {
  user: { firstName: string; lastName: string; role: string }
}

const roleConfig: Record<string, { label: string }> = {
  ADMIN:      { label: 'Admin' },
  OPERATOR:   { label: 'Operador' },
  TECHNICIAN: { label: 'Técnico' },
}

export default function Header({ user }: HeaderProps) {
  const router = useRouter()
  const role = roleConfig[user.role] || roleConfig.OPERATOR
  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()

  async function handleLogout() {
    const token = localStorage.getItem('token')
    if (token) {
      await fetch('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
    }
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.replace('/login')
  }

  return (
    <header className="h-16 flex-shrink-0 bg-[#0e141e] border-b border-white/5 flex items-center justify-between px-6 shadow-[0_4px_24px_rgba(8,14,24,0.4)]">
      {/* Left — brand */}
      <div className="flex items-center gap-3">
        <span className="text-2xl font-black tracking-tighter text-amber-500">VENOLS</span>
        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest hidden lg:block">
          Sistema de Gestión Marítima
        </span>
      </div>

      {/* Right — user + logout */}
      <div className="flex items-center gap-3">
        {/* User info */}
        <div className="hidden md:flex flex-col items-end">
          <span className="text-sm font-bold text-on-surface leading-none">
            {user.firstName} {user.lastName}
          </span>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">
            {role.label}
          </span>
        </div>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-black text-amber-500">{initials}</span>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-500 hover:text-error hover:bg-error/10 transition-all text-xs font-bold uppercase tracking-wide"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          <span className="hidden lg:block">Salir</span>
        </button>
      </div>
    </header>
  )
}
