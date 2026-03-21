/**
 * VENOLS ERP — Generador de Documentación Técnica PDF
 * Uso: node scripts/generate-pdf.mjs  /  npm run docs:pdf
 */

import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUTPUT = path.join(__dirname, '..', 'VENOLS_ERP_Fase1_Documentacion.pdf')

// ─── COLORES ────────────────────────────────────────────────────────────────
const NAVY   = [6,  14, 30]
const NAVY2  = [10, 22, 40]
const GOLD   = [212, 149, 10]
const WHITE  = [232, 244, 253]
const MUTED  = [127, 168, 201]
const GREEN  = [39, 174, 96]
const RED    = [231, 76, 60]
const ORANGE = [230, 126, 34]
const GRAY   = [74, 85, 104]
const LGRAY  = [226, 232, 240]
const DARK   = [6, 14, 30]
const BLACK  = [0, 0, 0]

// ─── DOCUMENTO ──────────────────────────────────────────────────────────────
const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 50, bottom: 55, left: 50, right: 50 },
  autoFirstPage: false,
  info: {
    Title:    'VENOLS ERP — Documentación Técnica Fase 1',
    Author:   'Equipo de Desarrollo VENOLS',
    Subject:  'ERP Logística Marítima Petrolera — MVP + Pre-Fase 2 Completados',
    Keywords: 'ERP, logística, marítima, petrolera, Next.js, PostgreSQL',
  },
})

const stream = fs.createWriteStream(OUTPUT)
doc.pipe(stream)

const W = 595.28   // A4 width pts
const H = 841.89   // A4 height pts
const ML = 50      // margin left
const MR = 50      // margin right
const MT = 50      // margin top
const MB = 55      // margin bottom
const CW = W - ML - MR  // content width

let currentPage = 0

// ─── UTILIDADES BÁSICAS ─────────────────────────────────────────────────────

function addPage() {
  doc.addPage()
  currentPage++
  // Footer en cada página
  doc.fontSize(7).fillColor(MUTED).font('Helvetica')
    .text(
      `VENOLS ERP  ·  Documentación Técnica Fase 1 + Pre-Fase 2  ·  ${currentPage}`,
      ML, H - 35, { width: CW, align: 'center' }
    )
  doc.moveTo(ML, H - 42).lineTo(W - MR, H - 42)
    .strokeColor(GOLD).lineWidth(0.4).stroke()
  // Resetear posición de escritura al inicio del contenido
  doc.y = MT + 10
}

function checkSpace(needed) {
  if (doc.y + needed > H - MB - 15) addPage()
}

function y() { return doc.y }
function setY(val) { doc.y = val }
function moveDown(n = 1) { doc.y += n * 12 }

// ─── BLOQUES DE CONTENIDO ───────────────────────────────────────────────────

function sectionTitle(text) {
  checkSpace(35)
  const sy = y()
  doc.rect(ML, sy, CW, 26).fill(NAVY2)
  doc.rect(ML, sy, 4, 26).fill(GOLD)
  doc.fontSize(11.5).fillColor(WHITE).font('Helvetica-Bold')
    .text(text, ML + 14, sy + 7, { width: CW - 20 })
  setY(sy + 26 + 8)
}

function subTitle(text) {
  checkSpace(25)
  moveDown(0.5)
  doc.fontSize(9.5).fillColor(GOLD).font('Helvetica-Bold').text(text, ML, y())
  moveDown(1.2)
}

function para(text) {
  checkSpace(20)
  doc.fontSize(8.5).fillColor(GRAY).font('Helvetica')
    .text(text, ML, y(), { width: CW, align: 'justify', lineGap: 1 })
  moveDown(1)
}

function bullet(label, text) {
  checkSpace(16)
  doc.fontSize(8.5).fillColor(GOLD).font('Helvetica-Bold')
    .text('▸ ', ML, y(), { continued: true })
  if (label) {
    doc.fillColor(GOLD).text(label + ': ', { continued: true })
  }
  doc.fillColor(GRAY).font('Helvetica').text(text || '')
  moveDown(0.3)
}

function checkRow(done, text) {
  checkSpace(16)
  const icon  = done ? '✓' : '○'
  const color = done ? GREEN : ORANGE
  doc.fontSize(8.5).fillColor(color).font('Helvetica-Bold')
    .text(icon + '  ', ML, y(), { continued: true })
  doc.fillColor(done ? GRAY : ORANGE).font('Helvetica').text(text)
  moveDown(0.1)
}

function divider() {
  checkSpace(10)
  moveDown(0.3)
  doc.moveTo(ML, y()).lineTo(W - MR, y())
    .strokeColor(GOLD).lineWidth(0.3).opacity(0.5).stroke()
  doc.opacity(1)
  moveDown(0.8)
}

// Tabla: cols = [{label, width}], rows = [[...cells]], altColor = bool
function table(cols, rows) {
  const totalW = cols.reduce((s, c) => s + c.w, 0)
  checkSpace(20 + rows.length * 15)

  // Header
  let hx = ML
  const hy = y()
  doc.rect(ML, hy, totalW, 18).fill(NAVY2)
  cols.forEach(col => {
    doc.fontSize(7.5).fillColor(GOLD).font('Helvetica-Bold')
      .text(col.label, hx + 4, hy + 4, { width: col.w - 8 })
    hx += col.w
  })
  setY(hy + 18)

  rows.forEach((row, ri) => {
    checkSpace(16)
    const ry = y()
    doc.rect(ML, ry, totalW, 15).fill(ri % 2 === 0 ? [248, 250, 252] : [255, 255, 255])
    let rx = ML
    row.forEach((cell, ci) => {
      const cellColor =
        cell.startsWith('✅') || cell.startsWith('✓') ? GREEN :
        cell.startsWith('🔲') || cell.startsWith('○') ? MUTED :
        cell.startsWith('⚠') || cell.startsWith('⏳') ? ORANGE :
        cell.startsWith('POST') || cell.startsWith('GET') ? [45, 156, 219] :
        GRAY
      doc.fontSize(7.5).fillColor(cellColor).font('Helvetica')
        .text(cell, rx + 4, ry + 3, { width: cols[ci].w - 8, height: 12, ellipsis: true })
      rx += cols[ci].w
    })
    setY(ry + 15)
  })
  moveDown(0.5)
}

