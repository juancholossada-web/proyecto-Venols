'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

type NavItem  = { href: string; icon: string; label: string; roles: string[] }
type NavGroup = { section: string; items: NavItem[]; roles: string[] }

const ALL_OPS = ['ADMIN', 'OPERATOR_HEAVY', 'OPERATOR_LIGHT']
const ALL     = ['ADMIN', 'OPERATOR_HEAVY', 'OPERATOR_LIGHT', 'STANDARD']

const navGroups: NavGroup[] = [
  {
    section: 'Principal',
    roles: ALL,
    items: [
      { href: '/dashboard',          icon: 'dashboard',       label: 'Dashboard',     roles: ALL },
      { href: '/dashboard/vessels',  icon: 'directions_boat', label: 'Embarcaciones', roles: ALL },
      { href: '/dashboard/crew',     icon: 'groups',          label: 'Personal',      roles: ALL_OPS },
    ],
  },
  {
    section: 'Operaciones',
    roles: ALL_OPS,
    items: [
      { href: '/dashboard/inventory',     icon: 'inventory_2',       label: 'Inventario',     roles: ALL_OPS },
      { href: '/dashboard/fuel',          icon: 'local_gas_station', label: 'Combustible',    roles: ALL_OPS },
      { href: '/dashboard/clients',       icon: 'business',          label: 'Clientes',       roles: ['ADMIN'] },
      { href: '/dashboard/daily-reports', icon: 'assignment',        label: 'Reporte Diario', roles: ALL_OPS },
      { href: '/dashboard/routes',        icon: 'route',             label: 'Rutas & Viajes', roles: ['ADMIN'] },
    ],
  },
  {
    section: 'Mantenimiento',
    roles: ALL_OPS,
    items: [
      { href: '/dashboard/maintenance', icon: 'build',         label: 'Mantenimiento', roles: ALL_OPS },
      { href: '/dashboard/compliance',  icon: 'verified_user', label: 'Compliance',    roles: ALL_OPS },
      { href: '/dashboard/reports',     icon: 'analytics',     label: 'Reportes',      roles: ALL },
    ],
  },
  {
    section: 'Sistema',
    roles: ['ADMIN'],
    items: [
      { href: '/dashboard/settings', icon: 'settings', label: 'Configuración', roles: ['ADMIN'] },
    ],
  },
]

const ROLE_BADGE: Record<string, { label: string; color: string }> = {
  ADMIN:          { label: 'Administrador',     color: '#ef4444' },
  OPERATOR_HEAVY: { label: 'Op. Flota Pesada',  color: '#f59e0b' },
  OPERATOR_LIGHT: { label: 'Op. Flota Liviana', color: '#3b82f6' },
  STANDARD:       { label: 'Estándar',          color: '#6b7280' },
}

interface SidebarProps {
  userRole: string
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ userRole, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const badge    = ROLE_BADGE[userRole] ?? { label: userRole, color: '#6b7280' }

  return (
    <aside className={[
      'w-64 flex-shrink-0 bg-[#161c26] border-r border-white/5 flex flex-col overflow-y-auto',
      'fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out',
      isOpen ? 'translate-x-0' : '-translate-x-full',
      'lg:relative lg:inset-auto lg:translate-x-0 lg:z-auto',
    ].join(' ')}>

      {/* Top bar: role badge + close button (mobile) */}
      <div className="px-4 py-3.5 border-b border-white/5 flex items-center justify-between gap-2">
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '4px 10px', borderRadius: '20px',
          background: `${badge.color}18`,
          border: `1px solid ${badge.color}40`,
          fontSize: '11px', fontWeight: 700, color: badge.color,
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: badge.color, flexShrink: 0 }} />
          {badge.label}
        </span>

        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-colors flex-shrink-0"
          aria-label="Cerrar menú"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-5">
        {navGroups
          .filter(g => g.roles.includes(userRole))
          .map(group => {
            const visibleItems = group.items.filter(i => i.roles.includes(userRole))
            if (!visibleItems.length) return null
            return (
              <div key={group.section}>
                <p className="text-[9px] font-bold text-slate-700 uppercase tracking-widest px-3 mb-1">
                  {group.section}
                </p>
                <div className="space-y-0.5">
                  {visibleItems.map(item => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={[
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium tracking-wide uppercase transition-all',
                          isActive
                            ? 'bg-gradient-to-r from-amber-400/20 to-transparent text-amber-500 border-l-4 border-amber-500 pl-2'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border-l-4 border-transparent pl-2',
                        ].join(' ')}
                      >
                        <span className="material-symbols-outlined text-[20px] flex-shrink-0">
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/5">
        <p className="text-[9px] text-slate-700 font-mono">VENOLS ERP · v2.0.0</p>
      </div>
    </aside>
  )
}
