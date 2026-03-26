'use client'

import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api-client'

/* ─── Types ─── */
type Vessel = { id: string; name: string }
type FuelLog = {
  id: string
  vesselId: string
  vessel: { id: string; name: string }
  voyage?: { id: string; voyageNumber: string } | null
  date: string
  fuelType: string
  operationAt: string
  bunkerReceived: number | null
  consumed: number | null
  rob: number
  price: number | null
  supplier: string | null
  bdn: string | null
  reportedBy: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

type DrawerMode = 'detail' | 'new'

const FUEL_TYPES = ['HFO', 'IFO380', 'VLSFO', 'MDO', 'MGO', 'LSMGO'] as const


/* ─── Styles ─── */
const card: React.CSSProperties = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-accent)',
  borderRadius: '12px',
}
const goldBorder = 'var(--border-accent)'
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  background: 'var(--bg-input)',
  border: '1px solid var(--border-accent)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box',
}
const btnPrimary: React.CSSProperties = {
  padding: '10px 20px',
  background: 'var(--accent)',
  border: 'none',
  borderRadius: '8px',
  color: '#080E1A',
  fontWeight: 700,
  fontSize: '13px',
  cursor: 'pointer',
}
const btnSecondary: React.CSSProperties = {
  padding: '10px 20px',
  background: 'transparent',
  border: '1px solid var(--border-accent)',
  borderRadius: '8px',
  color: 'var(--text-secondary)',
  fontWeight: 600,
  fontSize: '13px',
  cursor: 'pointer',
}
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  color: 'var(--text-muted)',
  marginBottom: '4px',
  fontWeight: 600,
}

