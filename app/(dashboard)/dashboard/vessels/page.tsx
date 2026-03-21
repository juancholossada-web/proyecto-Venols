'use client'

import { useEffect, useState, useCallback } from 'react'

/* ─── Types ─── */
type Vessel = {
  id: string; name: string; fleetType: 'PESADA' | 'LIVIANA'; vesselType: string
  status: string; matricula?: string; captain?: string; marineOnDuty?: string
  homePort?: string; flag?: string; grossTon?: number; length?: number
}
type FuelReport = {
  id: string; date: string; fuelLevel: number; fuelUnit: string
  consumption?: number; location?: string; operator?: string; notes?: string
}
type MaintenanceReport = {
  id: string; date: string; type: string; description: string; technician?: string
  partsReplaced?: string; cost?: number; status: string; nextScheduled?: string; notes?: string
}
type StatusReport = {
  id: string; date: string; location: string; activity: string; fuelLevel?: number
  client?: string; captain: string; marineOnDuty: string; vesselStatus: string; notes?: string
}

type DrawerView = 'modules' | 'reports' | 'fuel-list' | 'fuel-form' | 'maint-list' | 'maint-form' | 'status-list' | 'status-form'

/* ─── Config ─── */
const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  OPERATIVO:     { label: 'Operativo',     color: '#27ae60', bg: 'rgba(39,174,96,0.12)' },
  EN_TRANSITO:   { label: 'En tránsito',   color: '#D4950A', bg: 'rgba(212,149,10,0.12)' },
  ATRACADO:      { label: 'Atracado',      color: '#7fa8c9', bg: 'rgba(127,168,201,0.12)' },
  MANTENIMIENTO: { label: 'Mantenimiento', color: '#e74c3c', bg: 'rgba(231,76,60,0.12)' },
  INACTIVO:      { label: 'Inactivo',      color: '#555e6e', bg: 'rgba(85,94,110,0.12)' },
}
const fleetIcon = (ft: string) => ft === 'PESADA' ? '🚢' : '🚤'

/* ─── API helper ─── */
function getToken() { return localStorage.getItem('token') || '' }
async function api(path: string, opts?: RequestInit) {
  const res = await fetch(path, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...opts?.headers } })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}

/* ─── Styles ─── */
const card = { background: '#0a1628', border: '1px solid rgba(212,149,10,0.15)', borderRadius: '14px' }
const goldBorder = 'rgba(212,149,10,0.15)'
const goldBorderActive = 'rgba(212,149,10,0.5)'
const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', background: '#060c1a', border: `1px solid ${goldBorder}`, borderRadius: '8px', color: '#e8f4fd', fontSize: '13px', outline: 'none' }
const btnPrimary: React.CSSProperties = { padding: '10px 20px', background: 'linear-gradient(135deg, #D4950A, #b8820a)', border: 'none', borderRadius: '8px', color: '#060c1a', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }
const btnSecondary: React.CSSProperties = { padding: '8px 14px', background: 'transparent', border: `1px solid ${goldBorder}`, borderRadius: '8px', color: '#7fa8c9', fontSize: '12px', cursor: 'pointer' }

