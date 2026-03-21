'use client'

import { useEffect, useState } from 'react'

const card: React.CSSProperties = { background: '#0a1628', border: '1px solid rgba(212,149,10,0.15)', borderRadius: '14px' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', background: '#060c1a', border: '1px solid rgba(212,149,10,0.15)', borderRadius: '8px', color: '#e8f4fd', fontSize: '13px', outline: 'none' }
const btnPrimary: React.CSSProperties = { padding: '10px 20px', background: 'linear-gradient(135deg, #D4950A, #b8820a)', border: 'none', borderRadius: '8px', color: '#060c1a', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [toast, setToast] = useState('')
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '' })

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (u) {
      const parsed = JSON.parse(u)
      setUser(parsed)
      setForm({ firstName: parsed.firstName || '', lastName: parsed.lastName || '', email: parsed.email || '', phone: parsed.phone || '' })
    }
  }, [])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const sections = [
    {
      icon: '👤', title: 'Perfil de Usuario', desc: 'Informacion de tu cuenta',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div><label style={{ display: 'block', fontSize: '11px', color: '#7fa8c9', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Nombre</label><input value={form.firstName} onChange={e => set('firstName', e.target.value)} style={inputStyle} /></div>
            <div><label style={{ display: 'block', fontSize: '11px', color: '#7fa8c9', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Apellido</label><input value={form.lastName} onChange={e => set('lastName', e.target.value)} style={inputStyle} /></div>
          </div>
          <div><label style={{ display: 'block', fontSize: '11px', color: '#7fa8c9', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Email</label><input value={form.email} style={{ ...inputStyle, opacity: 0.5 }} disabled /></div>
          <div><label style={{ display: 'block', fontSize: '11px', color: '#7fa8c9', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Telefono</label><input value={form.phone} onChange={e => set('phone', e.target.value)} style={inputStyle} /></div>
          <button onClick={() => showToast('Perfil actualizado')} style={btnPrimary}>Guardar Cambios</button>
        </div>
      ),
    },
    {
      icon: '🔐', title: 'Seguridad', desc: 'Contraseña y sesiones activas',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div><label style={{ display: 'block', fontSize: '11px', color: '#7fa8c9', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Contraseña actual</label><input type="password" style={inputStyle} placeholder="••••••••" /></div>
          <div><label style={{ display: 'block', fontSize: '11px', color: '#7fa8c9', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Nueva contraseña</label><input type="password" style={inputStyle} placeholder="Min. 8 caracteres" /></div>
          <div><label style={{ display: 'block', fontSize: '11px', color: '#7fa8c9', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Confirmar nueva contraseña</label><input type="password" style={inputStyle} /></div>
          <button onClick={() => showToast('Contraseña actualizada')} style={btnPrimary}>Cambiar Contraseña</button>
        </div>
      ),
    },
    {
      icon: '🏢', title: 'Empresa', desc: 'Datos de la organizacion',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div><label style={{ display: 'block', fontSize: '11px', color: '#7fa8c9', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Nombre de empresa</label><input defaultValue="VENOLS C.A." style={inputStyle} /></div>
            <div><label style={{ display: 'block', fontSize: '11px', color: '#7fa8c9', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>RIF</label><input defaultValue="J-12345678-9" style={inputStyle} /></div>
          </div>
          <div><label style={{ display: 'block', fontSize: '11px', color: '#7fa8c9', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Direccion</label><input defaultValue="Maracaibo, Estado Zulia, Venezuela" style={inputStyle} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div><label style={{ display: 'block', fontSize: '11px', color: '#7fa8c9', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Telefono</label><input defaultValue="+58 261-7001000" style={inputStyle} /></div>
            <div><label style={{ display: 'block', fontSize: '11px', color: '#7fa8c9', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Email</label><input defaultValue="admin@venols.com" style={inputStyle} /></div>
          </div>
          <button onClick={() => showToast('Datos de empresa actualizados')} style={btnPrimary}>Guardar</button>
        </div>
      ),
    },
    {
      icon: '🔔', title: 'Notificaciones', desc: 'Alertas y configuracion de avisos',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { label: 'Alerta de certificaciones por vencer', desc: 'Notificar 30 dias antes del vencimiento', default: true },
            { label: 'Alerta de combustible bajo', desc: 'Notificar cuando ROB < 20%', default: true },
            { label: 'Ordenes de mantenimiento criticas', desc: 'Notificar ordenes con prioridad critica', default: true },
            { label: 'Nuevos viajes asignados', desc: 'Notificar cuando se crea un nuevo viaje', default: false },
            { label: 'Reportes semanales por email', desc: 'Resumen semanal de operaciones', default: false },
          ].map((n, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(212,149,10,0.06)' }}>
              <div><div style={{ fontSize: '13px', color: '#e8f4fd', fontWeight: 500 }}>{n.label}</div><div style={{ fontSize: '11px', color: '#7fa8c9' }}>{n.desc}</div></div>
              <ToggleSwitch defaultChecked={n.default} />
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: 'ℹ️', title: 'Acerca del Sistema', desc: 'Version e informacion tecnica',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
          {[
            ['Sistema', 'VENOLS ERP v2.0.0'],
            ['Framework', 'Next.js 16.2.1'],
            ['Base de datos', 'PostgreSQL 15+'],
            ['ORM', 'Prisma 6.12'],
            ['Rol actual', user?.role || '-'],
            ['Fases completadas', '1, 2, 3, 4, 5, 6'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(212,149,10,0.06)' }}>
              <span style={{ color: '#7fa8c9' }}>{k}</span>
              <span style={{ color: '#e8f4fd', fontWeight: 500, fontFamily: 'monospace' }}>{v}</span>
            </div>
          ))}
        </div>
      ),
    },
  ]

  return (
    <div>
      {toast && <div style={{ position: 'fixed', top: '20px', right: '20px', background: '#27ae60', color: 'white', padding: '10px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, zIndex: 2000 }}>{toast}</div>}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '22px', fontWeight: 800, color: '#e8f4fd' }}>Configuracion</div>
        <div style={{ fontSize: '13px', color: '#7fa8c9', marginTop: '4px' }}>Ajustes del sistema y preferencias de usuario</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {sections.map(s => (
          <details key={s.title} style={{ ...card, overflow: 'hidden' }}>
            <summary style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '18px 20px', cursor: 'pointer', listStyle: 'none' }}>
              <span style={{ fontSize: '22px' }}>{s.icon}</span>
              <div style={{ flex: 1 }}><div style={{ fontSize: '14px', fontWeight: 700, color: '#e8f4fd' }}>{s.title}</div><div style={{ fontSize: '11px', color: '#7fa8c9' }}>{s.desc}</div></div>
              <span style={{ color: '#D4950A', fontSize: '14px' }}>▸</span>
            </summary>
            <div style={{ padding: '0 20px 20px' }}>{s.content}</div>
          </details>
        ))}
      </div>
    </div>
  )
}

function ToggleSwitch({ defaultChecked }: { defaultChecked: boolean }) {
  const [on, setOn] = useState(defaultChecked)
  return (
    <div onClick={() => setOn(!on)} style={{ width: '44px', height: '24px', borderRadius: '12px', background: on ? '#27ae60' : '#2a3a50', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'white', position: 'absolute', top: '2px', left: on ? '22px' : '2px', transition: 'left 0.2s' }} />
    </div>
  )
}
