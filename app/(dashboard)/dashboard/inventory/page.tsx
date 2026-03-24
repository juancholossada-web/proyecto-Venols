'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'

/* ─── Types ─── */
type Vessel = { id: string; name: string }
type InventoryItem = {
  id: string; vesselId: string; name: string; category: string
  quantity: number; unit: string; minStock: number
  location?: string | null; supplier?: string | null; notes?: string | null
  vessel?: { id: string; name: string }
}
type FormData = {
  vesselId: string; name: string; category: string; quantity: string
  unit: string; minStock: string; location: string; supplier: string; notes: string
}
type Movement = {
  id: string; inventoryItemId: string; type: 'ENTRADA' | 'SALIDA'
  quantity: number; reason?: string | null; reference?: string | null
  executedBy?: string | null; date: string; notes?: string | null
  balanceAfter?: number | null
}
type MovementForm = {
  type: 'ENTRADA' | 'SALIDA'; quantity: string; reason: string
  reference: string; executedBy: string; date: string; notes: string
}

const CATEGORIES = ['Lubricantes', 'Repuestos', 'Aparejos', 'Seguridad', 'Mantenimiento', 'Otros']
const emptyForm: FormData = { vesselId: '', name: '', category: 'Lubricantes', quantity: '', unit: 'unidad', minStock: '0', location: '', supplier: '', notes: '' }
const emptyMovementForm: MovementForm = {
  type: 'ENTRADA', quantity: '', reason: '', reference: '', executedBy: '',
  date: new Date().toISOString().slice(0, 16), notes: '',
}

/* ─── API helper ─── */
function getToken() { return localStorage.getItem('token') || '' }
async function api(path: string, opts?: RequestInit) {
  const res = await fetch(path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...opts?.headers },
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `API ${res.status}`)
  }
  return res.json()
}

/* ─── Styles ─── */
const goldBorder = 'var(--border-accent)'
const goldBorderActive = 'var(--border-accent-strong)'

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-surface)', border: '1px solid var(--border-accent)', borderRadius: '12px', padding: '18px',
}
const kpiStyle: React.CSSProperties = {
  ...cardStyle, flex: '1 1 200px', minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '6px',
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-accent)',
  borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
}
const selectStyle: React.CSSProperties = {
  ...inputStyle, appearance: 'none' as const, cursor: 'pointer',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%237fa8c9'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
}
const btnPrimary: React.CSSProperties = {
  padding: '10px 20px', background: 'var(--accent)', border: 'none',
  borderRadius: '8px', color: '#080E1A', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
}
const btnSecondary: React.CSSProperties = {
  padding: '8px 14px', background: 'transparent', border: '1px solid var(--border-accent)',
  borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer',
}
const btnDanger: React.CSSProperties = {
  padding: '8px 14px', background: 'transparent', border: '1px solid rgba(176,48,40,0.40)',
  borderRadius: '8px', color: 'var(--danger)', fontSize: '12px', cursor: 'pointer',
}
const labelStyle: React.CSSProperties = { fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }
const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
  zIndex: 1000, display: 'flex', justifyContent: 'flex-end',
}
const drawerStyle: React.CSSProperties = {
  width: '520px', maxWidth: '100vw', height: '100%', background: 'var(--bg-elevated)',
  borderLeft: `1px solid ${goldBorder}`, overflowY: 'auto', padding: '28px 24px',
  display: 'flex', flexDirection: 'column', gap: '16px',
  animation: 'slideInRight 0.3s ease-out',
}

/* ─── Category config ─── */
const catColors: Record<string, { bg: string; color: string }> = {
  Lubricantes: { bg: 'rgba(212,149,10,0.12)', color: 'var(--accent)' },
  Repuestos: { bg: 'rgba(127,168,201,0.12)', color: 'var(--text-muted)' },
  Aparejos: { bg: 'rgba(39,174,96,0.12)', color: 'var(--success)' },
  Seguridad: { bg: 'rgba(231,76,60,0.12)', color: 'var(--danger)' },
  Mantenimiento: { bg: 'rgba(142,68,173,0.12)', color: '#8e44ad' },
  Otros: { bg: 'rgba(71,100,126,0.12)', color: 'var(--text-muted)' },
}

