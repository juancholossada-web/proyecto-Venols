'use client'

import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api-client'

/* ─── Types ─── */
type Department = 'FP' | 'FL' | 'OPERACION'

type Employee = {
  id: string; firstName: string; lastName: string; nationalId: string
  nationality: string; position: string; department: Department
  seafarerBook?: string; passportNumber?: string; passportExpiry?: string
  phone?: string; email?: string; address?: string; birthDate?: string
  status: string; notes?: string
  assignments?: { vessel: { id: string; name: string } }[]
}

type DrawerView = 'detail' | 'edit' | 'new-employee'
type TabKey = 'ALL' | Department

/* ─── Config ─── */
const TABS: { key: TabKey; label: string; color: string }[] = [
  { key: 'ALL',      label: 'Todos',      color: 'var(--accent)' },
  { key: 'FP',       label: 'Flota Pesada (FP)', color: '#3B82F6' },
  { key: 'FL',       label: 'Flota Liviana (FL)', color: '#10B981' },
  { key: 'OPERACION',label: 'Operación',   color: '#A78BFA' },
]

const DEPT_LABEL: Record<Department, string> = {
  FP: 'Flota Pesada',
  FL: 'Flota Liviana',
  OPERACION: 'Operación',
}
const DEPT_COLOR: Record<Department, string> = {
  FP: '#3B82F6',
  FL: '#10B981',
  OPERACION: '#A78BFA',
}
const DEPT_BG: Record<Department, string> = {
  FP: 'rgba(59,130,246,0.12)',
  FL: 'rgba(16,185,129,0.12)',
  OPERACION: 'rgba(167,139,250,0.12)',
}
const DEPT_ABBR: Record<Department, string> = {
  FP: 'FP',
  FL: 'FL',
  OPERACION: 'OP',
}

type VesselCfg = { id: string; name: string }
const FP_VESSELS: VesselCfg[] = [
  { id: 'cmn0kav0a0000o6u0hz45jkq8', name: 'Molleja Lake' },
  { id: 'cmn0kav0i0002o6u0c7pdtgvs', name: 'El Masco VIII' },
  { id: 'cmn0kav0h0001o6u078oky6am', name: 'El Porteño I' },
  { id: 'cmn0kav0k0003o6u002v5los9', name: 'Zapara Island' },
]
const FL_VESSELS: VesselCfg[] = [
  { id: 'cmn0kav0l0004o6u0r5gd3das', name: 'Anabella' },
  { id: 'cmn0kav0m0005o6u0i4nqsaah', name: 'Blohm' },
  { id: 'cmn0kav0n0006o6u09hvq110c', name: 'Jackie' },
  { id: 'cmn0kav0o0007o6u09wl8m67p', name: 'La Magdalena I' },
]

const statusCfg: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVO:     { label: 'Activo',     color: 'var(--success)',    bg: 'rgba(39,174,96,0.12)' },
  INACTIVO:   { label: 'Inactivo',   color: 'var(--text-muted)', bg: 'rgba(71,100,126,0.12)' },
  LICENCIA:   { label: 'Licencia',   color: 'var(--warning)',    bg: 'rgba(230,126,34,0.12)' },
  VACACIONES: { label: 'Vacaciones', color: 'var(--info)',       bg: 'var(--info-dim)' },
  RETIRADO:   { label: 'Retirado',   color: 'var(--danger)',     bg: 'rgba(231,76,60,0.12)' },
}

/* ─── Styles ─── */
const card: React.CSSProperties = { background: 'var(--bg-surface)', border: '1px solid var(--border-accent)', borderRadius: '12px' }
const goldBorder = 'var(--border-accent)'
const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-accent)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }
const btnPrimary: React.CSSProperties = { padding: '10px 20px', background: 'var(--accent)', border: 'none', borderRadius: '8px', color: '#080E1A', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }

