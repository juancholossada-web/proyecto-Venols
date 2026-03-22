'use client'

import { useEffect, useState, useCallback } from 'react'

/* ─── Types ─── */
type Vessel = { id: string; name: string }

type MaintenanceOrder = {
  id: string
  vesselId: string
  vessel?: { id: string; name: string }
  type: 'PREVENTIVO' | 'CORRECTIVO' | 'CLASIFICACION'
  description: string
  priority: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA'
  system: string
  technician?: string
  dueDate?: string
  status: 'PENDIENTE' | 'PLANIFICADO' | 'EN_PROCESO' | 'COMPLETADO'
  cost?: number
  spareParts?: string
  notes?: string
  createdAt?: string
  updatedAt?: string
  // Correctivo-specific fields
  causa?: string
  causaRaiz?: string
  modoDeFalla?: string
  accionTomada?: string
  equipoAfectado?: string
  horasParada?: number
  // Preventivo-specific fields
  preventiveTasks?: string
}

type MaintenanceProgram = {
  id?: string
  vesselId: string
  vessel?: { id: string; name: string }
  name: string
  description?: string
  system: string
  frequency: string
  frequencyHours?: number
  lastExecuted?: string
  nextDue?: string
  tasks?: string
  materials?: string
  status: 'ACTIVO' | 'PAUSADO'
  notes?: string
  createdAt?: string
  updatedAt?: string
}

type Equipment = {
  id?: string
  vesselId: string
  vessel?: { id: string; name: string }
  name: string
  type: string
  brand?: string
  model?: string
  currentHours: number
  lastServiceAt?: number
  serviceInterval?: number
  status: 'OPERATIVO' | 'REQUIERE_SERVICIO' | 'FUERA_SERVICIO'
  notes?: string
  createdAt?: string
  updatedAt?: string
}

type HourLog = {
  id?: string
  equipmentId: string
  hours: number
  readingDate: string
  notes?: string
  createdAt?: string
}

type StatusFilter = 'TODOS' | 'PENDIENTE' | 'PLANIFICADO' | 'EN_PROCESO' | 'COMPLETADO'
type MainTab = 'ordenes' | 'programas' | 'equipos'

/* ─── Config ─── */
const priorityColors: Record<string, string> = {
  BAJA: '#7fa8c9',
  MEDIA: '#D4950A',
  ALTA: '#e67e22',
  CRITICA: '#e74c3c',
}

const statusColors: Record<string, string> = {
  PENDIENTE: '#e67e22',
  PLANIFICADO: '#2d9cdb',
  EN_PROCESO: '#D4950A',
  COMPLETADO: '#27ae60',
}

const equipmentStatusColors: Record<string, string> = {
  OPERATIVO: '#27ae60',
  REQUIERE_SERVICIO: '#e67e22',
  FUERA_SERVICIO: '#e74c3c',
}

const programStatusColors: Record<string, string> = {
  ACTIVO: '#27ae60',
  PAUSADO: '#e67e22',
}

const systemOptions = [
  'Motor Principal',
  'Motor Auxiliar',
  'Generador',
  'Sistema de Bombeo',
  'Casco',
  'Sistema Electrico',
  'Equipos Nauticos',
  'Contra Incendios',
  'HVAC',
  'Comunicaciones',
]

const typeOptions: MaintenanceOrder['type'][] = ['PREVENTIVO', 'CORRECTIVO', 'CLASIFICACION']
const priorityOptions: MaintenanceOrder['priority'][] = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA']
const statusOptions: MaintenanceOrder['status'][] = ['PENDIENTE', 'PLANIFICADO', 'EN_PROCESO', 'COMPLETADO']
const tabFilters: StatusFilter[] = ['TODOS', 'PENDIENTE', 'PLANIFICADO', 'EN_PROCESO', 'COMPLETADO']

const frequencyOptions = [
  'DIARIO', 'SEMANAL', 'QUINCENAL', 'MENSUAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL', 'POR_HORAS',
]

const equipmentTypeOptions = [
  'MOTOR_PRINCIPAL', 'MOTOR_AUXILIAR', 'GENERADOR', 'BOMBA', 'COMPRESOR', 'WINCHE', 'GRUA', 'OTRO',
]

const equipmentTypeLabels: Record<string, string> = {
  MOTOR_PRINCIPAL: 'Motor Principal',
  MOTOR_AUXILIAR: 'Motor Auxiliar',
  GENERADOR: 'Generador',
  BOMBA: 'Bomba',
  COMPRESOR: 'Compresor',
  WINCHE: 'Winche',
  GRUA: 'Grua',
  OTRO: 'Otro',
}

/* ─── API helper ─── */
function getToken() { return localStorage.getItem('token') || '' }
async function api(path: string, opts?: RequestInit) {
  const res = await fetch(path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...opts?.headers,
    },
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}

/* ─── Styles ─── */
const goldBorder = 'rgba(212,149,10,0.15)'
const goldBorderActive = 'rgba(212,149,10,0.5)'

const cardStyle: React.CSSProperties = {
  background: '#0a1628',
  border: `1px solid ${goldBorder}`,
  borderRadius: '14px',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  background: '#060c1a',
  border: `1px solid ${goldBorder}`,
  borderRadius: '8px',
  color: '#e8f4fd',
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box',
}

const btnPrimary: React.CSSProperties = {
  padding: '10px 20px',
  background: 'linear-gradient(135deg, #D4950A, #b8820a)',
  border: 'none',
  borderRadius: '8px',
  color: '#060c1a',
  fontWeight: 700,
  fontSize: '13px',
  cursor: 'pointer',
}

const btnSecondary: React.CSSProperties = {
  padding: '8px 14px',
  background: 'transparent',
  border: `1px solid ${goldBorder}`,
  borderRadius: '8px',
  color: '#7fa8c9',
  fontSize: '12px',
  cursor: 'pointer',
}

const btnDanger: React.CSSProperties = {
  padding: '8px 14px',
  background: 'transparent',
  border: '1px solid rgba(231,76,60,0.3)',
  borderRadius: '8px',
  color: '#e74c3c',
  fontSize: '12px',
  cursor: 'pointer',
}

const labelStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#7fa8c9',
  marginBottom: '4px',
  display: 'block',
  fontWeight: 600,
}

/* ─── Blank forms ─── */
const blankOrderForm = (): Partial<MaintenanceOrder> => ({
  vesselId: '',
  type: 'PREVENTIVO',
  description: '',
  priority: 'MEDIA',
  system: systemOptions[0],
  technician: '',
  dueDate: '',
  status: 'PENDIENTE',
  cost: undefined,
  spareParts: '',
  notes: '',
  causa: '',
  causaRaiz: '',
  modoDeFalla: '',
  accionTomada: '',
  equipoAfectado: '',
  horasParada: undefined,
  preventiveTasks: '',
})

const blankProgramForm = (): Partial<MaintenanceProgram> => ({
  vesselId: '',
  name: '',
  description: '',
  system: systemOptions[0],
  frequency: 'MENSUAL',
  frequencyHours: undefined,
  lastExecuted: '',
  nextDue: '',
  tasks: '',
  materials: '',
  status: 'ACTIVO',
  notes: '',
})

const blankEquipmentForm = (): Partial<Equipment> => ({
  vesselId: '',
  name: '',
  type: 'MOTOR_PRINCIPAL',
  brand: '',
  model: '',
  currentHours: 0,
  lastServiceAt: 0,
  serviceInterval: 250,
  status: 'OPERATIVO',
  notes: '',
})

