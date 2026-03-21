'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

/* ─── Types ─── */
type Vessel = { id: string; name: string; fleetType: string }
type Client = { id: string; name: string }
type Voyage = {
  id: string; vesselId: string; voyageNumber: string; origin: string; destination: string
  departureAt: string | null; arrivalAt: string | null; status: VoyageStatusKey
  cargoType: string | null; cargoTons: number | null; charterParty: string | null
  clientId: string | null; notes: string | null; createdAt: string; updatedAt: string
  vessel?: Vessel; client?: Client | null
}
type VoyageStatusKey = 'PLANIFICADO' | 'EN_CURSO' | 'COMPLETADO' | 'CANCELADO'

type FormData = {
  vesselId: string; voyageNumber: string; origin: string; destination: string
  departureAt: string; arrivalAt: string; status: VoyageStatusKey; cargoType: string
  cargoTons: string; charterParty: string; clientId: string; notes: string
}

const emptyForm: FormData = {
  vesselId: '', voyageNumber: '', origin: '', destination: '', departureAt: '', arrivalAt: '',
  status: 'PLANIFICADO', cargoType: '', cargoTons: '', charterParty: '', clientId: '', notes: '',
}

/* ─── Config ─── */
const statusConfig: Record<VoyageStatusKey, { label: string; color: string; bg: string }> = {
  PLANIFICADO: { label: 'Planificado', color: '#2d9cdb', bg: 'rgba(45,156,219,0.12)' },
  EN_CURSO:    { label: 'En Curso',    color: '#D4950A', bg: 'rgba(212,149,10,0.12)' },
  COMPLETADO:  { label: 'Completado',  color: '#27ae60', bg: 'rgba(39,174,96,0.12)' },
  CANCELADO:   { label: 'Cancelado',   color: '#e74c3c', bg: 'rgba(231,76,60,0.12)' },
}
const statusKeys: (VoyageStatusKey | 'TODOS')[] = ['TODOS', 'PLANIFICADO', 'EN_CURSO', 'COMPLETADO', 'CANCELADO']
const statusLabels: Record<string, string> = {
  TODOS: 'Todos', PLANIFICADO: 'Planificado', EN_CURSO: 'En Curso', COMPLETADO: 'Completado', CANCELADO: 'Cancelado',
}

/* ─── API helper ─── */
function getToken() { return localStorage.getItem('token') || '' }
async function api<T = any>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...opts?.headers },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `API ${res.status}`)
  }
  return res.json()
}

/* ─── Styles ─── */
const card: React.CSSProperties = { background: '#0a1628', border: '1px solid rgba(212,149,10,0.15)', borderRadius: '14px' }
const goldBorder = 'rgba(212,149,10,0.15)'
const goldBorderActive = 'rgba(212,149,10,0.5)'
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', background: '#060c1a', border: `1px solid ${goldBorder}`,
  borderRadius: '8px', color: '#e8f4fd', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
}
const selectStyle: React.CSSProperties = { ...inputStyle, appearance: 'none' as const, cursor: 'pointer' }
const btnPrimary: React.CSSProperties = {
  padding: '10px 20px', background: 'linear-gradient(135deg, #D4950A, #b8820a)', border: 'none',
  borderRadius: '8px', color: '#060c1a', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
}
const btnSecondary: React.CSSProperties = {
  padding: '8px 14px', background: 'transparent', border: `1px solid ${goldBorder}`,
  borderRadius: '8px', color: '#7fa8c9', fontSize: '12px', cursor: 'pointer',
}
const labelStyle: React.CSSProperties = { fontSize: '12px', fontWeight: 600, color: '#7fa8c9', marginBottom: '4px', display: 'block' }