/* ═════════════════════ MAIN PAGE ═════════════════════ */
export default function VesselsPage() {
  const [vessels, setVessels] = useState<Vessel[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFleet, setActiveFleet] = useState<'PESADA' | 'LIVIANA' | null>(null)
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null)
  const [drawerView, setDrawerView] = useState<DrawerView>('modules')

  useEffect(() => {
    api('/api/vessels').then(setVessels).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const pesada = vessels.filter(v => v.fleetType === 'PESADA')
  const liviana = vessels.filter(v => v.fleetType === 'LIVIANA')
  const displayed = activeFleet ? vessels.filter(v => v.fleetType === activeFleet) : vessels

  function openVessel(v: Vessel) { setSelectedVessel(v); setDrawerView('modules') }
  function closeDrawer() { setSelectedVessel(null) }

  if (loading) return <div style={{ color: '#7fa8c9', padding: '40px', textAlign: 'center' }}>Cargando flota...</div>

  return (
    <div style={{ position: 'relative' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '22px', fontWeight: 800, color: '#e8f4fd' }}>Embarcaciones</div>
        <div style={{ fontSize: '13px', color: '#7fa8c9', marginTop: '4px' }}>
          Gestion de flota — {vessels.length} embarcaciones registradas
        </div>
      </div>

      {/* Fleet tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        {([null, 'PESADA', 'LIVIANA'] as const).map(ft => {
          const active = activeFleet === ft
          const label = ft === null ? 'Toda la Flota' : ft === 'PESADA' ? `🚢 Flota Pesada (${pesada.length})` : `🚤 Flota Liviana (${liviana.length})`
          return (
            <button key={String(ft)} onClick={() => setActiveFleet(ft)} style={{
              padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              border: `1px solid ${active ? goldBorderActive : goldBorder}`,
              background: active ? 'rgba(212,149,10,0.12)' : 'transparent',
              color: active ? '#D4950A' : '#7fa8c9',
            }}>
              {label}
            </button>
          )
        })}
      </div>

      {/* Fleet sections */}
      {activeFleet === null ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {[{ key: 'PESADA' as const, label: 'Flota Pesada', icon: '🚢', desc: 'Buques de gran calado para operaciones offshore', list: pesada },
            { key: 'LIVIANA' as const, label: 'Flota Liviana', icon: '🚤', desc: 'Lanchas para transporte de personal y operaciones costeras', list: liviana }]
            .map(fleet => (
            <div key={fleet.key}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>{fleet.icon}</span>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#e8f4fd' }}>{fleet.label}</div>
                    <div style={{ fontSize: '11px', color: '#7fa8c9' }}>{fleet.desc}</div>
                  </div>
                </div>
                <button onClick={() => setActiveFleet(fleet.key)} style={{ fontSize: '11px', color: '#D4950A', cursor: 'pointer', background: 'none', border: 'none' }}>Ver detalle →</button>
              </div>
              <VesselGrid vessels={fleet.list} onSelect={openVessel} />
            </div>
          ))}
        </div>
      ) : (
        <VesselGrid vessels={displayed} onSelect={openVessel} />
      )}

      {/* Drawer overlay */}
      {selectedVessel && (
        <VesselDrawer vessel={selectedVessel} view={drawerView} setView={setDrawerView} onClose={closeDrawer} />
      )}
    </div>
  )
}

