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
}

type StatusFilter = 'TODOS' | 'PENDIENTE' | 'PLANIFICADO' | 'EN_PROCESO' | 'COMPLETADO'

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

const systemOptions = [
  'Motor Principal',
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

const labelStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#7fa8c9',
  marginBottom: '4px',
  display: 'block',
  fontWeight: 600,
}

/* ─── Blank form ─── */
const blankForm = (): Partial<MaintenanceOrder> => ({
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
})

/* ═══════════════════════ MAIN PAGE ═══════════════════════ */
export default function MaintenancePage() {
  const [orders, setOrders] = useState<MaintenanceOrder[]>([])
  const [vessels, setVessels] = useState<Vessel[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('TODOS')
  const [vesselFilter, setVesselFilter] = useState<string>('')
  const [selectedOrder, setSelectedOrder] = useState<MaintenanceOrder | null>(null)
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'new' | null>(null)
  const [form, setForm] = useState<Partial<MaintenanceOrder>>(blankForm())
  const [saving, setSaving] = useState(false)

  /* ─── Fetch data ─── */
  const fetchOrders = useCallback(async () => {
    try {
      const data = await api('/api/maintenance-orders')
      setOrders(Array.isArray(data) ? data : data.orders ?? data.data ?? [])
    } catch { setOrders([]) }
  }, [])

  const fetchVessels = useCallback(async () => {
    try {
      const data = await api('/api/vessels')
      setVessels(Array.isArray(data) ? data : data.vessels ?? data.data ?? [])
    } catch { setVessels([]) }
  }, [])

  useEffect(() => {
    Promise.all([fetchOrders(), fetchVessels()]).finally(() => setLoading(false))
  }, [fetchOrders, fetchVessels])

  /* ─── Derived data ─── */
  const filtered = orders.filter(o => {
    if (statusFilter !== 'TODOS' && o.status !== statusFilter) return false
    if (vesselFilter && o.vesselId !== vesselFilter) return false
    return true
  })

  const total = orders.length
  const pendientes = orders.filter(o => o.status === 'PENDIENTE').length
  const enProceso = orders.filter(o => o.status === 'EN_PROCESO').length
  const criticas = orders.filter(o => o.priority === 'CRITICA').length

  /* ─── Helpers ─── */
  const vesselName = (o: MaintenanceOrder) =>
    o.vessel?.name ?? vessels.find(v => v.id === o.vesselId)?.name ?? 'Sin embarcación'

  const formatDate = (d?: string) => {
    if (!d) return '—'
    try { return new Date(d).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' }) } catch { return d }
  }

  const formatCost = (c?: number) => {
    if (c == null) return '—'
    return `$${c.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  /* ─── Drawer actions ─── */
  function openDetail(o: MaintenanceOrder) {
    setSelectedOrder(o)
    setForm({ ...o })
    setDrawerMode('view')
  }

  function openNew() {
    setSelectedOrder(null)
    setForm(blankForm())
    setDrawerMode('new')
  }

  function openEdit() {
    setDrawerMode('edit')
  }

  function closeDrawer() {
    setDrawerMode(null)
    setSelectedOrder(null)
  }

  function updateForm(key: string, value: unknown) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (drawerMode === 'new') {
        await api('/api/maintenance-orders', { method: 'POST', body: JSON.stringify(form) })
      } else if (drawerMode === 'edit' && selectedOrder) {
        await api(`/api/maintenance-orders/${selectedOrder.id}`, { method: 'PUT', body: JSON.stringify(form) })
      }
      await fetchOrders()
      closeDrawer()
    } catch (e) {
      alert('Error al guardar: ' + (e instanceof Error ? e.message : 'desconocido'))
    } finally {
      setSaving(false)
    }
  }

  /* ─── Render ─── */
  if (loading) {
    return (
      <div style={{ color: '#7fa8c9', padding: '40px', textAlign: 'center' }}>
        Cargando órdenes de mantenimiento...
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#e8f4fd' }}>Mantenimiento</div>
          <div style={{ fontSize: '13px', color: '#7fa8c9', marginTop: '4px' }}>
            Órdenes de mantenimiento — {total} registradas
          </div>
        </div>
        <button style={btnPrimary} onClick={openNew}>+ Nueva Orden</button>
      </div>

      {/* ── KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {([
          { label: 'Total Órdenes', value: total, color: '#e8f4fd', icon: '🔧' },
          { label: 'Pendientes', value: pendientes, color: '#e67e22', icon: '⏳' },
          { label: 'En Proceso', value: enProceso, color: '#D4950A', icon: '⚙️' },
          { label: 'Críticas', value: criticas, color: '#e74c3c', icon: '🚨' },
        ] as const).map((kpi) => (
          <div key={kpi.label} style={{ ...cardStyle, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ fontSize: '28px' }}>{kpi.icon}</div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
              <div style={{ fontSize: '12px', color: '#7fa8c9', marginTop: '2px' }}>{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Status tabs */}
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

        {/* Vessel filter */}
        <select
          value={vesselFilter}
          onChange={e => setVesselFilter(e.target.value)}
          style={{
            ...inputStyle,
            width: 'auto',
            minWidth: '180px',
            cursor: 'pointer',
          }}
        >
          <option value="">Todas las embarcaciones</option>
          {vessels.map(v => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
      </div>

      {/* ── Orders list ── */}
      {filtered.length === 0 ? (
        <div style={{ ...cardStyle, padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔧</div>
          <div style={{ color: '#7fa8c9', fontSize: '14px' }}>No se encontraron órdenes de mantenimiento</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(order => (
            <div
              key={order.id}
              onClick={() => openDetail(order)}
              style={{
                ...cardStyle,
                padding: '18px 22px',
                cursor: 'pointer',
                transition: 'border-color 0.2s, transform 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = goldBorderActive
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = goldBorder
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                {/* Left side */}
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: '#e8f4fd' }}>{vesselName(order)}</span>
                    {/* Type badge */}
                    <span style={{
                      padding: '2px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: 'rgba(127,168,201,0.12)',
                      color: '#7fa8c9',
                      border: '1px solid rgba(127,168,201,0.2)',
                    }}>
                      {order.type}
                    </span>
                    {/* Priority badge */}
                    <span style={{
                      padding: '2px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: `${priorityColors[order.priority]}18`,
                      color: priorityColors[order.priority],
                      border: `1px solid ${priorityColors[order.priority]}40`,
                    }}>
                      {order.priority}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#c8dce8', marginBottom: '6px', lineHeight: '1.4' }}>
                    {order.description || 'Sin descripción'}
                  </div>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: '#7fa8c9' }}>
                    {order.system && <span>Sistema: {order.system}</span>}
                    {order.technician && <span>Técnico: {order.technician}</span>}
                    {order.dueDate && <span>Vence: {formatDate(order.dueDate)}</span>}
                    {order.cost != null && <span>Costo: {formatCost(order.cost)}</span>}
                  </div>
                </div>

                {/* Status badge */}
                <div style={{
                  padding: '5px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
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

      {/* ═══ Drawer overlay ═══ */}
      {drawerMode && (
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
          {/* Backdrop */}
          <div
            onClick={closeDrawer}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(2px)',
            }}
          />

          {/* Drawer panel */}
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
          }}>
            {/* Drawer header */}
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
              <div style={{ fontSize: '17px', fontWeight: 700, color: '#e8f4fd' }}>
                {drawerMode === 'new' ? 'Nueva Orden de Mantenimiento' : drawerMode === 'edit' ? 'Editar Orden' : 'Detalle de Orden'}
              </div>
              <button onClick={closeDrawer} style={{ background: 'none', border: 'none', color: '#7fa8c9', fontSize: '22px', cursor: 'pointer', lineHeight: 1 }}>
                ✕
              </button>
            </div>

            {/* Drawer body */}
            <div style={{ padding: '24px', flex: 1 }}>
              {drawerMode === 'view' && selectedOrder ? (
                /* ── VIEW MODE ── */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {/* Vessel + type */}
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '18px', fontWeight: 800, color: '#e8f4fd' }}>{vesselName(selectedOrder)}</span>
                    <span style={{
                      padding: '3px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                      background: 'rgba(127,168,201,0.12)', color: '#7fa8c9',
                    }}>{selectedOrder.type}</span>
                  </div>

                  {/* Priority + Status */}
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

                  {/* Details grid */}
                  <div style={{ ...cardStyle, padding: '16px 20px' }}>
                    {([
                      ['Descripción', selectedOrder.description || '—'],
                      ['Sistema', selectedOrder.system || '—'],
                      ['Técnico', selectedOrder.technician || '—'],
                      ['Fecha de vencimiento', formatDate(selectedOrder.dueDate)],
                      ['Costo', formatCost(selectedOrder.cost)],
                      ['Repuestos', selectedOrder.spareParts || '—'],
                      ['Notas', selectedOrder.notes || '—'],
                    ] as [string, string][]).map(([label, value]) => (
                      <div key={label} style={{ padding: '10px 0', borderBottom: `1px solid ${goldBorder}` }}>
                        <div style={{ fontSize: '11px', color: '#7fa8c9', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                        <div style={{ fontSize: '13px', color: '#e8f4fd', lineHeight: '1.5' }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  <button style={btnPrimary} onClick={openEdit}>Editar Orden</button>
                </div>
              ) : (
                /* ── EDIT / NEW MODE (form) ── */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Vessel */}
                  <div>
                    <label style={labelStyle}>Embarcación *</label>
                    <select
                      value={form.vesselId || ''}
                      onChange={e => updateForm('vesselId', e.target.value)}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      <option value="">Seleccionar embarcación</option>
                      {vessels.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Type */}
                  <div>
                    <label style={labelStyle}>Tipo *</label>
                    <select
                      value={form.type || 'PREVENTIVO'}
                      onChange={e => updateForm('type', e.target.value)}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      {typeOptions.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label style={labelStyle}>Descripción *</label>
                    <textarea
                      value={form.description || ''}
                      onChange={e => updateForm('description', e.target.value)}
                      rows={3}
                      style={{ ...inputStyle, resize: 'vertical' }}
                      placeholder="Descripción del trabajo de mantenimiento..."
                    />
                  </div>

                  {/* Priority */}
                  <div>
                    <label style={labelStyle}>Prioridad</label>
                    <select
                      value={form.priority || 'MEDIA'}
                      onChange={e => updateForm('priority', e.target.value)}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      {priorityOptions.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  {/* System */}
                  <div>
                    <label style={labelStyle}>Sistema</label>
                    <select
                      value={form.system || systemOptions[0]}
                      onChange={e => updateForm('system', e.target.value)}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      {systemOptions.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Due Date */}
                  <div>
                    <label style={labelStyle}>Fecha de vencimiento</label>
                    <input
                      type="date"
                      value={form.dueDate ? form.dueDate.slice(0, 10) : ''}
                      onChange={e => updateForm('dueDate', e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  {/* Technician */}
                  <div>
                    <label style={labelStyle}>Técnico asignado</label>
                    <input
                      type="text"
                      value={form.technician || ''}
                      onChange={e => updateForm('technician', e.target.value)}
                      style={inputStyle}
                      placeholder="Nombre del técnico"
                    />
                  </div>

                  {/* Spare parts */}
                  <div>
                    <label style={labelStyle}>Repuestos</label>
                    <textarea
                      value={form.spareParts || ''}
                      onChange={e => updateForm('spareParts', e.target.value)}
                      rows={2}
                      style={{ ...inputStyle, resize: 'vertical' }}
                      placeholder="Lista de repuestos necesarios..."
                    />
                  </div>

                  {/* Cost */}
                  <div>
                    <label style={labelStyle}>Costo ($)</label>
                    <input
                      type="number"
                      value={form.cost ?? ''}
                      onChange={e => updateForm('cost', e.target.value ? parseFloat(e.target.value) : undefined)}
                      style={inputStyle}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label style={labelStyle}>Estado</label>
                    <select
                      value={form.status || 'PENDIENTE'}
                      onChange={e => updateForm('status', e.target.value)}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      {statusOptions.map(s => (
                        <option key={s} value={s}>{s.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>

                  {/* Notes */}
                  <div>
                    <label style={labelStyle}>Notas</label>
                    <textarea
                      value={form.notes || ''}
                      onChange={e => updateForm('notes', e.target.value)}
                      rows={3}
                      style={{ ...inputStyle, resize: 'vertical' }}
                      placeholder="Observaciones adicionales..."
                    />
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <button
                      style={{ ...btnPrimary, flex: 1, opacity: saving ? 0.6 : 1 }}
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? 'Guardando...' : drawerMode === 'new' ? 'Crear Orden' : 'Guardar Cambios'}
                    </button>
                    <button style={btnSecondary} onClick={closeDrawer}>Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
