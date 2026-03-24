'use client'

import { useEffect, useState, useCallback } from 'react'

/* ─── Types ─── */
type Vessel = { id: string; name: string }

type ComplianceDoc = {
  id: string
  vesselId: string | null
  vessel: { id: string; name: string } | null
  type: string
  name: string
  documentNumber: string | null
  issuedBy: string
  issuedAt: string
  expiresAt: string
  fileUrl: string | null
  status: string
  notes: string | null
  createdAt: string
  updatedAt: string
}

type DocForm = {
  vesselId: string
  type: string
  name: string
  documentNumber: string
  issuedBy: string
  issuedAt: string
  expiresAt: string
  notes: string
}

const DOC_TYPES = ['MARPOL', 'ISM_SMC', 'ISPS', 'CLASS', 'PANDI', 'IOPP', 'SOPEP', 'COF'] as const

const DOC_TYPE_LABELS: Record<string, string> = {
  MARPOL: 'MARPOL',
  ISM_SMC: 'ISM / SMC',
  ISPS: 'ISPS',
  CLASS: 'Clase',
  PANDI: 'P&I',
  IOPP: 'IOPP',
  SOPEP: 'SOPEP',
  COF: 'COF',
}

const DOC_TYPE_COLORS: Record<string, { color: string; bg: string }> = {
  MARPOL:  { color: 'var(--info)', bg: 'rgba(52,152,219,0.12)' },
  ISM_SMC: { color: '#9b59b6', bg: 'rgba(155,89,182,0.12)' },
  ISPS:    { color: 'var(--warning)', bg: 'rgba(230,126,34,0.12)' },
  CLASS:   { color: 'var(--success)', bg: 'rgba(26,188,156,0.12)' },
  PANDI:   { color: 'var(--success)', bg: 'rgba(46,204,113,0.12)' },
  IOPP:    { color: 'var(--danger)', bg: 'rgba(231,76,60,0.12)' },
  SOPEP:   { color: 'var(--warning)', bg: 'rgba(243,156,18,0.12)' },
  COF:     { color: 'var(--accent)', bg: 'rgba(212,149,10,0.12)' },
}

const emptyForm: DocForm = {
  vesselId: '', type: 'MARPOL', name: '', documentNumber: '', issuedBy: '', issuedAt: '', expiresAt: '', notes: '',
}

/* ─── API helper ─── */
function getToken() { return localStorage.getItem('token') || '' }
async function api(path: string, opts?: RequestInit) {
  const res = await fetch(path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...opts?.headers },
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}

/* ─── Styles ─── */
const cardStyle: React.CSSProperties = {
  background: 'var(--bg-surface)', border: '1px solid var(--border-accent)', borderRadius: '12px', padding: '20px',
}
const goldBorder = 'var(--border-accent)'
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-accent)',
  borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
}
const selectStyle: React.CSSProperties = { ...inputStyle, appearance: 'none' as const, cursor: 'pointer' }
const btnPrimary: React.CSSProperties = {
  padding: '10px 20px', background: 'var(--accent)', border: 'none',
  borderRadius: '8px', color: '#080E1A', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
}
const btnSecondary: React.CSSProperties = {
  padding: '8px 14px', background: 'transparent', border: '1px solid var(--border-accent)',
  borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer',
}
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px', fontWeight: 600 }

/* ─── Helpers ─── */
function daysUntil(dateStr: string): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function expirationColor(days: number): { color: string; bg: string; label: string } {
  if (days < 0) return { color: 'var(--danger)', bg: 'rgba(255,71,87,0.15)', label: 'Vencido' }
  if (days <= 30) return { color: 'var(--danger)', bg: 'rgba(255,107,107,0.12)', label: `${days}d` }
  if (days <= 90) return { color: 'var(--warning)', bg: 'rgba(255,165,2,0.12)', label: `${days}d` }
  return { color: 'var(--success)', bg: 'rgba(46,213,115,0.12)', label: `${days}d` }
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })
}