/* ═════════════════════ VESSEL GRID ═════════════════════ */
function VesselGrid({ vessels, onSelect }: { vessels: Vessel[]; onSelect: (v: Vessel) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
      {vessels.map(vessel => {
        const st = statusConfig[vessel.status] || statusConfig.INACTIVO
        return (
          <div key={vessel.id} onClick={() => onSelect(vessel)}
            style={{ ...card, padding: '20px', cursor: 'pointer', transition: 'border-color 0.2s, box-shadow 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(212,149,10,0.4)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(212,149,10,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = goldBorder; e.currentTarget.style.boxShadow = 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div style={{ width: '48px', height: '48px', background: 'rgba(212,149,10,0.1)', border: '1px solid rgba(212,149,10,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                {fleetIcon(vessel.fleetType)}
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: st.color, background: st.bg, padding: '4px 10px', borderRadius: '20px' }}>{st.label}</span>
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#e8f4fd', marginBottom: '4px' }}>{vessel.name}</div>
            <div style={{ fontSize: '12px', color: '#7fa8c9' }}>{vessel.vesselType}</div>
            {vessel.matricula && <div style={{ marginTop: '8px', fontSize: '11px', color: 'rgba(212,149,10,0.5)', fontFamily: 'monospace' }}>MAT: {vessel.matricula}</div>}
          </div>
        )
      })}
    </div>
  )
}

/* ═════════════════════ DRAWER ═════════════════════ */
function VesselDrawer({ vessel, view, setView, onClose }: {
  vessel: Vessel; view: DrawerView; setView: (v: DrawerView) => void; onClose: () => void
}) {
  /* Reports state */
  const [fuelReports, setFuelReports] = useState<FuelReport[]>([])
  const [maintReports, setMaintReports] = useState<MaintenanceReport[]>([])
  const [statusReports, setStatusReports] = useState<StatusReport[]>([])
  const [loadingReports, setLoadingReports] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const loadReports = useCallback(async (type: 'fuel' | 'maintenance' | 'status') => {
    setLoadingReports(true)
    try {
      const data = await api(`/api/vessels/${vessel.id}/reports/${type}`)
      if (type === 'fuel') setFuelReports(data)
      else if (type === 'maintenance') setMaintReports(data)
      else setStatusReports(data)
    } catch { /* silent */ }
    setLoadingReports(false)
  }, [vessel.id])

  function navigateTo(v: DrawerView) {
    setView(v)
    if (v === 'fuel-list') loadReports('fuel')
    else if (v === 'maint-list') loadReports('maintenance')
    else if (v === 'status-list') loadReports('status')
  }

  /* Breadcrumb */
  const breadcrumb: { label: string; view: DrawerView }[] = [{ label: 'Modulos', view: 'modules' }]
  if (view !== 'modules') breadcrumb.push({ label: 'Reportes', view: 'reports' })
  if (['fuel-list', 'fuel-form'].includes(view)) breadcrumb.push({ label: 'Combustible', view: 'fuel-list' })
  if (['maint-list', 'maint-form'].includes(view)) breadcrumb.push({ label: 'Mantenimiento', view: 'maint-list' })
  if (['status-list', 'status-form'].includes(view)) breadcrumb.push({ label: 'Estado', view: 'status-list' })

  const st = statusConfig[vessel.status] || statusConfig.INACTIVO

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, backdropFilter: 'blur(4px)' }} />
      {/* Panel */}
      <div style={{ position: 'fixed', top: 0, right: 0, width: '520px', maxWidth: '90vw', height: '100vh', background: '#0a1628', borderLeft: '1px solid rgba(212,149,10,0.2)', zIndex: 1001, display: 'flex', flexDirection: 'column', animation: 'slideIn 0.25s ease' }}>
        {/* Toast */}
        {toast && <div style={{ position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)', background: '#27ae60', color: 'white', padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, zIndex: 10 }}>{toast}</div>}

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(212,149,10,0.15)', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', background: 'rgba(212,149,10,0.1)', border: '1px solid rgba(212,149,10,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>{fleetIcon(vessel.fleetType)}</div>
              <div>
                <div style={{ fontSize: '17px', fontWeight: 700, color: '#e8f4fd' }}>{vessel.name}</div>
                <div style={{ fontSize: '12px', color: '#7fa8c9' }}>{vessel.vesselType} — {vessel.fleetType === 'PESADA' ? 'Flota Pesada' : 'Flota Liviana'}</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#7fa8c9', fontSize: '20px', cursor: 'pointer', padding: '4px 8px' }}>✕</button>
          </div>
          {/* Vessel meta row */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: st.color, background: st.bg, padding: '3px 10px', borderRadius: '20px' }}>{st.label}</span>
            {vessel.matricula && <span style={{ fontSize: '11px', color: '#D4950A', fontFamily: 'monospace', background: 'rgba(212,149,10,0.08)', padding: '3px 10px', borderRadius: '20px' }}>MAT: {vessel.matricula}</span>}
            {vessel.homePort && <span style={{ fontSize: '11px', color: '#7fa8c9', background: 'rgba(127,168,201,0.08)', padding: '3px 10px', borderRadius: '20px' }}>{vessel.homePort}</span>}
          </div>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '14px', fontSize: '12px' }}>
            {breadcrumb.map((b, i) => (
              <span key={b.view}>
                {i > 0 && <span style={{ color: 'rgba(212,149,10,0.3)', margin: '0 4px' }}>/</span>}
                <button onClick={() => navigateTo(b.view)} style={{ background: 'none', border: 'none', color: i === breadcrumb.length - 1 ? '#D4950A' : '#7fa8c9', cursor: 'pointer', padding: 0, fontSize: '12px', fontWeight: i === breadcrumb.length - 1 ? 600 : 400 }}>{b.label}</button>
              </span>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {view === 'modules' && <ModulesView onNavigate={navigateTo} />}
          {view === 'reports' && <ReportsMenu onNavigate={navigateTo} />}
          {view === 'fuel-list' && <FuelListView reports={fuelReports} loading={loadingReports} onNew={() => setView('fuel-form')} />}
          {view === 'fuel-form' && <FuelForm vesselId={vessel.id} onSaved={() => { navigateTo('fuel-list'); showToast('Reporte de combustible guardado') }} saving={saving} setSaving={setSaving} />}
          {view === 'maint-list' && <MaintListView reports={maintReports} loading={loadingReports} onNew={() => setView('maint-form')} />}
          {view === 'maint-form' && <MaintForm vesselId={vessel.id} onSaved={() => { navigateTo('maint-list'); showToast('Reporte de mantenimiento guardado') }} saving={saving} setSaving={setSaving} />}
          {view === 'status-list' && <StatusListView reports={statusReports} loading={loadingReports} onNew={() => setView('status-form')} />}
          {view === 'status-form' && <StatusForm vessel={vessel} onSaved={() => { navigateTo('status-list'); showToast('Reporte de estado guardado') }} saving={saving} setSaving={setSaving} />}
        </div>
      </div>
      <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
    </>
  )
}

/* ─── Modules View ─── */
function ModulesView({ onNavigate }: { onNavigate: (v: DrawerView) => void }) {
  const modules = [
    { id: 'reports' as const, icon: '📋', label: 'Reportes', desc: 'Combustible, mantenimiento y estado', active: true },
    { id: 'docs' as const, icon: '📄', label: 'Documentos', desc: 'Certificados y permisos', active: false },
    { id: 'history' as const, icon: '🕐', label: 'Historial', desc: 'Registro de operaciones', active: false },
    { id: 'map' as const, icon: '🗺️', label: 'Posicion AIS', desc: 'Ubicacion GPS en tiempo real', active: false },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
      {modules.map(m => (
        <div key={m.id}
          onClick={() => m.active && onNavigate(m.id === 'reports' ? 'reports' : 'modules')}
          style={{
            ...card, padding: '20px', cursor: m.active ? 'pointer' : 'default',
            opacity: m.active ? 1 : 0.4, transition: 'border-color 0.2s',
          }}
          onMouseEnter={e => m.active && (e.currentTarget.style.borderColor = 'rgba(212,149,10,0.4)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = goldBorder)}>
          <div style={{ fontSize: '28px', marginBottom: '10px' }}>{m.icon}</div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#e8f4fd', marginBottom: '4px' }}>{m.label}</div>
          <div style={{ fontSize: '11px', color: '#7fa8c9' }}>{m.desc}</div>
          {!m.active && <div style={{ fontSize: '9px', color: 'rgba(212,149,10,0.4)', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Proximamente</div>}
        </div>
      ))}
    </div>
  )
}

/* ─── Reports Menu ─── */
function ReportsMenu({ onNavigate }: { onNavigate: (v: DrawerView) => void }) {
  const types = [
    { view: 'fuel-list' as const, icon: '⛽', label: 'Reporte de Combustible', desc: 'Nivel de combustible, consumo, operador y ubicacion', color: '#e67e22' },
    { view: 'maint-list' as const, icon: '🔧', label: 'Reporte de Mantenimiento', desc: 'Tipo de trabajo, tecnico, repuestos, costos y estado', color: '#e74c3c' },
    { view: 'status-list' as const, icon: '📍', label: 'Reporte de Estado', desc: 'Ubicacion, actividad, cliente, capitan, marino en guardia', color: '#2d9cdb' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ fontSize: '14px', fontWeight: 700, color: '#e8f4fd', marginBottom: '4px' }}>Selecciona tipo de reporte</div>
      {types.map(t => (
        <div key={t.view} onClick={() => onNavigate(t.view)}
          style={{ ...card, padding: '18px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: `3px solid ${t.color}`, transition: 'border-color 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = t.color)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = goldBorder)}>
          <div style={{ fontSize: '28px', width: '44px', textAlign: 'center' }}>{t.icon}</div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#e8f4fd' }}>{t.label}</div>
            <div style={{ fontSize: '11px', color: '#7fa8c9', marginTop: '2px' }}>{t.desc}</div>
          </div>
          <div style={{ marginLeft: 'auto', color: '#D4950A', fontSize: '16px' }}>→</div>
        </div>
      ))}
    </div>
  )
}

/* ─── Formatters ─── */
function fmtDate(d: string) {
  const dt = new Date(d)
  return dt.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + dt.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
}
function nowLocal() { return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) }

/* ═══════ FUEL ═══════ */
function FuelListView({ reports, loading, onNew }: { reports: FuelReport[]; loading: boolean; onNew: () => void }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#e8f4fd' }}>Reportes de Combustible</div>
        <button onClick={onNew} style={btnPrimary}>+ Nuevo Reporte</button>
      </div>
      {loading ? <div style={{ color: '#7fa8c9', textAlign: 'center', padding: '30px' }}>Cargando...</div>
        : reports.length === 0 ? <EmptyState label="combustible" />
        : reports.map(r => (
          <div key={r.id} style={{ ...card, padding: '16px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#e8f4fd' }}>⛽ {r.fuelLevel} {r.fuelUnit}</span>
              <span style={{ fontSize: '11px', color: '#7fa8c9', fontFamily: 'monospace' }}>{fmtDate(r.date)}</span>
            </div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#7fa8c9' }}>
              {r.consumption != null && <span>Consumo: {r.consumption} {r.fuelUnit}</span>}
              {r.location && <span>Ubicacion: {r.location}</span>}
              {r.operator && <span>Op: {r.operator}</span>}
            </div>
            {r.notes && <div style={{ fontSize: '11px', color: 'rgba(127,168,201,0.5)', marginTop: '6px' }}>{r.notes}</div>}
          </div>
        ))
      }
    </div>
  )
}

function FuelForm({ vesselId, onSaved, saving, setSaving }: { vesselId: string; onSaved: () => void; saving: boolean; setSaving: (b: boolean) => void }) {
  const [form, setForm] = useState({ date: nowLocal(), fuelLevel: '', fuelUnit: 'litros', consumption: '', location: '', operator: '', notes: '' })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try { await api(`/api/vessels/${vesselId}/reports/fuel`, { method: 'POST', body: JSON.stringify(form) }); onSaved() }
    catch { alert('Error al guardar') }
    setSaving(false)
  }
  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ fontSize: '14px', fontWeight: 700, color: '#e8f4fd' }}>Nuevo Reporte de Combustible</div>
      <Field label="Fecha y hora"><input type="datetime-local" value={form.date} onChange={e => set('date', e.target.value)} style={inputStyle} required /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Field label="Nivel de combustible"><input type="number" step="0.1" value={form.fuelLevel} onChange={e => set('fuelLevel', e.target.value)} style={inputStyle} required placeholder="Ej: 2500" /></Field>
        <Field label="Unidad"><select value={form.fuelUnit} onChange={e => set('fuelUnit', e.target.value)} style={inputStyle}><option value="litros">Litros</option><option value="galones">Galones</option><option value="barriles">Barriles</option><option value="%">Porcentaje %</option></select></Field>
      </div>
      <Field label="Consumo desde ultimo reporte"><input type="number" step="0.1" value={form.consumption} onChange={e => set('consumption', e.target.value)} style={inputStyle} placeholder="Opcional" /></Field>
      <Field label="Ubicacion"><input value={form.location} onChange={e => set('location', e.target.value)} style={inputStyle} placeholder="Puerto o coordenadas" /></Field>
      <Field label="Operador"><input value={form.operator} onChange={e => set('operator', e.target.value)} style={inputStyle} placeholder="Nombre del operador" /></Field>
      <Field label="Notas"><textarea value={form.notes} onChange={e => set('notes', e.target.value)} style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} placeholder="Observaciones..." /></Field>
      <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
        <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>{saving ? 'Guardando...' : 'Guardar Reporte'}</button>
      </div>
    </form>
  )
}

