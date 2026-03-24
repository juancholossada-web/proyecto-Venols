'use client'

import { useEffect, useState, useCallback } from 'react'

/* ─── Types ─── */
type Vessel = {
  id: string; name: string; fleetType: 'PESADA' | 'LIVIANA'; vesselType: string
  status: string; matricula?: string; captain?: string; marineOnDuty?: string
  tankCapacityLiters?: number
}
type VesselReport = {
  vesselId: string; vesselName: string; fleetType: 'PESADA' | 'LIVIANA'; vesselType: string
  client: string; status: string; activity: string; captain: string; marineOnDuty: string
  additionalCrew: string; fuelLiters: string; fuelPercent: string; location: string; notes: string
}
type DailyReport = {
  id: string; vesselId: string; date: string; client?: string; vesselStatus: string
  activity: string; captain: string; marineOnDuty: string; additionalCrew?: string
  fuelLiters?: number; fuelPercent?: number; location?: string; notes?: string
  vessel?: { name: string; fleetType: string; vesselType: string }
}

type View = 'crear' | 'historial'

/* ─── Config ─── */
const statusOptions = [
  { value: 'OPERATIVO', label: 'Operativo' },
  { value: 'EN_TRANSITO', label: 'En tránsito' },
  { value: 'ATRACADO', label: 'Atracado' },
  { value: 'MANTENIMIENTO', label: 'Mantenimiento' },
  { value: 'INACTIVO', label: 'Inactivo' },
]
const statusLabel: Record<string, string> = {
  OPERATIVO: 'Operativo', EN_TRANSITO: 'En tránsito', ATRACADO: 'Atracado',
  MANTENIMIENTO: 'Mantenimiento', INACTIVO: 'Inactivo',
}

const PESADA_NAMES = ['El Porteño I', 'El Masco VIII', 'Molleja Lake', 'Zapara Island']
const LIVIANA_NAMES = ['Blohm', 'Jackie', 'Anabella', 'La Magdalena I']

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
const card: React.CSSProperties = { background: 'var(--bg-surface)', border: '1px solid var(--border-accent)', borderRadius: '12px' }
const goldBorder = 'var(--border-accent)'
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', background: 'var(--bg-input)',
  border: '1px solid var(--border-accent)', borderRadius: '8px',
  color: 'var(--text-primary)', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
}
const selectStyle: React.CSSProperties = { ...inputStyle, appearance: 'none' as const }
const textareaStyle: React.CSSProperties = { ...inputStyle, resize: 'vertical' as const, minHeight: '48px' }
const btnPrimary: React.CSSProperties = {
  padding: '12px 28px', background: 'var(--accent)',
  border: 'none', borderRadius: '8px', color: '#080E1A', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
}
const btnSecondary: React.CSSProperties = {
  padding: '10px 20px', background: 'transparent', border: `1px solid ${goldBorder}`,
  borderRadius: '8px', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer',
}
const labelStyle: React.CSSProperties = { fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px', fontWeight: 600 }
const fieldWrap: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '2px' }

/* ─── Helpers ─── */
function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function formatDateES(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}
function monthNameES(m: number) {
  return ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][m - 1]
}
function numberWithDots(n: number) {
  return n.toLocaleString('es-VE')
}

function makeEmptyReport(v: Vessel): VesselReport {
  return {
    vesselId: v.id, vesselName: v.name, fleetType: v.fleetType, vesselType: v.vesselType,
    client: '', status: v.status || 'OPERATIVO', activity: '', captain: v.captain || '',
    marineOnDuty: v.marineOnDuty || '', additionalCrew: '', fuelLiters: '', fuelPercent: '',
    location: '', notes: '',
  }
}

function fuelBar(percent: number): string {
  const filled = Math.round(percent / 10)
  const empty = 10 - filled
  return '█'.repeat(filled) + '░'.repeat(empty) + ` ${percent}%`
}