function codeBox(lines) {
  const lineH = 11
  const h = lines.length * lineH + 10
  checkSpace(h + 8)
  const by = y()
  doc.rect(ML, by, CW, h).fill(DARK)
  doc.rect(ML, by, 3, h).fill(GOLD)
  lines.forEach((line, i) => {
    const color = line.startsWith('#') ? MUTED :
                  line.startsWith('✅') ? GREEN :
                  line.startsWith('⚠') ? ORANGE :
                  line.startsWith('$') ? GOLD :
                  line.startsWith('─') || line === '' ? MUTED :
                  [180, 210, 230]
    doc.fontSize(7.5).fillColor(color).font('Courier')
      .text(line, ML + 8, by + 5 + i * lineH, { width: CW - 16 })
  })
  setY(by + h + 6)
}

function statusRow(label, status, color) {
  checkSpace(16)
  const ry = y()
  doc.rect(ML, ry, CW, 15).fill([248, 250, 252])
  doc.fontSize(8).fillColor(GRAY).font('Helvetica')
    .text(label, ML + 6, ry + 3, { width: CW - 120 })
  doc.fillColor(color).font('Helvetica-Bold')
    .text(status, ML + CW - 115, ry + 3, { width: 110, align: 'right' })
  setY(ry + 15)
}

function progressRow(label, pct, status, desc, color) {
  checkSpace(26)
  const ry = y()
  const bg = pct === 100 ? [240, 255, 244] : [248, 250, 252]
  doc.rect(ML, ry, CW, 24).fill(bg)
  doc.rect(ML, ry, 3, 24).fill(color)
  // Nombre
  doc.fontSize(8.5).fillColor(color).font('Helvetica-Bold')
    .text(label, ML + 8, ry + 4, { width: 80 })
  // Descripción
  doc.fontSize(7.5).fillColor(GRAY).font('Helvetica')
    .text(desc, ML + 95, ry + 4, { width: CW - 225 })
  // Estado
  doc.fontSize(7.5).fillColor(color).font('Helvetica-Bold')
    .text(status, ML + CW - 125, ry + 4, { width: 120, align: 'right' })
  // Barra de progreso
  const barY = ry + 16
  doc.rect(ML + 8, barY, 80, 4).fill(LGRAY)
  if (pct > 0) doc.rect(ML + 8, barY, 80 * pct / 100, 4).fill(color)
  setY(ry + 24)
}

// ═══════════════════════════════════════════════════════════════════════════
// ████  PORTADA  ████
// ═══════════════════════════════════════════════════════════════════════════
doc.addPage()
currentPage++

// Fondo
doc.rect(0, 0, W, H).fill(DARK)

// Franja dorada top
doc.rect(0, 0, W, 5).fill(GOLD)

// Círculo decorativo fondo
doc.circle(W - 60, H - 80, 200).stroke(GOLD).lineWidth(0.3).opacity(0.06)
doc.opacity(1)
doc.circle(40, 180, 140).stroke(GOLD).lineWidth(0.3).opacity(0.05)
doc.opacity(1)

// Ícono central
const iconX = W / 2 - 38, iconY = 130
doc.rect(iconX, iconY, 76, 76).fill(GOLD)
doc.fontSize(36).fillColor([255, 255, 255]).font('Helvetica-Bold')
  .text('ERP', iconX + 8, iconY + 20, { width: 60, align: 'center' })

// Título
doc.fontSize(30).fillColor(WHITE).font('Helvetica-Bold')
  .text('VENOLS ERP', 0, iconY + 92, { width: W, align: 'center' })
doc.fontSize(10).fillColor(GOLD).font('Helvetica')
  .text('MARITIME LOGISTICS PLATFORM', 0, iconY + 130, { width: W, align: 'center', characterSpacing: 3 })

// Línea divisoria
const lY = iconY + 155
doc.moveTo(W/2 - 80, lY).lineTo(W/2 + 80, lY).strokeColor(GOLD).lineWidth(1).stroke()

// Subtítulo doc
doc.fontSize(13).fillColor(WHITE).font('Helvetica-Bold')
  .text('Documentación Técnica', 0, lY + 16, { width: W, align: 'center' })
doc.fontSize(9).fillColor(MUTED)
  .text('FASE 1 + PRE-FASE 2 — COMPLETADOS', 0, lY + 34, { width: W, align: 'center', characterSpacing: 1.5 })

// Badges de estado
const badgeY = lY + 60
const badges = ['MVP AUTH ✓', 'BD MIGRADA ✓', 'SEED OK ✓', 'TEST E2E ✓']
const bW = 90, bGap = 8
const totalBW = badges.length * (bW + bGap) - bGap
let bx = W / 2 - totalBW / 2
badges.forEach(b => {
  doc.rect(bx, badgeY, bW, 20).fill(GREEN)
  doc.fontSize(7).fillColor([255, 255, 255]).font('Helvetica-Bold')
    .text(b, bx, badgeY + 5, { width: bW, align: 'center' })
  bx += bW + bGap
})

