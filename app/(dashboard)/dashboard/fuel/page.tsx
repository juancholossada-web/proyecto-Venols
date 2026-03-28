'use client'

import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api-client'

/* ─── Types ─── */
type Vessel = { id: string; name: string; fleetType: string; fuelStockLiters: number }
type FuelLog = {
  id: string
  vesselId: string
  vessel: { id: string; name: string; fuelStockLiters: number }
  type: string
  liters: number
  balanceAfter: number
  date: string
  source: string | null
  fuelType: string
  operationAt: string
  price: number | null
  supplier: string | null
  bdn: string | null
  reportedBy: string | null
  notes: string | null
  createdAt: string
}

/* ─── Config ─── */
const FLEET_CFG = {
  PESADA:  { label: 'Flota Pesada',  short: 'FP', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  LIVIANA: { label: 'Flota Liviana', short: 'FL', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
}

const TYPE_CFG = {
  SURTIDO: { label: 'Surtido',  color: '#10B981', bg: 'rgba(16,185,129,0.12)', icon: '⬆' },
  CONSUMO: { label: 'Consumo',  color: '#e74c3c', bg: 'rgba(231,76,60,0.12)',  icon: '⬇' },
  AJUSTE:  { label: 'Ajuste',   color: '#d4950a', bg: 'rgba(212,149,10,0.12)', icon: '⚙' },
}

/* ─── Styles ─── */
const card: React.CSSProperties = { background: 'var(--bg-surface)', border: '1px solid var(--border-accent)', borderRadius: '12px' }
const goldBorder = 'var(--border-accent)'
const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-accent)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }
const btnPrimary: React.CSSProperties = { padding: '10px 20px', background: 'var(--accent)', border: 'none', borderRadius: '8px', color: '#080E1A', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }
const btnSecondary: React.CSSProperties = { padding: '10px 20px', background: 'transparent', border: '1px solid var(--border-accent)', borderRadius: '8px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }
const btnDanger: React.CSSProperties = { ...btnSecondary, borderColor: 'rgba(231,76,60,0.4)', color: '#e74c3c' }
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtDatetime(d: string) {
  return new Date(d).toLocaleString('es-VE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function fmtL(n: number | null | undefined) {
  if (n == null) return '—'
  return n.toLocaleString('es-VE', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' L'
}

/* ═══════════════════════ MAIN PAGE ═══════════════════════ */
export default function FuelPage() {
  const [logs, setLogs]         = useState<FuelLog[]>([])
  const [vessels, setVessels]   = useState<Vessel[]>([])
  const [loading, setLoading]   = useState(true)
  const [userRole, setUserRole] = useState('STANDARD')

  const [drawerOpen, setDrawerOpen]         = useState(false)
  const [drawerMode, setDrawerMode]         = useState<'new' | 'detail'>('new')
  const [selectedLog, setSelectedLog]       = useState<FuelLog | null>(null)
  const [activeVesselId, setActiveVesselId] = useState<string | null>(null)
  const [preVesselId, setPreVesselId]       = useState<string>('')
  const [toast, setToast]   = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const emptyForm = { vesselId: '', type: 'SURTIDO', liters: '', date: new Date().toISOString().slice(0, 10), operationAt: '', supplier: '', bdn: '', price: '', reportedBy: '', notes: '' }
  const [form, setForm] = useState(emptyForm)

  const showToast = (msg: string, err = false) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user')
      if (stored) setUserRole(JSON.parse(stored).role || 'STANDARD')
    } catch {}
  }, [])

  const loadData = useCallback(async () => {
    try {
      const [fuelLogs, vesselList] = await Promise.all([
        api('/api/fuel-logs'),
        api('/api/vessels'),
      ])
      setLogs(fuelLogs)
      setVessels(vesselList)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  /* ─── Filtrar por rol ─── */
  const visibleVessels = vessels.filter(v => {
    if (userRole === 'OPERATOR_HEAVY') return v.fleetType === 'PESADA'
    if (userRole === 'OPERATOR_LIGHT') return v.fleetType === 'LIVIANA'
    return true
  })

  function logsForVessel(vesselId: string) {
    return logs.filter(l => l.vesselId === vesselId).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }

  /* ─── Drawer ─── */
  function openNew(vesselId = '') {
    setPreVesselId(vesselId)
    setForm({ ...emptyForm, vesselId })
    setDrawerMode('new')
    setDrawerOpen(true)
    setSelectedLog(null)
  }
  function openDetail(log: FuelLog) {
    setSelectedLog(log)
    setDrawerMode('detail')
    setDrawerOpen(true)
  }
  function closeDrawer() { setDrawerOpen(false); setSelectedLog(null) }

  async function handleSubmit() {
    if (!form.vesselId || !form.liters || !form.date) {
      showToast('Completa: embarcación, litros y fecha')
      return
    }
    setSaving(true)
    try {
      await api('/api/fuel-logs', {
        method: 'POST',
        body: JSON.stringify({
          vesselId:    form.vesselId,
          type:        form.type,
          liters:      parseFloat(form.liters),
          date:        form.date,
          operationAt: form.operationAt || '',
          supplier:    form.supplier || null,
          bdn:         form.bdn || null,
          price:       form.price ? parseFloat(form.price) : null,
          reportedBy:  form.reportedBy || null,
          notes:       form.notes || null,
          source:      'MANUAL',
        }),
      })
      showToast(form.type === 'SURTIDO' ? 'Surtido registrado — stock actualizado' : 'Consumo registrado — stock actualizado')
      closeDrawer()
      setLoading(true)
      await loadData()
    } catch { showToast('Error al guardar') }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este registro? El stock del buque se revertirá.')) return
    setDeleting(true)
    try {
      await api(`/api/fuel-logs/${id}`, { method: 'DELETE' })
      showToast('Registro eliminado')
      closeDrawer()
      setLoading(true)
      await loadData()
    } catch { showToast('Error al eliminar') }
    setDeleting(false)
  }

  if (loading) return <div style={{ color: 'var(--text-muted)', padding: '40px', textAlign: 'center' }}>Cargando...</div>

  return (
    <div style={{ position: 'relative' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', background: 'var(--success)', color: 'white', padding: '12px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, zIndex: 2000, boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>Control de Combustible</h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
            Existencias, consumos y surtidos por embarcación · {visibleVessels.length} unidades
          </p>
        </div>
      </div>

      {/* Vessel rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {visibleVessels.map(vessel => {
          const vLogs   = logsForVessel(vessel.id)
          const fleet   = FLEET_CFG[vessel.fleetType as keyof typeof FLEET_CFG]
          const isOpen  = activeVesselId === vessel.id
          const lastConsumo = vLogs.find(l => l.type === 'CONSUMO')
          const lastSurtido = vLogs.find(l => l.type === 'SURTIDO')
          const stock   = vessel.fuelStockLiters ?? 0
          const capacity = (vessels.find(v => v.id === vessel.id) as any)?.tankCapacityLiters
          const stockPct = capacity ? Math.min(100, Math.round((stock / capacity) * 100)) : null
          const stockColor = stockPct == null ? 'var(--accent)' : stockPct > 50 ? 'var(--success)' : stockPct > 20 ? 'var(--warning)' : 'var(--danger)'

          return (
            <div key={vessel.id} style={{ ...card, overflow: 'hidden' }}>
              {/* Row header */}
              <div
                onClick={() => setActiveVesselId(isOpen ? null : vessel.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,149,10,0.04)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Fleet badge */}
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: fleet?.bg, border: `1px solid ${fleet?.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: fleet?.color, flexShrink: 0 }}>
                  {fleet?.short ?? '—'}
                </div>

                {/* Name + fleet */}
                <div style={{ minWidth: '150px', flexShrink: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{vessel.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{fleet?.label}</div>
                </div>

                {/* Metrics */}
                <div style={{ display: 'flex', gap: '28px', flex: 1, flexWrap: 'wrap', alignItems: 'center' }}>

                  {/* Existencia MGO */}
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>Existencia MGO</div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: stockColor }}>
                      {fmtL(stock)}
                      {stockPct != null && <span style={{ fontSize: '11px', fontWeight: 600, marginLeft: '6px', opacity: 0.8 }}>({stockPct}%)</span>}
                    </div>
                  </div>

                  {/* Último Consumo */}
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>Último Consumo</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: lastConsumo ? 'var(--danger)' : 'var(--text-muted)' }}>
                      {lastConsumo ? `−${fmtL(lastConsumo.liters)}` : '—'}
                    </div>
                    {lastConsumo && <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>{fmtDate(lastConsumo.date)}</div>}
                  </div>

                  {/* Último Surtido */}
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>Último Surtido</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: lastSurtido ? 'var(--success)' : 'var(--text-muted)' }}>
                      {lastSurtido ? `+${fmtL(lastSurtido.liters)}` : '—'}
                    </div>
                    {lastSurtido && <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>{fmtDate(lastSurtido.date)}</div>}
                  </div>

                  {/* Total movimientos */}
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>Movimientos</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{vLogs.length}</div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <button onClick={e => { e.stopPropagation(); openNew(vessel.id) }} style={{ ...btnPrimary, padding: '7px 14px', fontSize: '12px' }}>
                    + Movimiento
                  </button>
                  <span style={{ color: 'var(--text-muted)', fontSize: '16px', transition: 'transform 0.2s', display: 'inline-block', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
                </div>
              </div>

              {/* Expandable ledger */}
              {isOpen && (
                <div style={{ borderTop: `1px solid ${goldBorder}` }}>
                  {vLogs.length === 0 ? (
                    <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                      Sin movimientos registrados para esta embarcación
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ background: 'rgba(212,149,10,0.04)' }}>
                            {['Fecha', 'Tipo', 'Litros', 'Existencia Tras Movimiento', 'Proveedor / Fuente', 'Ubicación', 'Notas'].map(h => (
                              <th key={h} style={{ textAlign: 'left', padding: '10px 16px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `1px solid ${goldBorder}`, whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {vLogs.map(log => {
                            const tc = TYPE_CFG[log.type as keyof typeof TYPE_CFG] ?? TYPE_CFG.AJUSTE
                            return (
                              <tr key={log.id} onClick={() => openDetail(log)} style={{ borderBottom: `1px solid rgba(212,149,10,0.06)`, cursor: 'pointer' }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,149,10,0.04)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                              >
                                <td style={{ padding: '10px 16px', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{fmtDate(log.date)}</td>
                                <td style={{ padding: '10px 16px' }}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, color: tc.color, background: tc.bg }}>
                                    {tc.icon} {tc.label}
                                  </span>
                                </td>
                                <td style={{ padding: '10px 16px', fontWeight: 700, color: tc.color, fontVariantNumeric: 'tabular-nums' }}>
                                  {log.type === 'CONSUMO' ? '−' : '+'}{fmtL(log.liters)}
                                </td>
                                <td style={{ padding: '10px 16px', color: 'var(--accent)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                                  {fmtL(log.balanceAfter)}
                                </td>
                                <td style={{ padding: '10px 16px', color: 'var(--text-muted)', fontSize: '12px' }}>
                                  {log.supplier || log.source || '—'}
                                </td>
                                <td style={{ padding: '10px 16px', color: 'var(--text-muted)', fontSize: '12px' }}>{log.operationAt || '—'}</td>
                                <td style={{ padding: '10px 16px', color: 'var(--text-muted)', fontSize: '12px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.notes || '—'}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ─── Drawer ─── */}
      {drawerOpen && (
        <>
          <div onClick={closeDrawer} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '500px', maxWidth: '100vw', background: 'var(--bg-surface)', borderLeft: `1px solid ${goldBorder}`, zIndex: 1001, overflowY: 'auto', padding: '28px', boxShadow: '-8px 0 40px rgba(0,0,0,0.5)' }}>
            <button onClick={closeDrawer} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>✕</button>

            {drawerMode === 'detail' && selectedLog && (
              <DetailView log={selectedLog} onDelete={handleDelete} deleting={deleting} />
            )}
            {drawerMode === 'new' && (
              <FormView
                form={form}
                vessels={visibleVessels}
                saving={saving}
                onChange={(k, v) => setForm(f => ({ ...f, [k]: v }))}
                onSubmit={handleSubmit}
                onCancel={closeDrawer}
              />
            )}
          </div>
        </>
      )}
    </div>
  )
}

/* ═══════════════════════ DETAIL VIEW ═══════════════════════ */
function DetailView({ log, onDelete, deleting }: { log: FuelLog; onDelete: (id: string) => void; deleting: boolean }) {
  const tc = TYPE_CFG[log.type as keyof typeof TYPE_CFG] ?? TYPE_CFG.AJUSTE
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: tc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
          {tc.icon}
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
            {tc.label} de Combustible
          </h2>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>{log.vessel.name} · {fmtDatetime(log.date)}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        <InfoCard label="Litros" value={`${log.type === 'CONSUMO' ? '−' : '+'}${fmtL(log.liters)}`} color={tc.color} />
        <InfoCard label="Existencia Tras Movimiento" value={fmtL(log.balanceAfter)} color="var(--accent)" />
        <InfoCard label="Fecha" value={fmtDate(log.date)} />
        <InfoCard label="Tipo de Combustible" value={log.fuelType} />
        {log.operationAt && <InfoCard label="Ubicación" value={log.operationAt} />}
        {log.supplier    && <InfoCard label="Proveedor" value={log.supplier} />}
        {log.bdn         && <InfoCard label="BDN" value={log.bdn} />}
        {log.price       && <InfoCard label="Precio (USD/L)" value={`$${log.price}`} />}
        {log.reportedBy  && <InfoCard label="Reportado por" value={log.reportedBy} />}
        <InfoCard label="Fuente" value={log.source || 'MANUAL'} />
      </div>

      {log.notes && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-accent)', borderRadius: '10px', padding: '14px', marginBottom: '20px' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>Notas</div>
          <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6 }}>{log.notes}</div>
        </div>
      )}

      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '20px' }}>
        Registrado: {fmtDatetime(log.createdAt)}
      </div>

      <button onClick={() => onDelete(log.id)} disabled={deleting} style={{ ...btnDanger, opacity: deleting ? 0.5 : 1 }}>
        {deleting ? 'Eliminando...' : 'Eliminar registro'}
      </button>
    </div>
  )
}

/* ═══════════════════════ FORM VIEW ═══════════════════════ */
function FormView({ form, vessels, saving, onChange, onSubmit, onCancel }: {
  form: Record<string, string>
  vessels: Vessel[]
  saving: boolean
  onChange: (k: string, v: string) => void
  onSubmit: () => void
  onCancel: () => void
}) {
  const isSurtido = form.type === 'SURTIDO'
  const selectedVessel = vessels.find(v => v.id === form.vesselId)

  return (
    <div>
      <h2 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
        Nuevo Movimiento de Combustible
      </h2>
      {selectedVessel && (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
          Existencia actual: <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{fmtL(selectedVessel.fuelStockLiters)}</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* Tipo */}
        <div>
          <label style={labelStyle}>Tipo de Movimiento *</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {(['SURTIDO', 'CONSUMO', 'AJUSTE'] as const).map(t => {
              const tc = TYPE_CFG[t]
              const active = form.type === t
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => onChange('type', t)}
                  style={{ padding: '10px 8px', borderRadius: '8px', border: `1px solid ${active ? tc.color : 'var(--border-accent)'}`, background: active ? tc.bg : 'transparent', color: active ? tc.color : 'var(--text-secondary)', fontWeight: active ? 700 : 500, fontSize: '12px', cursor: 'pointer', transition: 'all 0.15s' }}
                >
                  {tc.icon} {tc.label}
                </button>
              )
            })}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
            {form.type === 'SURTIDO' && '↑ Se sumará al stock actual del buque'}
            {form.type === 'CONSUMO' && '↓ Se restará del stock actual del buque'}
            {form.type === 'AJUSTE'  && '⚙ Establece el nuevo stock exacto (corrección)'}
          </div>
        </div>

        {/* Embarcacion */}
        <div>
          <label style={labelStyle}>Embarcación *</label>
          <select value={form.vesselId} onChange={e => onChange('vesselId', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="">Seleccionar embarcación</option>
            {vessels.map(v => <option key={v.id} value={v.id}>{v.name} · Existencia: {fmtL(v.fuelStockLiters)}</option>)}
          </select>
        </div>

        {/* Litros + Fecha */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>
              {form.type === 'AJUSTE' ? 'Nuevo stock (litros) *' : 'Litros *'}
            </label>
            <input type="number" step="1" min="0" value={form.liters} onChange={e => onChange('liters', e.target.value)} placeholder="0" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Fecha *</label>
            <input type="date" value={form.date} onChange={e => onChange('date', e.target.value)} style={inputStyle} />
          </div>
        </div>

        {/* Ubicación */}
        <div>
          <label style={labelStyle}>Ubicación / Puerto</label>
          <input type="text" value={form.operationAt} onChange={e => onChange('operationAt', e.target.value)} placeholder="Ej: Puerto La Cruz, Muelle Norte" style={inputStyle} />
        </div>

        {/* Campos extra para SURTIDO */}
        {isSurtido && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Proveedor</label>
                <input type="text" value={form.supplier} onChange={e => onChange('supplier', e.target.value)} placeholder="Nombre del proveedor" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>BDN (Bunker Delivery Note)</label>
                <input type="text" value={form.bdn} onChange={e => onChange('bdn', e.target.value)} placeholder="Número de BDN" style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Precio (USD/litro)</label>
              <input type="number" step="0.0001" value={form.price} onChange={e => onChange('price', e.target.value)} placeholder="0.0000" style={inputStyle} />
            </div>
          </>
        )}

        {/* Reportado por */}
        <div>
          <label style={labelStyle}>Reportado por</label>
          <input type="text" value={form.reportedBy} onChange={e => onChange('reportedBy', e.target.value)} placeholder="Nombre del responsable" style={inputStyle} />
        </div>

        {/* Notas */}
        <div>
          <label style={labelStyle}>Notas</label>
          <textarea value={form.notes} onChange={e => onChange('notes', e.target.value)} placeholder="Observaciones adicionales..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }} onClick={onSubmit} disabled={saving}>
            {saving ? 'Guardando...' : 'Registrar Movimiento'}
          </button>
          <button style={btnSecondary} onClick={onCancel}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}

/* ─── Shared ─── */
function InfoCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-accent)', borderRadius: '8px', padding: '12px' }}>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '14px', fontWeight: 700, color: color || 'var(--text-primary)' }}>{value}</div>
    </div>
  )
}