/* ═══════ MAINTENANCE ═══════ */
function MaintListView({ reports, loading, onNew }: { reports: MaintenanceReport[]; loading: boolean; onNew: () => void }) {
  const statusColors: Record<string, string> = { PENDIENTE: '#e67e22', EN_PROCESO: '#D4950A', COMPLETADO: '#27ae60' }
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#e8f4fd' }}>Reportes de Mantenimiento</div>
        <button onClick={onNew} style={btnPrimary}>+ Nuevo Reporte</button>
      </div>
      {loading ? <div style={{ color: '#7fa8c9', textAlign: 'center', padding: '30px' }}>Cargando...</div>
        : reports.length === 0 ? <EmptyState label="mantenimiento" />
        : reports.map(r => (
          <div key={r.id} style={{ ...card, padding: '16px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#e8f4fd' }}>🔧 {r.type}</span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: statusColors[r.status] || '#7fa8c9', background: 'rgba(212,149,10,0.08)', padding: '2px 10px', borderRadius: '12px' }}>{r.status}</span>
            </div>
            <div style={{ fontSize: '12px', color: '#e8f4fd', marginBottom: '6px' }}>{r.description}</div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: '#7fa8c9' }}>
              <span>{fmtDate(r.date)}</span>
              {r.technician && <span>Tecnico: {r.technician}</span>}
              {r.cost != null && <span>Costo: ${r.cost.toLocaleString()}</span>}
            </div>
            {r.partsReplaced && <div style={{ fontSize: '11px', color: 'rgba(127,168,201,0.5)', marginTop: '4px' }}>Repuestos: {r.partsReplaced}</div>}
          </div>
        ))
      }
    </div>
  )
}

