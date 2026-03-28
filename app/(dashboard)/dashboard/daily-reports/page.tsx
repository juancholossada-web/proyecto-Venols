'use client'

import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api-client'

/* ─── Types ─── */
type Vessel = {
  id: string; name: string; fleetType: 'PESADA' | 'LIVIANA'; vesselType: string
  status: string; matricula?: string; captain?: string; marineOnDuty?: string
  tankCapacityLiters?: number; waterTankCapacityLiters?: number
}
type VesselReport = {
  vesselId: string; vesselName: string; fleetType: 'PESADA' | 'LIVIANA'; vesselType: string
  client: string; status: string; activity: string; captain: string; marineOnDuty: string
  additionalCrew: string; fuelLiters: string; fuelPercent: string
  waterLiters: string; waterPercent: string
  location: string; notes: string
}
type DailyReport = {
  id: string; vesselId: string; date: string; client?: string; vesselStatus: string
  activity: string; captain: string; marineOnDuty: string; personnel?: string
  fuelLevelLiters?: number; fuelPercentage?: number
  waterOnBoardLiters?: number; waterOnBoardPercent?: number
  location?: string; notes?: string
  vessel?: { name: string; fleetType: string; vesselType: string; tankCapacityLiters?: number; waterTankCapacityLiters?: number }
}
type Client = { id: string; name: string }
type Employee = {
  id: string; firstName: string; lastName: string; position: string; status: string
  assignments?: { vessel: { id: string } }[]
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


/* ─── Styles ─── */
const card: React.CSSProperties = { background: 'var(--bg-surface)', border: '1px solid var(--border-accent)', borderRadius: '12px' }
const goldBorder = 'var(--border-accent)'
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', background: 'var(--bg-input)',
  border: '1px solid var(--border-accent)', borderRadius: '8px',
  color: 'var(--text-primary)', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
}
const inputReadOnly: React.CSSProperties = {
  ...inputStyle, opacity: 0.7, cursor: 'not-allowed',
  background: 'rgba(255,255,255,0.03)',
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
function calcPercent(liters: string, capacity?: number): string {
  if (!capacity || !liters || isNaN(Number(liters))) return ''
  return String(Math.round((Number(liters) / capacity) * 100))
}

function makeEmptyReport(v: Vessel): VesselReport {
  return {
    vesselId: v.id, vesselName: v.name, fleetType: v.fleetType, vesselType: v.vesselType,
    client: '', status: v.status || 'OPERATIVO', activity: '', captain: v.captain || '',
    marineOnDuty: v.marineOnDuty || '', additionalCrew: '', fuelLiters: '', fuelPercent: '',
    waterLiters: '', waterPercent: '', location: '', notes: '',
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
    if (r.marineOnDuty)  lines.push(`│ Marino: ${r.marineOnDuty}`)
    if (r.additionalCrew) lines.push(`│ Personal adicional: ${r.additionalCrew}`)
    if (r.fuelLiters || r.fuelPercent) {
      const pct = r.fuelPercent ? Number(r.fuelPercent) : null
      const lts = r.fuelLiters ? `${Number(r.fuelLiters).toLocaleString('es-VE')} L` : ''
      const bar = pct !== null ? `\n│          ${fuelBar(pct)}` : ''
      lines.push(`│ Combustible: ${lts}${r.fuelPercent ? ` (${r.fuelPercent}%)` : ''}${bar}`)
    }
    if (r.fleetType === 'PESADA' && (r.waterLiters || r.waterPercent)) {
      const wLts = r.waterLiters ? `${Number(r.waterLiters).toLocaleString('es-VE')} L` : ''
      lines.push(`│ Agua a bordo: ${wLts}${r.waterPercent ? ` (${r.waterPercent}%)` : ''}`)
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
    additionalCrew: r.personnel || '',
    fuelLiters: r.fuelLevelLiters != null ? String(r.fuelLevelLiters) : '',
    fuelPercent: r.fuelPercentage != null ? String(r.fuelPercentage) : '',
    waterLiters: r.waterOnBoardLiters != null ? String(r.waterOnBoardLiters) : '',
    waterPercent: r.waterOnBoardPercent != null ? String(r.waterOnBoardPercent) : '',
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

  // WhatsApp state
  const [waModalOpen, setWaModalOpen] = useState(false)
  const [waStatus, setWaStatus] = useState<'idle' | 'loading' | 'qr' | 'connected'>('idle')
  const [waQr, setWaQr] = useState<string | null>(null)
  const [waSending, setWaSending] = useState(false)
  const [waMessage, setWaMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [waGroups, setWaGroups] = useState<{ id: string; name: string }[]>([])
  const [waGroupId, setWaGroupId] = useState('')

  const [clients, setClients] = useState<Client[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])

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

  const loadClients = useCallback(async () => {
    try {
      const data = await api('/api/clients')
      setClients(Array.isArray(data) ? data : [])
    } catch { /* ignore */ }
  }, [])

  const loadEmployees = useCallback(async () => {
    try {
      const data = await api('/api/crew?status=ACTIVO')
      setEmployees(Array.isArray(data) ? data : [])
    } catch { /* ignore */ }
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

  useEffect(() => {
    loadVessels()
    loadClients()
    loadEmployees()
  }, [loadVessels, loadClients, loadEmployees])
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
      const vessel = vessels.find(v => v.id === vesselId)

      // Auto-calculate fuel percent when capacity is known
      if (field === 'fuelLiters') {
        if (vessel?.tankCapacityLiters) {
          r.fuelPercent = calcPercent(value, vessel.tankCapacityLiters)
        }
      }
      // Auto-calculate water percent when capacity is known
      if (field === 'waterLiters') {
        if (vessel?.waterTankCapacityLiters) {
          r.waterPercent = calcPercent(value, vessel.waterTankCapacityLiters)
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
            personnel: r.additionalCrew || undefined,
            fuelLevelLiters: r.fuelLiters ? Number(r.fuelLiters) : undefined,
            fuelPercentage: r.fuelPercent ? Number(r.fuelPercent) : undefined,
            waterOnBoardLiters: r.waterLiters ? Number(r.waterLiters) : undefined,
            waterOnBoardPercent: r.waterPercent ? Number(r.waterPercent) : undefined,
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

  /* ─── WhatsApp send ─── */
  async function pollWaStatus() {
    const res = await fetch('/api/whatsapp/status')
    const data = await res.json()
    setWaStatus(data.status)
    if (data.qr) setWaQr(data.qr)
    return data.status
  }

  async function handleOpenWaModal() {
    const txt = getFilledTxt()
    if (!txt) return
    setWaModalOpen(true)
    setWaMessage(null)
    setWaGroups([])
    setWaGroupId('')
    setWaStatus('loading')
    setWaQr(null)

    const status = await pollWaStatus()
    if (status === 'connected') {
      const res = await fetch('/api/whatsapp/groups')
      const groups = await res.json()
      if (Array.isArray(groups)) setWaGroups(groups)
      return
    }
    // Poll every 3s until connected or QR appears
    const interval = setInterval(async () => {
      const s = await pollWaStatus()
      if (s === 'connected') {
        clearInterval(interval)
        const res = await fetch('/api/whatsapp/groups')
        const groups = await res.json()
        if (Array.isArray(groups)) setWaGroups(groups)
      }
    }, 3000)
    // Stop polling when modal closes (cleanup via timeout safety)
    setTimeout(() => clearInterval(interval), 120000)
  }

  async function handleSendWhatsApp() {
    const txt = getFilledTxt()
    if (!txt) return
    if (!waGroupId) { setWaMessage({ type: 'err', text: 'Selecciona un grupo.' }); return }
    setWaSending(true)
    setWaMessage(null)
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: txt, groupId: waGroupId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error desconocido')
      setWaMessage({ type: 'ok', text: 'Reporte enviado exitosamente al grupo.' })
    } catch (err: unknown) {
      setWaMessage({ type: 'err', text: err instanceof Error ? err.message : 'Error al enviar' })
    } finally {
      setWaSending(false)
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
                <VesselReportCard
                  key={v.id} vessel={v} report={reports[v.id]}
                  onChange={(f, val) => updateField(v.id, f, val)}
                  clients={clients} employees={employees}
                />
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
                <VesselReportCard
                  key={v.id} vessel={v} report={reports[v.id]}
                  onChange={(f, val) => updateField(v.id, f, val)}
                  clients={clients} employees={employees}
                />
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
            <button
              onClick={handleOpenWaModal}
              style={{
                ...btnSecondary,
                background: 'rgba(37,211,102,0.12)',
                border: '1px solid rgba(37,211,102,0.4)',
                color: '#25D366',
                fontWeight: 700,
              }}
            >
              Enviar a WhatsApp
            </button>
          </div>
        </div>
      )}

      {/* ─────── MODAL WHATSAPP ─────── */}
      {waModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
        }}>
          <div style={{
            ...card, padding: '28px', width: '360px', maxWidth: '95vw',
            display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative',
          }}>
            {/* Cerrar */}
            <button
              onClick={() => setWaModalOpen(false)}
              style={{ position: 'absolute', top: '14px', right: '14px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer' }}
            >✕</button>

            <div style={{ fontSize: '16px', fontWeight: 700, color: '#25D366' }}>Enviar a WhatsApp</div>

            {/* Cargando */}
            {waStatus === 'loading' && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '20px 0' }}>
                Iniciando WhatsApp Web...
              </div>
            )}

            {/* QR */}
            {waStatus === 'qr' && waQr && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
                  Escanea el QR con tu celular en<br/>
                  <strong style={{ color: 'var(--text-primary)' }}>WhatsApp → Dispositivos vinculados</strong>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={waQr} alt="QR WhatsApp" style={{ width: '240px', height: '240px', borderRadius: '8px', background: '#fff', padding: '8px' }} />
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>El QR se actualiza automáticamente...</div>
              </div>
            )}

            {/* Conectado — seleccionar grupo */}
            {waStatus === 'connected' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '12px', color: 'var(--success)', fontWeight: 600 }}>WhatsApp conectado</div>
                  <button
                    onClick={async () => {
                      const res = await fetch('/api/whatsapp/groups')
                      const groups = await res.json()
                      if (Array.isArray(groups)) setWaGroups(groups)
                    }}
                    style={{ ...btnSecondary, padding: '4px 10px', fontSize: '11px' }}
                  >
                    Refrescar grupos
                  </button>
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>
                    Selecciona el grupo {waGroups.length === 0 && '(sin grupos — presiona Refrescar)'}
                  </label>
                  <select
                    value={waGroupId}
                    onChange={e => setWaGroupId(e.target.value)}
                    style={selectStyle}
                  >
                    <option value="">-- Seleccionar grupo --</option>
                    {waGroups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
                {waMessage && (
                  <div style={{
                    padding: '10px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                    background: waMessage.type === 'ok' ? 'rgba(39,174,96,0.12)' : 'rgba(231,76,60,0.12)',
                    color: waMessage.type === 'ok' ? 'var(--success)' : 'var(--danger)',
                    border: `1px solid ${waMessage.type === 'ok' ? 'rgba(39,174,96,0.3)' : 'rgba(231,76,60,0.3)'}`,
                  }}>
                    {waMessage.text}
                  </div>
                )}
                <button
                  onClick={handleSendWhatsApp}
                  disabled={waSending || !waGroupId}
                  style={{
                    ...btnPrimary,
                    background: '#25D366',
                    color: '#fff',
                    opacity: (waSending || !waGroupId) ? 0.6 : 1,
                  }}
                >
                  {waSending ? 'Enviando...' : 'Enviar Reporte'}
                </button>
              </div>
            )}
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
  vessel, report, onChange, clients, employees,
}: {
  vessel: Vessel
  report: VesselReport
  onChange: (field: keyof VesselReport, value: string) => void
  clients: Client[]
  employees: Employee[]
}) {
  const [expanded, setExpanded] = useState(false)

  if (!report) return null

  // Solo tripulantes asignados a esta embarcación
  const vesselCrew = employees.filter(e =>
    e.assignments?.some(a => a.vessel?.id === vessel.id)
  )

  const hasData = report.activity || report.client || report.fuelLiters

  const fuelAutoCalc = !!vessel.tankCapacityLiters
  const waterAutoCalc = !!vessel.waterTankCapacityLiters

  const fuelPct = report.fuelPercent ? Number(report.fuelPercent) : null
  const waterPct = report.waterPercent ? Number(report.waterPercent) : null

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
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* ── Fila 1: Personas, cliente, ubicación ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '12px' }}>

            {/* Cliente */}
            <div style={fieldWrap}>
              <label style={labelStyle}>Cliente <span style={{ color: 'var(--danger)' }}>*</span></label>
              <select style={selectStyle} value={report.client} onChange={e => onChange('client', e.target.value)}>
                <option value="">— Sin cliente —</option>
                {clients.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Estatus */}
            <div style={fieldWrap}>
              <label style={labelStyle}>Estatus <span style={{ color: 'var(--danger)' }}>*</span></label>
              <select style={selectStyle} value={report.status} onChange={e => onChange('status', e.target.value)}>
                {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Capitán */}
            <div style={fieldWrap}>
              <label style={labelStyle}>Capitán</label>
              <select style={selectStyle} value={report.captain} onChange={e => onChange('captain', e.target.value)}>
                <option value="">— Seleccionar —</option>
                {vesselCrew.map(e => (
                  <option key={e.id} value={`${e.firstName} ${e.lastName}`}>{e.lastName}, {e.firstName} — {e.position}</option>
                ))}
              </select>
            </div>

            {/* Marino */}
            <div style={fieldWrap}>
              <label style={labelStyle}>Marino</label>
              <select style={selectStyle} value={report.marineOnDuty} onChange={e => onChange('marineOnDuty', e.target.value)}>
                <option value="">— Seleccionar —</option>
                {vesselCrew.map(e => (
                  <option key={e.id} value={`${e.firstName} ${e.lastName}`}>{e.lastName}, {e.firstName} — {e.position}</option>
                ))}
              </select>
            </div>

            {/* Personal adicional */}
            <div style={fieldWrap}>
              <label style={labelStyle}>Personal adicional</label>
              <input style={inputStyle} value={report.additionalCrew} onChange={e => onChange('additionalCrew', e.target.value)} placeholder="Opcional" />
            </div>

            {/* Ubicación */}
            <div style={fieldWrap}>
              <label style={labelStyle}>Ubicación <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input style={inputStyle} value={report.location} onChange={e => onChange('location', e.target.value)} />
            </div>
          </div>

          {/* ── Fila 2: Combustible + Agua (FP) ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '12px' }}>

            {/* Combustible litros */}
            <div style={fieldWrap}>
              <label style={labelStyle}>Combustible (litros) <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input
                style={inputStyle} type="number" min="0"
                value={report.fuelLiters}
                onChange={e => onChange('fuelLiters', e.target.value)}
              />
            </div>

            {/* Combustible % */}
            <div style={fieldWrap}>
              <label style={labelStyle}>Combustible (%)</label>
              <input
                style={fuelAutoCalc ? inputReadOnly : inputStyle}
                type="number" min="0" max="100"
                value={report.fuelPercent}
                onChange={fuelAutoCalc ? undefined : e => onChange('fuelPercent', e.target.value)}
                readOnly={fuelAutoCalc}
              />
              {fuelPct !== null && (
                <div style={{ marginTop: '4px' }}>
                  <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: '3px',
                      width: `${Math.min(fuelPct, 100)}%`,
                      background: fuelPct > 60 ? 'var(--success)' : fuelPct > 25 ? 'var(--accent)' : 'var(--danger)',
                      transition: 'width 0.3s',
                    }} />
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{fuelPct}% de tanque</span>
                </div>
              )}
            </div>

            {/* Agua a bordo — solo Flota Pesada */}
            {vessel.fleetType === 'PESADA' && (
              <>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Agua a bordo (litros) <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input
                    style={inputStyle} type="number" min="0"
                    value={report.waterLiters}
                    onChange={e => onChange('waterLiters', e.target.value)}
                  />
                </div>

                <div style={fieldWrap}>
                  <label style={labelStyle}>Agua a bordo (%)</label>
                  <input
                    style={waterAutoCalc ? inputReadOnly : inputStyle}
                    type="number" min="0" max="100"
                    value={report.waterPercent}
                    onChange={waterAutoCalc ? undefined : e => onChange('waterPercent', e.target.value)}
                    readOnly={waterAutoCalc}
                  />
                  {waterPct !== null && (
                    <div style={{ marginTop: '4px' }}>
                      <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: '3px',
                          width: `${Math.min(waterPct, 100)}%`,
                          background: waterPct > 60 ? 'var(--info)' : waterPct > 25 ? 'var(--accent)' : 'var(--danger)',
                          transition: 'width 0.3s',
                        }} />
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{waterPct}% de tanque</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* ── Fila 3: Actividad y Notas ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={fieldWrap}>
              <label style={labelStyle}>Actividad <span style={{ color: 'var(--danger)' }}>*</span></label>
              <textarea
                style={textareaStyle}
                value={report.activity}
                onChange={e => onChange('activity', e.target.value)}
              />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Notas</label>
              <input style={inputStyle} value={report.notes} onChange={e => onChange('notes', e.target.value)} placeholder="Notas adicionales (opcional)" />
            </div>
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
  const fuelPct = report.fuelPercentage ?? null
  const waterPct = report.waterOnBoardPercent ?? null

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
        {report.personnel && (
          <div><span style={{ color: 'var(--text-muted)' }}>Personal:</span> <span style={{ color: 'var(--text-primary)' }}>{report.personnel}</span></div>
        )}

        {/* Combustible */}
        {(report.fuelLevelLiters != null || fuelPct != null) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Combustible:</span>{' '}
              <span style={{ color: 'var(--text-primary)' }}>
                {report.fuelLevelLiters != null ? `${numberWithDots(report.fuelLevelLiters)} L` : ''}
                {fuelPct != null ? ` (${fuelPct}%)` : ''}
              </span>
            </div>
            {fuelPct != null && (
              <div style={{ height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden', maxWidth: '140px' }}>
                <div style={{
                  height: '100%', borderRadius: '3px', width: `${Math.min(fuelPct, 100)}%`,
                  background: fuelPct > 60 ? 'var(--success)' : fuelPct > 25 ? 'var(--accent)' : 'var(--danger)',
                }} />
              </div>
            )}
          </div>
        )}

        {/* Agua a bordo (solo Flota Pesada) */}
        {report.vessel?.fleetType === 'PESADA' && (report.waterOnBoardLiters != null || waterPct != null) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Agua a bordo:</span>{' '}
              <span style={{ color: 'var(--text-primary)' }}>
                {report.waterOnBoardLiters != null ? `${numberWithDots(report.waterOnBoardLiters)} L` : ''}
                {waterPct != null ? ` (${waterPct}%)` : ''}
              </span>
            </div>
            {waterPct != null && (
              <div style={{ height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden', maxWidth: '140px' }}>
                <div style={{
                  height: '100%', borderRadius: '3px', width: `${Math.min(waterPct, 100)}%`,
                  background: waterPct > 60 ? 'var(--info)' : waterPct > 25 ? 'var(--accent)' : 'var(--danger)',
                }} />
              </div>
            )}
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
