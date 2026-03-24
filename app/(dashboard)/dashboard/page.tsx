'use client'

import { useEffect, useState } from 'react'

/* ─── Static data ─── */
const kpis = [
  {
    label: 'Flota Total',
    value: '08',
    icon: 'directions_boat',
    valueClass: 'text-primary',
    iconClass: 'text-slate-600',
    extra: null,
  },
  {
    label: 'Operativas',
    value: '03',
    icon: null,
    valueClass: 'text-secondary',
    iconClass: '',
    extra: 'pulse',
  },
  {
    label: 'Mantenimiento',
    value: '01',
    icon: 'build',
    valueClass: 'text-error',
    iconClass: 'text-error/60',
    extra: null,
  },
  {
    label: 'Viajes Hoy',
    value: '12',
    icon: 'schedule',
    valueClass: 'text-primary-container',
    iconClass: 'text-slate-600',
    extra: null,
  },
]

const vessels = [
  {
    name: 'Molleja Lake',
    code: 'VN-MOL-01',
    type: 'Pesada',
    status: 'En Ruta',
    statusColor: 'text-secondary',
    statusBg: 'bg-secondary/20',
    fuel: '82%',
    crew: '12/12',
    extra: { label: 'ETA', value: '14:30' },
    gradient: 'from-teal-900/60 to-slate-900',
  },
  {
    name: 'El Masco VIII',
    code: 'VN-MAS-08',
    type: 'Liviana',
    status: 'Operativo',
    statusColor: 'text-secondary',
    statusBg: 'bg-secondary/20',
    fuel: '45%',
    crew: '04/04',
    extra: { label: 'Ubicación', value: 'Puerto' },
    gradient: 'from-blue-900/60 to-slate-900',
  },
  {
    name: 'El Porteño I',
    code: 'VN-POR-01',
    type: 'Pesada',
    status: 'Atracado',
    statusColor: 'text-slate-400',
    statusBg: 'bg-white/10',
    fuel: '71%',
    crew: '08/10',
    extra: { label: 'Puerto', value: 'Maracaibo' },
    gradient: 'from-slate-800/60 to-slate-900',
  },
  {
    name: 'Zapara Island',
    code: 'VN-ZAP-01',
    type: 'Multi',
    status: 'Mantenimiento',
    statusColor: 'text-error',
    statusBg: 'bg-error/20',
    fuel: '30%',
    crew: '06/10',
    extra: { label: 'Retorno', value: '2d' },
    gradient: 'from-red-900/60 to-slate-900',
  },
]

const activity = [
  {
    icon: 'logout',
    iconBg: 'bg-secondary/10',
    iconColor: 'text-secondary',
    title: 'Molleja Lake',
    desc: 'Salida de puerto — Destino: Plataforma Delta',
    time: 'Hace 12 min',
  },
  {
    icon: 'warning',
    iconBg: 'bg-error/10',
    iconColor: 'text-error',
    title: 'Alerta: Anabella',
    desc: 'Bajo nivel de combustible detectado (20%)',
    time: 'Hace 34 min',
  },
  {
    icon: 'person_add',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-500',
    title: 'Nuevo usuario',
    desc: 'tecnico@venols.com — Registro de sistema',
    time: 'Hace 1h',
  },
  {
    icon: 'build',
    iconBg: 'bg-error/10',
    iconColor: 'text-error',
    title: 'Zapara Island',
    desc: 'Orden de mantenimiento abierta — Dique seco',
    time: 'Hace 2h',
  },
  {
    icon: 'login',
    iconBg: 'bg-secondary/10',
    iconColor: 'text-secondary',
    title: 'El Masco VIII',
    desc: 'Arribo confirmado a Puerto Cabello',
    time: 'Hace 3h',
  },
]