/* ═════════════════════ MAIN PAGE ═════════════════════ */
export default function CrewPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('')
  const [activeTab, setActiveTab] = useState<TabKey>('ALL')
  const [selectedVessel, setSelectedVessel] = useState<string | null>(null)
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null)
  const [drawerView, setDrawerView]   = useState<DrawerView>('detail')
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const loadData = useCallback(async () => {
    try {
      const emps = await api('/api/crew')
      setEmployees(emps)
    } catch { /* silent */ }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  function openEmployee(e: Employee) { setSelectedEmp(e); setDrawerView('detail') }
  function closeDrawer() { setSelectedEmp(null) }

  const filtered = employees
    .filter(e => {
      const matchSearch  = `${e.firstName} ${e.lastName} ${e.nationalId}`.toLowerCase().includes(filter.toLowerCase())
      const matchTab     = activeTab === 'ALL' || e.department === activeTab
      const matchVessel  = !selectedVessel || e.assignments?.some(a => a.vessel?.id === selectedVessel)
      return matchSearch && matchTab && matchVessel
    })
    .sort((a, b) => {
      if (activeTab !== 'ALL') return 0
      const cmp = a.lastName.localeCompare(b.lastName, 'es', { sensitivity: 'base' })
      return cmp !== 0 ? cmp : a.firstName.localeCompare(b.firstName, 'es', { sensitivity: 'base' })
    })

  const countByDept   = (dept: Department) => employees.filter(e => e.department === dept).length
  const countByVessel = (vesselId: string) => employees.filter(e =>
    e.department === activeTab && e.assignments?.some(a => a.vessel?.id === vesselId)
  ).length
  const totalActivo = employees.filter(e => e.status === 'ACTIVO').length

  if (loading) return <div style={{ color: 'var(--text-muted)', padding: '40px', textAlign: 'center' }}>Cargando personal...</div>

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', background: 'var(--success)', color: 'white', padding: '10px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, zIndex: 2000 }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Personal y Tripulacion</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Gestion de empleados por departamento</div>
        </div>
        <button onClick={() => { setSelectedEmp({} as Employee); setDrawerView('new-employee') }} style={btnPrimary}>
          + Nuevo Empleado
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <div style={{ ...card, padding: '20px 24px', borderTop: '2px solid var(--accent)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Total personal</div>
          <div style={{ fontFamily: 'monospace', fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>{employees.length}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{totalActivo} activos</div>
        </div>
        <div style={{ ...card, padding: '20px 24px', borderTop: `2px solid ${DEPT_COLOR.FP}` }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Flota Pesada</div>
          <div style={{ fontFamily: 'monospace', fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>{countByDept('FP')}</div>
          <div style={{ fontSize: '11px', color: DEPT_COLOR.FP, marginTop: '4px', fontWeight: 600 }}>FP</div>
        </div>
        <div style={{ ...card, padding: '20px 24px', borderTop: `2px solid ${DEPT_COLOR.FL}` }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Flota Liviana</div>
          <div style={{ fontFamily: 'monospace', fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>{countByDept('FL')}</div>
          <div style={{ fontSize: '11px', color: DEPT_COLOR.FL, marginTop: '4px', fontWeight: 600 }}>FL</div>
        </div>
        <div style={{ ...card, padding: '20px 24px', borderTop: `2px solid ${DEPT_COLOR.OPERACION}` }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Operacion</div>
          <div style={{ fontFamily: 'monospace', fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>{countByDept('OPERACION')}</div>
          <div style={{ fontSize: '11px', color: DEPT_COLOR.OPERACION, marginTop: '4px', fontWeight: 600 }}>OPS</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', borderBottom: `1px solid ${goldBorder}`, paddingBottom: '0' }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setSelectedVessel(null) }}
            style={{
              padding: '9px 18px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.key ? `2px solid ${tab.color}` : '2px solid transparent',
              color: activeTab === tab.key ? tab.color : 'var(--text-secondary)',
              fontWeight: activeTab === tab.key ? 700 : 400,
              fontSize: '13px',
              cursor: 'pointer',
              marginBottom: '-1px',
              transition: 'color 0.15s',
            }}
          >
            {tab.label}
            {tab.key !== 'ALL' && (
              <span style={{ marginLeft: '6px', fontSize: '11px', background: activeTab === tab.key ? tab.color : 'rgba(255,255,255,0.08)', color: activeTab === tab.key ? '#080E1A' : 'var(--text-muted)', padding: '1px 6px', borderRadius: '10px', fontWeight: 700 }}>
                {tab.key === 'FP' ? countByDept('FP') : tab.key === 'FL' ? countByDept('FL') : countByDept('OPERACION')}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Vessel sub-tabs */}
      {(activeTab === 'FP' || activeTab === 'FL') && (() => {
        const vessels  = activeTab === 'FP' ? FP_VESSELS : FL_VESSELS
        const color    = DEPT_COLOR[activeTab]
        const bg       = DEPT_BG[activeTab]
        return (
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedVessel(null)}
              style={{
                padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: selectedVessel === null ? 700 : 500, cursor: 'pointer',
                border: `1px solid ${selectedVessel === null ? color : 'rgba(255,255,255,0.1)'}`,
                background: selectedVessel === null ? bg : 'transparent',
                color: selectedVessel === null ? color : 'var(--text-secondary)',
                transition: 'all 0.15s',
              }}
            >
              Todas
              <span style={{ marginLeft: '5px', fontSize: '10px', fontWeight: 700, background: selectedVessel === null ? color : 'rgba(255,255,255,0.08)', color: selectedVessel === null ? '#080E1A' : 'var(--text-muted)', padding: '1px 5px', borderRadius: '8px' }}>
                {countByDept(activeTab)}
              </span>
            </button>
            {vessels.map(v => {
              const active = selectedVessel === v.id
              const cnt    = countByVessel(v.id)
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedVessel(v.id)}
                  style={{
                    padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: active ? 700 : 500, cursor: 'pointer',
                    border: `1px solid ${active ? color : 'rgba(255,255,255,0.1)'}`,
                    background: active ? bg : 'transparent',
                    color: active ? color : 'var(--text-secondary)',
                    transition: 'all 0.15s',
                  }}
                >
                  {v.name}
                  <span style={{ marginLeft: '5px', fontSize: '10px', fontWeight: 700, background: active ? color : 'rgba(255,255,255,0.08)', color: active ? '#080E1A' : 'var(--text-muted)', padding: '1px 5px', borderRadius: '8px' }}>
                    {cnt}
                  </span>
                </button>
              )
            })}
          </div>
        )
      })()}

      {/* Search */}
      <div style={{ marginBottom: '16px' }}>
        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Buscar por nombre o cedula..."
          style={{ ...inputStyle, maxWidth: '320px' }}
        />
      </div>

      {/* Table */}
      <div style={{ ...card, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'rgba(212,149,10,0.06)' }}>
              {['', 'Nombre', 'Cedula', 'Cargo', selectedVessel ? 'Embarcacion' : 'Departamento', 'Estado'].map(h => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, borderBottom: `1px solid ${goldBorder}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(emp => {
              const st   = statusCfg[emp.status] || statusCfg.INACTIVO
              const dept = emp.department as Department
              return (
                <tr key={emp.id} onClick={() => openEmployee(emp)}
                  style={{ cursor: 'pointer', borderBottom: `1px solid rgba(212,149,10,0.06)` }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,149,10,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '12px 14px', width: '40px', textAlign: 'center' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: dept ? DEPT_BG[dept] : 'var(--accent-dim)', border: `1px solid ${dept ? DEPT_COLOR[dept] : 'var(--border-accent)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: dept ? DEPT_COLOR[dept] : 'var(--accent)', letterSpacing: '0.3px' }}>
                      {DEPT_ABBR[dept] || dept}
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{emp.firstName} {emp.lastName}</div>
                    {emp.phone && <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{emp.phone}</div>}
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '12px' }}>{emp.nationalId}</td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-primary)' }}>{emp.position}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: DEPT_COLOR[dept] || 'var(--text-muted)', background: DEPT_BG[dept] || 'transparent', padding: '3px 10px', borderRadius: '20px' }}>
                      {selectedVessel
                        ? (emp.assignments?.find(a => a.vessel?.id === selectedVessel)?.vessel?.name ?? DEPT_LABEL[dept])
                        : (DEPT_LABEL[dept] || dept)}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: st.color, background: st.bg, padding: '3px 10px', borderRadius: '20px' }}>
                      {st.label}
                    </span>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No se encontraron empleados{activeTab !== 'ALL' ? ` en ${DEPT_LABEL[activeTab as Department]}` : ''}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Drawer */}
      {selectedEmp && (
        <CrewDrawer
          employee={selectedEmp} view={drawerView} setView={setDrawerView}
          onClose={closeDrawer} onRefresh={() => { loadData(); closeDrawer() }} showToast={showToast}
        />
      )}
    </div>
  )
}

/* ═════════════════════ DRAWER ═════════════════════ */
function CrewDrawer({ employee, view, setView, onClose, onRefresh, showToast }: {
  employee: Employee; view: DrawerView; setView: (v: DrawerView) => void
  onClose: () => void; onRefresh: () => void; showToast: (m: string) => void
}) {
  const [saving, setSaving] = useState(false)
  const isNew = view === 'new-employee'
  const st    = statusCfg[employee.status] || statusCfg.ACTIVO
  const dept  = employee.department as Department

  const breadcrumb: { label: string; view: DrawerView }[] = [
    { label: isNew ? 'Nuevo' : 'Detalle', view: isNew ? 'new-employee' : 'detail' },
  ]
  if (view === 'edit') breadcrumb.push({ label: 'Editar', view: 'edit' })

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'fixed', top: 0, right: 0, width: '560px', maxWidth: '100vw', height: '100vh', background: 'var(--bg-surface)', borderLeft: '1px solid rgba(212,149,10,0.2)', zIndex: 1001, display: 'flex', flexDirection: 'column', animation: 'slideIn 0.25s ease' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${goldBorder}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', background: !isNew && dept ? DEPT_BG[dept] : 'var(--accent-dim)', border: `1px solid ${!isNew && dept ? DEPT_COLOR[dept] : 'var(--border-accent)'}`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: !isNew && dept ? DEPT_COLOR[dept] : 'var(--accent)', letterSpacing: '0.5px' }}>
                {isNew ? 'USR' : (DEPT_ABBR[dept] || dept)}
              </div>
              <div>
                <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {isNew ? 'Nuevo Empleado' : `${employee.firstName} ${employee.lastName}`}
                </div>
                {!isNew && (
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {employee.position} — {employee.nationalId}
                  </div>
                )}
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '20px', cursor: 'pointer', padding: '4px 8px' }}>✕</button>
          </div>
          {!isNew && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: st.color, background: st.bg, padding: '3px 10px', borderRadius: '20px' }}>
                {st.label}
              </span>
              {dept && (
                <span style={{ fontSize: '11px', fontWeight: 700, color: DEPT_COLOR[dept], background: DEPT_BG[dept], padding: '3px 10px', borderRadius: '20px' }}>
                  {DEPT_LABEL[dept]}
                </span>
              )}
            </div>
          )}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '12px', fontSize: '12px' }}>
            {breadcrumb.map((b, i) => (
              <span key={b.view}>
                {i > 0 && <span style={{ color: 'rgba(212,149,10,0.3)', margin: '0 4px' }}>/</span>}
                <button onClick={() => setView(b.view)} style={{ background: 'none', border: 'none', color: i === breadcrumb.length - 1 ? 'var(--accent)' : 'var(--text-secondary)', cursor: 'pointer', padding: 0, fontSize: '12px', fontWeight: i === breadcrumb.length - 1 ? 600 : 400 }}>
                  {b.label}
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {view === 'new-employee' && <EmployeeForm onSaved={() => { onRefresh(); showToast('Empleado creado') }} saving={saving} setSaving={setSaving} />}
          {view === 'edit'         && <EmployeeForm employee={employee} onSaved={() => { onRefresh(); showToast('Empleado actualizado') }} saving={saving} setSaving={setSaving} />}
          {view === 'detail'       && <DetailView employee={employee} setView={setView} />}
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
      <div style={{ ...card, padding: '18px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Informacion Personal</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
          <InfoRow label="Nombre"          value={`${e.firstName} ${e.lastName}`} />
          <InfoRow label="Cedula"          value={e.nationalId} />
          <InfoRow label="Cargo"           value={e.position} />
          <InfoRow label="Departamento"    value={DEPT_LABEL[e.department] || e.department} />
          <InfoRow label="Nacionalidad"    value={e.nationality} />
          {e.phone          && <InfoRow label="Telefono"         value={e.phone} />}
          {e.email          && <InfoRow label="Email"            value={e.email} />}
          {e.seafarerBook   && <InfoRow label="Libreta de Mar"   value={e.seafarerBook} />}
          {e.passportNumber && <InfoRow label="Pasaporte"        value={e.passportNumber} />}
          {e.passportExpiry && <InfoRow label="Vence Pasaporte"  value={fmtDate(e.passportExpiry)} />}
          {e.birthDate      && <InfoRow label="Fecha Nacimiento" value={fmtDate(e.birthDate)} />}
          {e.address        && <InfoRow label="Direccion"        value={e.address} />}
          {e.notes          && <InfoRow label="Notas"            value={e.notes} />}
        </div>
      </div>

      <button onClick={() => setView('edit')} style={{ ...btnPrimary, alignSelf: 'flex-start' }}>
        Editar datos
      </button>
    </div>
  )
}

/* ─── Employee Form (New / Edit) ─── */
function EmployeeForm({ employee, onSaved, saving, setSaving }: {
  employee?: Employee; onSaved: () => void; saving: boolean; setSaving: (b: boolean) => void
}) {
  const isEdit = employee && employee.id
  const [form, setForm] = useState({
    firstName:      employee?.firstName      || '',
    lastName:       employee?.lastName       || '',
    nationalId:     employee?.nationalId     || '',
    nationality:    employee?.nationality    || 'Venezolana',
    position:       employee?.position       || 'Marinero',
    department:     employee?.department     || 'FP',
    seafarerBook:   employee?.seafarerBook   || '',
    passportNumber: employee?.passportNumber || '',
    passportExpiry: employee?.passportExpiry?.slice(0, 10) || '',
    phone:          employee?.phone          || '',
    email:          employee?.email          || '',
    address:        employee?.address        || '',
    birthDate:      employee?.birthDate?.slice(0, 10) || '',
    status:         employee?.status         || 'ACTIVO',
    notes:          employee?.notes          || '',
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
      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
        {isEdit ? 'Editar Empleado' : 'Nuevo Empleado'}
      </div>
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
            <option>Capitan</option>
            <option>Jefe de Maquinas</option>
            <option>Marinero</option>
            <option>Tecnico Mecanico</option>
            <option>Tecnico Electricista</option>
            <option>Operador</option>
            <option>Asistente de Operaciones</option>
            <option>Cocinero</option>
            <option>Administrativo</option>
          </select>
        </Field>
        <Field label="Departamento">
          <select value={form.department} onChange={e => set('department', e.target.value)} style={inputStyle}>
            <option value="FP">Flota Pesada (FP)</option>
            <option value="FL">Flota Liviana (FL)</option>
            <option value="OPERACION">Operacion</option>
          </select>
        </Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Field label="Estado">
          <select value={form.status} onChange={e => set('status', e.target.value)} style={inputStyle}>
            <option value="ACTIVO">Activo</option>
            <option value="INACTIVO">Inactivo</option>
            <option value="LICENCIA">Licencia</option>
            <option value="VACACIONES">Vacaciones</option>
            <option value="RETIRADO">Retirado</option>
          </select>
        </Field>
        <Field label="Telefono"><input value={form.phone} onChange={e => set('phone', e.target.value)} style={inputStyle} placeholder="+58 414-..." /></Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Field label="Email"><input type="email" value={form.email} onChange={e => set('email', e.target.value)} style={inputStyle} placeholder="correo@ejemplo.com" /></Field>
        <Field label="Fecha Nacimiento"><input type="date" value={form.birthDate} onChange={e => set('birthDate', e.target.value)} style={inputStyle} /></Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Field label="Libreta de Mar"><input value={form.seafarerBook} onChange={e => set('seafarerBook', e.target.value)} style={inputStyle} placeholder="LM-XXXX-XXXXX" /></Field>
        <Field label="N Pasaporte"><input value={form.passportNumber} onChange={e => set('passportNumber', e.target.value)} style={inputStyle} /></Field>
      </div>
      <Field label="Vence Pasaporte"><input type="date" value={form.passportExpiry} onChange={e => set('passportExpiry', e.target.value)} style={inputStyle} /></Field>
      <Field label="Direccion"><input value={form.address} onChange={e => set('address', e.target.value)} style={inputStyle} placeholder="Ciudad, estado..." /></Field>
      <Field label="Notas"><textarea value={form.notes} onChange={e => set('notes', e.target.value)} style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} placeholder="Observaciones..." /></Field>
      <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
        {saving ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear Empleado'}
      </button>
    </form>
  )
}

/* ─── Shared components ─── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>
        {label}
      </label>
      {children}
    </div>
  )
}
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>{value}</div>
    </div>
  )
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })
}
