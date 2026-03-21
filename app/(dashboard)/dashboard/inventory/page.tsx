'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'

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

const CATEGORIES = ['Lubricantes', 'Repuestos', 'Aparejos', 'Seguridad', 'Mantenimiento', 'Otros']
const emptyForm: FormData = { vesselId: '', name: '', category: 'Lubricantes', quantity: '', unit: 'unidad', minStock: '0', location: '', supplier: '', notes: '' }

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
const goldBorder = 'rgba(212,149,10,0.15)'
const goldBorderActive = 'rgba(212,149,10,0.5)'

const cardStyle: React.CSSProperties = {
  background: '#0a1628', border: `1px solid ${goldBorder}`, borderRadius: '14px', padding: '18px',
}
const kpiStyle: React.CSSProperties = {
  ...cardStyle, flex: '1 1 200px', minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '6px',
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', background: '#060c1a', border: `1px solid ${goldBorder}`,
  borderRadius: '8px', color: '#e8f4fd', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
}
const selectStyle: React.CSSProperties = {
  ...inputStyle, appearance: 'none' as const, cursor: 'pointer',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%237fa8c9'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
}
const btnPrimary: React.CSSProperties = {
  padding: '10px 20px', background: 'linear-gradient(135deg, #D4950A, #b8820a)', border: 'none',
  borderRadius: '8px', color: '#060c1a', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
}
const btnSecondary: React.CSSProperties = {
  padding: '8px 14px', background: 'transparent', border: `1px solid ${goldBorder}`,
  borderRadius: '8px', color: '#7fa8c9', fontSize: '12px', cursor: 'pointer',
}
const btnDanger: React.CSSProperties = {
  padding: '8px 14px', background: 'transparent', border: '1px solid rgba(231,76,60,0.4)',
  borderRadius: '8px', color: '#e74c3c', fontSize: '12px', cursor: 'pointer',
}
const labelStyle: React.CSSProperties = { fontSize: '12px', color: '#7fa8c9', marginBottom: '4px', display: 'block' }
const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end',
}
const drawerStyle: React.CSSProperties = {
  width: '460px', maxWidth: '100vw', height: '100%', background: '#0d1b2e',
  borderLeft: `1px solid ${goldBorder}`, overflowY: 'auto', padding: '28px 24px',
  display: 'flex', flexDirection: 'column', gap: '16px',
}