/* ═════════════════════ MAIN PAGE ═════════════════════ */
export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [vessels, setVessels] = useState<Vessel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  /* Filters */
  const [filterVessel, setFilterVessel] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [search, setSearch] = useState('')

  /* View mode */
  const [viewMode, setViewMode] = useState<'general' | 'vessel'>('vessel')

  /* Drawer */
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  /* Drawer tabs */
  const [drawerTab, setDrawerTab] = useState<'detalle' | 'movimientos'>('detalle')

  /* Movements */
  const [movements, setMovements] = useState<Movement[]>([])
  const [loadingMovements, setLoadingMovements] = useState(false)
  const [movementForm, setMovementForm] = useState<MovementForm>(emptyMovementForm)
  const [savingMovement, setSavingMovement] = useState(false)
  const [movementError, setMovementError] = useState('')

  /* Style injection ref */
  const styleInjected = useRef(false)

  useEffect(() => {
    if (styleInjected.current) return
    styleInjected.current = true
    const style = document.createElement('style')
    style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes pulseRed {
        0%, 100% { border-color: rgba(231,76,60,0.3); }
        50% { border-color: rgba(231,76,60,0.7); }
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-8px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `
    document.head.appendChild(style)
  }, [])

  /* ─── Fetch data ─── */
  const loadData = useCallback(async () => {
    try {
      const [inv, ves] = await Promise.all([api('/api/inventory'), api('/api/vessels')])
      setItems(inv)
      setVessels(ves.map((v: any) => ({ id: v.id, name: v.name })))
    } catch {
      setError('Error cargando datos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  /* ─── Load movements for an item ─── */
  const loadMovements = useCallback(async (itemId: string) => {
    setLoadingMovements(true)
    try {
      const data = await api(`/api/inventory/${itemId}/movements`)
      setMovements(Array.isArray(data) ? data : [])
    } catch {
      setMovements([])
    } finally {
      setLoadingMovements(false)
    }
  }, [])

  /* ─── KPIs ─── */
  const totalItems = items.length
  const lowStockItems = useMemo(() => items.filter(i => i.quantity <= i.minStock), [items])
  const lowStock = lowStockItems.length
  const distinctCategories = new Set(items.map(i => i.category)).size
  const vesselsWithInventory = new Set(items.map(i => i.vesselId)).size

  /* ─── Filtered items ─── */
  const filtered = useMemo(() => {
    return items.filter(i => {
      if (filterVessel && i.vesselId !== filterVessel) return false
      if (filterCategory && i.category !== filterCategory) return false
      if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [items, filterVessel, filterCategory, search])

  /* ─── Grouped by vessel ─── */
  const grouped = useMemo(() => {
    const map: Record<string, { vesselName: string; items: InventoryItem[]; lowStockCount: number }> = {}
    filtered.forEach(item => {
      const vName = item.vessel?.name || vessels.find(v => v.id === item.vesselId)?.name || 'Sin embarcacion'
      if (!map[item.vesselId]) map[item.vesselId] = { vesselName: vName, items: [], lowStockCount: 0 }
      map[item.vesselId].items.push(item)
      if (item.quantity <= item.minStock) map[item.vesselId].lowStockCount++
    })
    return Object.entries(map).sort((a, b) => a[1].vesselName.localeCompare(b[1].vesselName))
  }, [filtered, vessels])

  /* ─── Drawer handlers ─── */
  function openNew() {
    setEditingItem(null)
    setForm(emptyForm)
    setFormError('')
    setDrawerTab('detalle')
    setMovements([])
    setDrawerOpen(true)
  }

  function openEdit(item: InventoryItem) {
    setEditingItem(item)
    setForm({
      vesselId: item.vesselId,
      name: item.name,
      category: item.category,
      quantity: String(item.quantity),
      unit: item.unit,
      minStock: String(item.minStock),
      location: item.location || '',
      supplier: item.supplier || '',
      notes: item.notes || '',
    })
    setFormError('')
    setDrawerTab('detalle')
    setMovementForm({ ...emptyMovementForm, date: new Date().toISOString().slice(0, 16) })
    setMovementError('')
    setDrawerOpen(true)
    loadMovements(item.id)
  }

  function closeDrawer() {
    setDrawerOpen(false)
    setEditingItem(null)
    setFormError('')
    setMovementError('')
  }

  function updateField(field: keyof FormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function updateMovementField(field: keyof MovementForm, value: string) {
    setMovementForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    if (!form.name.trim() || !form.vesselId) return
    setSaving(true)
    setFormError('')
    try {
      if (editingItem) {
        await api(`/api/inventory/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: form.name, category: form.category, quantity: form.quantity,
            unit: form.unit, minStock: form.minStock, location: form.location || null,
            supplier: form.supplier || null, notes: form.notes || null,
          }),
        })
      } else {
        await api('/api/inventory', {
          method: 'POST',
          body: JSON.stringify(form),
        })
      }
      await loadData()
      closeDrawer()
    } catch (err: any) {
      const msg = err?.message || ''
      if (msg.includes('409') || msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('ya existe')) {
        setFormError('Ya existe un producto con ese nombre en esta embarcacion')
      } else {
        setFormError(msg || 'Error al guardar')
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!editingItem) return
    if (!confirm('Eliminar este item del inventario?')) return
    setSaving(true)
    try {
      await api(`/api/inventory/${editingItem.id}`, { method: 'DELETE' })
      await loadData()
      closeDrawer()
    } catch {
      setFormError('Error al eliminar')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveMovement() {
    if (!editingItem) return
    if (!movementForm.quantity || Number(movementForm.quantity) <= 0) {
      setMovementError('La cantidad debe ser mayor a 0')
      return
    }
    setSavingMovement(true)
    setMovementError('')
    try {
      await api(`/api/inventory/${editingItem.id}/movements`, {
        method: 'POST',
        body: JSON.stringify({
          type: movementForm.type,
          quantity: Number(movementForm.quantity),
          reason: movementForm.reason || null,
          reference: movementForm.reference || null,
          executedBy: movementForm.executedBy || null,
          date: movementForm.date || new Date().toISOString(),
          notes: movementForm.notes || null,
        }),
      })
      await Promise.all([loadData(), loadMovements(editingItem.id)])
      setMovementForm({ ...emptyMovementForm, date: new Date().toISOString().slice(0, 16) })
    } catch (err: any) {
      setMovementError(err?.message || 'Error al registrar movimiento')
    } finally {
      setSavingMovement(false)
    }
  }

  /* ─── Loading / Error ─── */
  if (loading) return (
    <div style={{ color: 'var(--text-muted)', padding: '40px', textAlign: 'center' }}>Cargando inventario...</div>
  )
  if (error) return (
    <div style={{ color: 'var(--danger)', padding: '40px', textAlign: 'center' }}>{error}</div>
  )

  /* ─── Stock bar component ─── */
  function StockBar({ quantity, minStock }: { quantity: number; minStock: number }) {
    const isLow = quantity <= minStock
    const max = Math.max(minStock * 2, quantity, 1)
    const pct = Math.min((quantity / max) * 100, 100)
    const color = isLow ? 'var(--danger)' : 'var(--success)'
    return (
      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '3px', transition: 'width 0.3s ease' }} />
      </div>
    )
  }

  /* ─── Format date ─── */
  function formatDate(dateStr: string) {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch {
      return dateStr
    }
  }

  /* ─── Render item card ─── */
  function renderItemCard(item: InventoryItem, showVessel = false) {
    const isLow = item.quantity <= item.minStock
    const cat = catColors[item.category] || catColors.Otros
    return (
      <div
        key={item.id}
        onClick={() => openEdit(item)}
        style={{
          ...cardStyle,
          cursor: 'pointer',
          transition: 'border-color 0.2s ease, transform 0.15s ease',
          ...(isLow ? { animation: 'pulseRed 2s ease-in-out infinite' } : {}),
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = goldBorderActive;
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = isLow ? 'rgba(231,76,60,0.3)' : goldBorder;
          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
        }}
      >
        {/* Category badge + low stock */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{
            fontSize: '10px', fontWeight: 600, padding: '3px 10px', borderRadius: '6px',
            background: cat.bg, color: cat.color, textTransform: 'uppercase', letterSpacing: '0.5px',
          }}>
            {item.category}
          </span>
          {isLow && (
            <span style={{
              fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px',
              background: 'rgba(231,76,60,0.15)', color: 'var(--danger)', border: '1px solid rgba(231,76,60,0.3)',
            }}>
              BAJO STOCK
            </span>
          )}
        </div>

        {/* Name */}
        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
          {item.name}
        </div>

        {/* Vessel label in general view */}
        {showVessel && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
            {item.vessel?.name || vessels.find(v => v.id === item.vesselId)?.name || ''}
          </div>
        )}

        {/* Quantity */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Cantidad</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: isLow ? 'var(--danger)' : 'var(--text-primary)' }}>
            {item.quantity} <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)' }}>{item.unit}</span>
          </span>
        </div>

        {/* Stock bar */}
        <div style={{ marginBottom: '6px' }}>
          <StockBar quantity={item.quantity} minStock={item.minStock} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Min: {item.minStock}</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{Math.round((item.quantity / Math.max(item.minStock * 2, item.quantity, 1)) * 100)}%</span>
          </div>
        </div>

        {/* Supplier */}
        {item.supplier && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', borderTop: `1px solid ${goldBorder}`, paddingTop: '8px' }}>
            Proveedor: <span style={{ color: 'var(--text-muted)' }}>{item.supplier}</span>
          </div>
        )}
      </div>
    )
  }

  /* ─── Drawer: Detail Tab ─── */
  function renderDetailTab() {
    return (
      <>
        {/* Vessel select (only for new items) */}
        {!editingItem && (
          <div>
            <label style={labelStyle}>Embarcacion *</label>
            <select style={selectStyle} value={form.vesselId} onChange={e => updateField('vesselId', e.target.value)}>
              <option value="">Seleccionar embarcacion</option>
              {vessels.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
        )}

        {/* Name */}
        <div>
          <label style={labelStyle}>Nombre *</label>
          <input style={inputStyle} value={form.name} onChange={e => updateField('name', e.target.value)} placeholder="Nombre del item" />
        </div>

        {/* Category */}
        <div>
          <label style={labelStyle}>Categoria</label>
          <select style={selectStyle} value={form.category} onChange={e => updateField('category', e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Quantity + Unit row */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Cantidad</label>
            <input
              style={inputStyle}
              type="number"
              min="0"
              value={form.quantity}
              onChange={e => updateField('quantity', e.target.value)}
              placeholder="0"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Unidad</label>
            <input style={inputStyle} value={form.unit} onChange={e => updateField('unit', e.target.value)} placeholder="unidad" />
          </div>
        </div>

        {/* Min stock */}
        <div>
          <label style={labelStyle}>Stock Minimo</label>
          <input
            style={inputStyle}
            type="number"
            min="0"
            value={form.minStock}
            onChange={e => updateField('minStock', e.target.value)}
            placeholder="0"
          />
        </div>

        {/* Location */}
        <div>
          <label style={labelStyle}>Ubicacion</label>
          <input style={inputStyle} value={form.location} onChange={e => updateField('location', e.target.value)} placeholder="Ej: Bodega proa, Sala maquinas..." />
        </div>

        {/* Supplier */}
        <div>
          <label style={labelStyle}>Proveedor</label>
          <input style={inputStyle} value={form.supplier} onChange={e => updateField('supplier', e.target.value)} placeholder="Nombre del proveedor" />
        </div>

        {/* Notes */}
        <div>
          <label style={labelStyle}>Notas</label>
          <textarea
            style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }}
            value={form.notes}
            onChange={e => updateField('notes', e.target.value)}
            placeholder="Observaciones adicionales..."
          />
        </div>

        {/* Error message */}
        {formError && (
          <div style={{
            padding: '10px 14px', borderRadius: '8px', fontSize: '13px',
            background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', color: 'var(--danger)',
          }}>
            {formError}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
          <button
            style={{ ...btnPrimary, flex: 1, opacity: saving ? 0.6 : 1 }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Guardando...' : editingItem ? 'Actualizar' : 'Crear Item'}
          </button>
          <button style={btnSecondary} onClick={closeDrawer}>Cancelar</button>
        </div>

        {/* Delete button (edit mode only) */}
        {editingItem && (
          <button
            style={{ ...btnDanger, width: '100%', marginTop: '4px', opacity: saving ? 0.6 : 1 }}
            onClick={handleDelete}
            disabled={saving}
          >
            Eliminar Item
          </button>
        )}
      </>
    )
  }

  /* ─── Drawer: Movements Tab ─── */
  function renderMovementsTab() {
    if (!editingItem) return null

    const currentItem = items.find(i => i.id === editingItem.id) || editingItem

    return (
      <>
        {/* Current stock summary */}
        <div style={{
          ...cardStyle, padding: '14px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Stock Actual</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: currentItem.quantity <= currentItem.minStock ? 'var(--danger)' : 'var(--text-primary)' }}>
              {currentItem.quantity} <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-muted)' }}>{currentItem.unit}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Min: {currentItem.minStock}</div>
            <StockBar quantity={currentItem.quantity} minStock={currentItem.minStock} />
          </div>
        </div>

        {/* New movement form */}
        <div style={{
          ...cardStyle, padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px',
        }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Registrar Movimiento</div>

          {/* Type toggle */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => updateMovementField('type', 'ENTRADA')}
              style={{
                flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: '13px', transition: 'all 0.2s',
                background: movementForm.type === 'ENTRADA' ? 'rgba(39,174,96,0.2)' : '#080E1A',
                color: movementForm.type === 'ENTRADA' ? 'var(--success)' : 'var(--text-secondary)',
                outline: movementForm.type === 'ENTRADA' ? '2px solid rgba(39,174,96,0.5)' : `1px solid ${goldBorder}`,
              }}
            >
              ENTRADA
            </button>
            <button
              onClick={() => updateMovementField('type', 'SALIDA')}
              style={{
                flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: '13px', transition: 'all 0.2s',
                background: movementForm.type === 'SALIDA' ? 'rgba(231,76,60,0.2)' : '#080E1A',
                color: movementForm.type === 'SALIDA' ? 'var(--danger)' : 'var(--text-secondary)',
                outline: movementForm.type === 'SALIDA' ? '2px solid rgba(231,76,60,0.5)' : `1px solid ${goldBorder}`,
              }}
            >
              SALIDA
            </button>
          </div>

          {/* Quantity */}
          <div>
            <label style={labelStyle}>Cantidad *</label>
            <input
              style={inputStyle}
              type="number"
              min="1"
              value={movementForm.quantity}
              onChange={e => updateMovementField('quantity', e.target.value)}
              placeholder="0"
            />
          </div>

          {/* Reason */}
          <div>
            <label style={labelStyle}>Motivo</label>
            <select
              style={selectStyle}
              value={movementForm.reason}
              onChange={e => updateMovementField('reason', e.target.value)}
            >
              <option value="">Seleccionar motivo</option>
              <option value="Reabastecimiento">Reabastecimiento</option>
              <option value="Consumo">Consumo</option>
              <option value="Transferencia a otra embarcacion">Transferencia a otra embarcacion</option>
              <option value="Ajuste de inventario">Ajuste de inventario</option>
              <option value="Devolucion">Devolucion</option>
              <option value="Perdida">Perdida</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          {/* Reference */}
          <div>
            <label style={labelStyle}>Referencia</label>
            <input
              style={inputStyle}
              value={movementForm.reference}
              onChange={e => updateMovementField('reference', e.target.value)}
              placeholder="N. factura, orden de compra..."
            />
          </div>

          {/* Executed by */}
          <div>
            <label style={labelStyle}>Ejecutado por</label>
            <input
              style={inputStyle}
              value={movementForm.executedBy}
              onChange={e => updateMovementField('executedBy', e.target.value)}
              placeholder="Nombre de quien realiza"
            />
          </div>

          {/* Date */}
          <div>
            <label style={labelStyle}>Fecha y hora</label>
            <input
              style={{ ...inputStyle, colorScheme: 'dark' }}
              type="datetime-local"
              value={movementForm.date}
              onChange={e => updateMovementField('date', e.target.value)}
            />
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle}>Notas</label>
            <textarea
              style={{ ...inputStyle, minHeight: '50px', resize: 'vertical' }}
              value={movementForm.notes}
              onChange={e => updateMovementField('notes', e.target.value)}
              placeholder="Observaciones..."
            />
          </div>

          {/* Movement error */}
          {movementError && (
            <div style={{
              padding: '8px 12px', borderRadius: '8px', fontSize: '12px',
              background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', color: 'var(--danger)',
            }}>
              {movementError}
            </div>
          )}

          <button
            style={{ ...btnPrimary, width: '100%', opacity: savingMovement ? 0.6 : 1 }}
            onClick={handleSaveMovement}
            disabled={savingMovement}
          >
            {savingMovement ? 'Registrando...' : `Registrar ${movementForm.type === 'ENTRADA' ? 'Entrada' : 'Salida'}`}
          </button>
        </div>

        {/* Movement history */}
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px' }}>
          Historial de Movimientos
        </div>

        {loadingMovements ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '20px' }}>
            Cargando movimientos...
          </div>
        ) : movements.length === 0 ? (
          <div style={{
            ...cardStyle, padding: '24px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Sin movimientos registrados</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Registra el primer movimiento de este item
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {movements.map((mov, idx) => {
              const isEntry = mov.type === 'ENTRADA'
              return (
                <div key={mov.id || idx} style={{
                  display: 'flex', gap: '12px', padding: '12px 14px',
                  background: 'var(--bg-surface)', borderRadius: '10px',
                  border: `1px solid ${goldBorder}`,
                  animation: 'fadeIn 0.3s ease-out',
                  animationDelay: `${idx * 0.05}s`,
                  animationFillMode: 'both',
                }}>
                  {/* Icon */}
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isEntry ? 'rgba(39,174,96,0.12)' : 'rgba(231,76,60,0.12)',
                    color: isEntry ? 'var(--success)' : 'var(--danger)', fontSize: '16px', fontWeight: 700,
                  }}>
                    {isEntry ? (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 12V4M8 4L4 8M8 4L12 8" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 4V12M8 12L4 8M8 12L12 8" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{
                        fontSize: '13px', fontWeight: 700,
                        color: isEntry ? 'var(--success)' : 'var(--danger)',
                      }}>
                        {isEntry ? '+' : '-'}{mov.quantity} {currentItem.unit}
                      </span>
                      {mov.balanceAfter != null && (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Balance: {mov.balanceAfter}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                      {formatDate(mov.date)}
                    </div>
                    {mov.reason && (
                      <div style={{ fontSize: '11px', color: 'var(--text-primary)' }}>
                        {mov.reason}
                      </div>
                    )}
                    {mov.executedBy && (
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Por: {mov.executedBy}
                      </div>
                    )}
                    {mov.reference && (
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        Ref: {mov.reference}
                      </div>
                    )}
                    {mov.notes && (
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '2px' }}>
                        {mov.notes}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Inventario</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Inventario a bordo — {totalItems} items registrados
          </div>
        </div>
        <button style={btnPrimary} onClick={openNew}>+ Nuevo Item</button>
      </div>

      {/* ── Low Stock Alert Banner ── */}
      {lowStock > 0 && (
        <div style={{
          background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.3)',
          borderRadius: '14px', padding: '16px 20px', marginBottom: '24px',
          display: 'flex', alignItems: 'center', gap: '14px',
          animation: 'fadeIn 0.4s ease-out',
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
            background: 'rgba(231,76,60,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 6V10M10 14H10.01M8.57 2.72L1.51 14.49C1.19 15.05 1.03 15.33 1.05 15.56C1.07 15.76 1.18 15.94 1.34 16.06C1.53 16.2 1.85 16.2 2.49 16.2H17.51C18.15 16.2 18.47 16.2 18.66 16.06C18.82 15.94 18.93 15.76 18.95 15.56C18.97 15.33 18.81 15.05 18.49 14.49L11.43 2.72C11.11 2.16 10.95 1.88 10.74 1.79C10.56 1.71 10.36 1.71 10.18 1.79C9.97 1.88 9.81 2.16 9.49 2.72L8.57 2.72Z" stroke="var(--danger)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--danger)', marginBottom: '2px' }}>
              Alerta de Stock Bajo
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
              {lowStock} item{lowStock !== 1 ? 's' : ''} por debajo del stock minimo:{' '}
              <span style={{ color: 'var(--text-muted)' }}>
                {lowStockItems.slice(0, 3).map(i => i.name).join(', ')}
                {lowStockItems.length > 3 ? ` y ${lowStockItems.length - 3} mas` : ''}
              </span>
            </div>
          </div>
          <div style={{
            fontSize: '28px', fontWeight: 800, color: 'var(--danger)', minWidth: '50px', textAlign: 'center',
          }}>
            {lowStock}
          </div>
        </div>
      )}

      {/* ── KPIs ── */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={kpiStyle}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Items</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>{totalItems}</div>
        </div>
        <div style={{
          ...kpiStyle,
          ...(lowStock > 0 ? { border: '1px solid rgba(231,76,60,0.3)', background: 'rgba(231,76,60,0.04)' } : {}),
        }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bajo Stock Minimo</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: lowStock > 0 ? 'var(--danger)' : 'var(--success)' }}>{lowStock}</div>
        </div>
        <div style={kpiStyle}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Categorias</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent)' }}>{distinctCategories}</div>
        </div>
        <div style={kpiStyle}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Embarcaciones</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>{vesselsWithInventory}</div>
        </div>
      </div>

      {/* ── View Toggle + Filters ── */}
      <div style={{ ...cardStyle, padding: '16px', marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* View mode toggle */}
        <div style={{
          display: 'flex', borderRadius: '8px', overflow: 'hidden',
          border: `1px solid ${goldBorder}`, flexShrink: 0,
        }}>
          <button
            onClick={() => setViewMode('general')}
            style={{
              padding: '8px 14px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
              background: viewMode === 'general' ? 'var(--accent)' : '#080E1A',
              color: viewMode === 'general' ? '#080E1A' : 'var(--text-secondary)',
              transition: 'all 0.2s',
            }}
          >
            Vision General
          </button>
          <button
            onClick={() => setViewMode('vessel')}
            style={{
              padding: '8px 14px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
              background: viewMode === 'vessel' ? 'var(--accent)' : '#080E1A',
              color: viewMode === 'vessel' ? '#080E1A' : 'var(--text-secondary)',
              transition: 'all 0.2s',
            }}
          >
            Por Embarcacion
          </button>
        </div>

        <div style={{ flex: '1 1 200px', minWidth: '160px' }}>
          <select
            style={selectStyle}
            value={filterVessel}
            onChange={e => setFilterVessel(e.target.value)}
          >
            <option value="">Todas las embarcaciones</option>
            {vessels.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
        <div style={{ flex: '1 1 180px', minWidth: '150px' }}>
          <select
            style={selectStyle}
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
          >
            <option value="">Todas las categorias</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ flex: '2 1 250px', minWidth: '200px' }}>
          <input
            style={inputStyle}
            placeholder="Buscar por nombre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {(filterVessel || filterCategory || search) && (
          <button
            style={{ ...btnSecondary, fontSize: '11px', padding: '8px 12px' }}
            onClick={() => { setFilterVessel(''); setFilterCategory(''); setSearch('') }}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* ── Items ── */}
      {filtered.length === 0 && (
        <div style={{ ...cardStyle, padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '15px', color: 'var(--text-muted)' }}>No se encontraron items</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
            {items.length === 0 ? 'Agrega el primer item al inventario' : 'Ajusta los filtros de busqueda'}
          </div>
        </div>
      )}

      {/* ── General view (flat grid) ── */}
      {viewMode === 'general' && filtered.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {filtered.map(item => renderItemCard(item, true))}
        </div>
      )}

      {/* ── Vessel view (grouped) ── */}
      {viewMode === 'vessel' && grouped.map(([vesselId, group]) => (
        <div key={vesselId} style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <path d="M3 17L5 7H19L21 17M3 17H21M3 17L1 21H23L21 17M7 7V5C7 3.9 7.9 3 9 3H15C16.1 3 17 3.9 17 5V7" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{group.vesselName}</span>
            <span style={{
              fontSize: '11px', color: 'var(--text-muted)', background: 'rgba(127,168,201,0.1)',
              padding: '2px 10px', borderRadius: '10px',
            }}>
              {group.items.length} item{group.items.length !== 1 ? 's' : ''}
            </span>
            {group.lowStockCount > 0 && (
              <span style={{
                fontSize: '10px', fontWeight: 700, color: 'var(--danger)',
                background: 'rgba(231,76,60,0.12)', padding: '2px 10px', borderRadius: '10px',
                border: '1px solid rgba(231,76,60,0.25)',
              }}>
                {group.lowStockCount} bajo stock
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
            {group.items.map(item => renderItemCard(item))}
          </div>
        </div>
      ))}

      {/* ═══ Drawer ═══ */}
      {drawerOpen && (
        <div style={overlayStyle} onClick={e => { if (e.target === e.currentTarget) closeDrawer() }}>
          <div style={drawerStyle} onClick={e => e.stopPropagation()}>
            {/* Drawer header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {editingItem ? editingItem.name : 'Nuevo Item'}
              </div>
              <button
                onClick={closeDrawer}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '22px', cursor: 'pointer', padding: '4px 8px' }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M4 4L14 14M14 4L4 14" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Tabs (only for editing) */}
            {editingItem && (
              <div style={{
                display: 'flex', borderRadius: '10px', overflow: 'hidden',
                border: `1px solid ${goldBorder}`, background: '#080E1A',
              }}>
                <button
                  onClick={() => setDrawerTab('detalle')}
                  style={{
                    flex: 1, padding: '10px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                    background: drawerTab === 'detalle' ? 'rgba(212,149,10,0.15)' : 'transparent',
                    color: drawerTab === 'detalle' ? 'var(--accent)' : 'var(--text-secondary)',
                    borderBottom: drawerTab === 'detalle' ? '2px solid var(--accent)' : '2px solid transparent',
                    transition: 'all 0.2s',
                  }}
                >
                  Detalle
                </button>
                <button
                  onClick={() => setDrawerTab('movimientos')}
                  style={{
                    flex: 1, padding: '10px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                    background: drawerTab === 'movimientos' ? 'rgba(212,149,10,0.15)' : 'transparent',
                    color: drawerTab === 'movimientos' ? 'var(--accent)' : 'var(--text-secondary)',
                    borderBottom: drawerTab === 'movimientos' ? '2px solid var(--accent)' : '2px solid transparent',
                    transition: 'all 0.2s',
                  }}
                >
                  Movimientos
                  {movements.length > 0 && (
                    <span style={{
                      marginLeft: '6px', fontSize: '10px', background: 'rgba(212,149,10,0.2)',
                      padding: '1px 6px', borderRadius: '8px', color: 'var(--accent)',
                    }}>
                      {movements.length}
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* Tab content */}
            {drawerTab === 'detalle' ? renderDetailTab() : renderMovementsTab()}
          </div>
        </div>
      )}
    </div>
  )
}