function MaintForm({ vesselId, onSaved, saving, setSaving }: { vesselId: string; onSaved: () => void; saving: boolean; setSaving: (b: boolean) => void }) {
  const [form, setForm] = useState({ date: nowLocal(), type: 'Preventivo', description: '', technician: '', partsReplaced: '', cost: '', status: 'PENDIENTE', nextScheduled: '', notes: '' })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try { await api(`/api/vessels/${vesselId}/reports/maintenance`, { method: 'POST', body: JSON.stringify(form) }); onSaved() }
    catch { alert('Error al guardar') }
    setSaving(false)
  }
  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ fontSize: '14px', fontWeight: 700, color: '#e8f4fd' }}>Nuevo Reporte de Mantenimiento</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Field label="Fecha"><input type="datetime-local" value={form.date} onChange={e => set('date', e.target.value)} style={inputStyle} required /></Field>
        <Field label="Tipo"><select value={form.type} onChange={e => set('type', e.target.value)} style={inputStyle}><option>Preventivo</option><option>Correctivo</option><option>Emergencia</option><option>Clasificacion</option></select></Field>
      </div>
      <Field label="Descripcion del trabajo"><textarea value={form.description} onChange={e => set('description', e.target.value)} style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }} required placeholder="Detalle del trabajo realizado..." /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Field label="Tecnico responsable"><input value={form.technician} onChange={e => set('technician', e.target.value)} style={inputStyle} placeholder="Nombre" /></Field>
        <Field label="Estado"><select value={form.status} onChange={e => set('status', e.target.value)} style={inputStyle}><option value="PENDIENTE">Pendiente</option><option value="EN_PROCESO">En proceso</option><option value="COMPLETADO">Completado</option></select></Field>
      </div>
      <Field label="Repuestos utilizados"><input value={form.partsReplaced} onChange={e => set('partsReplaced', e.target.value)} style={inputStyle} placeholder="Lista de repuestos..." /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Field label="Costo ($)"><input type="number" step="0.01" value={form.cost} onChange={e => set('cost', e.target.value)} style={inputStyle} placeholder="0.00" /></Field>
        <Field label="Proximo mantenimiento"><input type="datetime-local" value={form.nextScheduled} onChange={e => set('nextScheduled', e.target.value)} style={inputStyle} /></Field>
      </div>
      <Field label="Notas"><textarea value={form.notes} onChange={e => set('notes', e.target.value)} style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} placeholder="Observaciones..." /></Field>
      <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>{saving ? 'Guardando...' : 'Guardar Reporte'}</button>
    </form>
  )
}