/* ─── Fuel type badge colors ─── */
const fuelColors: Record<string, { color: string; bg: string }> = {
  HFO:    { color: 'var(--danger)', bg: 'rgba(231,76,60,0.12)' },
  IFO380: { color: 'var(--warning)', bg: 'rgba(230,126,34,0.12)' },
  VLSFO:  { color: 'var(--info)', bg: 'var(--info-dim)' },
  MDO:    { color: 'var(--success)', bg: 'rgba(39,174,96,0.12)' },
  MGO:    { color: 'var(--accent)', bg: 'rgba(212,149,10,0.12)' },
  LSMGO:  { color: '#9b59b6', bg: 'rgba(155,89,182,0.12)' },
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtNum(n: number | null | undefined, decimals = 2) {
  if (n == null) return '—'
  return n.toLocaleString('es-VE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

/* ═══════════════════════ MAIN PAGE ═══════════════════════ */
export default function FuelPage() {
  const [logs, setLogs] = useState<FuelLog[]>([])
  const [vessels, setVessels] = useState<Vessel[]>([])
  const [loading, setLoading] = useState(true)
  const [vesselFilter, setVesselFilter] = useState('')
  const [selectedLog, setSelectedLog] = useState<FuelLog | null>(null)
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('detail')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [saving, setSaving] = useState(false)

  // Form state
  const emptyForm = {
    vesselId: '', date: '', fuelType: 'MGO', operationAt: '', bunkerReceived: '',
    consumed: '', rob: '', price: '', supplier: '', bdn: '', notes: '',
  }
  const [form, setForm] = useState(emptyForm)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  const loadData = useCallback(async () => {
    try {
      const [fuelLogs, vesselList] = await Promise.all([
        api(`/api/fuel-logs${vesselFilter ? `?vesselId=${vesselFilter}` : ''}`),
        api('/api/vessels'),
      ])
      setLogs(fuelLogs)
      setVessels(vesselList)
    } catch {
      /* silent */
    }
    setLoading(false)
  }, [vesselFilter])

  useEffect(() => { loadData() }, [loadData])

  /* ─── KPIs ─── */
  const totalRegistros = logs.length
  const avgRob = logs.length > 0
    ? logs.reduce((sum, l) => sum + l.rob, 0) / logs.length
    : 0
  const lastBunker = logs.find(l => l.bunkerReceived && l.bunkerReceived > 0)
  const maxConsumo = logs.reduce<FuelLog | null>((max, l) => {
    if (l.consumed == null) return max
    if (!max || (max.consumed ?? 0) < l.consumed) return l
    return max
  }, null)

  /* ─── Drawer ─── */
  function openDetail(log: FuelLog) {
    setSelectedLog(log)
    setDrawerMode('detail')
    setDrawerOpen(true)
  }
  function openNew() {
    setSelectedLog(null)
    setForm(emptyForm)
    setDrawerMode('new')
    setDrawerOpen(true)
  }
  function closeDrawer() {
    setDrawerOpen(false)
    setSelectedLog(null)
  }
  function handleFormChange(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit() {
    if (!form.vesselId || !form.date || !form.rob || !form.operationAt) {
      showToast('Completa los campos obligatorios: embarcacion, fecha, ubicacion y ROB')
      return
    }
    setSaving(true)
    try {
      await api('/api/fuel-logs', {
        method: 'POST',
        body: JSON.stringify({
          vesselId: form.vesselId,
          date: form.date,
          fuelType: form.fuelType,
          operationAt: form.operationAt,
          bunkerReceived: form.bunkerReceived || null,
          consumed: form.consumed || null,
          rob: form.rob,
          price: form.price || null,
          supplier: form.supplier || null,
          bdn: form.bdn || null,
          notes: form.notes || null,
        }),
      })
      showToast('Registro de combustible creado exitosamente')
      closeDrawer()
      setLoading(true)
      await loadData()
    } catch {
      showToast('Error al crear registro')
    }
    setSaving(false)
  }

  /* ─── Render ─── */
  if (loading) {
    return (
      <div style={{ color: 'var(--text-muted)', padding: '40px', textAlign: 'center' }}>
        Cargando registros de combustible...
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', background: 'var(--success)',
          color: 'white', padding: '12px 24px', borderRadius: '8px', fontSize: '13px',
          fontWeight: 600, zIndex: 2000, boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Control de Combustible
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
            Gestion de consumo, abastecimiento y ROB de la flota
          </p>
        </div>
        <button style={btnPrimary} onClick={openNew}>+ Nuevo Registro</button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {/* Total Registros */}
        <div style={{ ...card, padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px' }}>
            TOTAL REGISTROS
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent)' }}>
            {totalRegistros}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            registros en el sistema
          </div>
        </div>

        {/* ROB Promedio */}
        <div style={{ ...card, padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px' }}>
            ROB PROMEDIO FLOTA
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>
            {fmtNum(avgRob, 1)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            toneladas metricas
          </div>
        </div>

        {/* Ultimo Abastecimiento */}
        <div style={{ ...card, padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px' }}>
            ULTIMO ABASTECIMIENTO
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--success)' }}>
            {lastBunker ? fmtNum(lastBunker.bunkerReceived) + ' MT' : '—'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {lastBunker ? `${lastBunker.vessel.name} - ${fmtDate(lastBunker.date)}` : 'Sin abastecimientos'}
          </div>
        </div>

        {/* Mayor Consumo */}
        <div style={{ ...card, padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px' }}>
            MAYOR CONSUMO
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--danger)' }}>
            {maxConsumo ? fmtNum(maxConsumo.consumed) + ' MT' : '—'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {maxConsumo ? `${maxConsumo.vessel.name} - ${maxConsumo.fuelType}` : 'Sin datos de consumo'}
          </div>
        </div>
      </div>

      {/* Filter */}
      <div style={{ ...card, padding: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Filtrar por embarcacion:</span>
        <select
          value={vesselFilter}
          onChange={e => { setVesselFilter(e.target.value); setLoading(true) }}
          style={{
            ...inputStyle,
            width: '260px',
            cursor: 'pointer',
          }}
        >
          <option value="">Todas las embarcaciones</option>
          {vessels.map(v => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
        <div style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-muted)' }}>
          Mostrando {logs.length} registro{logs.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Table */}
      <div style={{ ...card, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${goldBorder}` }}>
                {['Fecha', 'Embarcacion', 'Tipo Combustible', 'ROB (MT)', 'Consumido (MT)', 'Recibido (MT)', 'Proveedor', 'Ubicacion'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '14px 16px', color: 'var(--text-muted)',
                    fontWeight: 700, fontSize: '11px', textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No se encontraron registros de combustible
                  </td>
                </tr>
              ) : (
                logs.map(log => {
                  const fc = fuelColors[log.fuelType] || { color: 'var(--text-muted)', bg: 'rgba(127,168,201,0.12)' }
                  return (
                    <tr
                      key={log.id}
                      onClick={() => openDetail(log)}
                      style={{
                        borderBottom: `1px solid rgba(212,149,10,0.07)`,
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,149,10,0.04)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '12px 16px', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                        {fmtDate(log.date)}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontWeight: 600 }}>
                        {log.vessel.name}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-block', padding: '3px 10px', borderRadius: '6px',
                          fontSize: '11px', fontWeight: 700, color: fc.color, background: fc.bg,
                        }}>
                          {log.fuelType}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--accent)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                        {fmtNum(log.rob)}
                      </td>
                      <td style={{ padding: '12px 16px', color: log.consumed ? 'var(--danger)' : 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                        {fmtNum(log.consumed)}
                      </td>
                      <td style={{ padding: '12px 16px', color: log.bunkerReceived ? 'var(--success)' : 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                        {fmtNum(log.bunkerReceived)}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                        {log.supplier || '—'}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                        {log.operationAt}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Drawer ─── */}
      {drawerOpen && (
        <>
          {/* Overlay */}
          <div
            onClick={closeDrawer}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
              zIndex: 1000, backdropFilter: 'blur(4px)',
            }}
          />
          {/* Panel */}
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: '520px', maxWidth: '100vw',
            background: 'var(--bg-surface)', borderLeft: `1px solid ${goldBorder}`,
            zIndex: 1001, overflowY: 'auto', padding: '28px',
            boxShadow: '-8px 0 40px rgba(0,0,0,0.5)',
          }}>
            {/* Close */}
            <button
              onClick={closeDrawer}
              style={{
                position: 'absolute', top: '16px', right: '16px', background: 'none',
                border: 'none', color: 'var(--text-muted)', fontSize: '22px', cursor: 'pointer',
                lineHeight: 1, padding: '4px',
              }}
            >
              x
            </button>

            {drawerMode === 'detail' && selectedLog && <DetailView log={selectedLog} />}
            {drawerMode === 'new' && (
              <FormView
                form={form}
                vessels={vessels}
                saving={saving}
                onChange={handleFormChange}
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
function DetailView({ log }: { log: FuelLog }) {
  const fc = fuelColors[log.fuelType] || { color: 'var(--text-muted)', bg: 'rgba(127,168,201,0.12)' }

  const fields: { label: string; value: string | number | null; color?: string }[] = [
    { label: 'Embarcacion', value: log.vessel.name },
    { label: 'Fecha', value: fmtDate(log.date) },
    { label: 'Tipo Combustible', value: log.fuelType },
    { label: 'Ubicacion', value: log.operationAt },
    { label: 'ROB (MT)', value: fmtNum(log.rob), color: 'var(--accent)' },
    { label: 'Consumido (MT)', value: fmtNum(log.consumed), color: 'var(--danger)' },
    { label: 'Recibido (MT)', value: fmtNum(log.bunkerReceived), color: 'var(--success)' },
    { label: 'Precio (USD/MT)', value: log.price ? fmtNum(log.price) : '—' },
    { label: 'Proveedor', value: log.supplier || '—' },
    { label: 'BDN', value: log.bdn || '—' },
    { label: 'Viaje', value: log.voyage?.voyageNumber || '—' },
    { label: 'Reportado por', value: log.reportedBy || '—' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{
          width: '42px', height: '42px', borderRadius: '10px',
          background: fc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px',
        }}>
          <span role="img" aria-label="fuel">&#9981;</span>
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Detalle de Registro
          </h2>
          <span style={{
            display: 'inline-block', marginTop: '4px', padding: '2px 10px', borderRadius: '6px',
            fontSize: '11px', fontWeight: 700, color: fc.color, background: fc.bg,
          }}>
            {log.fuelType}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {fields.map(f => (
          <div key={f.label} style={{
            ...card, padding: '14px',
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>
              {f.label}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: f.color || 'var(--text-primary)' }}>
              {f.value}
            </div>
          </div>
        ))}
      </div>

      {log.notes && (
        <div style={{ ...card, padding: '14px', marginTop: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase' }}>
            Notas
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
            {log.notes}
          </div>
        </div>
      )}

      <div style={{ marginTop: '16px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right' }}>
        Creado: {fmtDate(log.createdAt)} | Actualizado: {fmtDate(log.updatedAt)}
      </div>
    </div>
  )
}

/* ═══════════════════════ FORM VIEW ═══════════════════════ */
function FormView({ form, vessels, saving, onChange, onSubmit, onCancel }: {
  form: Record<string, string>
  vessels: Vessel[]
  saving: boolean
  onChange: (field: string, value: string) => void
  onSubmit: () => void
  onCancel: () => void
}) {
  return (
    <div>
      <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
        Nuevo Registro de Combustible
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Vessel */}
        <div>
          <label style={labelStyle}>Embarcacion *</label>
          <select
            value={form.vesselId}
            onChange={e => onChange('vesselId', e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            <option value="">Seleccionar embarcacion</option>
            {vessels.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>

        {/* Date + FuelType row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Fecha *</label>
            <input
              type="date"
              value={form.date}
              onChange={e => onChange('date', e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Tipo Combustible</label>
            <select
              value={form.fuelType}
              onChange={e => onChange('fuelType', e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              {FUEL_TYPES.map(ft => (
                <option key={ft} value={ft}>{ft}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Operation At */}
        <div>
          <label style={labelStyle}>Ubicacion / Puerto *</label>
          <input
            type="text"
            value={form.operationAt}
            onChange={e => onChange('operationAt', e.target.value)}
            placeholder="Ej: Puerto La Cruz, Muelle Norte"
            style={inputStyle}
          />
        </div>

        {/* ROB + Consumed + Received */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label style={labelStyle}>ROB (MT) *</label>
            <input
              type="number"
              step="0.01"
              value={form.rob}
              onChange={e => onChange('rob', e.target.value)}
              placeholder="0.00"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Consumido (MT)</label>
            <input
              type="number"
              step="0.01"
              value={form.consumed}
              onChange={e => onChange('consumed', e.target.value)}
              placeholder="0.00"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Recibido (MT)</label>
            <input
              type="number"
              step="0.01"
              value={form.bunkerReceived}
              onChange={e => onChange('bunkerReceived', e.target.value)}
              placeholder="0.00"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Price + Supplier */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Precio (USD/MT)</label>
            <input
              type="number"
              step="0.01"
              value={form.price}
              onChange={e => onChange('price', e.target.value)}
              placeholder="0.00"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Proveedor</label>
            <input
              type="text"
              value={form.supplier}
              onChange={e => onChange('supplier', e.target.value)}
              placeholder="Nombre del proveedor"
              style={inputStyle}
            />
          </div>
        </div>

        {/* BDN */}
        <div>
          <label style={labelStyle}>BDN (Bunker Delivery Note)</label>
          <input
            type="text"
            value={form.bdn}
            onChange={e => onChange('bdn', e.target.value)}
            placeholder="Numero de BDN"
            style={inputStyle}
          />
        </div>

        {/* Notes */}
        <div>
          <label style={labelStyle}>Notas</label>
          <textarea
            value={form.notes}
            onChange={e => onChange('notes', e.target.value)}
            placeholder="Observaciones adicionales..."
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button style={btnPrimary} onClick={onSubmit} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar Registro'}
          </button>
          <button style={btnSecondary} onClick={onCancel}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}