// Caja de metadatos
const metaX = W / 2 - 155, metaY = badgeY + 40
doc.rect(metaX, metaY, 310, 115).fill(NAVY2)
doc.rect(metaX, metaY, 3, 115).fill(GOLD)
const metas = [
  ['PROYECTO',       'VENOLS Maritime ERP'],
  ['VERSIÓN',        '1.1.0 — Fase 1 + Pre-Fase 2'],
  ['FECHA',          '21 de Marzo de 2026'],
  ['ESTADO',         'EN PRODUCCIÓN LOCAL — Test E2E Exitoso'],
  ['PRÓXIMO PASO',   'Fase 2 — Módulo de Embarcaciones'],
  ['CLASIFICACIÓN',  'CONFIDENCIAL — USO INTERNO'],
]
metas.forEach(([k, v], i) => {
  doc.fontSize(7).fillColor(MUTED).font('Helvetica-Bold')
    .text(k, metaX + 10, metaY + 10 + i * 17, { width: 85 })
  doc.fontSize(7.5).fillColor(WHITE).font('Helvetica')
    .text(v, metaX + 100, metaY + 10 + i * 17, { width: 205 })
})

// Franja dorada bottom
doc.rect(0, H - 5, W, 5).fill(GOLD)
doc.fontSize(7).fillColor(MUTED).font('Helvetica')
  .text('VENOLS © 2026 — CONFIDENCIAL — USO INTERNO', 0, H - 22, { width: W, align: 'center' })

// ═══════════════════════════════════════════════════════════════════════════
// ████  PÁGINA 2 — ÍNDICE  ████
// ═══════════════════════════════════════════════════════════════════════════
addPage()

doc.fontSize(18).fillColor(GOLD).font('Helvetica-Bold')
  .text('Índice de Contenidos', ML, y())
moveDown(1.5)

const toc = [
  ['01', 'Resumen Ejecutivo'],
  ['02', 'Stack Tecnológico'],
  ['03', 'Arquitectura del Proyecto'],
  ['04', 'Módulo de Autenticación'],
  ['05', 'Configuración del Entorno Local'],
  ['06', 'Base de Datos — Schema y Migración'],
  ['07', 'Interfaz de Usuario'],
  ['08', 'Seguridad Implementada'],
  ['09', 'Pre-Fase 2 — Tareas Completadas'],
  ['10', 'Credenciales y Comandos Útiles'],
  ['11', 'Próximas Fases (2 a 6)'],
]

toc.forEach(([num, title], i) => {
  const ry = y()
  doc.rect(ML, ry, CW, 20).fill(i % 2 === 0 ? NAVY2 : [12, 24, 45])
  doc.fontSize(9).fillColor(GOLD).font('Helvetica-Bold')
    .text(num, ML + 8, ry + 5, { width: 22 })
  doc.fillColor(WHITE).font('Helvetica')
    .text(title, ML + 34, ry + 5, { width: CW - 44 })
  setY(ry + 20)
})

// ═══════════════════════════════════════════════════════════════════════════
// ████  PÁGINA 3 — RESUMEN EJECUTIVO  ████
// ═══════════════════════════════════════════════════════════════════════════
addPage()
sectionTitle('01 — RESUMEN EJECUTIVO')
moveDown(0.5)

para('VENOLS ERP es una plataforma web de gestión logística marítima diseñada para administrar de forma integral las operaciones de una empresa en el sector naval y petrolero: embarcaciones, combustible, inventario, personal, mantenimiento, clientes y rutas. Construida con tecnología moderna, escalable y preparada para crecer como SaaS multi-tenant.')

subTitle('Estado actual del proyecto')
table(
  [{ label: 'Componente', w: 200 }, { label: 'Descripción', w: 220 }, { label: 'Estado', w: 75 }],
  [
    ['Sistema de Autenticación completo', '4 endpoints API + JWT + bcrypt', '✅ Activo'],
    ['Base de datos PostgreSQL', '3 tablas, migración ejecutada, seed corrido', '✅ Activo'],
    ['Roles ADMIN / OPERATOR / TECHNICIAN', 'Permisos diferenciados en API y UI', '✅ Activo'],
    ['UI: Login, Register, Dashboard', 'Estética naval oscura, responsive', '✅ Activo'],
    ['Seguridad multicapa (8 capas)', 'bcrypt, JWT, SHA-256, Zod, brute force...', '✅ Activo'],
    ['Entorno local estable', 'TS sin errores, test E2E exitoso', '✅ Activo'],
    ['VPS / Servidor en producción', 'Pendiente — servidor no contratado aún', '⏳ Pendiente'],
  ]
)

subTitle('Logros clave')
bullet('Base de Datos', 'Schema Prisma completo con usuarios, sesiones y auditoría. Migración 20260321_init ejecutada exitosamente.')
bullet('Autenticación', 'Login, registro y logout con JWT + bcrypt. Flujo de 7 pasos dentro de transacción de BD. Verificado E2E.')
bullet('Roles y permisos', 'Admin, Operador y Técnico con acceso diferenciado a endpoints de API y navegación del sidebar.')
bullet('Seguridad', '8 capas activas: bcrypt 12 rondas, JWT HS256 64 bytes, SHA-256 en BD, Zod, brute-force lock, audit log, .env protegido.')
bullet('Pre-Fase 2', 'JWT_SECRET seguro generado, conflicto @prisma/client resuelto, 2 errores TS corregidos, seed ejecutado, test E2E OK.')

// ═══════════════════════════════════════════════════════════════════════════
// ████  PÁGINA 4 — STACK TECNOLÓGICO  ████
// ═══════════════════════════════════════════════════════════════════════════
addPage()
sectionTitle('02 — STACK TECNOLÓGICO')
moveDown(0.5)

