'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

type NavItem = {
  href: string
  icon: string
  label: string
  roles: string[]
}
type NavGroup = {
  section: string
  items: NavItem[]
  roles: string[] // qué roles ven este grupo
}

const ALL_OPS = ['ADMIN', 'OPERATOR_HEAVY', 'OPERATOR_LIGHT']
const ALL     = ['ADMIN', 'OPERATOR_HEAVY', 'OPERATOR_LIGHT', 'STANDARD']

const navGroups: NavGroup[] = [
  {
    section: 'Principal',
    roles: ALL,
    items: [
      { href: '/dashboard',          icon: 'dashboard',       label: 'Dashboard',     roles: ALL },
      { href: '/dashboard/vessels',  icon: 'directions_boat', label: 'Embarcaciones', roles: ALL },
      { href: '/dashboard/crew',     icon: 'groups',          label: 'Personal',      roles: ['ADMIN', 'OPERATOR_HEAVY', 'OPERATOR_LIGHT'] },
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
      { href: '/dashboard/maintenance', icon: 'build',          label: 'Mantenimiento', roles: ALL_OPS },
      { href: '/dashboard/compliance',  icon: 'verified_user',  label: 'Compliance',    roles: ['ADMIN', 'OPERATOR_HEAVY', 'OPERATOR_LIGHT'] },
      { href: '/dashboard/reports',     icon: 'analytics',      label: 'Reportes',      roles: ALL },
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

/** Etiqueta y color por rol */
const ROLE_BADGE: Record<string, { label: string; color: string }> = {
  ADMIN:          { label: 'Administrador',       color: '#ef4444' },
  OPERATOR_HEAVY: { label: 'Op. Flota Pesada',    color: '#f59e0b' },
  OPERATOR_LIGHT: { label: 'Op. Flota Liviana',   color: '#3b82f6' },
  STANDARD:       { label: 'Estándar',            color: '#6b7280' },
}

export default function Sidebar({ userRole }: { userRole: string }) {
  const pathname = usePathname()
  const badge    = ROLE_BADGE[userRole] ?? { label: userRole, color: '#6b7280' }

  return (
    <aside className="w-72 flex-shrink-0 bg-[#161c26] border-r border-white/5 flex flex-col overflow-y-auto">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <h2 className="text-amber-500 font-black text-2xl tracking-tighter">VENOLS</h2>
        <p className="text-[10px] text-slate-600 uppercase tracking-widest mt-0.5">ERP Maritime</p>
      </div>

      {/* Rol activo */}
      <div className="px-4 py-3 border-b border-white/5">
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
      <div className="px-6 py-4 border-t border-white/5">
        <p className="text-[9px] text-slate-700 font-mono">VENOLS ERP · v2.0.0</p>
      </div>
    </aside>
  )
}
