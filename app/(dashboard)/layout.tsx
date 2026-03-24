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
      <div className="h-screen flex flex-col items-center justify-center bg-surface gap-4">
        <span className="material-symbols-outlined text-amber-500 text-5xl animate-pulse">anchor</span>
        <p className="text-[13px] text-slate-600 tracking-widest uppercase font-mono">
          Cargando VENOLS ERP…
        </p>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex flex-col h-screen bg-surface font-body overflow-hidden">
      <Header user={user} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar userRole={user.role} />
        <main className="flex-1 overflow-y-auto bg-surface p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