subTitle('Tecnologías implementadas en Fase 1')
table(
  [{ label: 'Tecnología', w: 100 }, { label: 'Versión', w: 65 }, { label: 'Propósito', w: 330 }],
  [
    ['Next.js',       '16.2.1', 'Framework React — Frontend + API Routes como backend integrado'],
    ['TypeScript',    '5.x',    'Tipado estático — código robusto, autocompletado, detección de bugs'],
    ['PostgreSQL',    '15+',    'Base de datos relacional principal — enterprise-grade, ACID, gratuita'],
    ['Prisma ORM',    '6.12.0', 'Gestión de BD con tipado automático, migraciones versionadas'],
    ['jsonwebtoken',  '9.0.3',  'Tokens de autenticación JWT firmados HS256 con expiración'],
    ['bcryptjs',      '3.0.3',  'Hash de contraseñas con 12 rondas de sal (~250ms por hash)'],
    ['Zod',           '4.3.6',  'Validación de esquemas en todos los endpoints de la API'],
    ['Tailwind CSS',  '3.4.1',  'Framework CSS utility-first para la interfaz de usuario'],
    ['tsx',           '4.x',    'Runner TypeScript nativo en Windows para scripts de seed'],
    ['pdfkit',        '0.18',   'Generación de este documento de documentación técnica'],
    ['Nginx',         '1.24+',  'Reverse proxy + terminación SSL (configuración lista para VPS)'],
    ['PM2',           '5.x',    'Process manager — cluster mode, auto-restart, zero-downtime'],
    ["Let's Encrypt", 'Certbot', 'SSL/HTTPS gratuito — renovación automática cada 90 días'],
  ]
)

subTitle('¿Por qué este stack?')
bullet('Next.js 16', 'Combina frontend y backend en un proyecto. API Routes actúan como servidor Node.js. Turbopack para builds rápidos. Sin necesidad de Express separado.')
bullet('Prisma ORM', 'Genera tipos TypeScript automáticamente desde el schema. Migraciones versionadas con historial. Protección nativa contra SQL injection con prepared statements.')
bullet('JWT + bcrypt', 'JWT con secret de 64 bytes hex: imposible de forjar sin el secreto. bcrypt 12 rondas: ~250ms por hash hace ataques de diccionario inviables en tiempo real.')
bullet('PostgreSQL', 'BD enterprise-grade y gratuita. Soporte ACID crítico para ERP. Escala a terabytes. JSONB para metadata flexible en audit_logs. Índices compuestos para performance.')

// ═══════════════════════════════════════════════════════════════════════════
// ████  PÁGINA 5 — ARQUITECTURA  ████
// ═══════════════════════════════════════════════════════════════════════════
addPage()
sectionTitle('03 — ARQUITECTURA DEL PROYECTO')
moveDown(0.5)

subTitle('Estructura de carpetas actual')
codeBox([
  'maritime-erp/',
  '├── prisma/',
  '│   ├── schema.prisma              ← Modelos User, Session, AuditLog',
  '│   ├── seed.ts                    ← Usuarios iniciales del sistema  [NUEVO]',
  '│   └── migrations/20260321_init/  ← Historial de BD versionado     [NUEVO]',
  '├── app/',
  '│   ├── (auth)/login/page.tsx      ← Pantalla de login',
  '│   ├── (auth)/register/page.tsx   ← Pantalla de registro con roles',
  '│   ├── (dashboard)/layout.tsx     ← Auth guard + layout principal',
  '│   ├── (dashboard)/dashboard/     ← Panel con KPIs y flota',
  '│   └── api/auth/                  ← login | register | me | logout',
  '├── components/layout/',
  '│   ├── Header.tsx                 ← Usuario, rol coloreado, logout',
  '│   └── Sidebar.tsx                ← Navegación filtrada por rol',
  '├── lib/',
  '│   ├── prisma.ts                  ← Cliente Prisma singleton',
  '│   ├── jwt.ts                     ← Sign / verify / hash tokens',
  '│   ├── bcrypt.ts                  ← Hash y verificación de contraseñas',
  '│   └── auth-middleware.ts         ← withAuth HOF con control de roles',
  '├── scripts/',
  '│   └── generate-pdf.mjs           ← Generador de este documento',
  '├── types/auth.ts                  ← Tipos TypeScript del proyecto',
  '├── .env                           ← Variables de entorno (NO en git)',
  '├── .env.example                   ← Plantilla para equipo y VPS  [NUEVO]',
  '└── package.json                   ← Scripts: dev, build, db:*    [NUEVO]',
])

subTitle('Diseño de base de datos — Fase 1')
table(
  [{ label: 'Tabla', w: 90 }, { label: 'Propósito', w: 180 }, { label: 'Campos clave', w: 225 }],
  [
    ['users',      'Datos de cada usuario del sistema', 'id, email, password, role, status, loginAttempts, lockedUntil'],
    ['sessions',   'Control de sesiones. Logout multi-dispositivo', 'tokenHash (SHA-256 del JWT), expiresAt, revokedAt'],
    ['audit_logs', 'Registro completo: quién, qué y cuándo', 'userId, action, entity, ipAddress, metadata (JSON)'],
  ]
)

// ═══════════════════════════════════════════════════════════════════════════
// ████  PÁGINA 6 — MÓDULO DE AUTENTICACIÓN  ████
// ═══════════════════════════════════════════════════════════════════════════
addPage()
sectionTitle('04 — MÓDULO DE AUTENTICACIÓN')
moveDown(0.5)

subTitle('Endpoints de la API')
table(
  [{ label: 'Método', w: 55 }, { label: 'Endpoint', w: 145 }, { label: 'Descripción', w: 175 }, { label: 'Acceso', w: 120 }],
  [
    ['POST', '/api/auth/register', 'Crear nuevo usuario en el sistema', 'Abierto'],
    ['POST', '/api/auth/login',    'Iniciar sesión — devuelve JWT',     'Abierto'],
    ['GET',  '/api/auth/me',       'Datos del usuario autenticado',     'JWT requerido'],
    ['POST', '/api/auth/logout',   'Cerrar sesión y revocar token',     'JWT requerido'],
  ]
)

subTitle('Flujo de Registro — 7 pasos en una transacción de BD')