function generateWhatsAppReport(reports: VesselReport[], dateStr: string): string {
  const pesada = reports.filter(r => r.fleetType === 'PESADA')
  const liviana = reports.filter(r => r.fleetType === 'LIVIANA')
  const [year, month, day] = dateStr.split('-')
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  const dayNames = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
  const dateObj = new Date(Number(year), Number(month) - 1, Number(day))
  const dayName = dayNames[dateObj.getDay()]
  const monthName = months[Number(month) - 1]
  const formattedDate = `${dayName} ${day} ${monthName} ${year}`

  const statusPrefix: Record<string, string> = {
    OPERATIVO: '[OP]', EN_TRANSITO: '[TR]', ATRACADO: '[AT]',
    MANTENIMIENTO: '[MN]', INACTIVO: '[IN]',
  }
  const statusLbl: Record<string, string> = {
    OPERATIVO: 'Operativo', EN_TRANSITO: 'En tránsito', ATRACADO: 'Atracado',
    MANTENIMIENTO: 'Mantenimiento', INACTIVO: 'Inactivo',
  }

  function vesselBlock(r: VesselReport): string {
    const lines: string[] = []
    const prefix = statusPrefix[r.status] || '[--]'
    const stLbl = statusLbl[r.status] || r.status
    lines.push(`${prefix} *${r.vesselName}*${r.vesselType ? ` — _${r.vesselType}_` : ''}`)
    lines.push(`┌ Estado: ${stLbl}`)
    if (r.client)        lines.push(`│ Cliente: ${r.client}`)
    if (r.location)      lines.push(`│ Ubicación: ${r.location}`)
    if (r.activity)      lines.push(`│ Actividad: ${r.activity}`)
    if (r.captain)       lines.push(`│ Capitán: ${r.captain}`)
    if (r.marineOnDuty)  lines.push(`│ Marino de guardia: ${r.marineOnDuty}`)
    if (r.additionalCrew) lines.push(`│ Personal adicional: ${r.additionalCrew}`)
    if (r.fuelLiters || r.fuelPercent) {
      const pct = r.fuelPercent ? Number(r.fuelPercent) : null
      const lts = r.fuelLiters ? `${Number(r.fuelLiters).toLocaleString('es-VE')} L` : ''
      const bar = pct !== null ? `\n│          ${fuelBar(pct)}` : ''
      lines.push(`│ Combustible: ${lts}${bar}`)
    }
    if (r.notes)         lines.push(`│ Notas: ${r.notes}`)
    lines.push('└─────────────────')
    return lines.join('\n')
  }

  const now = new Date()
  const hour = String(now.getHours()).padStart(2,'0')
  const min  = String(now.getMinutes()).padStart(2,'0')

  let txt = ''
  txt += `*REPORTE DIARIO DE FLOTA*\n`
  txt += `${formattedDate}   ${hour}:${min}\n`
  txt += `VENOLS C.A.\n`
  txt += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`

  if (pesada.length) {
    txt += `*FLOTA PESADA* (${pesada.length} unidades)\n`
    txt += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
    txt += pesada.map(vesselBlock).join('\n')
    txt += '\n'
  }

  if (liviana.length) {
    txt += `\n*FLOTA LIVIANA* (${liviana.length} unidades)\n`
    txt += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
    txt += liviana.map(vesselBlock).join('\n')
    txt += '\n'
  }

  const totalOp = reports.filter(r => r.status === 'OPERATIVO' || r.status === 'EN_TRANSITO').length
  const totalMaint = reports.filter(r => r.status === 'MANTENIMIENTO').length
  const totalDoc = reports.filter(r => r.status === 'ATRACADO').length
  txt += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
  txt += `*RESUMEN:* ${reports.length} unidades reportadas\n`
  txt += `Operativas: ${totalOp}   Mantenimiento: ${totalMaint}   Atracadas: ${totalDoc}\n`
  txt += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
  txt += `_Generado por VENOLS ERP_`
  return txt
}

function generateWhatsAppFromDailyReports(reports: DailyReport[], dateStr: string): string {
  const mapped: VesselReport[] = reports.map(r => ({
    vesselId: r.vesselId,
    vesselName: r.vessel?.name || '',
    fleetType: (r.vessel?.fleetType || 'PESADA') as 'PESADA' | 'LIVIANA',
    vesselType: r.vessel?.vesselType || '',
    client: r.client || '',
    status: r.vesselStatus,
    activity: r.activity,
    captain: r.captain,
    marineOnDuty: r.marineOnDuty,
    additionalCrew: r.additionalCrew || '',
    fuelLiters: r.fuelLiters != null ? String(r.fuelLiters) : '',
    fuelPercent: r.fuelPercent != null ? String(r.fuelPercent) : '',
    location: r.location || '',
    notes: r.notes || '',
  }))
  return generateWhatsAppReport(mapped, dateStr)
}

function downloadReport(content: string, dateStr: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `reporte-flota-venols-${dateStr}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

async function copyToClipboard(content: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(content)
    return true
  } catch {
    return false
  }
}

