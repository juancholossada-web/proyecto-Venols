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
}

const navItems: NavGroup[] = [
  {
    section: 'Principal',
    items: [
      { href: '/dashboard',               icon: 'dashboard',         label: 'Dashboard',       roles: ['ADMIN','OPERATOR','TECHNICIAN'] },
      { href: '/dashboard/vessels',        icon: 'directions_boat',   label: 'Embarcaciones',   roles: ['ADMIN','OPERATOR','TECHNICIAN'] },
      { href: '/dashboard/crew',           icon: 'groups',            label: 'Personal',         roles: ['ADMIN','OPERATOR'] },
    ],
  },
  {
    section: 'Operaciones',
    items: [
      { href: '/dashboard/inventory',      icon: 'inventory_2',       label: 'Inventario',       roles: ['ADMIN','OPERATOR','TECHNICIAN'] },
      { href: '/dashboard/fuel',           icon: 'local_gas_station', label: 'Combustible',      roles: ['ADMIN','OPERATOR'] },
      { href: '/dashboard/clients',        icon: 'business',          label: 'Clientes',         roles: ['ADMIN','OPERATOR'] },
      { href: '/dashboard/daily-reports',  icon: 'assignment',        label: 'Reporte Diario',   roles: ['ADMIN','OPERATOR','TECHNICIAN'] },
      { href: '/dashboard/routes',         icon: 'route',             label: 'Rutas & Viajes',  roles: ['ADMIN','OPERATOR'] },
    ],
  },
  {
    section: 'Mantenimiento',
    items: [
      { href: '/dashboard/maintenance',    icon: 'build',             label: 'Mantenimiento',    roles: ['ADMIN','TECHNICIAN'] },
      { href: '/dashboard/compliance',     icon: 'verified_user',     label: 'Compliance',       roles: ['ADMIN','OPERATOR'] },
      { href: '/dashboard/reports',        icon: 'analytics',         label: 'Reportes',         roles: ['ADMIN','OPERATOR','TECHNICIAN'] },
    ],
  },
  {
    section: 'Sistema',
    items: [
      { href: '/dashboard/settings',       icon: 'settings',          label: 'Configuración',    roles: ['ADMIN'] },
    ],
  },
]

export default function Sidebar({ userRole }: { userRole: string }) {
  const pathname = usePathname()

  return (
    <aside className="w-72 flex-shrink-0 bg-[#161c26] border-r border-white/5 flex flex-col overflow-y-auto">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <h2 className="text-amber-500 font-black text-2xl tracking-tighter">VENOLS</h2>
        <p className="text-[10px] text-slate-600 uppercase tracking-widest mt-0.5">ERP Maritime</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-5">
        {navItems.map(group => (
          <div key={group.section}>
            {/* Section label */}
            <p className="text-[9px] font-bold text-slate-700 uppercase tracking-widest px-3 mb-1">
              {group.section}
            </p>

            <div className="space-y-0.5">
              {group.items
                .filter(i => i.roles.includes(userRole))
                .map(item => {
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
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/5">
        <p className="text-[9px] text-slate-700 font-mono">VENOLS ERP · v2.0.0</p>
      </div>
    </aside>
  )
}