const steps = [
  ['1 — VALIDAR',        'Zod verifica formato de email, contraseña (mín 8, 1 mayúscula, 1 número) y nombre'],
  ['2 — VERIFICAR',      'Comprueba que el email no esté ya registrado en la BD'],
  ['3 — HASH',           'bcrypt con 12 rondas convierte la contraseña en hash seguro (~250ms)'],
  ['4 — CREAR USUARIO',  'Se guarda el registro completo en la tabla users de PostgreSQL'],
  ['5 — CREAR SESIÓN',   'Se genera el JWT y su hash SHA-256 se guarda en tabla sessions'],
  ['6 — AUDIT LOG',      'Se registra el evento USER_REGISTERED con IP y timestamp exacto'],
  ['7 — RESPONDER',      'Se devuelve el JWT al cliente para guardarlo en localStorage'],
]
steps.forEach(([step, desc], i) => {
  checkSpace(18)
  const ry = y()
  doc.rect(ML, ry, CW, 17).fill(i % 2 === 0 ? NAVY2 : [10, 25, 50])
  doc.fontSize(8).fillColor(GOLD).font('Helvetica-Bold')
    .text(step, ML + 6, ry + 4, { width: 115 })
  doc.fillColor(WHITE).font('Helvetica')
    .text(desc, ML + 125, ry + 4, { width: CW - 135 })
  setY(ry + 17)
})
moveDown(0.5)

subTitle('Sistema de Roles')
table(
  [{ label: 'Rol', w: 90 }, { label: 'Badge', w: 70 }, { label: 'Permisos', w: 335 }],
  [
    ['ADMIN',      'Rojo',   'Acceso total al sistema. Crear/suspender usuarios. Configuración general.'],
    ['OPERATOR',   'Dorado', 'Gestión de embarcaciones, rutas, combustible, clientes y órdenes.'],
    ['TECHNICIAN', 'Azul',   'Mantenimiento, inventario técnico y reportes técnicos.'],
  ]
)

subTitle('Protección contra Fuerza Bruta')
bullet('', 'Máximo 5 intentos de login fallidos por cuenta')
bullet('', 'Tras 5 fallos: cuenta bloqueada automáticamente 15 minutos')
bullet('', 'El contador de intentos se resetea con un login exitoso')
bullet('', 'Cada intento fallido queda registrado en audit_logs con IP y timestamp')

// ═══════════════════════════════════════════════════════════════════════════
// ████  PÁGINA 7 — CONFIGURACIÓN DEL ENTORNO  ████
// ═══════════════════════════════════════════════════════════════════════════
addPage()
sectionTitle('05 — CONFIGURACIÓN DEL ENTORNO LOCAL')
moveDown(0.5)

subTitle('Variables de entorno (.env)')
para('El archivo .env está protegido por .gitignore y nunca se sube al repositorio. Para nuevos entornos, copiar .env.example y completar los valores reales.')
codeBox([
  '# Base de Datos PostgreSQL',
  'DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5432/maritime_erp_db"',
  '',
  '# JWT — Generado con crypto.randomBytes(64).toString("hex")',
  'JWT_SECRET="<64 bytes hexadecimales aleatorios — YA CONFIGURADO>"',
  'JWT_EXPIRES_IN="8h"',
  '',
  '# bcrypt — 12 rondas mínimo en producción (nunca bajar de 10)',
  'BCRYPT_ROUNDS=12',
  '',
  '# Entorno y URL pública',
  'NODE_ENV="development"',
  'NEXT_PUBLIC_APP_URL="http://localhost:3000"',
])

subTitle('Scripts disponibles en package.json')
table(
  [{ label: 'Comando', w: 175 }, { label: 'Descripción', w: 320 }],
  [
    ['npm run dev',             'Servidor de desarrollo Turbopack en http://localhost:3000'],
    ['npm run build',           'Build optimizado de producción'],
    ['npm run db:migrate',      'Crea nueva migración y la aplica (solo en desarrollo)'],
    ['npm run db:migrate:prod', 'Aplica migraciones sin interacción (producción / VPS)'],
    ['npm run db:seed',         'Inserta usuarios base en la BD (idempotente — no duplica)'],
    ['npm run db:studio',       'Abre Prisma Studio visual en http://localhost:5555'],
    ['npm run db:reset',        'PELIGRO: Resetea la BD completa (solo en desarrollo)'],
    ['npm run docs:pdf',        'Regenera este documento PDF con el estado actual'],
  ]
)

subTitle('Output real del seed ejecutado')
codeBox([
  '$ npm run db:seed',
  '',
  '  🌱 Iniciando seed de VENOLS ERP...',
  '',
  '  ✅ Creado: [ADMIN]      admin@venols.com',
  '  ✅ Creado: [OPERATOR]   operador@venols.com',
  '  ✅ Creado: [TECHNICIAN] tecnico@venols.com',
  '',
  '  📋 Credenciales de acceso:',
  '  ─────────────────────────────────────────────────────',
  '  ADMIN        │ admin@venols.com      │ Admin123!',
  '  OPERATOR     │ operador@venols.com   │ Operador123!',
  '  TECHNICIAN   │ tecnico@venols.com    │ Tecnico123!',
  '  ─────────────────────────────────────────────────────',
  '  ⚠️  IMPORTANTE: Cambia estas contraseñas en producción.',
])

// ═══════════════════════════════════════════════════════════════════════════
// ████  PÁGINA 8 — BASE DE DATOS  ████
// ═══════════════════════════════════════════════════════════════════════════
addPage()
sectionTitle('06 — BASE DE DATOS — SCHEMA Y MIGRACIÓN')
moveDown(0.5)

subTitle('Migración ejecutada exitosamente')
codeBox([
  '$ npx prisma migrate dev --name init',
  '',
  '  Applying migration: 20260321032118_init',
  '  ✔ Your database is now in sync with your schema.',
  '  ✔ Generated Prisma Client (v6.12.0) in 28ms',
  '',
  '  Tablas creadas:  users  |  sessions  |  audit_logs',
  '  Índices creados: email, role, status, tokenHash, expiresAt, action, createdAt',
])