/* ═══════ STATUS ═══════ */
function StatusListView({ reports, loading, onNew }: { reports: StatusReport[]; loading: boolean; onNew: () => void }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#e8f4fd' }}>Reportes de Estado</div>
        <button onClick={onNew} style={btnPrimary}>+ Nuevo Reporte</button>
      </div>
      {loading ? <div style={{ color: '#7fa8c9', textAlign: 'center', padding: '30px' }}>Cargando...</div>
        : reports.length === 0 ? <EmptyState label="estado" />
        : reports.map(r => {
          const st = statusConfig[r.vesselStatus] || statusConfig.INACTIVO
          return (
            <div key={r.id} style={{ ...card, padding: '16px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#e8f4fd' }}>📍 {r.location}</span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: st.color, background: st.bg, padding: '2px 10px', borderRadius: '12px' }}>{st.label}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#e8f4fd', marginBottom: '6px' }}>{r.activity}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '11px', color: '#7fa8c9' }}>
                <span>Capitan: {r.captain}</span>
                <span>Marino: {r.marineOnDuty}</span>
                {r.client && <span>Cliente: {r.client}</span>}
                {r.fuelLevel != null && <span>Combustible: {r.fuelLevel}%</span>}
              </div>
              <div style={{ fontSize: '10px', color: 'rgba(127,168,201,0.4)', marginTop: '6px', fontFamily: 'monospace' }}>{fmtDate(r.date)}</div>
            </div>
          )
        })
      }
    </div>
  )
}

