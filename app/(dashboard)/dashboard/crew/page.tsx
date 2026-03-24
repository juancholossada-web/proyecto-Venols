'use client'

import { useEffect, useState, useCallback } from 'react'

/* ─── Types ─── */
type Vessel = { id: string; name: string; fleetType: string; vesselType?: string }
type Certification = {
  id: string; type: string; name: string; number?: string
  issuedBy: string; issuedAt: string; expiresAt: string; notes?: string
}
type Assignment = {
  id: string; vesselId: string; vessel: Vessel; role: string
  startDate: string; endDate?: string; status: string; notes?: string
}
type Employee = {
  id: string; firstName: string; lastName: string; nationalId: string
  nationality: string; position: string; seafarerBook?: string
  passportNumber?: string; passportExpiry?: string; phone?: string
  email?: string; address?: string; birthDate?: string; status: string
  notes?: string; certifications: Certification[]; assignments: Assignment[]
}

type DrawerView = 'detail' | 'certs' | 'cert-form' | 'assigns' | 'assign-form' | 'edit' | 'new-employee'

/* ─── Config ─── */
const statusCfg: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVO:     { label: 'Activo',     color: 'var(--success)', bg: 'rgba(39,174,96,0.12)' },
  INACTIVO:   { label: 'Inactivo',   color: 'var(--text-muted)', bg: 'rgba(71,100,126,0.12)' },
  LICENCIA:   { label: 'Licencia',   color: 'var(--warning)', bg: 'rgba(230,126,34,0.12)' },
  VACACIONES: { label: 'Vacaciones', color: 'var(--info)', bg: 'var(--info-dim)' },
  RETIRADO:   { label: 'Retirado',   color: 'var(--danger)', bg: 'rgba(231,76,60,0.12)' },
}
const positionIcons: Record<string, string> = {
  'Capitan': 'CAP', 'Jefe de Maquinas': 'JMQ', 'Marinero': 'MAR',
  'Tecnico Mecanico': 'TMC', 'Tecnico Electricista': 'TEC',
}

/* ─── API helper ─── */
function getToken() { return localStorage.getItem('token') || '' }
async function api(path: string, opts?: RequestInit) {
  const res = await fetch(path, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...opts?.headers } })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}

/* ─── Styles ─── */
const card: React.CSSProperties = { background: 'var(--bg-surface)', border: '1px solid var(--border-accent)', borderRadius: '12px' }
const goldBorder = 'var(--border-accent)'
const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-accent)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }
const btnPrimary: React.CSSProperties = { padding: '10px 20px', background: 'var(--accent)', border: 'none', borderRadius: '8px', color: '#080E1A', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }

/* ═════════════════════ MAIN PAGE ═════════════════════ */
export default function CrewPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [vessels, setVessels] = useState<Vessel[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [posFilter, setPosFilter] = useState('')
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null)
  const [drawerView, setDrawerView] = useState<DrawerView>('detail')
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const loadData = useCallback(async () => {
    try {
      const [emps, vess] = await Promise.all([api('/api/crew'), api('/api/vessels')])
      setEmployees(emps)
      setVessels(vess)
    } catch { /* silent */ }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  function openEmployee(e: Employee) { setSelectedEmp(e); setDrawerView('detail') }
  function closeDrawer() { setSelectedEmp(null) }

  const positions = [...new Set(employees.map(e => e.position))]
  const filtered = employees.filter(e => {
    const matchName = `${e.firstName} ${e.lastName} ${e.nationalId}`.toLowerCase().includes(filter.toLowerCase())
    const matchPos = !posFilter || e.position === posFilter
    return matchName && matchPos
  })

  // Stats
  const activos = employees.filter(e => e.status === 'ACTIVO').length
  const expiringSoon = employees.flatMap(e => e.certifications).filter(c => {
    const diff = (new Date(c.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    return diff > 0 && diff <= 30
  }).length
  const assigned = employees.filter(e => e.assignments.length > 0).length

  if (loading) return <div style={{ color: 'var(--text-muted)', padding: '40px', textAlign: 'center' }}>Cargando personal...</div>

  return (
    <div>
      {/* Toast */}
      {toast && <div style={{ position: 'fixed', top: '20px', right: '20px', background: 'var(--success)', color: 'white', padding: '10px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, zIndex: 2000 }}>{toast}</div>}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Personal y Tripulacion</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Gestion de empleados, certificaciones y asignaciones</div>
        </div>
        <button onClick={() => { setSelectedEmp(null); setDrawerView('new-employee'); setSelectedEmp({} as Employee) }} style={btnPrimary}>+ Nuevo Empleado</button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {[
          { tag: 'TOT', value: employees.length, label: 'Total personal', color: 'var(--accent)' },
          { tag: 'ACT', value: activos, label: 'Activos', color: 'var(--success)' },
          { tag: 'EMB', value: assigned, label: 'Embarcados', color: 'var(--info)' },
          { tag: 'VEN', value: expiringSoon, label: 'Cert. por vencer', color: expiringSoon > 0 ? 'var(--danger)' : 'var(--success)' },
        ].map(k => (
          <div key={k.label} style={{ ...card, padding: '16px 20px', borderTop: `2px solid ${k.color}` }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: k.color, letterSpacing: '1px', marginBottom: '8px', fontFamily: 'monospace' }}>{k.tag}</div>
            <div style={{ fontFamily: 'monospace', fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{k.value}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Buscar por nombre o cedula..." style={{ ...inputStyle, maxWidth: '300px' }} />
        <select value={posFilter} onChange={e => setPosFilter(e.target.value)} style={{ ...inputStyle, maxWidth: '200px' }}>
          <option value="">Todos los cargos</option>
          {positions.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ ...card, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'rgba(212,149,10,0.06)' }}>
              {['', 'Nombre', 'Cedula', 'Cargo', 'Embarcacion', 'Certificaciones', 'Estado'].map(h => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, borderBottom: `1px solid ${goldBorder}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(emp => {
              const st = statusCfg[emp.status] || statusCfg.INACTIVO
              const activeAssign = emp.assignments.find(a => a.status === 'ACTIVO')
              const icon = positionIcons[emp.position] || 'USR'
              const certCount = emp.certifications.length
              const expiring = emp.certifications.filter(c => {
                const diff = (new Date(c.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                return diff > 0 && diff <= 30
              }).length
              return (
                <tr key={emp.id} onClick={() => openEmployee(emp)} style={{ cursor: 'pointer', borderBottom: `1px solid rgba(212,149,10,0.06)` }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,149,10,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '12px 14px', width: '40px', textAlign: 'center' }}><div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--accent-dim)', border: '1px solid var(--border-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.3px' }}>{icon}</div></td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{emp.firstName} {emp.lastName}</div>
                    {emp.phone && <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{emp.phone}</div>}
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '12px' }}>{emp.nationalId}</td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-primary)' }}>{emp.position}</td>
                  <td style={{ padding: '12px 14px' }}>
                    {activeAssign
                      ? <span style={{ fontSize: '12px', color: 'var(--accent)' }}>{activeAssign.vessel.name}</span>
                      : <span style={{ fontSize: '11px', color: 'rgba(127,168,201,0.4)' }}>Sin asignar</span>}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{certCount}</span>
                    {expiring > 0 && <span style={{ fontSize: '10px', color: 'var(--danger)', marginLeft: '6px' }}>({expiring} por vencer)</span>}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: st.color, background: st.bg, padding: '3px 10px', borderRadius: '20px' }}>{st.label}</span>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>No se encontraron empleados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Drawer */}
      {selectedEmp && (
        <CrewDrawer
          employee={selectedEmp} vessels={vessels} view={drawerView} setView={setDrawerView}
          onClose={closeDrawer} onRefresh={() => { loadData(); closeDrawer() }} showToast={showToast}
        />
      )}
    </div>
  )
}

/* ═════════════════════ DRAWER ═════════════════════ */
function CrewDrawer({ employee, vessels, view, setView, onClose, onRefresh, showToast }: {
  employee: Employee; vessels: Vessel[]; view: DrawerView; setView: (v: DrawerView) => void
  onClose: () => void; onRefresh: () => void; showToast: (m: string) => void
}) {
  const [saving, setSaving] = useState(false)
  const isNew = view === 'new-employee'
  const st = statusCfg[employee.status] || statusCfg.ACTIVO
  const activeAssign = employee.assignments?.find(a => a.status === 'ACTIVO')

  const breadcrumb: { label: string; view: DrawerView }[] = [{ label: isNew ? 'Nuevo' : 'Detalle', view: isNew ? 'new-employee' : 'detail' }]
  if (view === 'certs' || view === 'cert-form') breadcrumb.push({ label: 'Certificaciones', view: 'certs' })
  if (view === 'cert-form') breadcrumb.push({ label: 'Nueva', view: 'cert-form' })
  if (view === 'assigns' || view === 'assign-form') breadcrumb.push({ label: 'Asignaciones', view: 'assigns' })
  if (view === 'assign-form') breadcrumb.push({ label: 'Nueva', view: 'assign-form' })
  if (view === 'edit') breadcrumb.push({ label: 'Editar', view: 'edit' })

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'fixed', top: 0, right: 0, width: '560px', maxWidth: '92vw', height: '100vh', background: 'var(--bg-surface)', borderLeft: '1px solid rgba(212,149,10,0.2)', zIndex: 1001, display: 'flex', flexDirection: 'column', animation: 'slideIn 0.25s ease' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${goldBorder}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', background: 'var(--accent-dim)', border: '1px solid var(--border-accent)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.5px' }}>
                {isNew ? 'USR' : (positionIcons[employee.position] || 'USR')}
              </div>
              <div>
                <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {isNew ? 'Nuevo Empleado' : `${employee.firstName} ${employee.lastName}`}
                </div>
                {!isNew && <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{employee.position} — {employee.nationalId}</div>}
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '20px', cursor: 'pointer', padding: '4px 8px' }}>✕</button>
          </div>
          {!isNew && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: st.color, background: st.bg, padding: '3px 10px', borderRadius: '20px' }}>{st.label}</span>
              {activeAssign && <span style={{ fontSize: '11px', color: 'var(--accent)', background: 'rgba(212,149,10,0.08)', padding: '3px 10px', borderRadius: '20px' }}>{activeAssign.vessel.name} — {activeAssign.role}</span>}
              {employee.seafarerBook && <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace', background: 'rgba(127,168,201,0.08)', padding: '3px 10px', borderRadius: '20px' }}>LM: {employee.seafarerBook}</span>}
            </div>
          )}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '12px', fontSize: '12px' }}>
            {breadcrumb.map((b, i) => (
              <span key={b.view}>
                {i > 0 && <span style={{ color: 'rgba(212,149,10,0.3)', margin: '0 4px' }}>/</span>}
                <button onClick={() => setView(b.view)} style={{ background: 'none', border: 'none', color: i === breadcrumb.length - 1 ? 'var(--accent)' : 'var(--text-secondary)', cursor: 'pointer', padding: 0, fontSize: '12px', fontWeight: i === breadcrumb.length - 1 ? 600 : 400 }}>{b.label}</button>
              </span>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {view === 'new-employee' && <EmployeeForm onSaved={() => { onRefresh(); showToast('Empleado creado') }} saving={saving} setSaving={setSaving} />}
          {view === 'edit' && <EmployeeForm employee={employee} onSaved={() => { onRefresh(); showToast('Empleado actualizado') }} saving={saving} setSaving={setSaving} />}
          {view === 'detail' && <DetailView employee={employee} setView={setView} />}
          {view === 'certs' && <CertsView certs={employee.certifications} onNew={() => setView('cert-form')} />}
          {view === 'cert-form' && <CertForm employeeId={employee.id} onSaved={() => { onRefresh(); showToast('Certificacion agregada') }} saving={saving} setSaving={setSaving} />}
          {view === 'assigns' && <AssignsView assignments={employee.assignments} onNew={() => setView('assign-form')} />}
          {view === 'assign-form' && <AssignForm employeeId={employee.id} vessels={vessels} onSaved={() => { onRefresh(); showToast('Asignacion creada') }} saving={saving} setSaving={setSaving} />}
        </div>
      </div>
      <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
    </>
  )
}

/* ─── Detail View ─── */
function DetailView({ employee, setView }: { employee: Employee; setView: (v: DrawerView) => void }) {
  const e = employee
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Info grid */}
      <div style={{ ...card, padding: '18px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Informacion Personal</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
          <InfoRow label="Nombre" value={`${e.firstName} ${e.lastName}`} />
          <InfoRow label="Cedula" value={e.nationalId} />
          <InfoRow label="Cargo" value={e.position} />
          <InfoRow label="Nacionalidad" value={e.nationality} />
          {e.phone && <InfoRow label="Telefono" value={e.phone} />}
          {e.email && <InfoRow label="Email" value={e.email} />}
          {e.seafarerBook && <InfoRow label="Libreta de Mar" value={e.seafarerBook} />}
          {e.passportNumber && <InfoRow label="Pasaporte" value={e.passportNumber} />}
          {e.passportExpiry && <InfoRow label="Vence Pasaporte" value={fmtDate(e.passportExpiry)} />}
          {e.birthDate && <InfoRow label="Fecha Nacimiento" value={fmtDate(e.birthDate)} />}
        </div>
      </div>

      {/* Module cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
        <ModuleCard icon="CRT" label="Certificaciones" count={e.certifications.length} warning={e.certifications.filter(c => { const d = (new Date(c.expiresAt).getTime() - Date.now()) / 86400000; return d > 0 && d <= 30 }).length} onClick={() => setView('certs')} />
        <ModuleCard icon="EMB" label="Asignaciones" count={e.assignments.length} onClick={() => setView('assigns')} />
        <ModuleCard icon="EDT" label="Editar datos" onClick={() => setView('edit')} />
      </div>

      {/* Quick certs preview */}
      {e.certifications.length > 0 && (
        <div style={{ ...card, padding: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Certificaciones</div>
          {e.certifications.slice(0, 3).map(c => {
            const days = Math.ceil((new Date(c.expiresAt).getTime() - Date.now()) / 86400000)
            const expired = days <= 0
            const warning = days > 0 && days <= 30
            return (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(212,149,10,0.06)' }}>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>{c.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{c.issuedBy} — {c.number}</div>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: expired ? 'var(--danger)' : warning ? 'var(--warning)' : 'var(--success)', background: expired ? 'rgba(231,76,60,0.12)' : warning ? 'rgba(230,126,34,0.12)' : 'rgba(39,174,96,0.12)', padding: '3px 10px', borderRadius: '20px' }}>
                  {expired ? 'Vencida' : warning ? `${days}d restantes` : `Vigente`}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─── Certifications ─── */
function CertsView({ certs, onNew }: { certs: Certification[]; onNew: () => void }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Certificaciones</div>
        <button onClick={onNew} style={btnPrimary}>+ Nueva Certificacion</button>
      </div>
      {certs.length === 0
        ? <EmptyState label="certificaciones" />
        : certs.map(c => {
            const days = Math.ceil((new Date(c.expiresAt).getTime() - Date.now()) / 86400000)
            const expired = days <= 0
            const warning = days > 0 && days <= 30
            return (
              <div key={c.id} style={{ ...card, padding: '16px', marginBottom: '10px', borderLeft: `3px solid ${expired ? 'var(--danger)' : warning ? 'var(--warning)' : 'var(--success)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: expired ? 'var(--danger)' : warning ? 'var(--warning)' : 'var(--success)' }}>
                    {expired ? `Vencida hace ${Math.abs(days)}d` : `${days}d restantes`}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                  <span>Tipo: {c.type}</span>
                  <span>Emitido: {c.issuedBy}</span>
                  {c.number && <span>N: {c.number}</span>}
                  <span>Desde: {fmtDate(c.issuedAt)}</span>
                  <span>Hasta: {fmtDate(c.expiresAt)}</span>
                </div>
              </div>
            )
          })
      }
    </div>
  )
}

function CertForm({ employeeId, onSaved, saving, setSaving }: { employeeId: string; onSaved: () => void; saving: boolean; setSaving: (b: boolean) => void }) {
  const [form, setForm] = useState({ type: 'STCW', name: '', number: '', issuedBy: '', issuedAt: '', expiresAt: '', notes: '' })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try { await api(`/api/crew/${employeeId}/certifications`, { method: 'POST', body: JSON.stringify(form) }); onSaved() }
    catch { alert('Error al guardar') }
    setSaving(false)
  }
  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Nueva Certificacion</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Field label="Tipo"><select value={form.type} onChange={e => set('type', e.target.value)} style={inputStyle}>
          <option value="STCW">STCW</option><option value="BST">BST (Basic Safety)</option><option value="GMDSS">GMDSS</option>
          <option value="ECDIS">ECDIS</option><option value="ARPA">ARPA</option><option value="MEDICAL">Certificado Medico</option>
          <option value="OTHER">Otro</option>
        </select></Field>
        <Field label="Nombre del certificado"><input value={form.name} onChange={e => set('name', e.target.value)} style={inputStyle} required placeholder="Ej: STCW II/2 - Capitan" /></Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Field label="Numero"><input value={form.number} onChange={e => set('number', e.target.value)} style={inputStyle} placeholder="N de certificado" /></Field>
        <Field label="Emitido por"><input value={form.issuedBy} onChange={e => set('issuedBy', e.target.value)} style={inputStyle} required placeholder="Ej: INEA" /></Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Field label="Fecha emision"><input type="date" value={form.issuedAt} onChange={e => set('issuedAt', e.target.value)} style={inputStyle} required /></Field>
        <Field label="Fecha vencimiento"><input type="date" value={form.expiresAt} onChange={e => set('expiresAt', e.target.value)} style={inputStyle} required /></Field>
      </div>
      <Field label="Notas"><textarea value={form.notes} onChange={e => set('notes', e.target.value)} style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} placeholder="Observaciones..." /></Field>
      <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>{saving ? 'Guardando...' : 'Guardar Certificacion'}</button>
    </form>
  )
}

/* ─── Assignments ─── */
function AssignsView({ assignments, onNew }: { assignments: Assignment[]; onNew: () => void }) {
  const stColors: Record<string, string> = { ACTIVO: 'var(--success)', COMPLETADO: 'var(--text-secondary)', CANCELADO: 'var(--danger)' }
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Historial de Asignaciones</div>
        <button onClick={onNew} style={btnPrimary}>+ Nueva Asignacion</button>
      </div>
      {assignments.length === 0
        ? <EmptyState label="asignaciones" />
        : assignments.map(a => (
            <div key={a.id} style={{ ...card, padding: '16px', marginBottom: '10px', borderLeft: `3px solid ${stColors[a.status] || 'var(--text-secondary)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{a.vessel.name}</span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: stColors[a.status] || 'var(--text-secondary)' }}>{a.status}</span>
              </div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                <span>Rol: {a.role}</span>
                <span>Desde: {fmtDate(a.startDate)}</span>
                {a.endDate && <span>Hasta: {fmtDate(a.endDate)}</span>}
                <span>Flota: {a.vessel.fleetType}</span>
              </div>
            </div>
          ))
      }
    </div>
  )
}

function AssignForm({ employeeId, vessels, onSaved, saving, setSaving }: { employeeId: string; vessels: Vessel[]; onSaved: () => void; saving: boolean; setSaving: (b: boolean) => void }) {
  const [form, setForm] = useState({ vesselId: vessels[0]?.id || '', role: '', startDate: new Date().toISOString().slice(0, 10), endDate: '', notes: '' })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try { await api(`/api/crew/${employeeId}/assignments`, { method: 'POST', body: JSON.stringify(form) }); onSaved() }
    catch { alert('Error al guardar') }
    setSaving(false)
  }
  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Nueva Asignacion</div>
      <Field label="Embarcacion">
        <select value={form.vesselId} onChange={e => set('vesselId', e.target.value)} style={inputStyle} required>
          {vessels.map(v => <option key={v.id} value={v.id}>{v.name} ({v.fleetType})</option>)}
        </select>
      </Field>
      <Field label="Rol a bordo"><input value={form.role} onChange={e => set('role', e.target.value)} style={inputStyle} required placeholder="Ej: Capitan, Marinero, Jefe de Maquinas" /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Field label="Fecha inicio"><input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} style={inputStyle} required /></Field>
        <Field label="Fecha fin (opcional)"><input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} style={inputStyle} /></Field>
      </div>
      <Field label="Notas"><textarea value={form.notes} onChange={e => set('notes', e.target.value)} style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} placeholder="Observaciones..." /></Field>
      <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>{saving ? 'Guardando...' : 'Guardar Asignacion'}</button>
    </form>
  )
}

/* ─── Employee Form (New / Edit) ─── */
function EmployeeForm({ employee, onSaved, saving, setSaving }: { employee?: Employee; onSaved: () => void; saving: boolean; setSaving: (b: boolean) => void }) {
  const isEdit = employee && employee.id
  const [form, setForm] = useState({
    firstName: employee?.firstName || '', lastName: employee?.lastName || '',
    nationalId: employee?.nationalId || '', nationality: employee?.nationality || 'Venezolana',
    position: employee?.position || 'Marinero', seafarerBook: employee?.seafarerBook || '',
    passportNumber: employee?.passportNumber || '', passportExpiry: employee?.passportExpiry?.slice(0, 10) || '',
    phone: employee?.phone || '', email: employee?.email || '', address: employee?.address || '',
    birthDate: employee?.birthDate?.slice(0, 10) || '', status: employee?.status || 'ACTIVO', notes: employee?.notes || '',
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try {
      if (isEdit) {
        await api(`/api/crew/${employee!.id}`, { method: 'PUT', body: JSON.stringify(form) })
      } else {
        await api('/api/crew', { method: 'POST', body: JSON.stringify(form) })
      }
      onSaved()
    } catch { alert('Error al guardar') }
    setSaving(false)
  }
  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{isEdit ? 'Editar Empleado' : 'Nuevo Empleado'}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Field label="Nombre"><input value={form.firstName} onChange={e => set('firstName', e.target.value)} style={inputStyle} required /></Field>
        <Field label="Apellido"><input value={form.lastName} onChange={e => set('lastName', e.target.value)} style={inputStyle} required /></Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Field label="Cedula"><input value={form.nationalId} onChange={e => set('nationalId', e.target.value)} style={inputStyle} required placeholder="V-12345678" /></Field>
        <Field label="Nacionalidad"><input value={form.nationality} onChange={e => set('nationality', e.target.value)} style={inputStyle} /></Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Field label="Cargo">
          <select value={form.position} onChange={e => set('position', e.target.value)} style={inputStyle}>
            <option>Capitan</option><option>Jefe de Maquinas</option><option>Marinero</option>
            <option>Tecnico Mecanico</option><option>Tecnico Electricista</option><option>Operador</option>
            <option>Cocinero</option><option>Administrativo</option>
          </select>
        </Field>
        <Field label="Estado">
          <select value={form.status} onChange={e => set('status', e.target.value)} style={inputStyle}>
            <option value="ACTIVO">Activo</option><option value="INACTIVO">Inactivo</option>
            <option value="LICENCIA">Licencia</option><option value="VACACIONES">Vacaciones</option>
            <option value="RETIRADO">Retirado</option>
          </select>
        </Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Field label="Telefono"><input value={form.phone} onChange={e => set('phone', e.target.value)} style={inputStyle} placeholder="+58 414-..." /></Field>
        <Field label="Email"><input type="email" value={form.email} onChange={e => set('email', e.target.value)} style={inputStyle} placeholder="correo@ejemplo.com" /></Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Field label="Libreta de Mar"><input value={form.seafarerBook} onChange={e => set('seafarerBook', e.target.value)} style={inputStyle} placeholder="LM-XXXX-XXXXX" /></Field>
        <Field label="Fecha Nacimiento"><input type="date" value={form.birthDate} onChange={e => set('birthDate', e.target.value)} style={inputStyle} /></Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Field label="N Pasaporte"><input value={form.passportNumber} onChange={e => set('passportNumber', e.target.value)} style={inputStyle} /></Field>
        <Field label="Vence Pasaporte"><input type="date" value={form.passportExpiry} onChange={e => set('passportExpiry', e.target.value)} style={inputStyle} /></Field>
      </div>
      <Field label="Direccion"><input value={form.address} onChange={e => set('address', e.target.value)} style={inputStyle} placeholder="Ciudad, estado..." /></Field>
      <Field label="Notas"><textarea value={form.notes} onChange={e => set('notes', e.target.value)} style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} placeholder="Observaciones..." /></Field>
      <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>{saving ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear Empleado'}</button>
    </form>
  )
}

/* ─── Shared components ─── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>{label}</label>{children}</div>
}
function InfoRow({ label, value }: { label: string; value: string }) {
  return <div><div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div><div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>{value}</div></div>
}
function EmptyState({ label }: { label: string }) {
  return <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}><div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', marginBottom: '12px', opacity: 0.4, fontFamily: 'monospace' }}>—</div><div style={{ fontSize: '14px' }}>No hay {label} registradas</div></div>
}
function ModuleCard({ icon, label, count, warning, onClick }: { icon: string; label: string; count?: number; warning?: number; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{ ...card, padding: '16px', cursor: 'pointer', textAlign: 'center', transition: 'border-color 0.2s' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(212,149,10,0.4)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = goldBorder)}>
      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--accent-dim)', border: '1px solid var(--border-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.5px', margin: '0 auto 8px' }}>{icon}</div>
      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
      {count != null && <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{count} registros</div>}
      {warning != null && warning > 0 && <div style={{ fontSize: '10px', color: 'var(--danger)', marginTop: '2px' }}>{warning} por vencer</div>}
    </div>
  )
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })
}