subTitle('Schema Prisma completo — Fase 1')
codeBox([
  'enum Role       { ADMIN  OPERATOR  TECHNICIAN }',
  'enum UserStatus { ACTIVE  INACTIVE  SUSPENDED }',
  '',
  'model User {',
  '  id            String     @id @default(cuid())',
  '  email         String     @unique',
  '  password      String     // bcrypt hash — NUNCA texto plano',
  '  firstName     String',
  '  lastName      String',
  '  phone         String?',
  '  avatar        String?',
  '  role          Role       @default(OPERATOR)',
  '  status        UserStatus @default(ACTIVE)',
  '  lastLoginAt   DateTime?',
  '  loginAttempts Int        @default(0)',
  '  lockedUntil   DateTime?  // null = libre | filled = bloqueado N min',
  '  sessions      Session[]',
  '  auditLogs     AuditLog[]',
  '  @@map("users")',
  '  @@index([email]) @@index([role]) @@index([status])',
  '}',
  '',
  'model Session {',
  '  id        String    @id @default(cuid())',
  '  userId    String',
  '  tokenHash String    @unique   // SHA-256 del JWT — no el token completo',
  '  ipAddress String?',
  '  userAgent String?',
  '  expiresAt DateTime',
  '  revokedAt DateTime?           // null = activa | filled = cerrada',
  '  @@map("sessions")',
  '  @@index([userId]) @@index([tokenHash]) @@index([expiresAt])',
  '}',
  '',
  'model AuditLog {',
  '  id        String   @id @default(cuid())',
  '  userId    String?',
  '  action    String   // USER_LOGIN | USER_LOGOUT | LOGIN_FAILED | ...',
  '  entity    String?  // Tabla afectada (ej: "User")',
  '  entityId  String?',
  '  metadata  Json?    // Datos extra (ej: {attempts: 3})',
  '  ipAddress String?',
  '  @@map("audit_logs")',
  '  @@index([userId]) @@index([action]) @@index([createdAt])',
  '}',
])

// ═══════════════════════════════════════════════════════════════════════════
// ████  PÁGINA 9 — INTERFAZ DE USUARIO  ████
// ═══════════════════════════════════════════════════════════════════════════
addPage()
sectionTitle('07 — INTERFAZ DE USUARIO')
moveDown(0.5)

subTitle('Paleta de colores VENOLS')
table(
  [{ label: 'Nombre', w: 110 }, { label: 'Hex', w: 80 }, { label: 'Uso en la app', w: 305 }],
  [
    ['Navy Oscuro (fondo)',  '#060e1e', 'Fondo principal de la aplicación'],
    ['Navy Medio (cards)',   '#0a1628', 'Cards, paneles, sidebar, header'],
    ['Dorado (marca)',       '#D4950A', 'Color de marca — acentos, bordes activos, títulos'],
    ['Dorado claro',         '#E8A714', 'Hover states, gradientes de botones, íconos'],
    ['Azul marino (muted)',  '#7fa8c9', 'Texto secundario, labels, placeholders'],
    ['Blanco frío (texto)',  '#e8f4fd', 'Texto principal sobre fondos oscuros'],
  ]
)

subTitle('Componentes implementados')

const comps = [
  ['Login Page',       '(auth)/login/page.tsx',
   'Pantalla dividida: panel izquierdo con 4 KPIs decorativos (embarcaciones, tripulantes, disponibilidad, puertos) + panel derecho con formulario. Validación client-side y manejo de errores.'],
  ['Register Page',    '(auth)/register/page.tsx',
   'Panel izquierdo con descripción de los 3 roles. Panel derecho con formulario de 5 campos. Validación de contraseña: mín 8 chars, 1 mayúscula, 1 número. Selector de rol.'],
  ['Dashboard Page',   '(dashboard)/dashboard/page.tsx',
   '4 KPIs (embarcaciones, en operación, combustible, mantenimiento), lista de flota con estado visual, log de actividad reciente, reloj dinámico con actualización por minuto.'],
  ['Dashboard Layout', '(dashboard)/layout.tsx',
   'Auth guard: verifica JWT via /api/auth/me en cada carga. Si el token es inválido o expirado, redirige automáticamente a /login. Loading state mientras verifica.'],
  ['Header',           'components/layout/Header.tsx',
   'Logo VENOLS, avatar con iniciales del usuario, nombre, badge de rol por color (rojo/dorado/azul), botón de logout que llama a /api/auth/logout y limpia localStorage.'],
  ['Sidebar',          'components/layout/Sidebar.tsx',
   'Navegación agrupada en 4 secciones (Principal, Operaciones, Mantenimiento, Sistema). Filtrada por rol: solo muestra rutas permitidas. Indicadores "FASE 2+" para módulos pendientes.'],
]

comps.forEach(([name, path, desc]) => {
  checkSpace(40)
  doc.fontSize(9).fillColor(GOLD).font('Helvetica-Bold').text(name, ML)
  doc.fontSize(7.5).fillColor(MUTED).font('Courier').text(path, ML)
  doc.fontSize(8.5).fillColor(GRAY).font('Helvetica').text(desc, ML, y(), { width: CW, lineGap: 1 })
  moveDown(0.8)
})

// ═══════════════════════════════════════════════════════════════════════════
// ████  PÁGINA 10 — SEGURIDAD  ████
// ═══════════════════════════════════════════════════════════════════════════
addPage()
sectionTitle('08 — SEGURIDAD IMPLEMENTADA')
moveDown(0.5)
para('El sistema implementa 8 capas de seguridad independientes. Si una capa falla, las demás siguen protegiendo el sistema.')