/* ═══════════════════════ MAIN PAGE ═══════════════════════ */
export default function CompliancePage() {
  const [docs, setDocs] = useState<ComplianceDoc[]>([])
  const [vessels, setVessels] = useState<Vessel[]>([])
  const [loading, setLoading] = useState(true)
  const [filterVessel, setFilterVessel] = useState('')
  const [filterType, setFilterType] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<DocForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<ComplianceDoc | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [docsData, vesselsData] = await Promise.all([api('/api/compliance'), api('/api/vessels')])
      setDocs(docsData)
      setVessels(
        vesselsData.map((v: { id: string; name: string }) => ({ id: v.id, name: v.name }))
      )
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  /* ─── Computed ─── */
  const filtered = docs.filter(d => {
    if (filterVessel && d.vesselId !== filterVessel) return false
    if (filterType && d.type !== filterType) return false
    return true
  })

  const total = filtered.length
  const vigentes = filtered.filter(d => daysUntil(d.expiresAt) > 30).length
  const porVencer = filtered.filter(d => { const dd = daysUntil(d.expiresAt); return dd >= 0 && dd <= 30 }).length
  const vencidos = filtered.filter(d => daysUntil(d.expiresAt) < 0).length

  // Group by vessel
  const grouped: Record<string, { vesselName: string; docs: ComplianceDoc[] }> = {}
  for (const d of filtered) {
    const key = d.vesselId || '__none__'
    if (!grouped[key]) grouped[key] = { vesselName: d.vessel?.name || 'Sin embarcacion', docs: [] }
    grouped[key].docs.push(d)
  }

  /* ─── Form handlers ─── */
  function openNewForm() {
    setForm(emptyForm)
    setShowForm(true)
    setSelectedDoc(null)
  }
  function closeForm() { setShowForm(false) }
  function closeDetail() { setSelectedDoc(null) }

  function updateForm(field: keyof DocForm, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.vesselId || !form.name || !form.issuedBy || !form.issuedAt || !form.expiresAt) return
    setSaving(true)
    try {
      await api('/api/compliance', {
        method: 'POST',
        body: JSON.stringify({
          vesselId: form.vesselId,
          type: form.type,
          name: form.name,
          documentNumber: form.documentNumber || null,
          issuedBy: form.issuedBy,
          issuedAt: form.issuedAt,
          expiresAt: form.expiresAt,
          notes: form.notes || null,
        }),
      })
      setShowForm(false)
      setForm(emptyForm)
      setLoading(true)
      fetchData()
    } catch {
      alert('Error al guardar documento')
    } finally {
      setSaving(false)
    }
  }

  /* ─── Render ─── */
  if (loading) {
    return (
      <div style={{ color: 'var(--text-muted)', padding: '40px', textAlign: 'center', fontSize: '14px' }}>
        Cargando documentos de compliance...
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Compliance y Documentacion</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Gestion de documentos regulatorios maritimos — MARPOL, ISM, ISPS y mas
          </div>
        </div>
        <button onClick={openNewForm} style={btnPrimary}>+ Nuevo Documento</button>
      </div>

      {/* ── Expiration Alerts ── */}
      {(porVencer > 0 || vencidos > 0) && (
        <div style={{
          ...cardStyle,
          borderColor: vencidos > 0 ? 'rgba(255,71,87,0.4)' : 'rgba(255,165,2,0.3)',
          background: vencidos > 0 ? 'rgba(255,71,87,0.06)' : 'rgba(255,165,2,0.06)',
          marginBottom: '20px', padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: '14px',
        }}>
          <span style={{ fontSize: '22px' }}>{vencidos > 0 ? '\u26A0' : '\u23F0'}</span>
          <div>
            {vencidos > 0 && (
              <div style={{ color: 'var(--danger)', fontSize: '13px', fontWeight: 700 }}>
                {vencidos} documento{vencidos !== 1 ? 's' : ''} vencido{vencidos !== 1 ? 's' : ''} — requiere atencion inmediata
              </div>
            )}
            {porVencer > 0 && (
              <div style={{ color: 'var(--warning)', fontSize: '13px', fontWeight: 600, marginTop: vencidos > 0 ? '4px' : 0 }}>
                {porVencer} documento{porVencer !== 1 ? 's' : ''} por vencer en los proximos 30 dias
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Documentos', value: total, color: 'var(--accent)' },
          { label: 'Vigentes', value: vigentes, color: 'var(--success)' },
          { label: 'Por Vencer (30d)', value: porVencer, color: 'var(--warning)' },
          { label: 'Vencidos', value: vencidos, color: 'var(--danger)' },
        ].map(kpi => (
          <div key={kpi.label} style={{ ...cardStyle, borderTop: `2px solid ${kpi.color}` }}>
            <div style={{ fontSize: '26px', fontWeight: 700, color: kpi.color, marginBottom: '4px' }}>{kpi.value}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center' }}>
        <div>
          <select
            value={filterVessel}
            onChange={e => setFilterVessel(e.target.value)}
            style={{ ...selectStyle, width: '220px' }}
          >
            <option value="">Todas las embarcaciones</option>
            {vessels.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            style={{ ...selectStyle, width: '180px' }}
          >
            <option value="">Todos los tipos</option>
            {DOC_TYPES.map(t => (
              <option key={t} value={t}>{DOC_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>
        {(filterVessel || filterType) && (
          <button onClick={() => { setFilterVessel(''); setFilterType('') }} style={{ ...btnSecondary, fontSize: '11px' }}>
            Limpiar filtros
          </button>
        )}
        <div style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-muted)' }}>
          {filtered.length} documento{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* ── Table grouped by vessel ── */}
      {Object.keys(grouped).length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.5 }}>{'\uD83D\uDCC2'}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No se encontraron documentos de compliance</div>
          <button onClick={openNewForm} style={{ ...btnPrimary, marginTop: '16px' }}>+ Agregar primer documento</button>
        </div>
      ) : (
        Object.entries(grouped).map(([vesselId, group]) => (
          <div key={vesselId} style={{ marginBottom: '24px' }}>
            {/* Vessel group header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', paddingLeft: '4px',
            }}>
              <div style={{ width: '22px', height: '22px', background: 'var(--accent-dim)', border: '1px solid var(--border-accent)', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>VE</div>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{group.vesselName}</span>
              <span style={{
                fontSize: '11px', color: 'var(--text-muted)', background: 'rgba(127,168,201,0.1)',
                padding: '2px 8px', borderRadius: '10px',
              }}>
                {group.docs.length} doc{group.docs.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Table */}
            <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${goldBorder}` }}>
                    {['Documento', 'Tipo', 'No. Documento', 'Emitido por', 'Emision', 'Vencimiento', 'Estado'].map(h => (
                      <th key={h} style={{
                        padding: '12px 14px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '11px',
                        fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {group.docs.map(doc => {
                    const days = daysUntil(doc.expiresAt)
                    const exp = expirationColor(days)
                    const typeConf = DOC_TYPE_COLORS[doc.type] || { color: 'var(--text-muted)', bg: 'rgba(127,168,201,0.1)' }
                    return (
                      <tr
                        key={doc.id}
                        onClick={() => setSelectedDoc(doc)}
                        style={{
                          borderBottom: `1px solid rgba(212,149,10,0.07)`, cursor: 'pointer',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,149,10,0.04)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '11px 14px', color: 'var(--text-primary)', fontWeight: 600 }}>{doc.name}</td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{
                            display: 'inline-block', padding: '3px 10px', borderRadius: '6px', fontSize: '11px',
                            fontWeight: 700, color: typeConf.color, background: typeConf.bg,
                          }}>
                            {DOC_TYPE_LABELS[doc.type] || doc.type}
                          </span>
                        </td>
                        <td style={{ padding: '11px 14px', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '12px' }}>
                          {doc.documentNumber || '—'}
                        </td>
                        <td style={{ padding: '11px 14px', color: 'var(--text-muted)' }}>{doc.issuedBy}</td>
                        <td style={{ padding: '11px 14px', color: 'var(--text-muted)', fontSize: '12px' }}>{fmtDate(doc.issuedAt)}</td>
                        <td style={{ padding: '11px 14px', color: 'var(--text-muted)', fontSize: '12px' }}>{fmtDate(doc.expiresAt)}</td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px',
                            borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                            color: exp.color, background: exp.bg,
                          }}>
                            <span style={{
                              width: '7px', height: '7px', borderRadius: '50%', background: exp.color,
                              boxShadow: days < 0 ? `0 0 6px ${exp.color}` : 'none',
                            }} />
                            {exp.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {/* ═══ Detail Drawer ═══ */}
      {selectedDoc && (
        <div
          onClick={closeDetail}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, width: '480px',
              background: 'var(--bg-elevated)', borderLeft: '1px solid rgba(212,149,10,0.2)',
              overflowY: 'auto', padding: '28px',
            }}
          >
            {/* Drawer header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>Detalle de Documento</div>
              <button onClick={closeDetail} style={{
                background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer',
              }}>{'\u2715'}</button>
            </div>

            {/* Expiration banner in drawer */}
            {(() => {
              const days = daysUntil(selectedDoc.expiresAt)
              const exp = expirationColor(days)
              return (
                <div style={{
                  padding: '12px 16px', borderRadius: '10px', marginBottom: '20px',
                  background: exp.bg, border: `1px solid ${exp.color}30`,
                  display: 'flex', alignItems: 'center', gap: '10px',
                }}>
                  <span style={{
                    width: '10px', height: '10px', borderRadius: '50%', background: exp.color,
                    boxShadow: days < 0 ? `0 0 8px ${exp.color}` : 'none',
                  }} />
                  <span style={{ color: exp.color, fontWeight: 700, fontSize: '14px' }}>
                    {days < 0 ? `Vencido hace ${Math.abs(days)} dias` : days === 0 ? 'Vence hoy' : `Vence en ${days} dias`}
                  </span>
                </div>
              )
            })()}

            {/* Document info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { label: 'Nombre', value: selectedDoc.name },
                { label: 'Tipo', value: DOC_TYPE_LABELS[selectedDoc.type] || selectedDoc.type, isBadge: true },
                { label: 'Embarcacion', value: selectedDoc.vessel?.name || 'Sin asignar' },
                { label: 'No. Documento', value: selectedDoc.documentNumber || '—' },
                { label: 'Emitido por', value: selectedDoc.issuedBy },
                { label: 'Fecha de Emision', value: fmtDate(selectedDoc.issuedAt) },
                { label: 'Fecha de Vencimiento', value: fmtDate(selectedDoc.expiresAt) },
                { label: 'Estado', value: selectedDoc.status },
                { label: 'Notas', value: selectedDoc.notes || 'Sin notas' },
              ].map(row => (
                <div key={row.label} style={{
                  padding: '12px 16px', background: 'var(--bg-input)', borderRadius: '10px',
                  border: `1px solid ${goldBorder}`,
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase' }}>
                    {row.label}
                  </div>
                  {row.isBadge ? (
                    <span style={{
                      display: 'inline-block', padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700,
                      color: (DOC_TYPE_COLORS[selectedDoc.type] || { color: 'var(--text-muted)' }).color,
                      background: (DOC_TYPE_COLORS[selectedDoc.type] || { bg: 'rgba(127,168,201,0.1)' }).bg,
                    }}>
                      {row.value}
                    </span>
                  ) : (
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{row.value}</div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginTop: '24px', display: 'flex', gap: '10px' }}>
              <button onClick={closeDetail} style={btnSecondary}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ New Document Form Drawer ═══ */}
      {showForm && (
        <div
          onClick={closeForm}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, width: '500px',
              background: 'var(--bg-elevated)', borderLeft: '1px solid rgba(212,149,10,0.2)',
              overflowY: 'auto', padding: '28px',
            }}
          >
            {/* Form header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>Nuevo Documento</div>
              <button onClick={closeForm} style={{
                background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer',
              }}>{'\u2715'}</button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Vessel */}
              <div>
                <label style={labelStyle}>Embarcacion *</label>
                <select
                  value={form.vesselId}
                  onChange={e => updateForm('vesselId', e.target.value)}
                  style={selectStyle}
                  required
                >
                  <option value="">Seleccionar embarcacion...</option>
                  {vessels.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>

              {/* Type */}
              <div>
                <label style={labelStyle}>Tipo de Documento *</label>
                <select
                  value={form.type}
                  onChange={e => updateForm('type', e.target.value)}
                  style={selectStyle}
                  required
                >
                  {DOC_TYPES.map(t => <option key={t} value={t}>{DOC_TYPE_LABELS[t]}</option>)}
                </select>
              </div>

              {/* Name */}
              <div>
                <label style={labelStyle}>Nombre del Documento *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => updateForm('name', e.target.value)}
                  placeholder="Ej: Certificado MARPOL Anexo I"
                  style={inputStyle}
                  required
                />
              </div>

              {/* Document Number */}
              <div>
                <label style={labelStyle}>Numero de Documento</label>
                <input
                  type="text"
                  value={form.documentNumber}
                  onChange={e => updateForm('documentNumber', e.target.value)}
                  placeholder="Ej: MAR-2026-001"
                  style={inputStyle}
                />
              </div>

              {/* Issued By */}
              <div>
                <label style={labelStyle}>Emitido por *</label>
                <input
                  type="text"
                  value={form.issuedBy}
                  onChange={e => updateForm('issuedBy', e.target.value)}
                  placeholder="Ej: Lloyd's Register, INEA, DNV"
                  style={inputStyle}
                  required
                />
              </div>

              {/* Dates row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Fecha de Emision *</label>
                  <input
                    type="date"
                    value={form.issuedAt}
                    onChange={e => updateForm('issuedAt', e.target.value)}
                    style={{ ...inputStyle, colorScheme: 'dark' }}
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Fecha de Vencimiento *</label>
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={e => updateForm('expiresAt', e.target.value)}
                    style={{ ...inputStyle, colorScheme: 'dark' }}
                    required
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={labelStyle}>Notas</label>
                <textarea
                  value={form.notes}
                  onChange={e => updateForm('notes', e.target.value)}
                  placeholder="Observaciones adicionales..."
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' as const }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="submit" disabled={saving} style={{
                  ...btnPrimary, opacity: saving ? 0.6 : 1, flex: 1,
                }}>
                  {saving ? 'Guardando...' : 'Guardar Documento'}
                </button>
                <button type="button" onClick={closeForm} style={btnSecondary}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
