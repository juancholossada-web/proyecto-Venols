'use client'

import { useEffect, useState, useCallback } from 'react'

/* ─── Types ─── */
type Client = {
  id: string
  name: string
  taxId?: string
  type: string
  country?: string
  address?: string
  phone?: string
  email?: string
  contactPerson?: string
  notes?: string
  status: string
  createdAt?: string
  updatedAt?: string
  _count?: { voyages: number }
}

type DrawerMode = 'view' | 'edit' | 'create'

const CLIENT_TYPES = ['REFINERIA', 'OPERADORA', 'TERMINAL', 'TRADER', 'ASTILLERO', 'EMPRESA'] as const
type ClientType = typeof CLIENT_TYPES[number]

/* ─── Config ─── */
const typeColors: Record<string, string> = {
  REFINERIA: '#e74c3c',
  OPERADORA: '#D4950A',
  TERMINAL: '#2d9cdb',
  TRADER: '#27ae60',
  ASTILLERO: '#e67e22',
  EMPRESA: '#7fa8c9',
}

const statusColors: Record<string, string> = {
  ACTIVO: '#27ae60',
  INACTIVO: '#e74c3c',
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
const cardStyle: React.CSSProperties = {
  background: '#0a1628',
  border: '1px solid rgba(212,149,10,0.15)',
  borderRadius: '14px',
}

const goldBorder = 'rgba(212,149,10,0.15)'

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

const emptyForm: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | '_count'> = {
  name: '',
  taxId: '',
  type: 'EMPRESA',
  country: '',
  address: '',
  phone: '',
  email: '',
  contactPerson: '',
  notes: '',
  status: 'ACTIVO',
}

/* ═══════════════════════ MAIN PAGE ═══════════════════════ */
export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('ALL')

  /* Drawer state */
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('view')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  /* ── Fetch ── */
  const fetchClients = useCallback(() => {
    setLoading(true)
    api('/api/clients')
      .then(data => setClients(Array.isArray(data) ? data : data.clients ?? data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchClients() }, [fetchClients])

  /* ── Filtering ── */
  const filtered = clients.filter(c => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.taxId || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.contactPerson || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === 'ALL' || c.type === filterType
    return matchSearch && matchType
  })

  /* ── KPIs ── */
  const totalClients = clients.length
  const activeClients = clients.filter(c => c.status === 'ACTIVO').length
  const distinctTypes = new Set(clients.map(c => c.type)).size
  const withVoyages = clients.filter(c => (c._count?.voyages ?? 0) > 0).length

  /* ── Drawer actions ── */
  function openClient(c: Client) {
    setSelectedClient(c)
    setDrawerMode('view')
    setDrawerOpen(true)
  }

  function openNewClient() {
    setSelectedClient(null)
    setForm({ ...emptyForm })
    setDrawerMode('create')
    setDrawerOpen(true)
  }

  function startEdit() {
    if (!selectedClient) return
    setForm({
      name: selectedClient.name,
      taxId: selectedClient.taxId || '',
      type: selectedClient.type,
      country: selectedClient.country || '',
      address: selectedClient.address || '',
      phone: selectedClient.phone || '',
      email: selectedClient.email || '',
      contactPerson: selectedClient.contactPerson || '',
      notes: selectedClient.notes || '',
      status: selectedClient.status,
    })
    setDrawerMode('edit')
  }

  function closeDrawer() {
    setDrawerOpen(false)
    setTimeout(() => {
      setSelectedClient(null)
      setDrawerMode('view')
    }, 300)
  }

  function updateField(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (drawerMode === 'create') {
        await api('/api/clients', { method: 'POST', body: JSON.stringify(form) })
      } else if (drawerMode === 'edit' && selectedClient) {
        await api(`/api/clients/${selectedClient.id}`, { method: 'PUT', body: JSON.stringify(form) })
      }
      fetchClients()
      closeDrawer()
    } catch {
      /* stay open on error */
    } finally {
      setSaving(false)
    }
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={{ color: '#7fa8c9', padding: '40px', textAlign: 'center' }}>
        Cargando clientes...
      </div>
    )
  }

  /* ═══════════════════════ RENDER ═══════════════════════ */
  return (
    <div style={{ position: 'relative' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#e8f4fd' }}>Clientes</div>
          <div style={{ fontSize: '13px', color: '#7fa8c9', marginTop: '4px' }}>
            CRM — Gestión de clientes y relaciones comerciales
          </div>
        </div>
        <button onClick={openNewClient} style={btnPrimary}>+ Nuevo Cliente</button>
      </div>

      {/* ── KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Clientes', value: totalClients, color: '#D4950A' },
          { label: 'Activos', value: activeClients, color: '#27ae60' },
          { label: 'Tipos Distintos', value: distinctTypes, color: '#2d9cdb' },
          { label: 'Con Viajes', value: withVoyages, color: '#e67e22' },
        ].map(kpi => (
          <div key={kpi.label} style={{ ...cardStyle, padding: '20px' }}>
            <div style={{ fontSize: '11px', color: '#7fa8c9', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              {kpi.label}
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* ── Search & Filter ── */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            placeholder="Buscar por nombre, RIF, contacto, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingLeft: '36px' }}
          />
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#7fa8c9', fontSize: '14px', pointerEvents: 'none' }}>
            ⌕
          </span>
        </div>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          style={{ ...inputStyle, width: '200px', cursor: 'pointer' }}
        >
          <option value="ALL">Todos los tipos</option>
          {CLIENT_TYPES.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* ── Client Grid ── */}
      {filtered.length === 0 ? (
        <div style={{ ...cardStyle, padding: '60px', textAlign: 'center' }}>
          <div style={{ fontSize: '16px', color: '#7fa8c9', marginBottom: '8px' }}>
            No se encontraron clientes
          </div>
          <div style={{ fontSize: '12px', color: '#556' }}>
            {search || filterType !== 'ALL' ? 'Intenta ajustar los filtros de búsqueda' : 'Agrega tu primer cliente con el botón "+ Nuevo Cliente"'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {filtered.map(client => (
            <div
              key={client.id}
              onClick={() => openClient(client)}
              style={{
                ...cardStyle,
                padding: '20px',
                cursor: 'pointer',
                transition: 'border-color 0.2s, transform 0.2s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(212,149,10,0.4)'
                ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(212,149,10,0.15)'
                ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
              }}
            >
              {/* Card header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#e8f4fd', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {client.name}
                  </div>
                  {client.taxId && (
                    <div style={{ fontSize: '12px', color: '#7fa8c9' }}>
                      RIF: {client.taxId}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: typeColors[client.type] || '#7fa8c9',
                    background: `${typeColors[client.type] || '#7fa8c9'}18`,
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                  }}>
                    {client.type}
                  </span>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: statusColors[client.status] || '#7fa8c9',
                    background: `${statusColors[client.status] || '#7fa8c9'}18`,
                  }}>
                    {client.status}
                  </span>
                </div>
              </div>

              {/* Card body */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {client.country && (
                  <div style={{ fontSize: '12px', color: '#7fa8c9' }}>
                    <span style={{ color: '#556', marginRight: '6px' }}>País:</span>{client.country}
                  </div>
                )}
                {client.contactPerson && (
                  <div style={{ fontSize: '12px', color: '#7fa8c9' }}>
                    <span style={{ color: '#556', marginRight: '6px' }}>Contacto:</span>{client.contactPerson}
                  </div>
                )}
                {client.phone && (
                  <div style={{ fontSize: '12px', color: '#7fa8c9' }}>
                    <span style={{ color: '#556', marginRight: '6px' }}>Tel:</span>{client.phone}
                  </div>
                )}
                {client.email && (
                  <div style={{ fontSize: '12px', color: '#7fa8c9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span style={{ color: '#556', marginRight: '6px' }}>Email:</span>{client.email}
                  </div>
                )}
              </div>

              {/* Voyage count footer */}
              <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: `1px solid ${goldBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '11px', color: '#556' }}>
                  Viajes: <span style={{ color: (client._count?.voyages ?? 0) > 0 ? '#D4950A' : '#556', fontWeight: 700 }}>
                    {client._count?.voyages ?? 0}
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: '#D4950A' }}>Ver detalle →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══════════════ DRAWER BACKDROP ═══════════════ */}
      {drawerOpen && (
        <div
          onClick={closeDrawer}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            zIndex: 900,
            transition: 'opacity 0.3s',
          }}
        />
      )}

      {/* ═══════════════ DRAWER ═══════════════ */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '520px',
          height: '100vh',
          background: '#0a1628',
          borderLeft: `1px solid ${goldBorder}`,
          zIndex: 1000,
          transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Drawer header */}
        <div style={{ padding: '24px 24px 16px', borderBottom: `1px solid ${goldBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: '17px', fontWeight: 700, color: '#e8f4fd' }}>
            {drawerMode === 'create' ? 'Nuevo Cliente' : drawerMode === 'edit' ? 'Editar Cliente' : selectedClient?.name || ''}
          </div>
          <button onClick={closeDrawer} style={{ background: 'none', border: 'none', color: '#7fa8c9', fontSize: '22px', cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>
            ✕
          </button>
        </div>

        {/* Drawer content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {/* ── VIEW MODE ── */}
          {drawerMode === 'view' && selectedClient && (
            <div>
              {/* Status & Type badges */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                <span style={{
                  padding: '5px 14px',
                  borderRadius: '14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: typeColors[selectedClient.type] || '#7fa8c9',
                  background: `${typeColors[selectedClient.type] || '#7fa8c9'}18`,
                  textTransform: 'uppercase',
                }}>
                  {selectedClient.type}
                </span>
                <span style={{
                  padding: '5px 14px',
                  borderRadius: '14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: statusColors[selectedClient.status] || '#7fa8c9',
                  background: `${statusColors[selectedClient.status] || '#7fa8c9'}18`,
                }}>
                  {selectedClient.status}
                </span>
              </div>

              {/* Detail rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { label: 'Nombre', value: selectedClient.name },
                  { label: 'RIF / Tax ID', value: selectedClient.taxId },
                  { label: 'Tipo', value: selectedClient.type },
                  { label: 'País', value: selectedClient.country },
                  { label: 'Dirección', value: selectedClient.address },
                  { label: 'Teléfono', value: selectedClient.phone },
                  { label: 'Email', value: selectedClient.email },
                  { label: 'Persona de Contacto', value: selectedClient.contactPerson },
                  { label: 'Notas', value: selectedClient.notes },
                  { label: 'Viajes Asociados', value: String(selectedClient._count?.voyages ?? 0) },
                  { label: 'Estado', value: selectedClient.status },
                  { label: 'Creado', value: selectedClient.createdAt ? new Date(selectedClient.createdAt).toLocaleDateString('es-VE') : undefined },
                  { label: 'Actualizado', value: selectedClient.updatedAt ? new Date(selectedClient.updatedAt).toLocaleDateString('es-VE') : undefined },
                ].map(row => row.value ? (
                  <div key={row.label}>
                    <div style={{ fontSize: '11px', color: '#556', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                      {row.label}
                    </div>
                    <div style={{ fontSize: '14px', color: '#e8f4fd' }}>
                      {row.value}
                    </div>
                  </div>
                ) : null)}
              </div>

              {/* Edit button */}
              <div style={{ marginTop: '28px' }}>
                <button onClick={startEdit} style={btnPrimary}>
                  Editar Cliente
                </button>
              </div>
            </div>
          )}

          {/* ── EDIT / CREATE MODE ── */}
          {(drawerMode === 'edit' || drawerMode === 'create') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Name */}
              <div>
                <label style={{ fontSize: '12px', color: '#7fa8c9', display: 'block', marginBottom: '6px' }}>Nombre *</label>
                <input
                  style={inputStyle}
                  value={form.name}
                  onChange={e => updateField('name', e.target.value)}
                  placeholder="Nombre del cliente"
                />
              </div>

              {/* Tax ID */}
              <div>
                <label style={{ fontSize: '12px', color: '#7fa8c9', display: 'block', marginBottom: '6px' }}>RIF / Tax ID</label>
                <input
                  style={inputStyle}
                  value={form.taxId || ''}
                  onChange={e => updateField('taxId', e.target.value)}
                  placeholder="J-12345678-9"
                />
              </div>

              {/* Type */}
              <div>
                <label style={{ fontSize: '12px', color: '#7fa8c9', display: 'block', marginBottom: '6px' }}>Tipo *</label>
                <select
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  value={form.type}
                  onChange={e => updateField('type', e.target.value)}
                >
                  {CLIENT_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Country */}
              <div>
                <label style={{ fontSize: '12px', color: '#7fa8c9', display: 'block', marginBottom: '6px' }}>País</label>
                <input
                  style={inputStyle}
                  value={form.country || ''}
                  onChange={e => updateField('country', e.target.value)}
                  placeholder="Venezuela"
                />
              </div>

              {/* Address */}
              <div>
                <label style={{ fontSize: '12px', color: '#7fa8c9', display: 'block', marginBottom: '6px' }}>Dirección</label>
                <input
                  style={inputStyle}
                  value={form.address || ''}
                  onChange={e => updateField('address', e.target.value)}
                  placeholder="Dirección completa"
                />
              </div>

              {/* Phone */}
              <div>
                <label style={{ fontSize: '12px', color: '#7fa8c9', display: 'block', marginBottom: '6px' }}>Teléfono</label>
                <input
                  style={inputStyle}
                  value={form.phone || ''}
                  onChange={e => updateField('phone', e.target.value)}
                  placeholder="+58 412 1234567"
                />
              </div>

              {/* Email */}
              <div>
                <label style={{ fontSize: '12px', color: '#7fa8c9', display: 'block', marginBottom: '6px' }}>Email</label>
                <input
                  style={inputStyle}
                  type="email"
                  value={form.email || ''}
                  onChange={e => updateField('email', e.target.value)}
                  placeholder="contacto@empresa.com"
                />
              </div>

              {/* Contact Person */}
              <div>
                <label style={{ fontSize: '12px', color: '#7fa8c9', display: 'block', marginBottom: '6px' }}>Persona de Contacto</label>
                <input
                  style={inputStyle}
                  value={form.contactPerson || ''}
                  onChange={e => updateField('contactPerson', e.target.value)}
                  placeholder="Nombre del contacto"
                />
              </div>

              {/* Notes */}
              <div>
                <label style={{ fontSize: '12px', color: '#7fa8c9', display: 'block', marginBottom: '6px' }}>Notas</label>
                <textarea
                  style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                  value={form.notes || ''}
                  onChange={e => updateField('notes', e.target.value)}
                  placeholder="Observaciones adicionales..."
                />
              </div>

              {/* Status */}
              <div>
                <label style={{ fontSize: '12px', color: '#7fa8c9', display: 'block', marginBottom: '6px' }}>Estado</label>
                <select
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  value={form.status}
                  onChange={e => updateField('status', e.target.value)}
                >
                  <option value="ACTIVO">ACTIVO</option>
                  <option value="INACTIVO">INACTIVO</option>
                </select>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.name.trim()}
                  style={{
                    ...btnPrimary,
                    flex: 1,
                    opacity: saving || !form.name.trim() ? 0.5 : 1,
                    cursor: saving || !form.name.trim() ? 'not-allowed' : 'pointer',
                  }}
                >
                  {saving ? 'Guardando...' : drawerMode === 'create' ? 'Crear Cliente' : 'Guardar Cambios'}
                </button>
                <button
                  onClick={closeDrawer}
                  style={{ ...btnSecondary, flex: 0 }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