/* ─── Helpers ─── */
function fmtDate(d: string | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtDateInput(d: string | null | undefined): string {
  if (!d) return ''
  return new Date(d).toISOString().slice(0, 16)
}

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════ */
export default function RoutesPage() {
  const [voyages, setVoyages] = useState<Voyage[]>([])
  const [vessels, setVessels] = useState<Vessel[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<VoyageStatusKey | 'TODOS'>('TODOS')
  const [selectedVoyage, setSelectedVoyage] = useState<Voyage | null>(null)
  const [drawerMode, setDrawerMode] = useState<'view' | 'create' | 'edit'>('view')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = useCallback((msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500) }, [])

  /* ─── Load data ─── */
  const loadVoyages = useCallback(async () => {
    try {
      const data = await api<Voyage[]>('/api/voyages')
      setVoyages(data)
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    Promise.all([
      api<Voyage[]>('/api/voyages').then(setVoyages).catch(() => {}),
      api<Vessel[]>('/api/vessels').then(v => setVessels(v.map(({ id, name, fleetType }) => ({ id, name, fleetType })))).catch(() => {}),
      api<Client[]>('/api/clients').then(setClients).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  /* ─── Filters ─── */
  const filtered = activeTab === 'TODOS' ? voyages : voyages.filter(v => v.status === activeTab)

  /* ─── KPIs ─── */
  const total = voyages.length
  const enCurso = voyages.filter(v => v.status === 'EN_CURSO').length
  const completados = voyages.filter(v => v.status === 'COMPLETADO').length
  const planificados = voyages.filter(v => v.status === 'PLANIFICADO').length

  const kpis = [
    { label: 'Total Viajes', value: total, color: '#e8f4fd', icon: '\u2693' },
    { label: 'En Curso', value: enCurso, color: '#D4950A', icon: '\u{1F6A2}' },
    { label: 'Completados', value: completados, color: '#27ae60', icon: '\u2705' },
    { label: 'Planificados', value: planificados, color: '#2d9cdb', icon: '\u{1F4CB}' },
  ]

  /* ─── Drawer actions ─── */
  function openCreate() {
    setSelectedVoyage(null)
    setDrawerMode('create')
    setDrawerOpen(true)
  }
  function openView(v: Voyage) {
    setSelectedVoyage(v)
    setDrawerMode('view')
    setDrawerOpen(true)
  }
  function openEdit() {
    setDrawerMode('edit')
  }
  function closeDrawer() {
    setDrawerOpen(false)
    setSelectedVoyage(null)
  }

  async function handleSave(data: FormData) {
    try {
      if (drawerMode === 'create') {
        await api('/api/voyages', { method: 'POST', body: JSON.stringify(data) })
        showToast('Viaje creado exitosamente')
      } else if (drawerMode === 'edit' && selectedVoyage) {
        await api(`/api/voyages/${selectedVoyage.id}`, { method: 'PUT', body: JSON.stringify(data) })
        showToast('Viaje actualizado exitosamente')
      }
      await loadVoyages()
      closeDrawer()
    } catch (err: any) {
      showToast(`Error: ${err.message}`)
    }
  }

  /* ─── Loading state ─── */
  if (loading) {
    return (
      <div style={{ color: '#7fa8c9', padding: '60px', textAlign: 'center', fontSize: '14px' }}>
        Cargando viajes...
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', minHeight: '100%' }}>
      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 9999, padding: '12px 24px',
          background: '#0a1628', border: '1px solid rgba(212,149,10,0.4)', borderRadius: '10px',
          color: '#e8f4fd', fontSize: '13px', fontWeight: 600, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          animation: 'fadeIn 0.3s ease',
        }}>
          {toast}
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#e8f4fd' }}>Rutas & Viajes</div>
          <div style={{ fontSize: '13px', color: '#7fa8c9', marginTop: '4px' }}>
            Gesti\u00f3n de viajes y operaciones mar\u00edtimas — {total} viajes registrados
          </div>
        </div>
        <button onClick={openCreate} style={btnPrimary}>+ Nuevo Viaje</button>
      </div>

      {/* ── KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {kpis.map(kpi => (
          <div key={kpi.label} style={{ ...card, padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#7fa8c9', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  {kpi.label}
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
              </div>
              <div style={{
                width: '42px', height: '42px', background: 'rgba(212,149,10,0.08)',
                border: '1px solid rgba(212,149,10,0.15)', borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
              }}>
                {kpi.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter Tabs ── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {statusKeys.map(key => {
          const active = activeTab === key
          const count = key === 'TODOS' ? total : voyages.filter(v => v.status === key).length
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                border: `1px solid ${active ? goldBorderActive : goldBorder}`,
                background: active ? 'rgba(212,149,10,0.12)' : 'transparent',
                color: active ? '#D4950A' : '#7fa8c9',
                transition: 'all 0.2s ease',
              }}
            >
              {statusLabels[key]} ({count})
            </button>
          )
        })}
      </div>

      {/* ── Table ── */}
      <div style={{ ...card, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${goldBorder}` }}>
                {['N\u00b0 Viaje', 'Embarcaci\u00f3n', 'Ruta', 'Carga', 'Cliente', 'Estado', 'Salida', 'Llegada'].map(h => (
                  <th key={h} style={{
                    padding: '14px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700,
                    color: '#7fa8c9', textTransform: 'uppercase', letterSpacing: '0.5px',
                    whiteSpace: 'nowrap',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#7fa8c9' }}>
                    No se encontraron viajes{activeTab !== 'TODOS' ? ` con estado "${statusLabels[activeTab]}"` : ''}
                  </td>
                </tr>
              ) : (
                filtered.map(voyage => {
                  const st = statusConfig[voyage.status] || statusConfig.PLANIFICADO
                  return (
                    <tr
                      key={voyage.id}
                      onClick={() => openView(voyage)}
                      style={{ borderBottom: `1px solid ${goldBorder}`, cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,149,10,0.04)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                    >
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#D4950A', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                        {voyage.voyageNumber}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#e8f4fd', whiteSpace: 'nowrap' }}>
                        {voyage.vessel?.name || '—'}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#e8f4fd', whiteSpace: 'nowrap' }}>
                        <span>{voyage.origin}</span>
                        <span style={{ color: '#D4950A', margin: '0 6px' }}>\u2192</span>
                        <span>{voyage.destination}</span>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#7fa8c9', whiteSpace: 'nowrap' }}>
                        {voyage.cargoType ? `${voyage.cargoType}${voyage.cargoTons ? ` \u00b7 ${voyage.cargoTons.toLocaleString()} t` : ''}` : '—'}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#e8f4fd', whiteSpace: 'nowrap' }}>
                        {voyage.client?.name || '—'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          fontSize: '11px', fontWeight: 600, color: st.color, background: st.bg,
                          padding: '4px 10px', borderRadius: '20px', whiteSpace: 'nowrap',
                        }}>
                          {st.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#7fa8c9', whiteSpace: 'nowrap', fontSize: '12px' }}>
                        {fmtDate(voyage.departureAt)}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#7fa8c9', whiteSpace: 'nowrap', fontSize: '12px' }}>
                        {fmtDate(voyage.arrivalAt)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Drawer ── */}
      {drawerOpen && (
        <VoyageDrawer
          voyage={selectedVoyage}
          mode={drawerMode}
          vessels={vessels}
          clients={clients}
          onClose={closeDrawer}
          onSave={handleSave}
          onEdit={openEdit}
        />
      )}

      {/* ── Keyframes injected once ── */}
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   DRAWER COMPONENT
   ═══════════════════════════════════════════════════════ */
function VoyageDrawer({ voyage, mode, vessels, clients, onClose, onSave, onEdit }: {
  voyage: Voyage | null
  mode: 'view' | 'create' | 'edit'
  vessels: Vessel[]
  clients: Client[]
  onClose: () => void
  onSave: (data: FormData) => Promise<void>
  onEdit: () => void
}) {
  const [form, setForm] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (mode === 'edit' && voyage) {
      setForm({
        vesselId: voyage.vesselId, voyageNumber: voyage.voyageNumber,
        origin: voyage.origin, destination: voyage.destination,
        departureAt: fmtDateInput(voyage.departureAt), arrivalAt: fmtDateInput(voyage.arrivalAt),
        status: voyage.status, cargoType: voyage.cargoType || '', cargoTons: voyage.cargoTons?.toString() || '',
        charterParty: voyage.charterParty || '', clientId: voyage.clientId || '', notes: voyage.notes || '',
      })
    } else if (mode === 'create') {
      setForm(emptyForm)
    }
  }, [mode, voyage])

  function update(field: keyof FormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === backdropRef.current) onClose()
  }

  const isForm = mode === 'create' || mode === 'edit'
  const title = mode === 'create' ? 'Nuevo Viaje' : mode === 'edit' ? 'Editar Viaje' : 'Detalle del Viaje'

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        display: 'flex', justifyContent: 'flex-end',
      }}
    >
      <div style={{
        width: '520px', maxWidth: '100vw', height: '100%', background: '#0a1628',
        borderLeft: `1px solid ${goldBorder}`, display: 'flex', flexDirection: 'column',
        animation: 'slideIn 0.3s ease', boxShadow: '-8px 0 40px rgba(0,0,0,0.4)',
        overflowY: 'auto',
      }}>
        {/* Drawer Header */}
        <div style={{
          padding: '20px 24px', borderBottom: `1px solid ${goldBorder}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, background: '#0a1628', zIndex: 2,
        }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#e8f4fd' }}>{title}</div>
            {voyage && mode === 'view' && (
              <div style={{ fontSize: '12px', color: '#D4950A', fontFamily: 'monospace', marginTop: '2px' }}>
                {voyage.voyageNumber}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {mode === 'view' && (
              <button onClick={onEdit} style={btnSecondary}>Editar</button>
            )}
            <button onClick={onClose} style={{
              width: '32px', height: '32px', borderRadius: '8px', border: `1px solid ${goldBorder}`,
              background: 'transparent', color: '#7fa8c9', fontSize: '18px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              \u00d7
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div style={{ padding: '24px', flex: 1 }}>
          {isForm ? (
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Vessel */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Embarcaci\u00f3n *</label>
                  <select
                    value={form.vesselId}
                    onChange={e => update('vesselId', e.target.value)}
                    required
                    style={selectStyle}
                  >
                    <option value="">Seleccionar embarcaci\u00f3n...</option>
                    {vessels.map(v => (
                      <option key={v.id} value={v.id}>{v.name} ({v.fleetType})</option>
                    ))}
                  </select>
                </div>

                {/* Voyage Number */}
                <div>
                  <label style={labelStyle}>N\u00b0 de Viaje *</label>
                  <input
                    value={form.voyageNumber}
                    onChange={e => update('voyageNumber', e.target.value)}
                    placeholder="VYG-2026-001"
                    required
                    style={inputStyle}
                    readOnly={mode === 'edit'}
                  />
                </div>

                {/* Status */}
                <div>
                  <label style={labelStyle}>Estado</label>
                  <select value={form.status} onChange={e => update('status', e.target.value)} style={selectStyle}>
                    {(['PLANIFICADO', 'EN_CURSO', 'COMPLETADO', 'CANCELADO'] as VoyageStatusKey[]).map(s => (
                      <option key={s} value={s}>{statusConfig[s].label}</option>
                    ))}
                  </select>
                </div>

                {/* Origin */}
                <div>
                  <label style={labelStyle}>Origen *</label>
                  <input
                    value={form.origin}
                    onChange={e => update('origin', e.target.value)}
                    placeholder="Puerto de origen"
                    required
                    style={inputStyle}
                  />
                </div>

                {/* Destination */}
                <div>
                  <label style={labelStyle}>Destino *</label>
                  <input
                    value={form.destination}
                    onChange={e => update('destination', e.target.value)}
                    placeholder="Puerto de destino"
                    required
                    style={inputStyle}
                  />
                </div>

                {/* Departure */}
                <div>
                  <label style={labelStyle}>Fecha de Salida</label>
                  <input
                    type="datetime-local"
                    value={form.departureAt}
                    onChange={e => update('departureAt', e.target.value)}
                    style={inputStyle}
                  />
                </div>

                {/* Arrival */}
                <div>
                  <label style={labelStyle}>Fecha de Llegada</label>
                  <input
                    type="datetime-local"
                    value={form.arrivalAt}
                    onChange={e => update('arrivalAt', e.target.value)}
                    style={inputStyle}
                  />
                </div>

                {/* Cargo Type */}
                <div>
                  <label style={labelStyle}>Tipo de Carga</label>
                  <input
                    value={form.cargoType}
                    onChange={e => update('cargoType', e.target.value)}
                    placeholder="Ej: Crudo, Gasolina"
                    style={inputStyle}
                  />
                </div>

                {/* Cargo Tons */}
                <div>
                  <label style={labelStyle}>Tonelaje</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.cargoTons}
                    onChange={e => update('cargoTons', e.target.value)}
                    placeholder="0.00"
                    style={inputStyle}
                  />
                </div>

                {/* Client */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Cliente</label>
                  <select value={form.clientId} onChange={e => update('clientId', e.target.value)} style={selectStyle}>
                    <option value="">Sin cliente asignado</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Charter Party */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Charter Party</label>
                  <input
                    value={form.charterParty}
                    onChange={e => update('charterParty', e.target.value)}
                    placeholder="Referencia del contrato"
                    style={inputStyle}
                  />
                </div>

                {/* Notes */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Notas</label>
                  <textarea
                    value={form.notes}
                    onChange={e => update('notes', e.target.value)}
                    rows={3}
                    placeholder="Observaciones adicionales..."
                    style={{ ...inputStyle, resize: 'vertical' as const }}
                  />
                </div>
              </div>

              {/* Form actions */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '24px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={onClose} style={btnSecondary}>Cancelar</button>
                <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Guardando...' : mode === 'create' ? 'Crear Viaje' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          ) : voyage ? (
            <VoyageDetail voyage={voyage} />
          ) : null}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   VOYAGE DETAIL (view mode)
   ═══════════════════════════════════════════════════════ */
function VoyageDetail({ voyage }: { voyage: Voyage }) {
  const st = statusConfig[voyage.status] || statusConfig.PLANIFICADO

  const sections: { title: string; rows: { label: string; value: React.ReactNode }[] }[] = [
    {
      title: 'Informaci\u00f3n General',
      rows: [
        { label: 'N\u00b0 de Viaje', value: <span style={{ fontFamily: 'monospace', color: '#D4950A', fontWeight: 700 }}>{voyage.voyageNumber}</span> },
        {
          label: 'Estado',
          value: (
            <span style={{ fontSize: '11px', fontWeight: 600, color: st.color, background: st.bg, padding: '4px 10px', borderRadius: '20px' }}>
              {st.label}
            </span>
          ),
        },
        { label: 'Embarcaci\u00f3n', value: voyage.vessel?.name || '—' },
      ],
    },
    {
      title: 'Ruta',
      rows: [
        { label: 'Origen', value: voyage.origin },
        { label: 'Destino', value: voyage.destination },
        { label: 'Fecha de Salida', value: fmtDate(voyage.departureAt) },
        { label: 'Fecha de Llegada', value: fmtDate(voyage.arrivalAt) },
      ],
    },
    {
      title: 'Carga & Cliente',
      rows: [
        { label: 'Tipo de Carga', value: voyage.cargoType || '—' },
        { label: 'Tonelaje', value: voyage.cargoTons ? `${voyage.cargoTons.toLocaleString()} t` : '—' },
        { label: 'Cliente', value: voyage.client?.name || '—' },
        { label: 'Charter Party', value: voyage.charterParty || '—' },
      ],
    },
  ]

  if (voyage.notes) {
    sections.push({
      title: 'Notas',
      rows: [{ label: '', value: voyage.notes }],
    })
  }

  sections.push({
    title: 'Registro',
    rows: [
      { label: 'Creado', value: fmtDate(voyage.createdAt) },
      { label: '\u00daltima actualizaci\u00f3n', value: fmtDate(voyage.updatedAt) },
    ],
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {sections.map(section => (
        <div key={section.title}>
          <div style={{
            fontSize: '11px', fontWeight: 700, color: '#D4950A', textTransform: 'uppercase',
            letterSpacing: '0.8px', marginBottom: '12px', paddingBottom: '8px',
            borderBottom: `1px solid ${goldBorder}`,
          }}>
            {section.title}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {section.rows.map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {row.label && (
                  <span style={{ fontSize: '13px', color: '#7fa8c9' }}>{row.label}</span>
                )}
                <span style={{ fontSize: '13px', color: '#e8f4fd', textAlign: 'right', maxWidth: row.label ? '60%' : '100%', wordBreak: 'break-word' }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