const telemetryBars = [
  { h: 'h-1/2', opacity: 'bg-amber-500/20' },
  { h: 'h-3/4', opacity: 'bg-amber-500/30' },
  { h: 'h-2/3', opacity: 'bg-amber-500/40' },
  { h: 'h-1/3', opacity: 'bg-amber-500/20' },
  { h: 'h-5/6', opacity: 'bg-amber-500/60' },
  { h: 'h-4/6', opacity: 'bg-amber-500/40' },
  { h: 'h-full', opacity: 'bg-primary-container shadow-[0_0_20px_rgba(255,193,7,0.3)]' },
]

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [now, setNow] = useState('')

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (u) setUser(JSON.parse(u))

    function tick() {
      const d = new Date()
      const days   = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']
      const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']
      setNow(`${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} · ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`)
    }
    tick()
    const interval = setInterval(tick, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="max-w-7xl mx-auto space-y-8">

      {/* Page title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-on-background">
            Panel de Control
          </h1>
          {user && (
            <p className="text-sm text-slate-500 mt-1">
              Bienvenido, {user.firstName} {user.lastName}
            </p>
          )}
        </div>
        <span className="text-[11px] font-mono text-slate-600 hidden lg:block">{now}</span>
      </div>

      {/* ── KPI Cards ── */}
      <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div
            key={k.label}
            className="bg-surface-container-low p-5 rounded-xl border border-outline-variant/5 hover:bg-surface-container transition-colors"
          >
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-3">
              {k.label}
            </span>
            <div className="flex items-end justify-between">
              <span className={`text-4xl font-black ${k.valueClass}`}>{k.value}</span>
              {k.extra === 'pulse' ? (
                <div className="w-2.5 h-2.5 rounded-full bg-secondary mb-1"
                  style={{ boxShadow: '0 0 0 0 rgba(112,216,200,0.7)', animation: 'pulse 2s infinite' }} />
              ) : k.icon ? (
                <span className={`material-symbols-outlined ${k.iconClass}`}>{k.icon}</span>
              ) : null}
            </div>
          </div>
        ))}
      </section>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">

        {/* Left: Flota + Map */}
        <div className="xl:col-span-8 space-y-8">

          {/* Flota header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-on-background flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500 text-xl">anchor</span>
              FLOTA ACTIVA
            </h2>
            <button className="text-xs font-bold text-amber-500 uppercase tracking-widest hover:underline transition-all">
              Ver todo
            </button>
          </div>

          {/* Vessel Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {vessels.map(v => (
              <div
                key={v.name}
                className="group bg-surface-container-high rounded-xl overflow-hidden border border-outline-variant/10 hover:border-amber-500/30 transition-all shadow-lg"
              >
                {/* Card header — gradient banner */}
                <div className={`h-28 bg-gradient-to-br ${v.gradient} relative flex items-end p-4`}>
                  {/* Status badge */}
                  <div className={`absolute top-3 right-3 ${v.statusBg} backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1.5`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${v.statusColor.replace('text-','bg-')}`}
                      style={v.status === 'En Ruta' || v.status === 'Operativo'
                        ? { boxShadow: '0 0 0 0 rgba(112,216,200,0.7)', animation: 'pulse 2s infinite' }
                        : {}} />
                    <span className={`text-[10px] font-bold ${v.statusColor} uppercase`}>{v.status}</span>
                  </div>
                  {/* Vessel icon */}
                  <span className="material-symbols-outlined text-white/20 text-6xl absolute bottom-2 right-3 group-hover:text-white/30 transition-all">
                    directions_boat
                  </span>
                </div>

                {/* Card body */}
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="font-bold text-lg text-primary tracking-tight leading-none">{v.name}</h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">
                      {v.type} · {v.code}
                    </p>
                  </div>

                  <div className="flex justify-between items-center bg-surface-container-lowest/50 p-3 rounded-lg">
                    <div className="text-center">
                      <p className="text-[9px] text-slate-500 uppercase mb-1">Combustible</p>
                      <p className="text-sm font-bold text-on-surface">{v.fuel}</p>
                    </div>
                    <div className="h-8 w-px bg-outline-variant/20" />
                    <div className="text-center">
                      <p className="text-[9px] text-slate-500 uppercase mb-1">Tripulación</p>
                      <p className="text-sm font-bold text-on-surface">{v.crew}</p>
                    </div>
                    <div className="h-8 w-px bg-outline-variant/20" />
                    <div className="text-center">
                      <p className="text-[9px] text-slate-500 uppercase mb-1">{v.extra.label}</p>
                      <p className="text-sm font-bold text-on-surface">{v.extra.value}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Map Placeholder */}
          <div className="bg-surface-container-low rounded-xl h-[260px] border border-outline-variant/10 relative overflow-hidden flex items-center justify-center">
            {/* Grid background pattern */}
            <div className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'linear-gradient(rgba(112,216,200,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(112,216,200,0.3) 1px, transparent 1px)',
                backgroundSize: '40px 40px'
              }} />
            <div className="absolute inset-0 bg-gradient-to-r from-surface-container-low/90 via-transparent to-surface-container-low/90" />

            {/* Labels */}
            <div className="absolute top-5 left-6 z-10">
              <h4 className="text-sm font-bold text-on-surface tracking-wide uppercase">Tráfico en Tiempo Real</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Canal de Navegación Principal</p>
            </div>

            {/* Vessel markers */}
            <div className="relative z-10 flex gap-16 items-center">
              {[
                { code: 'VN-MOL-01', color: 'bg-amber-500' },
                { code: 'VN-MAS-08', color: 'bg-secondary' },
                { code: 'VN-POR-01', color: 'bg-slate-400' },
              ].map(m => (
                <div key={m.code} className="flex flex-col items-center gap-2">
                  <div className={`w-4 h-4 ${m.color} rounded-full flex items-center justify-center`}
                    style={{ boxShadow: '0 0 0 0 rgba(112,216,200,0.5)', animation: 'pulse 2s infinite' }}>
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  </div>
                  <div className="bg-surface-container-highest px-3 py-1 rounded-lg border border-outline-variant/30 text-[10px] font-bold text-on-surface whitespace-nowrap">
                    {m.code}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Activity + Telemetry */}
        <div className="xl:col-span-4 space-y-8">

          {/* Activity header */}
          <h2 className="text-lg font-bold tracking-tight text-on-background">
            ACTIVIDAD RECIENTE
          </h2>

          {/* Activity list */}
          <div className="bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/5">
            <div className="divide-y divide-outline-variant/10">
              {activity.map((a, i) => (
                <div key={i} className="p-4 hover:bg-white/5 transition-all flex gap-4">
                  <div className={`w-10 h-10 rounded-lg ${a.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <span className={`material-symbols-outlined ${a.iconColor} text-[20px]`}>{a.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-sm font-bold text-on-surface truncate">{a.title}</span>
                      <span className="text-[9px] text-slate-500 uppercase whitespace-nowrap flex-shrink-0">{a.time}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{a.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-surface-container-lowest/30 hover:bg-surface-container-lowest transition-colors">
              Ver Log Completo
            </button>
          </div>

          {/* Telemetry Bar Chart */}
          <div className="bg-gradient-to-br from-surface-container-low to-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Consumo Promedio Flota
              </span>
              <span className="text-xs font-bold text-secondary">+2.4%</span>
            </div>
            <div className="h-24 flex items-end gap-1.5">
              {telemetryBars.map((bar, i) => (
                <div key={i} className={`flex-1 ${bar.opacity} rounded-t-sm ${bar.h}`} />
              ))}
            </div>
            <div className="flex justify-between mt-4 text-[9px] font-bold text-slate-600 uppercase">
              <span>08:00</span>
              <span>12:00</span>
              <span>16:00</span>
              <span>Ahora</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