/* ─── Category config ─── */
const catColors: Record<string, { bg: string; color: string }> = {
  Lubricantes: { bg: 'rgba(212,149,10,0.12)', color: '#D4950A' },
  Repuestos: { bg: 'rgba(127,168,201,0.12)', color: '#7fa8c9' },
  Aparejos: { bg: 'rgba(39,174,96,0.12)', color: '#27ae60' },
  Seguridad: { bg: 'rgba(231,76,60,0.12)', color: '#e74c3c' },
  Mantenimiento: { bg: 'rgba(142,68,173,0.12)', color: '#8e44ad' },
  Otros: { bg: 'rgba(85,94,110,0.12)', color: '#555e6e' },
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

  /* Drawer */
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)

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

  /* ─── KPIs ─── */
  const totalItems = items.length
  const lowStock = items.filter(i => i.quantity <= i.minStock).length
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
    const map: Record<string, { vesselName: string; items: InventoryItem[] }> = {}
    filtered.forEach(item => {
      const vName = item.vessel?.name || vessels.find(v => v.id === item.vesselId)?.name || 'Sin embarcación'
      if (!map[item.vesselId]) map[item.vesselId] = { vesselName: vName, items: [] }
      map[item.vesselId].items.push(item)
    })
    return Object.entries(map).sort((a, b) => a[1].vesselName.localeCompare(b[1].vesselName))
  }, [filtered, vessels])

  /* ─── Drawer handlers ─── */
  function openNew() {
    setEditingItem(null)
    setForm(emptyForm)
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
    setDrawerOpen(true)
  }

  function closeDrawer() {
    setDrawerOpen(false)
    setEditingItem(null)
  }

  function updateField(field: keyof FormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    if (!form.name.trim() || !form.vesselId) return
    setSaving(true)
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
    } catch {
      alert('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!editingItem) return
    if (!confirm('¿Eliminar este item del inventario?')) return
    setSaving(true)
    try {
      await api(`/api/inventory/${editingItem.id}`, { method: 'DELETE' })
      await loadData()
      closeDrawer()
    } catch {
      alert('Error al eliminar')
    } finally {
      setSaving(false)
    }
  }

  /* ─── Loading / Error ─── */
  if (loading) return (
    <div style={{ color: '#7fa8c9', padding: '40px', textAlign: 'center' }}>Cargando inventario...</div>
  )
  if (error) return (
    <div style={{ color: '#e74c3c', padding: '40px', textAlign: 'center' }}>{error}</div>
  )

  /* ─── Stock bar component ─── */
  function StockBar({ quantity, minStock }: { quantity: number; minStock: number }) {
    const isLow = quantity <= minStock
    const max = Math.max(minStock * 2, quantity, 1)
    const pct = Math.min((quantity / max) * 100, 100)
    const color = isLow ? '#e74c3c' : '#27ae60'
    return (
      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '3px', transition: 'width 0.3s ease' }} />
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#e8f4fd' }}>Inventario</div>
          <div style={{ fontSize: '13px', color: '#7fa8c9', marginTop: '4px' }}>
            Inventario a bordo — {totalItems} items registrados
          </div>
        </div>
        <button style={btnPrimary} onClick={openNew}>+ Nuevo Item</button>
      </div>

      {/* ── KPIs ── */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={kpiStyle}>
          <div style={{ fontSize: '12px', color: '#7fa8c9', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Items</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#e8f4fd' }}>{totalItems}</div>
        </div>
        <div style={kpiStyle}>
          <div style={{ fontSize: '12px', color: '#7fa8c9', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bajo Stock Mínimo</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: lowStock > 0 ? '#e74c3c' : '#27ae60' }}>{lowStock}</div>
        </div>
        <div style={kpiStyle}>
          <div style={{ fontSize: '12px', color: '#7fa8c9', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Categorías</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#D4950A' }}>{distinctCategories}</div>
        </div>
        <div style={kpiStyle}>
          <div style={{ fontSize: '12px', color: '#7fa8c9', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Embarcaciones</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#e8f4fd' }}>{vesselsWithInventory}</div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div style={{ ...cardStyle, padding: '16px', marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
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
            <option value="">Todas las categorías</option>
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

      {/* ── Items grouped by vessel ── */}
      {grouped.length === 0 && (
        <div style={{ ...cardStyle, padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '15px', color: '#7fa8c9' }}>No se encontraron items</div>
          <div style={{ fontSize: '12px', color: '#555e6e', marginTop: '6px' }}>
            {items.length === 0 ? 'Agrega el primer item al inventario' : 'Ajusta los filtros de búsqueda'}
          </div>
        </div>
      )}

      {grouped.map(([vesselId, group]) => (
        <div key={vesselId} style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <span style={{ fontSize: '16px' }}>🚢</span>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#e8f4fd' }}>{group.vesselName}</span>
            <span style={{
              fontSize: '11px', color: '#7fa8c9', background: 'rgba(127,168,201,0.1)',
              padding: '2px 10px', borderRadius: '10px',
            }}>
              {group.items.length} item{group.items.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
            {group.items.map(item => {
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
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = goldBorderActive;
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = goldBorder;
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
                        fontSize: '10px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px',
                        background: 'rgba(231,76,60,0.12)', color: '#e74c3c',
                      }}>
                        BAJO STOCK
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#e8f4fd', marginBottom: '8px' }}>
                    {item.name}
                  </div>

                  {/* Quantity */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#7fa8c9' }}>Cantidad</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: isLow ? '#e74c3c' : '#e8f4fd' }}>
                      {item.quantity} <span style={{ fontSize: '11px', fontWeight: 400, color: '#7fa8c9' }}>{item.unit}</span>
                    </span>
                  </div>

                  {/* Stock bar */}
                  <div style={{ marginBottom: '6px' }}>
                    <StockBar quantity={item.quantity} minStock={item.minStock} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
                      <span style={{ fontSize: '10px', color: '#555e6e' }}>Min: {item.minStock}</span>
                      <span style={{ fontSize: '10px', color: '#555e6e' }}>{Math.round((item.quantity / Math.max(item.minStock * 2, item.quantity, 1)) * 100)}%</span>
                    </div>
                  </div>

                  {/* Supplier */}
                  {item.supplier && (
                    <div style={{ fontSize: '11px', color: '#555e6e', marginTop: '6px', borderTop: `1px solid ${goldBorder}`, paddingTop: '8px' }}>
                      Proveedor: <span style={{ color: '#7fa8c9' }}>{item.supplier}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* ═══ Drawer ═══ */}
      {drawerOpen && (
        <div style={overlayStyle} onClick={e => { if (e.target === e.currentTarget) closeDrawer() }}>
          <div style={drawerStyle} onClick={e => e.stopPropagation()}>
            {/* Drawer header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#e8f4fd' }}>
                {editingItem ? 'Editar Item' : 'Nuevo Item'}
              </div>
              <button
                onClick={closeDrawer}
                style={{ background: 'none', border: 'none', color: '#7fa8c9', fontSize: '22px', cursor: 'pointer', padding: '4px 8px' }}
              >
                ✕
              </button>
            </div>

            {/* Vessel select (only for new items) */}
            {!editingItem && (
              <div>
                <label style={labelStyle}>Embarcación *</label>
                <select style={selectStyle} value={form.vesselId} onChange={e => updateField('vesselId', e.target.value)}>
                  <option value="">Seleccionar embarcación</option>
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
              <label style={labelStyle}>Categoría</label>
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
              <label style={labelStyle}>Stock Mínimo</label>
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
              <label style={labelStyle}>Ubicación</label>
              <input style={inputStyle} value={form.location} onChange={e => updateField('location', e.target.value)} placeholder="Ej: Bodega proa, Sala máquinas..." />
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
          </div>
        </div>
      )}
    </div>
  )
}
