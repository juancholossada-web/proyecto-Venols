'use client'

import { useRouter } from 'next/navigation'

interface HeaderProps {
  user: { firstName: string; lastName: string; role: string }
}

const roleStyles: Record<string, { bg: string; color: string; border: string }> = {
  ADMIN:      { bg: 'rgba(231,76,60,0.15)',  color: '#e74c3c', border: 'rgba(231,76,60,0.3)' },
  OPERATOR:   { bg: 'rgba(212,149,10,0.15)', color: '#D4950A', border: 'rgba(212,149,10,0.3)' },
  TECHNICIAN: { bg: 'rgba(45,156,219,0.15)', color: '#2d9cdb', border: 'rgba(45,156,219,0.3)' },
}

export default function Header({ user }: HeaderProps) {
  const router = useRouter()
  const role = roleStyles[user.role] || roleStyles.OPERATOR
  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()

  async function handleLogout() {
    const token = localStorage.getItem('accessToken')
    if (token) {
      await fetch('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
    }
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    router.replace('/login')
  }

  return (
    <header style={{ background: '#060c1a', borderBottom: '1px solid rgba(212,149,10,0.2)', padding: '0 24px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '34px', height: '34px', background: 'linear-gradient(135deg, #D4950A, #E8A714)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🚢</div>
        <span style={{ fontSize: '18px', fontWeight: 800, color: '#e8f4fd' }}>VENOLS ERP</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '36px', height: '36px', background: 'rgba(212,149,10,0.1)', border: '1px solid rgba(212,149,10,0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '16px' }}>🔔</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(212,149,10,0.08)', border: '1px solid rgba(212,149,10,0.2)', borderRadius: '10px', padding: '6px 14px' }}>
          <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #D4950A, #E8A714)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: 'white' }}>{initials}</div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#e8f4fd' }}>{user.firstName} {user.lastName}</div>
            <div style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600, background: role.bg, color: role.color, border: `1px solid ${role.border}`, display: 'inline-block' }}>{user.role}</div>
          </div>
        </div>

        <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid rgba(192,57,43,0.3)', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', color: '#e74c3c', cursor: 'pointer', fontFamily: 'inherit' }}>
          ⏻ Salir
        </button>
      </div>
    </header>
  )
}
