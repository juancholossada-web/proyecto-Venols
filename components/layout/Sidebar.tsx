'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

type NavItem = {
  href: string
  icon: string
  label: string
  roles: string[]
  soon?: boolean
  badge?: string
}

type NavGroup = {
  section: string
  items: NavItem[]
}

const navItems: NavGroup[] = [
  { section: 'PRINCIPAL', items: [
    { href: '/dashboard', icon: '📊', label: 'Dashboard', roles: ['ADMIN','OPERATOR','TECHNICIAN'] },
    { href: '/dashboard/vessels', icon: '🚢', label: 'Embarcaciones', roles: ['ADMIN','OPERATOR','TECHNICIAN'], soon: true },
    { href: '/dashboard/crew', icon: '👥', label: 'Personal', roles: ['ADMIN','OPERATOR'], soon: true },
  ]},
  { section: 'OPERACIONES', items: [
    { href: '/dashboard/routes', icon: '🗺️', label: 'Rutas & Viajes', roles: ['ADMIN','OPERATOR'], soon: true },
    { href: '/dashboard/inventory', icon: '📦', label: 'Inventario', roles: ['ADMIN','OPERATOR','TECHNICIAN'], soon: true },
    { href: '/dashboard/fuel', icon: '⛽', label: 'Combustible', roles: ['ADMIN','OPERATOR'], badge: '3', soon: true },
    { href: '/dashboard/clients', icon: '🤝', label: 'Clientes', roles: ['ADMIN','OPERATOR'], soon: true },
  ]},
  { section: 'MANTENIMIENTO', items: [
    { href: '/dashboard/maintenance', icon: '🔧', label: 'Mantenimiento', roles: ['ADMIN','TECHNICIAN'], badge: '2', soon: true },
    { href: '/dashboard/reports', icon: '📋', label: 'Reportes', roles: ['ADMIN','OPERATOR','TECHNICIAN'], soon: true },
  ]},
  { section: 'SISTEMA', items: [
    { href: '/dashboard/settings', icon: '⚙️', label: 'Configuración', roles: ['ADMIN'], soon: true },
  ]},
]

export default function Sidebar({ userRole }: { userRole: string }) {
  const pathname = usePathname()

  return (
    <aside style={{ width: '220px', background: '#060c1a', borderRight: '1px solid rgba(212,149,10,0.15)', padding: '16px 12px', display: 'flex', flexDirection: 'column', overflowY: 'auto', flexShrink: 0 }}>
      {navItems.map(group => (
        <div key={group.section}>
          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(212,149,10,0.4)', padding: '0 8px', margin: '14px 0 6px' }}>{group.section}</div>
          {group.items.filter(i => i.roles.includes(userRole)).map(item => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, textDecoration: 'none', color: isActive ? '#D4950A' : item.soon ? 'rgba(127,168,201,0.4)' : '#7fa8c9', background: isActive ? 'rgba(212,149,10,0.1)' : 'transparent', border: `1px solid ${isActive ? 'rgba(212,149,10,0.25)' : 'transparent'}`, marginBottom: '2px' }}>
                <span style={{ fontSize: '15px', width: '20px', textAlign: 'center' }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && <span style={{ background: '#c0392b', color: 'white', fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '10px' }}>{item.badge}</span>}
                {item.soon && !isActive && <span style={{ fontSize: '9px', color: 'rgba(212,149,10,0.3)' }}>FASE 2+</span>}
              </Link>
            )
          })}
        </div>
      ))}
      <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(212,149,10,0.1)', fontSize: '10px', color: 'rgba(212,149,10,0.3)', textAlign: 'center' }}>
        VENOLS ERP v1.0.0 — FASE 1
      </div>
    </aside>
  )
}