// Legacy aliases kept for compatibility
function generateTxt(reports: VesselReport[], dateStr: string): string {
  return generateWhatsAppReport(reports, dateStr)
}
function generateTxtFromDailyReports(reports: DailyReport[], dateStr: string): string {
  return generateWhatsAppFromDailyReports(reports, dateStr)
}
function downloadTxt(content: string, dateStr: string) {
  downloadReport(content, dateStr)
}




/* ═════════════════════════ MAIN PAGE ═════════════════════════ */
export default function DailyReportsPage() {
  const [view, setView] = useState<View>('crear')
  const [vessels, setVessels] = useState<Vessel[]>([])
  const [reports, setReports] = useState<Record<string, VesselReport>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [copied, setCopied] = useState(false)

  // Historial state
  const [allReports, setAllReports] = useState<DailyReport[]>([])
  const [histLoading, setHistLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({})
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({})
  const [histFrom, setHistFrom] = useState('')
  const [histTo, setHistTo] = useState('')

  const loadVessels = useCallback(async () => {
    try {
      const data = await api('/api/vessels')
      setVessels(data)
      const recs: Record<string, VesselReport> = {}
      data.forEach((v: Vessel) => { recs[v.id] = makeEmptyReport(v) })
      setReports(recs)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  const loadHistory = useCallback(async () => {
    setHistLoading(true)
    try {
      let qs = ''
      const params: string[] = []
      if (histFrom) params.push(`from=${histFrom}`)
      if (histTo) params.push(`to=${histTo}`)
      if (params.length) qs = '?' + params.join('&')
      const data = await api(`/api/daily-reports${qs}`)
      setAllReports(Array.isArray(data) ? data : data.reports || [])
      // Auto-expand current year and select today
      const today = todayStr()
      const year = today.split('-')[0]
      setExpandedYears(prev => ({ ...prev, [year]: true }))
      const ym = today.substring(0, 7)
      setExpandedMonths(prev => ({ ...prev, [ym]: true }))
    } catch { /* ignore */ }
    finally { setHistLoading(false) }
  }, [histFrom, histTo])

  useEffect(() => { loadVessels() }, [loadVessels])
  useEffect(() => { if (view === 'historial') loadHistory() }, [view, loadHistory])

  /* Vessel classification */
  const pesadaOrder = PESADA_NAMES
  const livianaOrder = LIVIANA_NAMES

  const sortByFleetOrder = (list: Vessel[], order: string[]) =>
    [...list].sort((a, b) => {
      const ai = order.indexOf(a.name)
      const bi = order.indexOf(b.name)
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
    })

  const pesada = sortByFleetOrder(vessels.filter(v => v.fleetType === 'PESADA'), pesadaOrder)
  const liviana = sortByFleetOrder(vessels.filter(v => v.fleetType === 'LIVIANA'), livianaOrder)

  /* Report field update */
  function updateField(vesselId: string, field: keyof VesselReport, value: string) {
    setReports(prev => {
      const r = { ...prev[vesselId], [field]: value }
      // Auto-calculate fuel percent
      if (field === 'fuelLiters') {
        const vessel = vessels.find(v => v.id === vesselId)
        if (vessel?.tankCapacityLiters && value) {
          r.fuelPercent = String(Math.round((Number(value) / vessel.tankCapacityLiters) * 100))
        }
      }
      return { ...prev, [vesselId]: r }
    })
  }

  /* Save all filled reports */
  async function handleSave() {
    const filled = Object.values(reports).filter(r => r.activity || r.client || r.fuelLiters)
    if (!filled.length) { setMessage({ type: 'err', text: 'No hay reportes con datos para guardar.' }); return }
    setSaving(true)
    setMessage(null)
    let saved = 0
    let errors = 0
    for (const r of filled) {
      try {
        await api('/api/daily-reports', {
          method: 'POST',
          body: JSON.stringify({
            vesselId: r.vesselId,
            date: todayStr(),
            client: r.client || undefined,
            vesselStatus: r.status,
            activity: r.activity,
            captain: r.captain,
            marineOnDuty: r.marineOnDuty,
            additionalCrew: r.additionalCrew || undefined,
            fuelLiters: r.fuelLiters ? Number(r.fuelLiters) : undefined,
            fuelPercent: r.fuelPercent ? Number(r.fuelPercent) : undefined,
            location: r.location || undefined,
            notes: r.notes || undefined,
          }),
        })
        saved++
      } catch { errors++ }
    }
    setSaving(false)
    if (errors) setMessage({ type: 'err', text: `${saved} guardados, ${errors} fallaron.` })
    else setMessage({ type: 'ok', text: `${saved} reporte(s) guardados exitosamente.` })
  }

  /* Generate and download/copy report */
  function getFilledTxt(): string | null {
    const filled = Object.values(reports).filter(r => r.activity || r.client || r.fuelLiters)
    if (!filled.length) { setMessage({ type: 'err', text: 'No hay reportes con datos para exportar.' }); return null }
    return generateTxt(filled, todayStr())
  }
  function handleDownloadTxt() {
    const txt = getFilledTxt()
    if (!txt) return
    downloadTxt(txt, todayStr())
  }
  async function handleCopyTxt() {
    const txt = getFilledTxt()
    if (!txt) return
    const ok = await copyToClipboard(txt)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } else {
      setMessage({ type: 'err', text: 'No se pudo copiar. Usa el botón de descarga.' })
    }
  }

  /* ─── Historial helpers ─── */
  const reportsByDate: Record<string, DailyReport[]> = {}
  allReports.forEach(r => {
    const d = r.date.substring(0, 10)
    if (!reportsByDate[d]) reportsByDate[d] = []
    reportsByDate[d].push(r)
  })
  const allDates = Object.keys(reportsByDate).sort((a, b) => b.localeCompare(a))

  // Build year > month > day tree
  const tree: Record<string, Record<string, string[]>> = {}
  allDates.forEach(d => {
    const [y, m] = d.split('-')
    if (!tree[y]) tree[y] = {}
    if (!tree[y][m]) tree[y][m] = []
    tree[y][m].push(d)
  })
  const years = Object.keys(tree).sort((a, b) => b.localeCompare(a))

  const selectedReports = selectedDate ? (reportsByDate[selectedDate] || []) : []
  const selectedPesada = selectedReports.filter(r => r.vessel?.fleetType === 'PESADA')
  const selectedLiviana = selectedReports.filter(r => r.vessel?.fleetType === 'LIVIANA')

  const filledCount = Object.values(reports).filter(r => r.activity || r.client || r.fuelLiters).length

  if (loading) return <div style={{ color: 'var(--text-muted)', padding: '40px', textAlign: 'center' }}>Cargando...</div>

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Reportes Diarios de Flota</div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
          {view === 'crear'
            ? `${vessels.length} embarcaciones — ${filledCount} con datos`
            : `${allReports.length} reportes en historial`}
        </div>
      </div>

      {/* View toggle */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button
          onClick={() => setView('crear')}
          style={{
            ...btnSecondary,
            ...(view === 'crear' ? { background: 'var(--accent)', color: '#080E1A', fontWeight: 700, border: 'none' } : {}),
          }}
        >
          Crear Reporte
        </button>
        <button
          onClick={() => setView('historial')}
          style={{
            ...btnSecondary,
            ...(view === 'historial' ? { background: 'var(--accent)', color: '#080E1A', fontWeight: 700, border: 'none' } : {}),
          }}
        >
          Historial
        </button>
      </div>

      {/* ─────── VIEW: CREAR REPORTE ─────── */}
      {view === 'crear' && (
        <div>
          {/* Date display */}
          <div style={{ ...card, padding: '14px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--accent-dim)', border: '1px solid var(--border-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.3px', flexShrink: 0 }}>HOY</div>
            <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '15px' }}>
              Fecha: {formatDateES(todayStr())}
            </span>
          </div>

          {/* Flota Pesada */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '5px', background: 'var(--accent-dim)', border: '1px solid var(--border-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 700, color: 'var(--accent)' }}>FP</div> Flota Pesada
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>({pesada.length} embarcaciones)</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pesada.map(v => (
                <VesselReportCard key={v.id} vessel={v} report={reports[v.id]} onChange={(f, val) => updateField(v.id, f, val)} />
              ))}
            </div>
          </div>

          {/* Flota Liviana */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '5px', background: 'var(--accent-dim)', border: '1px solid var(--border-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 700, color: 'var(--accent)' }}>FL</div> Flota Liviana
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>({liviana.length} embarcaciones)</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {liviana.map(v => (
                <VesselReportCard key={v.id} vessel={v} report={reports[v.id]} onChange={(f, val) => updateField(v.id, f, val)} />
              ))}
            </div>
          </div>

          {/* Messages */}
          {message && (
            <div style={{
              padding: '12px 18px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px', fontWeight: 600,
              background: message.type === 'ok' ? 'rgba(39,174,96,0.12)' : 'rgba(231,76,60,0.12)',
              color: message.type === 'ok' ? 'var(--success)' : 'var(--danger)',
              border: `1px solid ${message.type === 'ok' ? 'rgba(39,174,96,0.3)' : 'rgba(231,76,60,0.3)'}`,
            }}>
              {message.text}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={handleSave} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Guardando...' : 'Guardar Reportes'}
            </button>
            <button
              onClick={handleCopyTxt}
              style={{
                ...btnSecondary,
                ...(copied ? {
                  background: 'rgba(39,174,96,0.15)',
                  color: 'var(--success)',
                  border: '1px solid rgba(39,174,96,0.4)',
                } : {}),
              }}
            >
              {copied ? 'Copiado!' : 'Copiar para WhatsApp'}
            </button>
            <button onClick={handleDownloadTxt} style={btnSecondary}>
              Descargar .txt
            </button>
          </div>
        </div>
      )}

      {/* ─────── VIEW: HISTORIAL ─────── */}
      {view === 'historial' && (
        <div>
          {/* Date range filter */}
          <div style={{ ...card, padding: '14px 20px', marginBottom: '20px', display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={fieldWrap}>
              <label style={labelStyle}>Desde</label>
              <input type="date" value={histFrom} onChange={e => setHistFrom(e.target.value)} style={{ ...inputStyle, width: '160px' }} />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Hasta</label>
              <input type="date" value={histTo} onChange={e => setHistTo(e.target.value)} style={{ ...inputStyle, width: '160px' }} />
            </div>
            <button onClick={loadHistory} style={{ ...btnSecondary, alignSelf: 'flex-end', marginBottom: '2px' }}>
              Filtrar
            </button>
          </div>

          <div style={{ display: 'flex', gap: '20px', minHeight: '400px' }}>
            {/* Sidebar tree */}
            <div style={{ ...card, padding: '14px', minWidth: '220px', maxWidth: '260px', overflowY: 'auto', maxHeight: '70vh' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent)', marginBottom: '12px' }}>Fechas</div>
              {histLoading && <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Cargando...</div>}
              {!histLoading && years.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Sin reportes</div>}
              {years.map(year => (
                <div key={year} style={{ marginBottom: '6px' }}>
                  <div
                    onClick={() => setExpandedYears(p => ({ ...p, [year]: !p[year] }))}
                    style={{ cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 700, fontSize: '14px', padding: '4px 0', userSelect: 'none' }}
                  >
                    {expandedYears[year] ? '▾' : '▸'} {year}
                  </div>
                  {expandedYears[year] && Object.keys(tree[year]).sort((a, b) => b.localeCompare(a)).map(month => {
                    const ym = `${year}-${month}`
                    return (
                      <div key={ym} style={{ marginLeft: '14px', marginBottom: '4px' }}>
                        <div
                          onClick={() => setExpandedMonths(p => ({ ...p, [ym]: !p[ym] }))}
                          style={{ cursor: 'pointer', color: 'var(--accent)', fontWeight: 600, fontSize: '13px', padding: '3px 0', userSelect: 'none' }}
                        >
                          {expandedMonths[ym] ? '▾' : '▸'} {monthNameES(Number(month))}
                        </div>
                        {expandedMonths[ym] && tree[year][month].map(day => (
                          <div
                            key={day}
                            onClick={() => setSelectedDate(day)}
                            style={{
                              marginLeft: '14px', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px',
                              fontSize: '12px', color: selectedDate === day ? '#080E1A' : 'var(--text-secondary)',
                              background: selectedDate === day ? 'var(--accent)' : 'transparent',
                              fontWeight: selectedDate === day ? 700 : 400,
                              marginBottom: '2px',
                            }}
                          >
                            {formatDateES(day)} ({reportsByDate[day].length})
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Main content area */}
            <div style={{ flex: 1 }}>
              {!selectedDate && (
                <div style={{ ...card, padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                  Selecciona una fecha del panel izquierdo para ver los reportes.
                </div>
              )}
              {selectedDate && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Reportes del {formatDateES(selectedDate)}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={async () => {
                          const txt = generateTxtFromDailyReports(selectedReports, selectedDate)
                          const ok = await copyToClipboard(txt)
                          if (ok) {
                            setCopied(true)
                            setTimeout(() => setCopied(false), 3000)
                          }
                        }}
                        style={{
                          ...btnSecondary,
                          ...(copied ? { background: 'rgba(39,174,96,0.15)', color: 'var(--success)', border: '1px solid rgba(39,174,96,0.4)' } : {}),
                        }}
                      >
                        {copied ? 'Copiado!' : 'Copiar WA'}
                      </button>
                      <button
                        onClick={() => {
                          const txt = generateTxtFromDailyReports(selectedReports, selectedDate)
                          downloadTxt(txt, selectedDate)
                        }}
                        style={btnSecondary}
                      >
                        Descargar .txt
                      </button>
                    </div>
                  </div>

                  {/* Pesada section */}
                  {selectedPesada.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'var(--accent-dim)', border: '1px solid var(--border-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', fontWeight: 700, color: 'var(--accent)' }}>FP</div> Flota Pesada
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {selectedPesada.map(r => <HistoryReportCard key={r.id} report={r} />)}
                      </div>
                    </div>
                  )}

                  {/* Liviana section */}
                  {selectedLiviana.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'var(--accent-dim)', border: '1px solid var(--border-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', fontWeight: 700, color: 'var(--accent)' }}>FL</div> Flota Liviana
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {selectedLiviana.map(r => <HistoryReportCard key={r.id} report={r} />)}
                      </div>
                    </div>
                  )}

                  {selectedReports.length === 0 && (
                    <div style={{ ...card, padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                      No hay reportes para esta fecha.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


/* ═════════════════════ VESSEL REPORT CARD ═════════════════════ */
function VesselReportCard({
  vessel, report, onChange,
}: {
  vessel: Vessel
  report: VesselReport
  onChange: (field: keyof VesselReport, value: string) => void
}) {
  const [expanded, setExpanded] = useState(false)

  if (!report) return null

  const hasData = report.activity || report.client || report.fuelLiters

  return (
    <div style={{
      ...card,
      padding: '16px 20px',
      borderLeft: hasData ? '3px solid var(--accent)' : '3px solid transparent',
    }}>
      {/* Header row */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '5px', background: 'var(--accent-dim)', border: '1px solid var(--border-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>{vessel.fleetType === 'PESADA' ? 'FP' : 'FL'}</div>
          <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '15px' }}>{vessel.name}</span>
          {vessel.vesselType && (
            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>({vessel.vesselType})</span>
          )}
          {hasData && (
            <span style={{ fontSize: '10px', color: 'var(--success)', background: 'rgba(39,174,96,0.12)', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
              Con datos
            </span>
          )}
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: '18px', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0)' }}>▾</span>
      </div>

      {/* Expanded form */}
      {expanded && (
        <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
          {/* Cliente */}
          <div style={fieldWrap}>
            <label style={labelStyle}>Cliente</label>
            <input style={inputStyle} value={report.client} onChange={e => onChange('client', e.target.value)} placeholder="Ej: PDVSA" />
          </div>

          {/* Status */}
          <div style={fieldWrap}>
            <label style={labelStyle}>Status</label>
            <select style={selectStyle} value={report.status} onChange={e => onChange('status', e.target.value)}>
              {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Capitán */}
          <div style={fieldWrap}>
            <label style={labelStyle}>Capitán</label>
            <input style={inputStyle} value={report.captain} onChange={e => onChange('captain', e.target.value)} />
          </div>

          {/* Marino de Guardia */}
          <div style={fieldWrap}>
            <label style={labelStyle}>Marino de Guardia</label>
            <input style={inputStyle} value={report.marineOnDuty} onChange={e => onChange('marineOnDuty', e.target.value)} />
          </div>

          {/* Personal adicional */}
          <div style={fieldWrap}>
            <label style={labelStyle}>Personal adicional</label>
            <input style={inputStyle} value={report.additionalCrew} onChange={e => onChange('additionalCrew', e.target.value)} placeholder="Opcional" />
          </div>

          {/* Combustible litros */}
          <div style={fieldWrap}>
            <label style={labelStyle}>Combustible (litros)</label>
            <input style={inputStyle} type="number" value={report.fuelLiters} onChange={e => onChange('fuelLiters', e.target.value)} placeholder="Ej: 3500" />
          </div>

          {/* Combustible % */}
          <div style={fieldWrap}>
            <label style={labelStyle}>
              Combustible (%)
              {vessel.tankCapacityLiters ? ' — auto' : ''}
            </label>
            <input
              style={inputStyle} type="number" value={report.fuelPercent}
              onChange={e => onChange('fuelPercent', e.target.value)}
              readOnly={!!vessel.tankCapacityLiters && !!report.fuelLiters}
              placeholder={vessel.tankCapacityLiters ? 'Auto-calculado' : 'Manual'}
            />
          </div>

          {/* Ubicación */}
          <div style={fieldWrap}>
            <label style={labelStyle}>Ubicación</label>
            <input style={inputStyle} value={report.location} onChange={e => onChange('location', e.target.value)} placeholder="Ej: Muelle Norte, Maracaibo" />
          </div>

          {/* Actividad — full width */}
          <div style={{ ...fieldWrap, gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Actividad</label>
            <textarea
              style={textareaStyle}
              value={report.activity}
              onChange={e => onChange('activity', e.target.value)}
              placeholder="Ej: Se encuentra haciendo recorrida por campo con personal de seguridad"
            />
          </div>

          {/* Notas — full width */}
          <div style={{ ...fieldWrap, gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Notas</label>
            <input style={inputStyle} value={report.notes} onChange={e => onChange('notes', e.target.value)} placeholder="Notas adicionales (opcional)" />
          </div>
        </div>
      )}
    </div>
  )
}


/* ═════════════════════ HISTORY REPORT CARD ═════════════════════ */
function HistoryReportCard({ report }: { report: DailyReport }) {
  const statusColor: Record<string, string> = {
    OPERATIVO: 'var(--success)', EN_TRANSITO: 'var(--accent)', ATRACADO: 'var(--text-secondary)',
    MANTENIMIENTO: 'var(--danger)', INACTIVO: 'var(--text-muted)',
  }
  const color = statusColor[report.vesselStatus] || 'var(--text-secondary)'

  return (
    <div style={{ ...card, padding: '14px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '14px' }}>{report.vessel?.name || 'Embarcación'}</span>
          {report.vessel?.vesselType && (
            <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>({report.vessel.vesselType})</span>
          )}
        </div>
        <span style={{
          fontSize: '11px', fontWeight: 600, color, padding: '3px 10px', borderRadius: '10px',
          background: `${color}1a`,
        }}>
          {statusLabel[report.vesselStatus] || report.vesselStatus}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px', fontSize: '12px' }}>
        {report.client && (
          <div><span style={{ color: 'var(--text-muted)' }}>Cliente:</span> <span style={{ color: 'var(--text-primary)' }}>{report.client}</span></div>
        )}
        {report.activity && (
          <div style={{ gridColumn: '1 / -1' }}><span style={{ color: 'var(--text-muted)' }}>Actividad:</span> <span style={{ color: 'var(--text-primary)' }}>{report.activity}</span></div>
        )}
        <div><span style={{ color: 'var(--text-muted)' }}>Capitán:</span> <span style={{ color: 'var(--text-primary)' }}>{report.captain}</span></div>
        <div><span style={{ color: 'var(--text-muted)' }}>Marino:</span> <span style={{ color: 'var(--text-primary)' }}>{report.marineOnDuty}</span></div>
        {report.additionalCrew && (
          <div><span style={{ color: 'var(--text-muted)' }}>Personal:</span> <span style={{ color: 'var(--text-primary)' }}>{report.additionalCrew}</span></div>
        )}
        {(report.fuelLiters != null || report.fuelPercent != null) && (
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Combustible:</span>{' '}
            <span style={{ color: 'var(--text-primary)' }}>
              {report.fuelLiters != null ? `${numberWithDots(report.fuelLiters)} Lts` : ''}
              {report.fuelPercent != null ? ` (${report.fuelPercent}%)` : ''}
            </span>
          </div>
        )}
        {report.location && (
          <div><span style={{ color: 'var(--text-muted)' }}>Ubicación:</span> <span style={{ color: 'var(--text-primary)' }}>{report.location}</span></div>
        )}
        {report.notes && (
          <div style={{ gridColumn: '1 / -1' }}><span style={{ color: 'var(--text-muted)' }}>Notas:</span> <span style={{ color: 'var(--text-primary)' }}>{report.notes}</span></div>
        )}
      </div>
    </div>
  )
}
