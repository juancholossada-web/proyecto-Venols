'use client'

import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api-client'
import { Button, Card, Badge, FormField, Input, Select, Textarea, LoadingState, EmptyState } from '@/components/ui'

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
const STATUS_CONFIG: Record<string, { label: string; tone: 'success' | 'accent' | 'muted' | 'danger' }> = {
  OPERATIVO:     { label: 'Operativo',     tone: 'success' },
  EN_TRANSITO:   { label: 'En tránsito',   tone: 'accent' },
  ATRACADO:      { label: 'Atracado',      tone: 'muted' },
  MANTENIMIENTO: { label: 'Mantenimiento', tone: 'danger' },
  INACTIVO:      { label: 'Inactivo',      tone: 'muted' },
}
const fleetTag = (ft: string) => ft === 'PESADA' ? 'PS' : 'LV'

function fmtDate(d: string) {
  const dt = new Date(d)
  return dt.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' + dt.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
}
function nowLocal() {
  return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

/* ═════════════════════ MAIN PAGE ═════════════════════ */
export default function VesselsPage() {
  const [vessels, setVessels]               = useState<Vessel[]>([])
  const [loading, setLoading]               = useState(true)
  const [activeFleet, setActiveFleet]       = useState<'PESADA' | 'LIVIANA' | null>(null)
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null)
  const [drawerView, setDrawerView]         = useState<DrawerView>('modules')

  useEffect(() => {
    api<Vessel[]>('/api/vessels').then(setVessels).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const pesada   = vessels.filter(v => v.fleetType === 'PESADA')
  const liviana  = vessels.filter(v => v.fleetType === 'LIVIANA')
  const displayed = activeFleet ? vessels.filter(v => v.fleetType === activeFleet) : vessels

  function openVessel(v: Vessel) { setSelectedVessel(v); setDrawerView('modules') }
  function closeDrawer()         { setSelectedVessel(null) }

  if (loading) return <LoadingState message="Cargando flota..." />

  return (
    <div className="relative">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Embarcaciones</h1>
        <p className="text-[13px] text-[var(--text-muted)] mt-1">
          Gestión de flota — {vessels.length} embarcaciones registradas
        </p>
      </div>

      {/* Fleet tabs */}
      <div className="flex gap-2.5 mb-6">
        {([null, 'PESADA', 'LIVIANA'] as const).map(ft => {
          const active = activeFleet === ft
          const label  = ft === null ? 'Toda la Flota'
            : ft === 'PESADA' ? `Flota Pesada (${pesada.length})`
            : `Flota Liviana (${liviana.length})`
          return (
            <Button key={String(ft)} variant={active ? 'primary' : 'secondary'} size="sm"
              onClick={() => setActiveFleet(ft)}>
              {label}
            </Button>
          )
        })}
      </div>

      {/* Fleet sections */}
      {activeFleet === null ? (
        <div className="flex flex-col gap-7">
          {([
            { key: 'PESADA' as const, label: 'Flota Pesada',   tag: 'PS', desc: 'Buques de gran calado para operaciones offshore',                list: pesada },
            { key: 'LIVIANA' as const, label: 'Flota Liviana', tag: 'LV', desc: 'Lanchas para transporte de personal y operaciones costeras', list: liviana },
          ]).map(fleet => (
            <div key={fleet.key}>
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2.5">
                  <FleetIcon tag={fleet.tag} />
                  <div>
                    <div className="text-[15px] font-bold text-[var(--text-primary)]">{fleet.label}</div>
                    <div className="text-[11px] text-[var(--text-muted)]">{fleet.desc}</div>
                  </div>
                </div>
              </div>
              <VesselGrid vessels={fleet.list} onSelect={openVessel} />
            </div>
          ))}
        </div>
      ) : (
        <VesselGrid vessels={displayed} onSelect={openVessel} />
      )}

      {selectedVessel && (
        <VesselDrawer vessel={selectedVessel} view={drawerView} setView={setDrawerView} onClose={closeDrawer} />
      )}
    </div>
  )
}

/* ─── Fleet Icon chip ─── */
function FleetIcon({ tag, size = 30 }: { tag: string; size?: number }) {
  return (
    <div style={{ width: size, height: size }}
      className="bg-[var(--accent-dim)] border border-[var(--border-accent)] rounded-lg flex items-center justify-center text-[10px] font-bold text-[var(--accent)] tracking-[0.5px]">
      {tag}
    </div>
  )
}

/* ═════════════════════ VESSEL GRID ═════════════════════ */
function VesselGrid({ vessels, onSelect }: { vessels: Vessel[]; onSelect: (v: Vessel) => void }) {
  if (!vessels.length) {
    return <EmptyState icon="directions_boat" title="Sin embarcaciones" description="No hay embarcaciones en esta flota." />
  }
  return (
    <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
      {vessels.map(vessel => {
        const st = STATUS_CONFIG[vessel.status] || STATUS_CONFIG.INACTIVO
        return (
          <Card key={vessel.id} padding="none"
            className="p-5 cursor-pointer hover:border-[var(--border-accent-strong)] transition-colors"
            onClick={() => onSelect(vessel)}>
            <div className="flex justify-between items-start mb-3.5">
              <FleetIcon tag={fleetTag(vessel.fleetType)} size={44} />
              <Badge tone={st.tone}>{st.label}</Badge>
            </div>
            <div className="text-[14px] font-bold text-[var(--text-primary)] mb-1">{vessel.name}</div>
            <div className="text-[12px] text-[var(--text-muted)]">{vessel.vesselType}</div>
            {vessel.matricula && (
              <div className="mt-2 text-[11px] text-[var(--accent)] font-mono opacity-60">MAT: {vessel.matricula}</div>
            )}
          </Card>
        )
      })}
    </div>
  )
}

/* ═════════════════════ DRAWER ═════════════════════ */
function VesselDrawer({ vessel, view, setView, onClose }: {
  vessel: Vessel; view: DrawerView; setView: (v: DrawerView) => void; onClose: () => void
}) {
  const [fuelReports,   setFuelReports]   = useState<FuelReport[]>([])
  const [maintReports,  setMaintReports]  = useState<MaintenanceReport[]>([])
  const [statusReports, setStatusReports] = useState<StatusReport[]>([])
  const [loadingReports, setLoadingReports] = useState(false)
  const [saving, setSaving]               = useState(false)
  const [toast, setToast]                 = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const loadReports = useCallback(async (type: 'fuel' | 'maintenance' | 'status') => {
    setLoadingReports(true)
    try {
      const data = await api<FuelReport[] | MaintenanceReport[] | StatusReport[]>(`/api/vessels/${vessel.id}/reports/${type}`)
      if (type === 'fuel')        setFuelReports(data as FuelReport[])
      else if (type === 'maintenance') setMaintReports(data as MaintenanceReport[])
      else                        setStatusReports(data as StatusReport[])
    } catch { /* silent */ }
    setLoadingReports(false)
  }, [vessel.id])

  function navigateTo(v: DrawerView) {
    setView(v)
    if (v === 'fuel-list')   loadReports('fuel')
    else if (v === 'maint-list')  loadReports('maintenance')
    else if (v === 'status-list') loadReports('status')
  }

  const breadcrumb: { label: string; view: DrawerView }[] = [{ label: 'Módulos', view: 'modules' }]
  if (view !== 'modules') breadcrumb.push({ label: 'Reportes', view: 'reports' })
  if (['fuel-list',   'fuel-form'].includes(view))   breadcrumb.push({ label: 'Combustible',    view: 'fuel-list' })
  if (['maint-list',  'maint-form'].includes(view))  breadcrumb.push({ label: 'Mantenimiento',  view: 'maint-list' })
  if (['status-list', 'status-form'].includes(view)) breadcrumb.push({ label: 'Estado',         view: 'status-list' })

  const st = STATUS_CONFIG[vessel.status] || STATUS_CONFIG.INACTIVO

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000]" />
      <div className="fixed top-0 right-0 w-[520px] max-w-[90vw] h-screen bg-[var(--bg-surface)] border-l border-[var(--border-accent)] z-[1001] flex flex-col"
        style={{ animation: 'slideIn 0.25s ease' }}>

        {toast && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-[var(--success)] text-white px-5 py-2 rounded-lg text-[13px] font-semibold z-10">
            {toast}
          </div>
        )}

        {/* Header */}
        <div className="px-6 py-5 border-b border-[var(--border-accent)] flex-shrink-0">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              <FleetIcon tag={fleetTag(vessel.fleetType)} size={44} />
              <div>
                <div className="text-[17px] font-bold text-[var(--text-primary)]">{vessel.name}</div>
                <div className="text-[12px] text-[var(--text-secondary)]">
                  {vessel.vesselType} — {vessel.fleetType === 'PESADA' ? 'Flota Pesada' : 'Flota Liviana'}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-transparent border-none text-xl cursor-pointer px-2 py-1">✕</button>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Badge tone={st.tone} dot>{st.label}</Badge>
            {vessel.matricula && <Badge tone="accent">MAT: {vessel.matricula}</Badge>}
            {vessel.homePort  && <Badge tone="muted">{vessel.homePort}</Badge>}
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 mt-3.5 text-[12px]">
            {breadcrumb.map((b, i) => (
              <span key={b.view} className="flex items-center">
                {i > 0 && <span className="text-[var(--border-accent-strong)] mx-1">/</span>}
                <button onClick={() => navigateTo(b.view)}
                  className={`bg-transparent border-none cursor-pointer p-0 text-[12px] ${i === breadcrumb.length - 1 ? 'text-[var(--accent)] font-semibold' : 'text-[var(--text-secondary)]'}`}>
                  {b.label}
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {view === 'modules'     && <ModulesView onNavigate={navigateTo} />}
          {view === 'reports'     && <ReportsMenu onNavigate={navigateTo} />}
          {view === 'fuel-list'   && <FuelListView reports={fuelReports} loading={loadingReports} onNew={() => setView('fuel-form')} />}
          {view === 'fuel-form'   && <FuelForm vesselId={vessel.id} onSaved={() => { navigateTo('fuel-list'); showToast('Reporte de combustible guardado') }} saving={saving} setSaving={setSaving} />}
          {view === 'maint-list'  && <MaintListView reports={maintReports} loading={loadingReports} onNew={() => setView('maint-form')} />}
          {view === 'maint-form'  && <MaintForm vesselId={vessel.id} onSaved={() => { navigateTo('maint-list'); showToast('Reporte de mantenimiento guardado') }} saving={saving} setSaving={setSaving} />}
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
    { id: 'reports' as const, icon: 'RPT', label: 'Reportes',     desc: 'Combustible, mantenimiento y estado',  active: true },
    { id: 'docs'    as const, icon: 'DOC', label: 'Documentos',   desc: 'Certificados y permisos',               active: false },
    { id: 'history' as const, icon: 'HST', label: 'Historial',    desc: 'Registro de operaciones',               active: false },
    { id: 'map'     as const, icon: 'AIS', label: 'Posición AIS', desc: 'Ubicación GPS en tiempo real',          active: false },
  ]
  return (
    <div className="grid grid-cols-2 gap-3">
      {modules.map(m => (
        <Card key={m.id} padding="none"
          className={`p-5 transition-colors ${m.active ? 'cursor-pointer hover:border-[var(--border-accent-strong)]' : 'opacity-40 cursor-default'}`}
          onClick={() => m.active && onNavigate(m.id === 'reports' ? 'reports' : 'modules')}>
          <FleetIcon tag={m.icon} size={40} />
          <div className="text-[14px] font-bold text-[var(--text-primary)] mt-2.5 mb-1">{m.label}</div>
          <div className="text-[11px] text-[var(--text-secondary)]">{m.desc}</div>
          {!m.active && <div className="text-[9px] text-[var(--accent)]/40 mt-2 uppercase tracking-widest">Próximamente</div>}
        </Card>
      ))}
    </div>
  )
}

/* ─── Reports Menu ─── */
function ReportsMenu({ onNavigate }: { onNavigate: (v: DrawerView) => void }) {
  const types = [
    { view: 'fuel-list'   as const, tag: 'CMB', label: 'Reporte de Combustible',    desc: 'Nivel de combustible, consumo, operador y ubicación',         tone: 'warning' as const },
    { view: 'maint-list'  as const, tag: 'MNT', label: 'Reporte de Mantenimiento',  desc: 'Tipo de trabajo, técnico, repuestos, costos y estado',        tone: 'danger'  as const },
    { view: 'status-list' as const, tag: 'EST', label: 'Reporte de Estado',          desc: 'Ubicación, actividad, cliente, capitán, marino en guardia',  tone: 'info'    as const },
  ]
  return (
    <div className="flex flex-col gap-3">
      <div className="text-[14px] font-bold text-[var(--text-primary)] mb-1">Selecciona tipo de reporte</div>
      {types.map(t => (
        <Card key={t.view} padding="none"
          className="px-4 py-3.5 flex items-center gap-3.5 cursor-pointer hover:border-[var(--border-accent-strong)] transition-colors"
          onClick={() => onNavigate(t.view)}>
          <div className="w-[38px] h-[38px] bg-[var(--accent-dim)] border border-[var(--border-accent)] rounded-lg flex items-center justify-center text-[11px] font-bold tracking-[0.5px] flex-shrink-0"
            style={{ color: `var(--${t.tone})` }}>
            {t.tag}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-[var(--text-primary)]">{t.label}</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate">{t.desc}</div>
          </div>
          <span className="text-[var(--accent)] text-[16px]">›</span>
        </Card>
      ))}
    </div>
  )
}

/* ═══════ FUEL ═══════ */
function FuelListView({ reports, loading, onNew }: { reports: FuelReport[]; loading: boolean; onNew: () => void }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="text-[14px] font-bold text-[var(--text-primary)]">Reportes de Combustible</div>
        <Button size="sm" onClick={onNew}>+ Nuevo Reporte</Button>
      </div>
      {loading ? <LoadingState /> : reports.length === 0
        ? <EmptyState icon="local_gas_station" title="Sin reportes de combustible" description="Crea el primer reporte con el botón de arriba" />
        : reports.map(r => (
          <Card key={r.id} padding="sm" className="mb-2.5">
            <div className="flex justify-between mb-2">
              <span className="text-[13px] font-semibold text-[var(--text-primary)]">Combustible: {r.fuelLevel} {r.fuelUnit}</span>
              <span className="text-[11px] text-[var(--text-muted)] font-mono">{fmtDate(r.date)}</span>
            </div>
            <div className="flex gap-4 text-[12px] text-[var(--text-muted)]">
              {r.consumption != null && <span>Consumo: {r.consumption} {r.fuelUnit}</span>}
              {r.location && <span>Ubicación: {r.location}</span>}
              {r.operator && <span>Op: {r.operator}</span>}
            </div>
            {r.notes && <div className="text-[11px] text-[var(--text-secondary)]/50 mt-1.5">{r.notes}</div>}
          </Card>
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
    <form onSubmit={submit} className="flex flex-col gap-3.5">
      <div className="text-[14px] font-bold text-[var(--text-primary)]">Nuevo Reporte de Combustible</div>
      <FormField label="Fecha y hora">
        <Input type="datetime-local" value={form.date} onChange={e => set('date', e.target.value)} required />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Nivel de combustible">
          <Input type="number" step="0.1" value={form.fuelLevel} onChange={e => set('fuelLevel', e.target.value)} required placeholder="Ej: 2500" />
        </FormField>
        <FormField label="Unidad">
          <Select value={form.fuelUnit} onChange={e => set('fuelUnit', e.target.value)}>
            <option value="litros">Litros</option>
            <option value="galones">Galones</option>
            <option value="barriles">Barriles</option>
            <option value="%">Porcentaje %</option>
          </Select>
        </FormField>
      </div>
      <FormField label="Consumo desde último reporte">
        <Input type="number" step="0.1" value={form.consumption} onChange={e => set('consumption', e.target.value)} placeholder="Opcional" />
      </FormField>
      <FormField label="Ubicación">
        <Input value={form.location} onChange={e => set('location', e.target.value)} placeholder="Puerto o coordenadas" />
      </FormField>
      <FormField label="Operador">
        <Input value={form.operator} onChange={e => set('operator', e.target.value)} placeholder="Nombre del operador" />
      </FormField>
      <FormField label="Notas">
        <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Observaciones..." />
      </FormField>
      <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar Reporte'}</Button>
    </form>
  )
}

/* ═══════ MAINTENANCE ═══════ */
function MaintListView({ reports, loading, onNew }: { reports: MaintenanceReport[]; loading: boolean; onNew: () => void }) {
  const statusTone = (s: string) => s === 'COMPLETADO' ? 'success' : s === 'EN_PROCESO' ? 'accent' : 'warning'
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="text-[14px] font-bold text-[var(--text-primary)]">Reportes de Mantenimiento</div>
        <Button size="sm" onClick={onNew}>+ Nuevo Reporte</Button>
      </div>
      {loading ? <LoadingState /> : reports.length === 0
        ? <EmptyState icon="build" title="Sin reportes de mantenimiento" description="Crea el primer reporte con el botón de arriba" />
        : reports.map(r => (
          <Card key={r.id} padding="sm" className="mb-2.5">
            <div className="flex justify-between mb-2">
              <span className="text-[13px] font-semibold text-[var(--text-primary)]">{r.type}</span>
              <Badge tone={statusTone(r.status) as 'success' | 'accent' | 'warning'}>{r.status}</Badge>
            </div>
            <div className="text-[12px] text-[var(--text-primary)] mb-1.5">{r.description}</div>
            <div className="flex gap-4 text-[11px] text-[var(--text-secondary)]">
              <span>{fmtDate(r.date)}</span>
              {r.technician && <span>Técnico: {r.technician}</span>}
              {r.cost != null && <span>Costo: ${r.cost.toLocaleString()}</span>}
            </div>
            {r.partsReplaced && <div className="text-[11px] text-[var(--text-secondary)]/50 mt-1">Repuestos: {r.partsReplaced}</div>}
          </Card>
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
    <form onSubmit={submit} className="flex flex-col gap-3.5">
      <div className="text-[14px] font-bold text-[var(--text-primary)]">Nuevo Reporte de Mantenimiento</div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Fecha">
          <Input type="datetime-local" value={form.date} onChange={e => set('date', e.target.value)} required />
        </FormField>
        <FormField label="Tipo">
          <Select value={form.type} onChange={e => set('type', e.target.value)}>
            <option>Preventivo</option><option>Correctivo</option><option>Emergencia</option><option>Clasificacion</option>
          </Select>
        </FormField>
      </div>
      <FormField label="Descripción del trabajo">
        <Textarea value={form.description} onChange={e => set('description', e.target.value)} required rows={3} placeholder="Detalle del trabajo realizado..." />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Técnico responsable">
          <Input value={form.technician} onChange={e => set('technician', e.target.value)} placeholder="Nombre" />
        </FormField>
        <FormField label="Estado">
          <Select value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="PENDIENTE">Pendiente</option>
            <option value="EN_PROCESO">En proceso</option>
            <option value="COMPLETADO">Completado</option>
          </Select>
        </FormField>
      </div>
      <FormField label="Repuestos utilizados">
        <Input value={form.partsReplaced} onChange={e => set('partsReplaced', e.target.value)} placeholder="Lista de repuestos..." />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Costo ($)">
          <Input type="number" step="0.01" value={form.cost} onChange={e => set('cost', e.target.value)} placeholder="0.00" />
        </FormField>
        <FormField label="Próximo mantenimiento">
          <Input type="datetime-local" value={form.nextScheduled} onChange={e => set('nextScheduled', e.target.value)} />
        </FormField>
      </div>
      <FormField label="Notas">
        <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Observaciones..." />
      </FormField>
      <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar Reporte'}</Button>
    </form>
  )
}

/* ═══════ STATUS ═══════ */
function StatusListView({ reports, loading, onNew }: { reports: StatusReport[]; loading: boolean; onNew: () => void }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="text-[14px] font-bold text-[var(--text-primary)]">Reportes de Estado</div>
        <Button size="sm" onClick={onNew}>+ Nuevo Reporte</Button>
      </div>
      {loading ? <LoadingState /> : reports.length === 0
        ? <EmptyState icon="article" title="Sin reportes de estado" description="Crea el primer reporte con el botón de arriba" />
        : reports.map(r => {
          const st = STATUS_CONFIG[r.vesselStatus] || STATUS_CONFIG.INACTIVO
          return (
            <Card key={r.id} padding="sm" className="mb-2.5">
              <div className="flex justify-between mb-2">
                <span className="text-[13px] font-semibold text-[var(--text-primary)]">{r.location}</span>
                <Badge tone={st.tone} dot>{st.label}</Badge>
              </div>
              <div className="text-[12px] text-[var(--text-primary)] mb-1.5">{r.activity}</div>
              <div className="grid grid-cols-2 gap-1 text-[11px] text-[var(--text-secondary)]">
                <span>Capitán: {r.captain}</span>
                <span>Marino: {r.marineOnDuty}</span>
                {r.client && <span>Cliente: {r.client}</span>}
                {r.fuelLevel != null && <span>Combustible: {r.fuelLevel}%</span>}
              </div>
              <div className="text-[10px] text-[var(--text-muted)]/40 mt-1.5 font-mono">{fmtDate(r.date)}</div>
            </Card>
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
    <form onSubmit={submit} className="flex flex-col gap-3.5">
      <div className="text-[14px] font-bold text-[var(--text-primary)]">Nuevo Reporte de Estado</div>
      {vessel.matricula && (
        <Card padding="sm" className="flex items-center gap-2.5 border-l-[3px] border-l-[var(--accent)]">
          <span className="text-[11px] text-[var(--text-secondary)]">Matrícula:</span>
          <span className="text-[13px] font-bold text-[var(--accent)] font-mono">{vessel.matricula}</span>
          <span className="text-[10px] text-[var(--text-muted)]/40 ml-auto">Campo fijo</span>
        </Card>
      )}
      <FormField label="Fecha y hora">
        <Input type="datetime-local" value={form.date} onChange={e => set('date', e.target.value)} required />
      </FormField>
      <FormField label="Ubicación actual">
        <Input value={form.location} onChange={e => set('location', e.target.value)} required placeholder="Puerto, coordenadas o zona" />
      </FormField>
      <FormField label="Actividad que realiza">
        <Input value={form.activity} onChange={e => set('activity', e.target.value)} required placeholder="Ej: Transporte de personal a plataforma X" />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Capitán en guardia">
          <Input value={form.captain} onChange={e => set('captain', e.target.value)} required placeholder="Nombre completo" />
        </FormField>
        <FormField label="Marino en guardia">
          <Input value={form.marineOnDuty} onChange={e => set('marineOnDuty', e.target.value)} required placeholder="Nombre completo" />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Nivel de combustible (%)">
          <Input type="number" step="0.1" min="0" max="100" value={form.fuelLevel} onChange={e => set('fuelLevel', e.target.value)} placeholder="Ej: 75" />
        </FormField>
        <FormField label="Estado de la embarcación">
          <Select value={form.vesselStatus} onChange={e => set('vesselStatus', e.target.value)}>
            <option value="OPERATIVO">Operativo</option>
            <option value="EN_TRANSITO">En tránsito</option>
            <option value="ATRACADO">Atracado</option>
            <option value="MANTENIMIENTO">Mantenimiento</option>
            <option value="INACTIVO">Inactivo</option>
          </Select>
        </FormField>
      </div>
      <FormField label="Cliente">
        <Input value={form.client} onChange={e => set('client', e.target.value)} placeholder="Empresa o cliente asignado" />
      </FormField>
      <FormField label="Notas">
        <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Observaciones adicionales..." />
      </FormField>
      <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar Reporte'}</Button>
    </form>
  )
}
