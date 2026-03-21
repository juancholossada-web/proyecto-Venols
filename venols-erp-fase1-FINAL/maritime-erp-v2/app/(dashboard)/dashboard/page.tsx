'use client'

import { useEffect, useState } from 'react'

const kpis = [
  { icon: '🚢', value: '24', label: 'Embarcaciones', change: '▲ 2 este mes', up: true, accent: '#D4950A' },
  { icon: '✅', value: '18', label: 'En operación', change: '▲ 75% flota activa', up: true, accent: '#27ae60' },
  { icon: '⛽', value: '84%', label: 'Nivel combustible', change: '▼ Alerta: 3 buques', up: false, accent: '#e67e22' },
  { icon: '🔧', value: '2', label: 'En mantenimiento', change: '▼ Retorno: 3 días', up: false, accent: '#e74c3c' },
]

const vessels = [
  { icon: '🚢', name: 'MV Atlántico Sur', route: 'Valencia → Casablanca', status: 'active' },
  { icon: '⛴️', name: 'MV Cóndor Marino', route: 'En tránsito · ETA 06h', status: 'transit' },
  { icon: '🛳️', name: 'MV Pacífico Norte', route: 'Puerto Algeciras · Atracado', status: 'docked' },
  { icon: '⚓', name: 'MV Estrella del Mar', route: 'Revisión motores', status: 'maintenance' },
]

const statusColors: Record<string, string> = {
  active: '#27ae60', transit: '#D4950A', docked: '#7fa8c9', maintenance: '#e74c3c',
}

const activity = [
  { color: '#27ae60', text: 'MV Atlántico Sur — Salida puerto confirmada', time: 'Hace 12 min · Operador: R. Díaz' },
  { color: '#D4950A', text: '⛽ Alerta combustible — MV Cóndor bajo 20%', time: 'Hace 34 min · Sistema automático' },
  { color: '#2d9cdb', text: 'Nuevo usuario registrado — tecnico@venols.com', time: 'Hace 1h · Admin: J. Martínez' },
  { color: '#e74c3c', text: '🔧 Orden mantenimiento abierta — MV Estrella', time: 'Hace 2h · Técnico: P. Romero' },
  { color: '#27ae60', text: 'MV Pacífico Norte — Carga completada 847 t', time: 'Hace 3h · Operador: L. García' },
]

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [now, setNow] = useState('')

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (u) setUser(JSON.parse(u))

    function tick() {
      const d = new Date()
      const days = ['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB']
      const months = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC']
      setNow(`${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} · ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`)
    }
    tick()
    const interval = setInterval(tick, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div>
      {/* Header de página */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#e8f4fd' }}>Panel de Control</div>
          {user && <div style={{ fontSize: '13px', color: '#7fa8c9', marginTop: '2px' }}>Bienvenido, {user.firstName} {user.lastName}</div>}
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#7fa8c9' }}>{now}</div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background: '#0a1628', border: '1px solid rgba(212,149,10,0.15)', borderRadius: '14px', padding: '18px 20px', borderTop: `2px solid ${k.accent}` }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>{k.icon}</div>
            <div style={{ fontFamily: 'monospace', fontSize: '28px', fontWeight: 700, color: '#e8f4fd', lineHeight: 1 }}>{k.value}</div>
            <div style={{ fontSize: '11px', color: '#7fa8c9', textTransform: 'uppercase', letterSpacing: '1px', margin: '6px 0' }}>{k.label}</div>
            <div style={{ fontSize: '11px', color: k.up ? '#27ae60' : '#e74c3c' }}>{k.change}</div>
          </div>
        ))}
      </div>

      {/* Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        {/* Flota activa */}
        <div style={{ background: '#0a1628', border: '1px solid rgba(212,149,10,0.15)', borderRadius: '14px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#7fa8c9' }}>Flota activa</div>
            <div style={{ fontSize: '11px', color: '#D4950A', cursor: 'pointer' }}>Ver todo →</div>
          </div>
          {vessels.map(v => (
            <div key={v.name} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 0', borderBottom: '1px solid rgba(212,149,10,0.08)' }}>
              <div style={{ width: '40px', height: '40px', flexShrink: 0, background: 'rgba(212,149,10,0.1)', border: '1px solid rgba(212,149,10,0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>{v.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#e8f4fd' }}>{v.name}</div>
                <div style={{ fontSize: '12px', color: '#7fa8c9' }}>{v.route}</div>
              </div>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, background: statusColors[v.status], boxShadow: v.status === 'active' ? `0 0 6px ${statusColors[v.status]}` : 'none' }} />
            </div>
          ))}
        </div>

        {/* Actividad reciente */}
        <div style={{ background: '#0a1628', border: '1px solid rgba(212,149,10,0.15)', borderRadius: '14px', padding: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#7fa8c9', marginBottom: '16px' }}>Actividad reciente</div>
          {activity.map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '10px 0', borderBottom: i < activity.length - 1 ? '1px solid rgba(212,149,10,0.08)' : 'none' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: a.color, marginTop: '5px', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '13px', color: '#e8f4fd', lineHeight: 1.4 }}>{a.text}</div>
                <div style={{ fontSize: '11px', color: '#7fa8c9', marginTop: '3px', fontFamily: 'monospace' }}>{a.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
