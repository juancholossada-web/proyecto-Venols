'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.replace('/login'); return }

    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (!res.ok) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          router.replace('/login')
          return null
        }
        return res.json()
      })
      .then(data => { if (data?.user) setUser(data.user) })
      .finally(() => setLoading(false))
  }, [router])

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#070f1e', color: '#D4950A', fontSize: '16px', fontFamily: 'system-ui' }}>
        🚢 Cargando VENOLS ERP...
      </div>
    )
  }

  if (!user) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#070f1e', fontFamily: 'system-ui, sans-serif' }}>
      <Header user={user} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar userRole={user.role} />
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