function StatusForm({ vessel, onSaved, saving, setSaving }: { vessel: Vessel; onSaved: () => void; saving: boolean; setSaving: (b: boolean) => void }) {
  const [form, setForm] = useState({
    date: nowLocal(), location: vessel.homePort || '', activity: '',
    fuelLevel: '', client: '', captain: vessel.captain || '',
    marineOnDuty: vessel.marineOnDuty || '', vesselStatus: vessel.status, notes: '',
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try { await api(`/api/vessels/${vessel.id}/reports/status`, { method: 'POST', body: JSON.stringify(form) }); onSaved() }
    catch { alert('Error al guardar') }
    setSaving(false)
  }
  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ fontSize: '14px', fontWeight: 700, color: '#e8f4fd' }}>Nuevo Reporte de Estado</div>
      {vessel.matricula && (
        <div style={{ ...card, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '3px solid #D4950A' }}>
          <span style={{ fontSize: '11px', color: '#7fa8c9' }}>Matricula:</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#D4950A', fontFamily: 'monospace' }}>{vessel.matricula}</span>
          <span style={{ fontSize: '10px', color: 'rgba(127,168,201,0.4)', marginLeft: 'auto' }}>Campo fijo</span>
        </div>
      )}
      <Field label="Fecha y hora"><input type="datetime-local" value={form.date} onChange={e => set('date', e.target.value)} style={inputStyle} required /></Field>
      <Field label="Ubicacion actual"><input value={form.location} onChange={e => set('location', e.target.value)} style={inputStyle} required placeholder="Puerto, coordenadas o zona" /></Field>
      <Field label="Actividad que realiza"><input value={form.activity} onChange={e => set('activity', e.target.value)} style={inputStyle} required placeholder="Ej: Transporte de personal a plataforma X" /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Field label="Capitan en guardia"><input value={form.captain} onChange={e => set('captain', e.target.value)} style={inputStyle} required placeholder="Nombre completo" /></Field>
        <Field label="Marino en guardia"><input value={form.marineOnDuty} onChange={e => set('marineOnDuty', e.target.value)} style={inputStyle} required placeholder="Nombre completo" /></Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Field label="Nivel de combustible (%)"><input type="number" step="0.1" min="0" max="100" value={form.fuelLevel} onChange={e => set('fuelLevel', e.target.value)} style={inputStyle} placeholder="Ej: 75" /></Field>
        <Field label="Estado de la embarcacion">
          <select value={form.vesselStatus} onChange={e => set('vesselStatus', e.target.value)} style={inputStyle}>
            <option value="OPERATIVO">Operativo</option>
            <option value="EN_TRANSITO">En transito</option>
            <option value="ATRACADO">Atracado</option>
            <option value="MANTENIMIENTO">Mantenimiento</option>
            <option value="INACTIVO">Inactivo</option>
          </select>
        </Field>
      </div>
      <Field label="Cliente"><input value={form.client} onChange={e => set('client', e.target.value)} style={inputStyle} placeholder="Empresa o cliente asignado" /></Field>
      <Field label="Notas"><textarea value={form.notes} onChange={e => set('notes', e.target.value)} style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} placeholder="Observaciones adicionales..." /></Field>
      <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>{saving ? 'Guardando...' : 'Guardar Reporte'}</button>
    </form>
  )
}

/* ─── Shared ─── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#7fa8c9', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>{label}</label>
      {children}
    </div>
  )
}
function EmptyState({ label }: { label: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#7fa8c9' }}>
      <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.4 }}>📋</div>
      <div style={{ fontSize: '14px', marginBottom: '4px' }}>No hay reportes de {label}</div>
      <div style={{ fontSize: '12px', opacity: 0.6 }}>Crea el primer reporte con el boton de arriba</div>
    </div>
  )
}
