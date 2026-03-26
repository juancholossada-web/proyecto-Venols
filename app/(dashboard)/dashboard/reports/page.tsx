'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api-client'

type Vessel = { id: string; name: string; fleetType: string }

const card: React.CSSProperties = { background: 'var(--bg-surface)', border: '1px solid var(--border-accent)', borderRadius: '12px' }
const btnPrimary: React.CSSProperties = { padding: '10px 20px', background: 'var(--accent)', border: 'none', borderRadius: '8px', color: '#080E1A', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }
const inputStyle: React.CSSProperties = { padding: '9px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-accent)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }

const reportTypes = [
  { id: 'fleet',       tag: 'FLT', title: 'Reporte de Flota',           desc: 'Estado general de todas las embarcaciones, ubicacion y asignaciones', color: 'var(--accent)' },
  { id: 'fuel',        tag: 'CMB', title: 'Consumo de Combustible',      desc: 'ROB por embarcacion, consumo historico, abastecimientos y costos',    color: 'var(--warning)' },
  { id: 'maintenance', tag: 'MNT', title: 'Historial de Mantenimiento',  desc: 'Ordenes completadas y pendientes, costos por embarcacion y sistema',  color: 'var(--danger)' },
  { id: 'crew',        tag: 'TRP', title: 'Crew List',                   desc: 'Listado de tripulacion por embarcacion con certificaciones vigentes',  color: 'var(--info)' },
  { id: 'compliance',  tag: 'CMP', title: 'Estado de Compliance',        desc: 'Certificados vigentes, por vencer y vencidos por embarcacion',        color: 'var(--success)' },
  { id: 'voyages',     tag: 'VJE', title: 'Reporte de Viajes',           desc: 'Viajes completados, en curso y planificados con carga y clientes',    color: '#7B5EA7' },
]

export default function ReportsPage() {
  const [vessels, setVessels] = useState<Vessel[]>([])
  const [selectedReport, setSelectedReport] = useState<string | null>(null)
  const [vesselFilter, setVesselFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { api('/api/vessels').then(setVessels).catch(() => {}) }, [])

  async function generateReport() {
    if (!selectedReport) return
    setLoading(true); setData(null)
    try {
      const endpoints: Record<string, string> = {
        fleet: '/api/vessels', fuel: '/api/fuel-logs', maintenance: '/api/maintenance-orders',
        crew: '/api/crew', compliance: '/api/compliance', voyages: '/api/voyages',
      }
      const url = endpoints[selectedReport] + (vesselFilter ? `?vesselId=${vesselFilter}` : '')
      const result = await api(url)
      setData(result)
    } catch { setData([]) }
    setLoading(false)
  }

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Reportes</div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Generacion de reportes operativos del sistema</div>
      </div>

      {/* Report type selector */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5 mb-6">
        {reportTypes.map(r => (
          <div key={r.id} onClick={() => { setSelectedReport(r.id); setData(null) }}
            style={{ ...card, padding: '18px', cursor: 'pointer', borderLeft: `3px solid ${selectedReport === r.id ? r.color : 'transparent'}`, transition: 'all 0.2s', opacity: selectedReport && selectedReport !== r.id ? 0.5 : 1 }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-accent-strong)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = selectedReport === r.id ? r.color : 'var(--border-accent)')}>
            <div style={{ width: '38px', height: '38px', background: 'var(--accent-dim)', border: '1px solid var(--border-accent)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: r.color, letterSpacing: '0.5px', marginBottom: '12px' }}>{r.tag}</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{r.title}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{r.desc}</div>
          </div>
        ))}
      </div>

      {/* Filters + Generate */}
      {selectedReport && (
        <div style={{ ...card, padding: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Embarcacion</div>
              <select value={vesselFilter} onChange={e => setVesselFilter(e.target.value)} style={{ ...inputStyle, minWidth: '200px' }}>
                <option value="">Todas</option>
                {vessels.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Desde</div>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Hasta</div>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputStyle} />
            </div>
            <button onClick={generateReport} disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Generando...' : 'Generar Reporte'}
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {data && (
        <div style={{ ...card, padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {reportTypes.find(r => r.id === selectedReport)?.title} — {Array.isArray(data) ? data.length : 0} registros
            </div>
            <button onClick={() => { const text = JSON.stringify(data, null, 2); const blob = new Blob([text], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `reporte-${selectedReport}-${new Date().toISOString().slice(0,10)}.json`; a.click() }} style={{ ...inputStyle, cursor: 'pointer', fontSize: '11px', padding: '6px 14px' }}>
              Exportar JSON
            </button>
          </div>
          {Array.isArray(data) && data.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No hay datos para los filtros seleccionados</div>
          ) : (
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: 'rgba(212,149,10,0.06)' }}>
                    {data && Array.isArray(data) && data[0] && Object.keys(data[0]).filter(k => !['id','createdAt','updatedAt','vesselId','voyageId','clientId','employeeId'].includes(k)).slice(0, 8).map(k => (
                      <th key={k} style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(212,149,10,0.1)' }}>{k.replace(/([A-Z])/g, ' $1').trim()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(data) && data.map((row: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(212,149,10,0.06)' }}>
                      {Object.entries(row).filter(([k]) => !['id','createdAt','updatedAt','vesselId','voyageId','clientId','employeeId'].includes(k)).slice(0, 8).map(([k, v]) => (
                        <td key={k} style={{ padding: '10px 12px', color: 'var(--text-primary)' }}>
                          {typeof v === 'object' && v !== null ? (v as any).name || JSON.stringify(v) : String(v ?? '-')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