/* ─── Helpers ─── */
function formatDate(d?: string) {
  if (!d) return '\u2014'
  try { return new Date(d).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' }) } catch { return d }
}

function formatCost(c?: number) {
  if (c == null) return '\u2014'
  return `$${c.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null
  const now = new Date()
  const target = new Date(dateStr)
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function needsService(eq: Equipment): boolean {
  if (eq.lastServiceAt == null || eq.serviceInterval == null) return false
  return eq.currentHours >= (eq.lastServiceAt + eq.serviceInterval)
}

/* ═══════════════════════ MAIN PAGE ═══════════════════════ */
export default function MaintenancePage() {
  const [mainTab, setMainTab] = useState<MainTab>('ordenes')

  // --- Orders state ---
  const [orders, setOrders] = useState<MaintenanceOrder[]>([])
  const [vessels, setVessels] = useState<Vessel[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('TODOS')
  const [vesselFilter, setVesselFilter] = useState<string>('')
  const [selectedOrder, setSelectedOrder] = useState<MaintenanceOrder | null>(null)
  const [orderDrawerMode, setOrderDrawerMode] = useState<'view' | 'edit' | 'new' | null>(null)
  const [orderForm, setOrderForm] = useState<Partial<MaintenanceOrder>>(blankOrderForm())
  const [saving, setSaving] = useState(false)

  // --- Programs state ---
  const [programs, setPrograms] = useState<MaintenanceProgram[]>([])
  const [programsLoading, setProgramsLoading] = useState(false)
  const [programVesselFilter, setProgramVesselFilter] = useState<string>('')
  const [selectedProgram, setSelectedProgram] = useState<MaintenanceProgram | null>(null)
  const [programDrawerMode, setProgramDrawerMode] = useState<'view' | 'edit' | 'new' | null>(null)
  const [programForm, setProgramForm] = useState<Partial<MaintenanceProgram>>(blankProgramForm())

  // --- Equipment state ---
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [equipmentLoading, setEquipmentLoading] = useState(false)
  const [equipVesselFilter, setEquipVesselFilter] = useState<string>('')
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)
  const [equipDrawerMode, setEquipDrawerMode] = useState<'view' | 'edit' | 'new' | 'addHours' | null>(null)
  const [equipForm, setEquipForm] = useState<Partial<Equipment>>(blankEquipmentForm())
  const [hourLogs, setHourLogs] = useState<HourLog[]>([])
  const [hourForm, setHourForm] = useState<{ hours: number; readingDate: string; notes: string }>({ hours: 0, readingDate: '', notes: '' })

  /* ─── Fetch data ─── */
  const fetchOrders = useCallback(async () => {
    try {
      const data = await api('/api/maintenance-orders')
      const raw = Array.isArray(data) ? data : data.orders ?? data.data ?? []
      setOrders(raw.map((o: any) => ({
        ...o,
        causa: o.cause || o.causa || '',
        causaRaiz: o.rootCause || o.causaRaiz || '',
        modoDeFalla: o.failureMode || o.modoDeFalla || '',
        accionTomada: o.actionTaken || o.accionTomada || '',
        equipoAfectado: o.equipmentAffected || o.equipoAfectado || '',
        horasParada: o.downtimeHours ?? o.horasParada,
      })))
    } catch { setOrders([]) }
  }, [])

  const fetchVessels = useCallback(async () => {
    try {
      const data = await api('/api/vessels')
      setVessels(Array.isArray(data) ? data : data.vessels ?? data.data ?? [])
    } catch { setVessels([]) }
  }, [])

  const fetchPrograms = useCallback(async () => {
    setProgramsLoading(true)
    try {
      const data = await api('/api/maintenance-programs')
      setPrograms(Array.isArray(data) ? data : data.programs ?? data.data ?? [])
    } catch { setPrograms([]) }
    finally { setProgramsLoading(false) }
  }, [])

  const fetchEquipment = useCallback(async () => {
    setEquipmentLoading(true)
    try {
      const data = await api('/api/equipment')
      setEquipment(Array.isArray(data) ? data : data.equipment ?? data.data ?? [])
    } catch { setEquipment([]) }
    finally { setEquipmentLoading(false) }
  }, [])

  const fetchHourLogs = useCallback(async (equipId: string) => {
    try {
      const data = await api(`/api/equipment/${equipId}/hours`)
      setHourLogs(Array.isArray(data) ? data : data.logs ?? data.data ?? [])
    } catch { setHourLogs([]) }
  }, [])

  useEffect(() => {
    Promise.all([fetchOrders(), fetchVessels()]).finally(() => setLoading(false))
  }, [fetchOrders, fetchVessels])

  useEffect(() => {
    if (mainTab === 'programas') fetchPrograms()
    if (mainTab === 'equipos') fetchEquipment()
  }, [mainTab, fetchPrograms, fetchEquipment])

  /* ─── Derived data ─── */
  const filteredOrders = orders.filter(o => {
    if (statusFilter !== 'TODOS' && o.status !== statusFilter) return false
    if (vesselFilter && o.vesselId !== vesselFilter) return false
    return true
  })

  const total = orders.length
  const pendientes = orders.filter(o => o.status === 'PENDIENTE').length
  const enProceso = orders.filter(o => o.status === 'EN_PROCESO').length
  const criticas = orders.filter(o => o.priority === 'CRITICA').length

  const totalHorasParadaPreventivo = orders
    .filter(o => o.type === 'PREVENTIVO' && o.horasParada)
    .reduce((acc, o) => acc + (o.horasParada || 0), 0)

  const totalHorasParadaCorrectivo = orders
    .filter(o => o.type === 'CORRECTIVO' && o.horasParada)
    .reduce((acc, o) => acc + (o.horasParada || 0), 0)

  // Build vessel downtime summary
  const vesselDowntimeSummary = vessels.map(v => {
    const vesselOrders = orders.filter(o => o.vesselId === v.id)
    const prevDown = vesselOrders.filter(o => o.type === 'PREVENTIVO').reduce((acc, o) => acc + (o.horasParada || 0), 0)
    const corrDown = vesselOrders.filter(o => o.type === 'CORRECTIVO').reduce((acc, o) => acc + (o.horasParada || 0), 0)
    return { vessel: v, preventivo: prevDown, correctivo: corrDown, total: prevDown + corrDown }
  }).filter(s => s.total > 0)

  const filteredPrograms = programs.filter(p => {
    if (programVesselFilter && p.vesselId !== programVesselFilter) return false
    return true
  })

  const filteredEquipment = equipment.filter(e => {
    if (equipVesselFilter && e.vesselId !== equipVesselFilter) return false
    return true
  })

  /* ─── Helpers ─── */
  const vesselName = (vesselId: string, vessel?: { id: string; name: string }) =>
    vessel?.name ?? vessels.find(v => v.id === vesselId)?.name ?? 'Sin embarcacion'

  /* ─── Order drawer actions ─── */
  function openOrderDetail(o: MaintenanceOrder) {
    setSelectedOrder(o)
    setOrderForm({
      ...o,
      causa: (o as any).cause || o.causa || '',
      causaRaiz: (o as any).rootCause || o.causaRaiz || '',
      modoDeFalla: (o as any).failureMode || o.modoDeFalla || '',
      accionTomada: (o as any).actionTaken || o.accionTomada || '',
      equipoAfectado: (o as any).equipmentAffected || o.equipoAfectado || '',
      horasParada: (o as any).downtimeHours ?? o.horasParada,
    })
    setOrderDrawerMode('view')
  }

  function openNewOrder() {
    setSelectedOrder(null)
    setOrderForm(blankOrderForm())
    setOrderDrawerMode('new')
  }

  function openEditOrder() {
    setOrderDrawerMode('edit')
  }

  function closeOrderDrawer() {
    setOrderDrawerMode(null)
    setSelectedOrder(null)
  }

  function updateOrderForm(key: string, value: unknown) {
    setOrderForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSaveOrder() {
    setSaving(true)
    try {
      const payload = {
        ...orderForm,
        cause: orderForm.causa || null,
        rootCause: orderForm.causaRaiz || null,
        failureMode: orderForm.modoDeFalla || null,
        actionTaken: orderForm.accionTomada || null,
        equipmentAffected: orderForm.equipoAfectado || null,
        downtimeHours: orderForm.horasParada ?? null,
      }
      if (orderDrawerMode === 'new') {
        await api('/api/maintenance-orders', { method: 'POST', body: JSON.stringify(payload) })
      } else if (orderDrawerMode === 'edit' && selectedOrder) {
        await api(`/api/maintenance-orders/${selectedOrder.id}`, { method: 'PUT', body: JSON.stringify(payload) })
      }
      await fetchOrders()
      closeOrderDrawer()
    } catch (e) {
      alert('Error al guardar: ' + (e instanceof Error ? e.message : 'desconocido'))
    } finally {
      setSaving(false)
    }
  }

  /* ─── Program drawer actions ─── */
  function openProgramDetail(p: MaintenanceProgram) {
    setSelectedProgram(p)
    setProgramForm({ ...p })
    setProgramDrawerMode('view')
  }

  function openNewProgram() {
    setSelectedProgram(null)
    setProgramForm(blankProgramForm())
    setProgramDrawerMode('new')
  }

  function openEditProgram() {
    setProgramDrawerMode('edit')
  }

  function closeProgramDrawer() {
    setProgramDrawerMode(null)
    setSelectedProgram(null)
  }

  function updateProgramForm(key: string, value: unknown) {
    setProgramForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSaveProgram() {
    setSaving(true)
    try {
      if (programDrawerMode === 'new') {
        await api('/api/maintenance-programs', { method: 'POST', body: JSON.stringify(programForm) })
      } else if (programDrawerMode === 'edit' && selectedProgram?.id) {
        await api(`/api/maintenance-programs/${selectedProgram.id}`, { method: 'PUT', body: JSON.stringify(programForm) })
      }
      await fetchPrograms()
      closeProgramDrawer()
    } catch (e) {
      alert('Error al guardar: ' + (e instanceof Error ? e.message : 'desconocido'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteProgram() {
    if (!selectedProgram?.id) return
    if (!confirm('Eliminar este programa de mantenimiento?')) return
    setSaving(true)
    try {
      await api(`/api/maintenance-programs/${selectedProgram.id}`, { method: 'DELETE' })
      await fetchPrograms()
      closeProgramDrawer()
    } catch (e) {
      alert('Error al eliminar: ' + (e instanceof Error ? e.message : 'desconocido'))
    } finally {
      setSaving(false)
    }
  }

  /* ─── Equipment drawer actions ─── */
  function openEquipDetail(eq: Equipment) {
    setSelectedEquipment(eq)
    setEquipForm({ ...eq })
    setEquipDrawerMode('view')
    if (eq.id) fetchHourLogs(eq.id)
  }

  function openNewEquipment() {
    setSelectedEquipment(null)
    setEquipForm(blankEquipmentForm())
    setEquipDrawerMode('new')
  }

  function openEditEquipment() {
    setEquipDrawerMode('edit')
  }

  function closeEquipDrawer() {
    setEquipDrawerMode(null)
    setSelectedEquipment(null)
    setHourLogs([])
  }

  function updateEquipForm(key: string, value: unknown) {
    setEquipForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSaveEquipment() {
    setSaving(true)
    try {
      if (equipDrawerMode === 'new') {
        await api('/api/equipment', { method: 'POST', body: JSON.stringify(equipForm) })
      } else if (equipDrawerMode === 'edit' && selectedEquipment?.id) {
        await api(`/api/equipment/${selectedEquipment.id}`, { method: 'PUT', body: JSON.stringify(equipForm) })
      }
      await fetchEquipment()
      closeEquipDrawer()
    } catch (e) {
      alert('Error al guardar: ' + (e instanceof Error ? e.message : 'desconocido'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteEquipment() {
    if (!selectedEquipment?.id) return
    if (!confirm('Eliminar este equipo?')) return
    setSaving(true)
    try {
      await api(`/api/equipment/${selectedEquipment.id}`, { method: 'DELETE' })
      await fetchEquipment()
      closeEquipDrawer()
    } catch (e) {
      alert('Error al eliminar: ' + (e instanceof Error ? e.message : 'desconocido'))
    } finally {
      setSaving(false)
    }
  }

  async function handleAddHourLog() {
    if (!selectedEquipment?.id) return
    setSaving(true)
    try {
      await api(`/api/equipment/${selectedEquipment.id}/hours`, {
        method: 'POST',
        body: JSON.stringify(hourForm),
      })
      await fetchHourLogs(selectedEquipment.id)
      await fetchEquipment()
      setHourForm({ hours: 0, readingDate: '', notes: '' })
      setEquipDrawerMode('view')
      // Refresh equipment detail
      const data = await api(`/api/equipment/${selectedEquipment.id}`)
      if (data) {
        setSelectedEquipment(data)
        setEquipForm({ ...data })
      }
    } catch (e) {
      alert('Error al registrar horas: ' + (e instanceof Error ? e.message : 'desconocido'))
    } finally {
      setSaving(false)
    }
  }

  /* ─── Render loading ─── */
  if (loading) {
    return (
      <div style={{ color: '#7fa8c9', padding: '40px', textAlign: 'center' }}>
        Cargando mantenimiento...
      </div>
    )
  }

  /* ─── Drawer wrapper component ─── */
  const renderDrawer = (
    isOpen: boolean,
    onClose: () => void,
    title: string,
    children: React.ReactNode
  ) => {
    if (!isOpen) return null
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <div
          onClick={onClose}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(2px)',
          }}
        />
        <div style={{
          position: 'relative',
          width: '520px',
          maxWidth: '95vw',
          height: '100vh',
          background: '#0a1628',
          borderLeft: `1px solid ${goldBorder}`,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideIn 0.25s ease-out',
        }}>
          <div style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${goldBorder}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            background: '#0a1628',
            zIndex: 2,
          }}>
            <div style={{ fontSize: '17px', fontWeight: 700, color: '#e8f4fd' }}>{title}</div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#7fa8c9', fontSize: '22px', cursor: 'pointer', lineHeight: 1 }}>
              &#x2715;
            </button>
          </div>
          <div style={{ padding: '24px', flex: 1 }}>
            {children}
          </div>
        </div>
      </div>
    )
  }

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div style={{ position: 'relative' }}>
      {/* Slide-in animation */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#e8f4fd' }}>Mantenimiento</div>
          <div style={{ fontSize: '13px', color: '#7fa8c9', marginTop: '4px' }}>
            Gestion integral de mantenimiento de la flota
          </div>
        </div>
      </div>

      {/* ── Main Tabs ── */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '28px', borderBottom: `1px solid ${goldBorder}`, paddingBottom: '0' }}>
        {([
          { key: 'ordenes' as MainTab, label: 'Ordenes' },
          { key: 'programas' as MainTab, label: 'Programas Preventivos' },
          { key: 'equipos' as MainTab, label: 'Equipos & Horas' },
        ]).map(tab => {
          const active = mainTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setMainTab(tab.key)}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderBottom: active ? '3px solid #D4950A' : '3px solid transparent',
                background: active ? 'rgba(212,149,10,0.08)' : 'transparent',
                color: active ? '#D4950A' : '#7fa8c9',
                fontWeight: active ? 700 : 500,
                fontSize: '14px',
                cursor: 'pointer',
                borderRadius: '8px 8px 0 0',
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ════════════════════ TAB 1: ORDENES ════════════════════ */}
      {mainTab === 'ordenes' && (
        <>
          {/* Action button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
            <button style={btnPrimary} onClick={openNewOrder}>+ Nueva Orden</button>
          </div>

          {/* ── KPIs ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '24px' }}>
            {([
              { label: 'Total Ordenes', value: total, color: '#e8f4fd' },
              { label: 'Pendientes', value: pendientes, color: '#e67e22' },
              { label: 'En Proceso', value: enProceso, color: '#D4950A' },
              { label: 'Criticas', value: criticas, color: '#e74c3c' },
              { label: 'Hrs Parada Prev.', value: totalHorasParadaPreventivo, color: '#2d9cdb' },
              { label: 'Hrs Parada Corr.', value: totalHorasParadaCorrectivo, color: '#e67e22' },
            ]).map((kpi) => (
              <div key={kpi.label} style={{ ...cardStyle, padding: '16px 18px' }}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
                <div style={{ fontSize: '11px', color: '#7fa8c9', marginTop: '4px' }}>{kpi.label}</div>
              </div>
            ))}
          </div>

          {/* Vessel Downtime Summary */}
          {vesselDowntimeSummary.length > 0 && (
            <div style={{ ...cardStyle, padding: '18px 22px', marginBottom: '24px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#e8f4fd', marginBottom: '14px' }}>
                Resumen de Horas de Parada por Embarcacion
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                {vesselDowntimeSummary.map(s => (
                  <div key={s.vessel.id} style={{
                    background: '#060c1a',
                    border: `1px solid ${goldBorder}`,
                    borderRadius: '10px',
                    padding: '14px 16px',
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#e8f4fd', marginBottom: '8px' }}>{s.vessel.name}</div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                      <div>
                        <span style={{ color: '#7fa8c9' }}>Prev: </span>
                        <span style={{ color: '#2d9cdb', fontWeight: 600 }}>{s.preventivo}h</span>
                      </div>
                      <div>
                        <span style={{ color: '#7fa8c9' }}>Corr: </span>
                        <span style={{ color: '#e67e22', fontWeight: 600 }}>{s.correctivo}h</span>
                      </div>
                      <div>
                        <span style={{ color: '#7fa8c9' }}>Total: </span>
                        <span style={{ color: '#e74c3c', fontWeight: 700 }}>{s.total}h</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Filters ── */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {tabFilters.map(tab => {
                const active = statusFilter === tab
                const color = tab === 'TODOS' ? '#e8f4fd' : statusColors[tab] ?? '#e8f4fd'
                return (
                  <button
                    key={tab}
                    onClick={() => setStatusFilter(tab)}
                    style={{
                      padding: '7px 16px',
                      borderRadius: '8px',
                      border: active ? `1px solid ${color}` : `1px solid ${goldBorder}`,
                      background: active ? `${color}18` : 'transparent',
                      color: active ? color : '#7fa8c9',
                      fontWeight: active ? 700 : 500,
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {tab === 'TODOS' ? 'Todos' : tab.replace('_', ' ')}
                  </button>
                )
              })}
            </div>
            <select
              value={vesselFilter}
              onChange={e => setVesselFilter(e.target.value)}
              style={{ ...inputStyle, width: 'auto', minWidth: '180px', cursor: 'pointer' }}
            >
              <option value="">Todas las embarcaciones</option>
              {vessels.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>

          {/* ── Orders list ── */}
          {filteredOrders.length === 0 ? (
            <div style={{ ...cardStyle, padding: '48px', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>&#128295;</div>
              <div style={{ color: '#7fa8c9', fontSize: '14px' }}>No se encontraron ordenes de mantenimiento</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredOrders.map(order => (
                <div
                  key={order.id}
                  onClick={() => openOrderDetail(order)}
                  style={{
                    ...cardStyle,
                    padding: '18px 22px',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s, transform 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = goldBorderActive }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = goldBorder }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '15px', fontWeight: 700, color: '#e8f4fd' }}>{vesselName(order.vesselId, order.vessel)}</span>
                        <span style={{
                          padding: '2px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                          background: order.type === 'CORRECTIVO' ? 'rgba(231,76,60,0.12)' : 'rgba(127,168,201,0.12)',
                          color: order.type === 'CORRECTIVO' ? '#e74c3c' : '#7fa8c9',
                          border: order.type === 'CORRECTIVO' ? '1px solid rgba(231,76,60,0.25)' : '1px solid rgba(127,168,201,0.2)',
                        }}>
                          {order.type}
                        </span>
                        <span style={{
                          padding: '2px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                          background: `${priorityColors[order.priority]}18`,
                          color: priorityColors[order.priority],
                          border: `1px solid ${priorityColors[order.priority]}40`,
                        }}>
                          {order.priority}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#c8dce8', marginBottom: '6px', lineHeight: '1.4' }}>
                        {order.description || 'Sin descripcion'}
                      </div>
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: '#7fa8c9' }}>
                        {order.system && <span>Sistema: {order.system}</span>}
                        {order.technician && <span>Tecnico: {order.technician}</span>}
                        {order.dueDate && <span>Vence: {formatDate(order.dueDate)}</span>}
                        {order.cost != null && <span>Costo: {formatCost(order.cost)}</span>}
                        {order.horasParada != null && order.horasParada > 0 && (
                          <span style={{ color: '#e67e22' }}>Parada: {order.horasParada}h</span>
                        )}
                      </div>
                    </div>
                    <div style={{
                      padding: '5px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                      background: `${statusColors[order.status]}18`,
                      color: statusColors[order.status],
                      border: `1px solid ${statusColors[order.status]}40`,
                      whiteSpace: 'nowrap',
                    }}>
                      {order.status.replace('_', ' ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ═══ Order Drawer ═══ */}
          {renderDrawer(
            orderDrawerMode !== null,
            closeOrderDrawer,
            orderDrawerMode === 'new' ? 'Nueva Orden de Mantenimiento' : orderDrawerMode === 'edit' ? 'Editar Orden' : 'Detalle de Orden',
            orderDrawerMode === 'view' && selectedOrder ? (
              /* ── VIEW MODE ── */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: '#e8f4fd' }}>{vesselName(selectedOrder.vesselId, selectedOrder.vessel)}</span>
                  <span style={{
                    padding: '3px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                    background: selectedOrder.type === 'CORRECTIVO' ? 'rgba(231,76,60,0.12)' : 'rgba(127,168,201,0.12)',
                    color: selectedOrder.type === 'CORRECTIVO' ? '#e74c3c' : '#7fa8c9',
                  }}>{selectedOrder.type}</span>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <span style={{
                    padding: '5px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                    background: `${priorityColors[selectedOrder.priority]}18`,
                    color: priorityColors[selectedOrder.priority],
                    border: `1px solid ${priorityColors[selectedOrder.priority]}40`,
                  }}>Prioridad: {selectedOrder.priority}</span>
                  <span style={{
                    padding: '5px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                    background: `${statusColors[selectedOrder.status]}18`,
                    color: statusColors[selectedOrder.status],
                    border: `1px solid ${statusColors[selectedOrder.status]}40`,
                  }}>Estado: {selectedOrder.status.replace('_', ' ')}</span>
                </div>

                <div style={{ ...cardStyle, padding: '16px 20px' }}>
                  {([
                    ['Descripcion', selectedOrder.description || '\u2014'],
                    ['Sistema', selectedOrder.system || '\u2014'],
                    ['Tecnico', selectedOrder.technician || '\u2014'],
                    ['Fecha de vencimiento', formatDate(selectedOrder.dueDate)],
                    ['Costo', formatCost(selectedOrder.cost)],
                    ['Repuestos', selectedOrder.spareParts || '\u2014'],
                    ['Notas', selectedOrder.notes || '\u2014'],
                    ...(selectedOrder.horasParada != null ? [['Horas de Parada', `${selectedOrder.horasParada}h`]] : []),
                  ] as [string, string][]).map(([label, value]) => (
                    <div key={label} style={{ padding: '10px 0', borderBottom: `1px solid ${goldBorder}` }}>
                      <div style={{ fontSize: '11px', color: '#7fa8c9', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                      <div style={{ fontSize: '13px', color: '#e8f4fd', lineHeight: '1.5' }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Correctivo-specific detail */}
                {selectedOrder.type === 'CORRECTIVO' && (
                  <div style={{ ...cardStyle, padding: '16px 20px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#e74c3c', marginBottom: '12px' }}>Analisis Correctivo</div>
                    {([
                      ['Causa', selectedOrder.causa || '\u2014'],
                      ['Causa Raiz', selectedOrder.causaRaiz || '\u2014'],
                      ['Modo de Falla', selectedOrder.modoDeFalla || '\u2014'],
                      ['Accion Tomada', selectedOrder.accionTomada || '\u2014'],
                      ['Equipo Afectado', selectedOrder.equipoAfectado || '\u2014'],
                    ] as [string, string][]).map(([label, value]) => (
                      <div key={label} style={{ padding: '8px 0', borderBottom: `1px solid ${goldBorder}` }}>
                        <div style={{ fontSize: '11px', color: '#7fa8c9', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                        <div style={{ fontSize: '13px', color: '#e8f4fd', lineHeight: '1.5' }}>{value}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Preventivo-specific detail */}
                {selectedOrder.type === 'PREVENTIVO' && selectedOrder.preventiveTasks && (
                  <div style={{ ...cardStyle, padding: '16px 20px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#27ae60', marginBottom: '12px' }}>Tareas Preventivas Realizadas</div>
                    <div style={{ fontSize: '13px', color: '#e8f4fd', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{selectedOrder.preventiveTasks}</div>
                  </div>
                )}

                <button style={btnPrimary} onClick={openEditOrder}>Editar Orden</button>
              </div>
            ) : (
              /* ── EDIT / NEW MODE (form) ── */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Embarcacion *</label>
                  <select value={orderForm.vesselId || ''} onChange={e => updateOrderForm('vesselId', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">Seleccionar embarcacion</option>
                    {vessels.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Tipo *</label>
                  <select value={orderForm.type || 'PREVENTIVO'} onChange={e => updateOrderForm('type', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {typeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Descripcion *</label>
                  <textarea
                    value={orderForm.description || ''}
                    onChange={e => updateOrderForm('description', e.target.value)}
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical' }}
                    placeholder="Descripcion del trabajo de mantenimiento..."
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Prioridad</label>
                    <select value={orderForm.priority || 'MEDIA'} onChange={e => updateOrderForm('priority', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                      {priorityOptions.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Sistema</label>
                    <select value={orderForm.system || systemOptions[0]} onChange={e => updateOrderForm('system', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                      {systemOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Fecha de vencimiento</label>
                    <input type="date" value={orderForm.dueDate ? orderForm.dueDate.slice(0, 10) : ''} onChange={e => updateOrderForm('dueDate', e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Estado</label>
                    <select value={orderForm.status || 'PENDIENTE'} onChange={e => updateOrderForm('status', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                      {statusOptions.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Tecnico asignado</label>
                  <input type="text" value={orderForm.technician || ''} onChange={e => updateOrderForm('technician', e.target.value)} style={inputStyle} placeholder="Nombre del tecnico" />
                </div>

                <div>
                  <label style={labelStyle}>Repuestos</label>
                  <textarea value={orderForm.spareParts || ''} onChange={e => updateOrderForm('spareParts', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Lista de repuestos necesarios..." />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Costo ($)</label>
                    <input type="number" value={orderForm.cost ?? ''} onChange={e => updateOrderForm('cost', e.target.value ? parseFloat(e.target.value) : undefined)} style={inputStyle} placeholder="0.00" step="0.01" min="0" />
                  </div>
                  <div>
                    <label style={labelStyle}>Horas de Parada</label>
                    <input type="number" value={orderForm.horasParada ?? ''} onChange={e => updateOrderForm('horasParada', e.target.value ? parseFloat(e.target.value) : undefined)} style={inputStyle} placeholder="0" step="0.5" min="0" />
                  </div>
                </div>

                {/* ── CORRECTIVO-specific fields ── */}
                {orderForm.type === 'CORRECTIVO' && (
                  <div style={{ border: `1px solid rgba(231,76,60,0.2)`, borderRadius: '10px', padding: '16px', background: 'rgba(231,76,60,0.04)' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#e74c3c', marginBottom: '14px' }}>Datos del Correctivo</div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={labelStyle}>Causa</label>
                        <input type="text" value={orderForm.causa || ''} onChange={e => updateOrderForm('causa', e.target.value)} style={inputStyle} placeholder="Ej: Falla mecanica en bomba de achique" />
                      </div>
                      <div>
                        <label style={labelStyle}>Causa Raiz</label>
                        <input type="text" value={orderForm.causaRaiz || ''} onChange={e => updateOrderForm('causaRaiz', e.target.value)} style={inputStyle} placeholder="Analisis de causa raiz..." />
                      </div>
                      <div>
                        <label style={labelStyle}>Modo de Falla</label>
                        <input type="text" value={orderForm.modoDeFalla || ''} onChange={e => updateOrderForm('modoDeFalla', e.target.value)} style={inputStyle} placeholder="Ej: Desgaste, Sobrecalentamiento, Corrosion" />
                      </div>
                      <div>
                        <label style={labelStyle}>Equipo Afectado</label>
                        <input type="text" value={orderForm.equipoAfectado || ''} onChange={e => updateOrderForm('equipoAfectado', e.target.value)} style={inputStyle} placeholder="Equipo o componente afectado" />
                      </div>
                      <div>
                        <label style={labelStyle}>Accion Tomada</label>
                        <textarea value={orderForm.accionTomada || ''} onChange={e => updateOrderForm('accionTomada', e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Descripcion detallada de la accion correctiva..." />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── PREVENTIVO-specific fields ── */}
                {orderForm.type === 'PREVENTIVO' && (
                  <div style={{ border: '1px solid rgba(39,174,96,0.2)', borderRadius: '10px', padding: '16px', background: 'rgba(39,174,96,0.04)' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#27ae60', marginBottom: '14px' }}>Tareas Preventivas</div>
                    <div>
                      <label style={labelStyle}>Descripcion de tareas realizadas</label>
                      <textarea
                        value={orderForm.preventiveTasks || ''}
                        onChange={e => updateOrderForm('preventiveTasks', e.target.value)}
                        rows={5}
                        style={{ ...inputStyle, resize: 'vertical' }}
                        placeholder={"Cambio de aceite: __\nFiltros reemplazados: __\nLubricantes: __\nRefrigerante: __\nIndicadores motor: __\nIndicadores generador: __\nOtros: __"}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label style={labelStyle}>Notas</label>
                  <textarea value={orderForm.notes || ''} onChange={e => updateOrderForm('notes', e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Observaciones adicionales..." />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button
                    style={{ ...btnPrimary, flex: 1, opacity: saving ? 0.6 : 1 }}
                    onClick={handleSaveOrder}
                    disabled={saving}
                  >
                    {saving ? 'Guardando...' : orderDrawerMode === 'new' ? 'Crear Orden' : 'Guardar Cambios'}
                  </button>
                  <button style={btnSecondary} onClick={closeOrderDrawer}>Cancelar</button>
                </div>
              </div>
            )
          )}
        </>
      )}

      {/* ════════════════════ TAB 2: PROGRAMAS PREVENTIVOS ════════════════════ */}
      {mainTab === 'programas' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <select
              value={programVesselFilter}
              onChange={e => setProgramVesselFilter(e.target.value)}
              style={{ ...inputStyle, width: 'auto', minWidth: '200px', cursor: 'pointer' }}
            >
              <option value="">Todas las embarcaciones</option>
              {vessels.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
            <button style={btnPrimary} onClick={openNewProgram}>+ Nuevo Programa</button>
          </div>

          {programsLoading ? (
            <div style={{ color: '#7fa8c9', padding: '40px', textAlign: 'center' }}>Cargando programas...</div>
          ) : filteredPrograms.length === 0 ? (
            <div style={{ ...cardStyle, padding: '48px', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>&#128197;</div>
              <div style={{ color: '#7fa8c9', fontSize: '14px' }}>No se encontraron programas de mantenimiento preventivo</div>
            </div>
          ) : (
            (() => {
              // Group by vessel
              const grouped: Record<string, MaintenanceProgram[]> = {}
              filteredPrograms.forEach(p => {
                const vName = vesselName(p.vesselId, p.vessel)
                if (!grouped[vName]) grouped[vName] = []
                grouped[vName].push(p)
              })
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {Object.entries(grouped).map(([vName, progs]) => (
                    <div key={vName}>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#D4950A', marginBottom: '12px', paddingLeft: '4px' }}>
                        {vName}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {progs.map(prog => {
                          const days = daysUntil(prog.nextDue)
                          const isOverdue = days !== null && days < 0
                          const isNearDue = days !== null && days >= 0 && days <= 7
                          const dueColor = isOverdue ? '#e74c3c' : isNearDue ? '#e67e22' : '#7fa8c9'

                          return (
                            <div
                              key={prog.id || prog.name}
                              onClick={() => openProgramDetail(prog)}
                              style={{
                                ...cardStyle,
                                padding: '16px 20px',
                                cursor: 'pointer',
                                transition: 'border-color 0.2s',
                                borderLeft: `3px solid ${programStatusColors[prog.status] || '#7fa8c9'}`,
                              }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = goldBorderActive }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = goldBorder; (e.currentTarget as HTMLElement).style.borderLeftColor = programStatusColors[prog.status] || '#7fa8c9' }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#e8f4fd' }}>{prog.name}</span>
                                    <span style={{
                                      padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 600,
                                      background: `${programStatusColors[prog.status]}18`,
                                      color: programStatusColors[prog.status],
                                    }}>{prog.status}</span>
                                  </div>
                                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: '#7fa8c9' }}>
                                    <span>Sistema: {prog.system}</span>
                                    <span>Frecuencia: {prog.frequency}{prog.frequency === 'POR_HORAS' && prog.frequencyHours ? ` (${prog.frequencyHours}h)` : ''}</span>
                                  </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontSize: '11px', color: '#7fa8c9', marginBottom: '2px' }}>Proximo</div>
                                  <div style={{ fontSize: '13px', fontWeight: 700, color: dueColor }}>
                                    {prog.nextDue ? formatDate(prog.nextDue) : '\u2014'}
                                  </div>
                                  {isOverdue && <div style={{ fontSize: '10px', color: '#e74c3c', fontWeight: 700, marginTop: '2px' }}>VENCIDO</div>}
                                  {isNearDue && <div style={{ fontSize: '10px', color: '#e67e22', fontWeight: 700, marginTop: '2px' }}>PROXIMO</div>}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()
          )}

          {/* ═══ Program Drawer ═══ */}
          {renderDrawer(
            programDrawerMode !== null,
            closeProgramDrawer,
            programDrawerMode === 'new' ? 'Nuevo Programa Preventivo' : programDrawerMode === 'edit' ? 'Editar Programa' : 'Detalle del Programa',
            programDrawerMode === 'view' && selectedProgram ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: '#e8f4fd' }}>{selectedProgram.name}</span>
                  <span style={{
                    padding: '3px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                    background: `${programStatusColors[selectedProgram.status]}18`,
                    color: programStatusColors[selectedProgram.status],
                  }}>{selectedProgram.status}</span>
                </div>

                <div style={{ ...cardStyle, padding: '16px 20px' }}>
                  {([
                    ['Embarcacion', vesselName(selectedProgram.vesselId, selectedProgram.vessel)],
                    ['Sistema', selectedProgram.system],
                    ['Frecuencia', selectedProgram.frequency + (selectedProgram.frequency === 'POR_HORAS' && selectedProgram.frequencyHours ? ` (${selectedProgram.frequencyHours}h)` : '')],
                    ['Descripcion', selectedProgram.description || '\u2014'],
                    ['Ultima Ejecucion', formatDate(selectedProgram.lastExecuted)],
                    ['Proximo Vencimiento', formatDate(selectedProgram.nextDue)],
                    ['Materiales', selectedProgram.materials || '\u2014'],
                    ['Notas', selectedProgram.notes || '\u2014'],
                  ] as [string, string][]).map(([label, value]) => (
                    <div key={label} style={{ padding: '10px 0', borderBottom: `1px solid ${goldBorder}` }}>
                      <div style={{ fontSize: '11px', color: '#7fa8c9', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                      <div style={{ fontSize: '13px', color: '#e8f4fd', lineHeight: '1.5' }}>{value}</div>
                    </div>
                  ))}
                </div>

                {selectedProgram.tasks && (
                  <div style={{ ...cardStyle, padding: '16px 20px' }}>
                    <div style={{ fontSize: '11px', color: '#7fa8c9', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Checklist de Tareas</div>
                    <div style={{ fontSize: '13px', color: '#e8f4fd', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{selectedProgram.tasks}</div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button style={{ ...btnPrimary, flex: 1 }} onClick={openEditProgram}>Editar Programa</button>
                  <button style={btnDanger} onClick={handleDeleteProgram}>Eliminar</button>
                </div>
              </div>
            ) : (
              /* ── Program EDIT / NEW form ── */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Embarcacion *</label>
                  <select value={programForm.vesselId || ''} onChange={e => updateProgramForm('vesselId', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">Seleccionar embarcacion</option>
                    {vessels.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Nombre del Programa *</label>
                  <input type="text" value={programForm.name || ''} onChange={e => updateProgramForm('name', e.target.value)} style={inputStyle} placeholder="Ej: Cambio de aceite Motor Principal" />
                </div>

                <div>
                  <label style={labelStyle}>Descripcion</label>
                  <textarea value={programForm.description || ''} onChange={e => updateProgramForm('description', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Descripcion del programa de mantenimiento..." />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Sistema</label>
                    <select value={programForm.system || systemOptions[0]} onChange={e => updateProgramForm('system', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                      {systemOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Frecuencia</label>
                    <select value={programForm.frequency || 'MENSUAL'} onChange={e => updateProgramForm('frequency', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                      {frequencyOptions.map(f => <option key={f} value={f}>{f.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                </div>

                {programForm.frequency === 'POR_HORAS' && (
                  <div>
                    <label style={labelStyle}>Cada cuantas horas</label>
                    <input type="number" value={programForm.frequencyHours ?? ''} onChange={e => updateProgramForm('frequencyHours', e.target.value ? parseInt(e.target.value) : undefined)} style={inputStyle} placeholder="Ej: 250" min="1" />
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Ultima Ejecucion</label>
                    <input type="date" value={programForm.lastExecuted ? programForm.lastExecuted.slice(0, 10) : ''} onChange={e => updateProgramForm('lastExecuted', e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Proximo Vencimiento</label>
                    <input type="date" value={programForm.nextDue ? programForm.nextDue.slice(0, 10) : ''} onChange={e => updateProgramForm('nextDue', e.target.value)} style={inputStyle} />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Checklist de Tareas</label>
                  <textarea
                    value={programForm.tasks || ''}
                    onChange={e => updateProgramForm('tasks', e.target.value)}
                    rows={5}
                    style={{ ...inputStyle, resize: 'vertical' }}
                    placeholder={"1. Drenar aceite usado\n2. Reemplazar filtro de aceite\n3. Agregar aceite nuevo\n4. Verificar nivel\n5. Registrar horas del motor"}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Materiales</label>
                  <textarea value={programForm.materials || ''} onChange={e => updateProgramForm('materials', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Aceite 15W-40, filtro referencia XYZ..." />
                </div>

                <div>
                  <label style={labelStyle}>Estado</label>
                  <select value={programForm.status || 'ACTIVO'} onChange={e => updateProgramForm('status', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="PAUSADO">PAUSADO</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Notas</label>
                  <textarea value={programForm.notes || ''} onChange={e => updateProgramForm('notes', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Observaciones..." />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button
                    style={{ ...btnPrimary, flex: 1, opacity: saving ? 0.6 : 1 }}
                    onClick={handleSaveProgram}
                    disabled={saving}
                  >
                    {saving ? 'Guardando...' : programDrawerMode === 'new' ? 'Crear Programa' : 'Guardar Cambios'}
                  </button>
                  <button style={btnSecondary} onClick={closeProgramDrawer}>Cancelar</button>
                </div>
              </div>
            )
          )}
        </>
      )}

      {/* ════════════════════ TAB 3: EQUIPOS & HORAS ════════════════════ */}
      {mainTab === 'equipos' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <select
              value={equipVesselFilter}
              onChange={e => setEquipVesselFilter(e.target.value)}
              style={{ ...inputStyle, width: 'auto', minWidth: '200px', cursor: 'pointer' }}
            >
              <option value="">Todas las embarcaciones</option>
              {vessels.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
            <button style={btnPrimary} onClick={openNewEquipment}>+ Nuevo Equipo</button>
          </div>

          {equipmentLoading ? (
            <div style={{ color: '#7fa8c9', padding: '40px', textAlign: 'center' }}>Cargando equipos...</div>
          ) : filteredEquipment.length === 0 ? (
            <div style={{ ...cardStyle, padding: '48px', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>&#9881;</div>
              <div style={{ color: '#7fa8c9', fontSize: '14px' }}>No se encontraron equipos registrados</div>
            </div>
          ) : (
            (() => {
              const grouped: Record<string, Equipment[]> = {}
              filteredEquipment.forEach(eq => {
                const vName = vesselName(eq.vesselId, eq.vessel)
                if (!grouped[vName]) grouped[vName] = []
                grouped[vName].push(eq)
              })
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {Object.entries(grouped).map(([vName, eqs]) => (
                    <div key={vName}>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#D4950A', marginBottom: '12px', paddingLeft: '4px' }}>
                        {vName}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                        {eqs.map(eq => {
                          const reqService = needsService(eq)
                          const displayStatus = reqService && eq.status === 'OPERATIVO' ? 'REQUIERE_SERVICIO' : eq.status
                          const stColor = equipmentStatusColors[displayStatus] || '#7fa8c9'

                          return (
                            <div
                              key={eq.id || eq.name}
                              onClick={() => openEquipDetail(eq)}
                              style={{
                                ...cardStyle,
                                padding: '16px 20px',
                                cursor: 'pointer',
                                transition: 'border-color 0.2s',
                                borderLeft: `3px solid ${stColor}`,
                              }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = goldBorderActive }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = goldBorder; (e.currentTarget as HTMLElement).style.borderLeftColor = stColor }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                <div>
                                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#e8f4fd', marginBottom: '4px' }}>{eq.name}</div>
                                  <div style={{ fontSize: '12px', color: '#7fa8c9' }}>
                                    {equipmentTypeLabels[eq.type] || eq.type}
                                    {eq.brand && ` \u2022 ${eq.brand}`}
                                    {eq.model && ` ${eq.model}`}
                                  </div>
                                </div>
                                <span style={{
                                  padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700,
                                  background: `${stColor}18`,
                                  color: stColor,
                                  whiteSpace: 'nowrap',
                                }}>
                                  {displayStatus.replace('_', ' ')}
                                </span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                                <div style={{ fontSize: '20px', fontWeight: 800, color: '#e8f4fd' }}>
                                  {eq.currentHours.toLocaleString()}h
                                </div>
                                {reqService && (
                                  <div style={{ fontSize: '10px', color: '#e67e22', fontWeight: 700, background: 'rgba(230,126,34,0.12)', padding: '3px 8px', borderRadius: '6px' }}>
                                    REQUIERE SERVICIO
                                  </div>
                                )}
                              </div>
                              {eq.serviceInterval && (
                                <div style={{ marginTop: '6px' }}>
                                  <div style={{ height: '4px', background: '#060c1a', borderRadius: '2px', overflow: 'hidden' }}>
                                    <div style={{
                                      height: '100%',
                                      borderRadius: '2px',
                                      width: `${Math.min(100, ((eq.currentHours - (eq.lastServiceAt || 0)) / eq.serviceInterval) * 100)}%`,
                                      background: reqService ? '#e74c3c' : ((eq.currentHours - (eq.lastServiceAt || 0)) / eq.serviceInterval > 0.8 ? '#e67e22' : '#27ae60'),
                                      transition: 'width 0.3s',
                                    }} />
                                  </div>
                                  <div style={{ fontSize: '10px', color: '#7fa8c9', marginTop: '3px' }}>
                                    {eq.currentHours - (eq.lastServiceAt || 0)}h / {eq.serviceInterval}h hasta servicio
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()
          )}

          {/* ═══ Equipment Drawer ═══ */}
          {renderDrawer(
            equipDrawerMode !== null,
            closeEquipDrawer,
            equipDrawerMode === 'new' ? 'Nuevo Equipo' : equipDrawerMode === 'edit' ? 'Editar Equipo' : equipDrawerMode === 'addHours' ? 'Registrar Horas' : 'Detalle del Equipo',
            equipDrawerMode === 'view' && selectedEquipment ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: '#e8f4fd' }}>{selectedEquipment.name}</span>
                  <span style={{
                    padding: '3px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                    background: `${equipmentStatusColors[selectedEquipment.status]}18`,
                    color: equipmentStatusColors[selectedEquipment.status],
                  }}>{selectedEquipment.status.replace('_', ' ')}</span>
                </div>

                <div style={{ ...cardStyle, padding: '16px 20px' }}>
                  {([
                    ['Embarcacion', vesselName(selectedEquipment.vesselId, selectedEquipment.vessel)],
                    ['Tipo', equipmentTypeLabels[selectedEquipment.type] || selectedEquipment.type],
                    ['Marca', selectedEquipment.brand || '\u2014'],
                    ['Modelo', selectedEquipment.model || '\u2014'],
                    ['Horas Actuales', `${selectedEquipment.currentHours.toLocaleString()}h`],
                    ['Ultimo Servicio', selectedEquipment.lastServiceAt != null ? `${selectedEquipment.lastServiceAt.toLocaleString()}h` : '\u2014'],
                    ['Intervalo de Servicio', selectedEquipment.serviceInterval != null ? `${selectedEquipment.serviceInterval.toLocaleString()}h` : '\u2014'],
                    ['Notas', selectedEquipment.notes || '\u2014'],
                  ] as [string, string][]).map(([label, value]) => (
                    <div key={label} style={{ padding: '10px 0', borderBottom: `1px solid ${goldBorder}` }}>
                      <div style={{ fontSize: '11px', color: '#7fa8c9', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                      <div style={{ fontSize: '13px', color: '#e8f4fd', lineHeight: '1.5' }}>{value}</div>
                    </div>
                  ))}
                </div>

                {needsService(selectedEquipment) && (
                  <div style={{ background: 'rgba(230,126,34,0.08)', border: '1px solid rgba(230,126,34,0.3)', borderRadius: '10px', padding: '14px 18px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#e67e22', marginBottom: '4px' }}>Servicio Requerido</div>
                    <div style={{ fontSize: '12px', color: '#7fa8c9' }}>
                      Este equipo ha superado el intervalo de servicio. Horas desde ultimo servicio: {selectedEquipment.currentHours - (selectedEquipment.lastServiceAt || 0)}h
                    </div>
                  </div>
                )}

                {/* Hour logs */}
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#e8f4fd', marginBottom: '10px' }}>Historial de Lecturas</div>
                  {hourLogs.length === 0 ? (
                    <div style={{ ...cardStyle, padding: '20px', textAlign: 'center', color: '#7fa8c9', fontSize: '13px' }}>
                      Sin lecturas registradas
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                      {hourLogs.map((log, idx) => (
                        <div key={log.id || idx} style={{ background: '#060c1a', border: `1px solid ${goldBorder}`, borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#e8f4fd' }}>{log.hours.toLocaleString()}h</div>
                            <div style={{ fontSize: '11px', color: '#7fa8c9' }}>{formatDate(log.readingDate)}</div>
                          </div>
                          {log.notes && <div style={{ fontSize: '11px', color: '#7fa8c9', maxWidth: '200px', textAlign: 'right' }}>{log.notes}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button style={{ ...btnPrimary, flex: 1 }} onClick={() => setEquipDrawerMode('addHours')}>Registrar Horas</button>
                  <button style={{ ...btnSecondary, flex: 1 }} onClick={openEditEquipment}>Editar Equipo</button>
                  <button style={btnDanger} onClick={handleDeleteEquipment}>Eliminar</button>
                </div>
              </div>
            ) : equipDrawerMode === 'addHours' && selectedEquipment ? (
              /* ── Add hours form ── */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ ...cardStyle, padding: '16px 20px' }}>
                  <div style={{ fontSize: '13px', color: '#7fa8c9', marginBottom: '4px' }}>Equipo</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#e8f4fd' }}>{selectedEquipment.name}</div>
                  <div style={{ fontSize: '12px', color: '#7fa8c9', marginTop: '4px' }}>Horas actuales: {selectedEquipment.currentHours.toLocaleString()}h</div>
                </div>

                <div>
                  <label style={labelStyle}>Lectura de Horas *</label>
                  <input type="number" value={hourForm.hours || ''} onChange={e => setHourForm(prev => ({ ...prev, hours: parseFloat(e.target.value) || 0 }))} style={inputStyle} placeholder="Ej: 1250" min="0" />
                </div>

                <div>
                  <label style={labelStyle}>Fecha de Lectura *</label>
                  <input type="date" value={hourForm.readingDate} onChange={e => setHourForm(prev => ({ ...prev, readingDate: e.target.value }))} style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Notas</label>
                  <textarea value={hourForm.notes} onChange={e => setHourForm(prev => ({ ...prev, notes: e.target.value }))} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Observaciones de la lectura..." />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button
                    style={{ ...btnPrimary, flex: 1, opacity: saving ? 0.6 : 1 }}
                    onClick={handleAddHourLog}
                    disabled={saving}
                  >
                    {saving ? 'Guardando...' : 'Registrar Lectura'}
                  </button>
                  <button style={btnSecondary} onClick={() => setEquipDrawerMode('view')}>Cancelar</button>
                </div>
              </div>
            ) : (
              /* ── Equipment EDIT / NEW form ── */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Embarcacion *</label>
                  <select value={equipForm.vesselId || ''} onChange={e => updateEquipForm('vesselId', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">Seleccionar embarcacion</option>
                    {vessels.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Nombre del Equipo *</label>
                  <input type="text" value={equipForm.name || ''} onChange={e => updateEquipForm('name', e.target.value)} style={inputStyle} placeholder="Ej: Motor Principal Babor" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Tipo</label>
                    <select value={equipForm.type || 'MOTOR_PRINCIPAL'} onChange={e => updateEquipForm('type', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                      {equipmentTypeOptions.map(t => <option key={t} value={t}>{equipmentTypeLabels[t] || t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Estado</label>
                    <select value={equipForm.status || 'OPERATIVO'} onChange={e => updateEquipForm('status', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                      <option value="OPERATIVO">OPERATIVO</option>
                      <option value="REQUIERE_SERVICIO">REQUIERE SERVICIO</option>
                      <option value="FUERA_SERVICIO">FUERA DE SERVICIO</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Marca</label>
                    <input type="text" value={equipForm.brand || ''} onChange={e => updateEquipForm('brand', e.target.value)} style={inputStyle} placeholder="Ej: Caterpillar" />
                  </div>
                  <div>
                    <label style={labelStyle}>Modelo</label>
                    <input type="text" value={equipForm.model || ''} onChange={e => updateEquipForm('model', e.target.value)} style={inputStyle} placeholder="Ej: C32 ACERT" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Horas Actuales</label>
                    <input type="number" value={equipForm.currentHours ?? 0} onChange={e => updateEquipForm('currentHours', parseFloat(e.target.value) || 0)} style={inputStyle} placeholder="0" min="0" />
                  </div>
                  <div>
                    <label style={labelStyle}>Ult. Servicio (h)</label>
                    <input type="number" value={equipForm.lastServiceAt ?? ''} onChange={e => updateEquipForm('lastServiceAt', e.target.value ? parseFloat(e.target.value) : 0)} style={inputStyle} placeholder="0" min="0" />
                  </div>
                  <div>
                    <label style={labelStyle}>Intervalo (h)</label>
                    <input type="number" value={equipForm.serviceInterval ?? ''} onChange={e => updateEquipForm('serviceInterval', e.target.value ? parseFloat(e.target.value) : undefined)} style={inputStyle} placeholder="250" min="1" />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Notas</label>
                  <textarea value={equipForm.notes || ''} onChange={e => updateEquipForm('notes', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Observaciones del equipo..." />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button
                    style={{ ...btnPrimary, flex: 1, opacity: saving ? 0.6 : 1 }}
                    onClick={handleSaveEquipment}
                    disabled={saving}
                  >
                    {saving ? 'Guardando...' : equipDrawerMode === 'new' ? 'Crear Equipo' : 'Guardar Cambios'}
                  </button>
                  <button style={btnSecondary} onClick={closeEquipDrawer}>Cancelar</button>
                </div>
              </div>
            )
          )}
        </>
      )}
    </div>
  )
}