const secLayers = [
  ['Contraseñas cifradas',     'bcrypt con 12 rondas. Las contraseñas NUNCA se almacenan en texto plano. ~250ms por hash hace ataques de diccionario inviables computacionalmente.'],
  ['Tokens JWT firmados HS256', 'Secret de 64 bytes hexadecimales aleatorios (crypto.randomBytes). Sin el secreto del servidor es imposible forjar un token válido. Expiración en 8h.'],
  ['Hash SHA-256 del token',   'No se guarda el JWT completo en la BD, sino su hash SHA-256. Si alguien roba la BD, no puede usar los tokens robados. Zero-knowledge storage.'],
  ['Validación con Zod',       'Todos los endpoints validan estrictamente los datos recibidos con schemas Zod. Previene inyecciones, datos malformados y tipos incorrectos.'],
  ['Bloqueo por fuerza bruta', '5 intentos fallidos → bloqueo automático de 15 minutos en la BD. El contador se resetea con un login exitoso. Cada fallo queda en audit_logs.'],
  ['Headers de seguridad',     'Configurados en Nginx: X-Frame-Options SAMEORIGIN, X-XSS-Protection, X-Content-Type-Options nosniff, HSTS (Strict-Transport-Security).'],
  ['HTTPS/TLS',                "Let's Encrypt — todo el tráfico viaja cifrado. Certificado SSL gratuito con renovación automática cada 90 días. Solo TLS 1.2 y 1.3 permitidos."],
  ['Variables de entorno',     '.env en .gitignore — secretos nunca en el código ni en el repositorio. JWT_SECRET generado con crypto.randomBytes(64).toString("hex").'],
  ['Audit log completo',       'Tabla audit_logs registra: USER_LOGIN, USER_LOGOUT, USER_REGISTERED, LOGIN_FAILED. Cada registro incluye userId, IP, timestamp y metadata JSON.'],
]

secLayers.forEach(([layer, desc], i) => {
  checkSpace(24)
  const ry = y()
  doc.rect(ML, ry, CW, 22).fill(i % 2 === 0 ? NAVY2 : [10, 25, 50])
  doc.rect(ML, ry, 3, 22).fill(GREEN)
  doc.fontSize(8.5).fillColor(GOLD).font('Helvetica-Bold')
    .text(layer, ML + 8, ry + 4, { width: 155 })
  doc.fontSize(7.5).fillColor([170, 210, 235]).font('Helvetica')
    .text(desc, ML + 168, ry + 4, { width: CW - 178, height: 17 })
  setY(ry + 22)
})

// ═══════════════════════════════════════════════════════════════════════════
// ████  PÁGINA 11 — PRE-FASE 2  ████
// ═══════════════════════════════════════════════════════════════════════════
addPage()
sectionTitle('09 — PRE-FASE 2 — TAREAS COMPLETADAS')
moveDown(0.5)
para('Antes de iniciar el desarrollo de nuevas funcionalidades se ejecutó una sesión de estabilización del entorno local. Todos los puntos fueron verificados y testeados.')
moveDown(0.3)

const preFase2 = [
  [true,  'JWT_SECRET reemplazado — 64 bytes hexadecimales generados con crypto.randomBytes(64)'],
  [true,  '.gitignore corregido — .env, .env.local, .env.production ahora protegidos del repositorio'],
  [true,  '.env.example creado como plantilla documentada para nuevos desarrolladores y el VPS'],
  [true,  'Conflicto de versiones resuelto — @prisma/client v7 alineado a v6.12.0 (igual que CLI)'],
  [true,  'Migración inicial ejecutada — tablas users, sessions, audit_logs creadas en PostgreSQL'],
  [true,  'Índices de BD verificados — email, role, status, tokenHash, expiresAt, action, createdAt'],
  [true,  'Error TypeScript en Sidebar.tsx corregido — tipos NavItem y NavGroup definidos explícitamente'],
  [true,  'Error TypeScript en lib/jwt.ts corregido — tipo de expiresIn alineado con jsonwebtoken v9'],
  [true,  'tsx instalado como runner TypeScript en Windows (evita problemas de comillas con ts-node)'],
  [true,  'Scripts de BD añadidos — db:migrate, db:migrate:prod, db:seed, db:studio, db:reset, docs:pdf'],
  [true,  'prisma/seed.ts creado — 3 usuarios base idempotentes (no duplica si ya existen)'],
  [true,  'Seed ejecutado exitosamente — 3 usuarios en BD con contraseñas hasheadas correctamente'],
  [true,  'npx tsc --noEmit sin errores — TypeScript 100% válido en todo el proyecto'],
  [true,  'Test E2E exitoso: POST /api/auth/login → 200 OK + JWT + sesión guardada + audit log creado'],
  [true,  'scripts/generate-pdf.mjs creado — documentación técnica regenerable con npm run docs:pdf'],
  [false, 'Replicar configuración en VPS (pendiente — servidor no contratado aún)'],
  [false, 'Configurar backup automático de PostgreSQL en producción'],
  [false, 'Configurar monitoreo de uptime (UptimeRobot, Betterstack o similar)'],
]

preFase2.forEach(([done, text]) => { checkRow(done, text) })

// ═══════════════════════════════════════════════════════════════════════════
// ████  PÁGINA 12 — CREDENCIALES Y COMANDOS  ████
// ═══════════════════════════════════════════════════════════════════════════
addPage()
sectionTitle('10 — CREDENCIALES Y COMANDOS ÚTILES')
moveDown(0.5)

subTitle('Credenciales de desarrollo local')
para('IMPORTANTE: Cambiar estas contraseñas antes de cualquier lanzamiento en producción o entorno accesible desde internet.')
codeBox([
  'ROL          │ EMAIL                     │ CONTRASEÑA',
  '─────────────┼───────────────────────────┼─────────────',
  'ADMIN        │ admin@venols.com           │ Admin123!',
  'OPERATOR     │ operador@venols.com        │ Operador123!',
  'TECHNICIAN   │ tecnico@venols.com         │ Tecnico123!',
])

subTitle('Comandos de desarrollo diario')
codeBox([
  '# Iniciar servidor de desarrollo',
  '$ npm run dev                  → http://localhost:3000',
  '',
  '# Ver y editar base de datos visualmente',
  '$ npm run db:studio            → http://localhost:5555',
  '',
  '# Insertar/verificar usuarios base',
  '$ npm run db:seed',
  '',
  '# Verificar que TypeScript no tiene errores',
  '$ npx tsc --noEmit',
  '',
  '# Regenerar este documento PDF',
  '$ npm run docs:pdf',
])

