'use client'

import { useEffect, useState } from 'react'

type Vessel = { id: string; name: string; fleetType: string }

function getToken() { return localStorage.getItem('token') || '' }
async function api(path: string) {
  const res = await fetch(path, { headers: { Authorization: `Bearer ${getToken()}` } })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}

const card: React.CSSProperties = { background: '#0a1628', border: '1px solid rgba(212,149,10,0.15)', borderRadius: '14px' }
const btnPrimary: React.CSSProperties = { padding: '10px 20px', background: 'linear-gradient(135deg, #D4950A, #b8820a)', border: 'none', borderRadius: '8px', color: '#060c1a', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }
const inputStyle: React.CSSProperties = { padding: '9px 12px', background: '#060c1a', border: '1px solid rgba(212,149,10,0.15)', borderRadius: '8px', color: '#e8f4fd', fontSize: '13px', outline: 'none' }

const reportTypes = [
  { id: 'fleet', icon: '🚢', title: 'Reporte de Flota', desc: 'Estado general de todas las embarcaciones, ubicacion y asignaciones', color: '#D4950A' },
  { id: 'fuel', icon: '⛽', title: 'Consumo de Combustible', desc: 'ROB por embarcacion, consumo historico, abastecimientos y costos', color: '#e67e22' },
  { id: 'maintenance', icon: '🔧', title: 'Historial de Mantenimiento', desc: 'Ordenes completadas y pendientes, costos por embarcacion y sistema', color: '#e74c3c' },
  { id: 'crew', icon: '👥', title: 'Crew List', desc: 'Listado de tripulacion por embarcacion con certificaciones vigentes', color: '#2d9cdb' },
  { id: 'compliance', icon: '📜', title: 'Estado de Compliance', desc: 'Certificados vigentes, por vencer y vencidos por embarcacion', color: '#27ae60' },
  { id: 'voyages', icon: '🗺️', title: 'Reporte de Viajes', desc: 'Viajes completados, en curso y planificados con carga y clientes', color: '#9b59b6' },
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
        <div style={{ fontSize: '22px', fontWeight: 800, color: '#e8f4fd' }}>Reportes</div>
        <div style={{ fontSize: '13px', color: '#7fa8c9', marginTop: '4px' }}>Generacion de reportes operativos del sistema</div>
      </div>

      {/* Report type selector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {reportTypes.map(r => (
          <div key={r.id} onClick={() => { setSelectedReport(r.id); setData(null) }}
            style={{ ...card, padding: '18px', cursor: 'pointer', borderLeft: `3px solid ${selectedReport === r.id ? r.color : 'transparent'}`, transition: 'all 0.2s', opacity: selectedReport && selectedReport !== r.id ? 0.5 : 1 }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(212,149,10,0.4)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = selectedReport === r.id ? r.color : 'rgba(212,149,10,0.15)')}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>{r.icon}</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#e8f4fd', marginBottom: '4px' }}>{r.title}</div>
            <div style={{ fontSize: '11px', color: '#7fa8c9' }}>{r.desc}</div>
          </div>
        ))}
      </div>

      {/* Filters + Generate */}
      {selectedReport && (
        <div style={{ ...card, padding: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '10px', color: '#7fa8c9', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Embarcacion</div>
              <select value={vesselFilter} onChange={e => setVesselFilter(e.target.value)} style={{ ...inputStyle, minWidth: '200px' }}>
                <option value="">Todas</option>
                {vessels.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#7fa8c9', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Desde</div>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#7fa8c9', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Hasta</div>
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
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#e8f4fd' }}>
              {reportTypes.find(r => r.id === selectedReport)?.title} — {Array.isArray(data) ? data.length : 0} registros
            </div>
            <button onClick={() => { const text = JSON.stringify(data, null, 2); const blob = new Blob([text], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `reporte-${selectedReport}-${new Date().toISOString().slice(0,10)}.json`; a.click() }} style={{ ...inputStyle, cursor: 'pointer', fontSize: '11px', padding: '6px 14px' }}>
              Exportar JSON
            </button>
          </div>
          {Array.isArray(data) && data.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#7fa8c9' }}>No hay datos para los filtros seleccionados</div>
          ) : (
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: 'rgba(212,149,10,0.06)' }}>
                    {data && Array.isArray(data) && data[0] && Object.keys(data[0]).filter(k => !['id','createdAt','updatedAt','vesselId','voyageId','clientId','employeeId'].includes(k)).slice(0, 8).map(k => (
                      <th key={k} style={{ padding: '10px 12px', textAlign: 'left', color: '#7fa8c9', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(212,149,10,0.1)' }}>{k.replace(/([A-Z])/g, ' $1').trim()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(data) && data.map((row: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(212,149,10,0.06)' }}>
                      {Object.entries(row).filter(([k]) => !['id','createdAt','updatedAt','vesselId','voyageId','clientId','employeeId'].includes(k)).slice(0, 8).map(([k, v]) => (
                        <td key={k} style={{ padding: '10px 12px', color: '#e8f4fd' }}>
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