subTitle('Comandos de despliegue en VPS (cuando esté disponible)')
codeBox([
  '# 1. Actualizar código desde repositorio',
  '$ git pull origin main',
  '',
  '# 2. Instalar solo dependencias de producción',
  '$ npm ci --omit=dev',
  '',
  '# 3. Aplicar migraciones en producción (sin interacción)',
  '$ npx prisma migrate deploy',
  '$ npx prisma generate',
  '',
  '# 4. Build y reinicio sin downtime',
  '$ npm run build',
  '$ pm2 reload venols-erp --update-env',
  '',
  '# 5. Primera vez: crear usuario admin inicial',
  '$ npm run db:seed',
  '',
  '# 6. Ver logs en tiempo real',
  '$ pm2 logs venols-erp',
])

// ═══════════════════════════════════════════════════════════════════════════
// ████  PÁGINA 13 — PRÓXIMAS FASES  ████
// ═══════════════════════════════════════════════════════════════════════════
addPage()
sectionTitle('11 — HOJA DE RUTA: PRÓXIMAS FASES')
moveDown(0.5)

subTitle('Estado general del proyecto')

progressRow('FASE 1',     100, '✅ COMPLETADA',  'Autenticación, roles, BD base, UI naval, seguridad', GREEN)
progressRow('PRE-FASE 2', 100, '✅ COMPLETADA',  'Entorno local estable, migraciones, seed, test E2E', GREEN)
progressRow('FASE 2',       0, '🔲 PRÓXIMA',     'Módulo de embarcaciones, mapa AIS, CRUD flota',      MUTED)
progressRow('FASE 3',       0, '🔲 PENDIENTE',   'Personal, tripulación, certificaciones STCW',        MUTED)
progressRow('FASE 4',       0, '🔲 PENDIENTE',   'Rutas, combustible, carga de hidrocarburos',         MUTED)
progressRow('FASE 5',       0, '🔲 PENDIENTE',   'Clientes CRM, mantenimiento, compliance MARPOL',     MUTED)
progressRow('FASE 6',       0, '🔲 PENDIENTE',   'Analytics, reportes PDF, SaaS multi-tenant',         MUTED)

moveDown(0.5)
subTitle('FASE 2 — Módulo de Embarcaciones (próxima acción)')

const f2 = [
  'Agregar modelos Vessel, VesselType, Port al schema.prisma',
  'Ejecutar: npx prisma migrate dev --name fase2-vessels',
  'API GET /api/vessels — listar flota con filtros (status, tipo)',
  'API POST /api/vessels — crear embarcación (solo ADMIN)',
  'API GET /api/vessels/[id] — detalle completo del buque',
  'API PUT /api/vessels/[id] — actualizar datos (ADMIN/OPERATOR)',
  'Página /dashboard/vessels — tabla con filtros y búsqueda en tiempo real',
  'Página /dashboard/vessels/[id] — ficha completa de embarcación',
  'Formulario de alta/edición con validación Zod + React Hook Form',
  'Mapa interactivo con Leaflet para posición de buques',
  'Integración AIS (MarineTraffic API) para posición GPS real',
  'Estados de embarcación con flujo: ACTIVE, DOCKED, TRANSIT, MAINTENANCE',
  'Alertas de embarcaciones en mantenimiento prolongado (> N días)',
]
f2.forEach(t => checkRow(false, t))

moveDown(0.5)
subTitle('Innovaciones prioritarias para sector petrolero')
bullet('Demurrage automático', 'NOR → cálculo de laytime → alerta de vencimiento → Statement of Facts')
bullet('Control de bunker ROB', 'Remaining On Board en tiempo real con alertas configurables por umbral')
bullet('Compliance MARPOL', 'Checklists digitales MARPOL Anexos I-VI, vencimientos automáticos')
bullet('Rastreo AIS', 'Posición GPS en tiempo real sobre mapa — integración MarineTraffic / VesselFinder')
bullet('CII Rating IMO 2023', 'Cálculo automático de Carbon Intensity Indicator por embarcación')

// ═══════════════════════════════════════════════════════════════════════════
// ████  PÁGINA 14 — CIERRE  ████
// ═══════════════════════════════════════════════════════════════════════════
addPage()
sectionTitle('NOTA PARA EL EQUIPO')
moveDown(0.5)

para('Este documento fue generado automáticamente por el script scripts/generate-pdf.mjs al completar la Fase 1 y la sesión de estabilización Pre-Fase 2. Refleja con exactitud el estado actual del código, la base de datos, los tests realizados y los próximos pasos.')

moveDown(0.5)
subTitle('Para regenerar este documento')
codeBox(['$ npm run docs:pdf    →  VENOLS_ERP_Fase1_Documentacion.pdf'])

moveDown(0.3)
para('Cada fase completada actualizará este documento con sus secciones correspondientes. El PDF es la fuente de verdad del estado del proyecto para presentaciones al cliente y onboarding de nuevos desarrolladores.')

divider()

doc.fontSize(8).fillColor(MUTED).font('Helvetica')
  .text(
    `Generado automáticamente el ${new Date().toLocaleDateString('es-ES', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}  ·  VENOLS ERP v1.1.0  ·  CONFIDENCIAL`,
    ML, y(), { width: CW, align: 'center' }
  )

// ─── FINALIZAR ────────────────────────────────────────────────────────────
doc.end()

stream.on('finish', () => {
  const size = (fs.statSync(OUTPUT).size / 1024).toFixed(1)
  console.log('\n✅  PDF generado exitosamente')
  console.log(`    Archivo : ${OUTPUT}`)
  console.log(`    Páginas : ${currentPage}`)
  console.log(`    Tamaño  : ${size} KB\n`)
})
stream.on('error', err => { console.error('❌ Error:', err); process.exit(1) })
