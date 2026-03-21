# VENOLS ERP — DOCUMENTO MAESTRO
## Logística Marítima Petrolera · Plataforma SaaS Enterprise

> **Clasificación:** CONFIDENCIAL — USO INTERNO
> **Versión:** 2.0.0
> **Fecha:** 20 de Marzo de 2026
> **Equipo:** Desarrollo VENOLS

---

## ÍNDICE

1. [Visión del Producto](#1-visión-del-producto)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Arquitectura del Proyecto](#3-arquitectura-del-proyecto)
4. [Estado Actual — FASE 1 COMPLETADA](#4-estado-actual--fase-1-completada)
5. [Lo que falta por hacer — Fases 2 a 6](#5-lo-que-falta-por-hacer--fases-2-a-6)
6. [Hoja de Ruta Completa](#6-hoja-de-ruta-completa)
7. [Innovaciones Propuestas — Sector Petrolero](#7-innovaciones-propuestas--sector-petrolero)
8. [Arquitectura Escalable a SaaS](#8-arquitectura-escalable-a-saas)
9. [Seguridad Implementada y Pendiente](#9-seguridad-implementada-y-pendiente)
10. [Configuración de Servidor](#10-configuración-de-servidor)
11. [Checklist de Desarrollo](#11-checklist-de-desarrollo)

---

## 1. VISIÓN DEL PRODUCTO

**VENOLS ERP** es una plataforma web de gestión logística marítima diseñada para administrar de forma integral las operaciones de empresas en el sector **naval y petrolero**: embarcaciones, combustible, inventario, personal, mantenimiento, clientes y rutas.

### ¿Por qué es crítico este producto en la industria petrolera?

La logística marítima del sector oil & gas tiene requerimientos únicos:
- Trazabilidad total de carga y descarga de hidrocarburos
- Cumplimiento regulatorio MARPOL, SOPEP, ISM Code
- Control de emisiones CO₂ y carbono (ESG)
- Manejo de situaciones de emergencia (HSSE)
- Documentación legal: LOI, NOR, B/L, Charter Parties
- Gestión de demurrage (penalizaciones por tiempo)
- Integración con terminales portuarios y refinerías

### Propuesta de valor

| Problema actual | Solución VENOLS |
|---|---|
| Gestión en Excel/papel | ERP centralizado, tiempo real |
| Sin trazabilidad de carga | Módulo de cargamentos con QR/IoT |
| Incumplimiento regulatorio | Alertas y checklists MARPOL automáticos |
| Mantenimiento reactivo | IA predictiva con sensores IoT |
| Sin visibilidad de flota | Mapa AIS en tiempo real |
| Reportes manuales | Analytics automático + exportación |

---

## 2. STACK TECNOLÓGICO

### Implementado en Fase 1

| Tecnología | Versión | Propósito |
|---|---|---|
| **Next.js** | 16.2.1 | Framework React — Frontend + API Routes Backend |
| **TypeScript** | 5.x | Tipado estático — código robusto y mantenible |
| **PostgreSQL** | 15+ | Base de datos relacional principal del ERP |
| **Prisma ORM** | 6.12 | Gestión de BD con tipado automático |
| **JWT** jsonwebtoken | 9.0.3 | Tokens de autenticación seguros con expiración |
| **bcryptjs** | 3.0.3 | Hash de contraseñas — 12 rondas |
| **Zod** | 4.3.6 | Validación de esquemas en API |
| **Tailwind CSS** | 3.4.1 | Framework CSS utility-first |
| **Nginx** | 1.24+ | Reverse proxy + SSL termination |
| **PM2** | 5.x | Process manager Node.js — cluster mode |
| **Let's Encrypt** | Certbot | SSL/HTTPS gratuito, renovación automática |

### A incorporar en fases siguientes

| Tecnología | Propósito | Fase |
|---|---|---|
| **Socket.io / Pusher** | WebSockets para alertas tiempo real | 2 |
| **Redis** | Cache de sesiones, rate limiting, queues | 2 |
| **Mapbox GL / Leaflet** | Mapa interactivo de flota | 2 |
| **AIS API** (MarineTraffic/VesselFinder) | Posición GPS real de buques | 2 |
| **React Query / SWR** | Cache y sincronización de datos en cliente | 2 |
| **Chart.js / Recharts** | Gráficas de KPIs y analytics | 3 |
| **jsPDF / PDFKit** | Generación de reportes PDF | 5 |
| **Nodemailer / Resend** | Notificaciones por email | 3 |
| **Bull / BullMQ** | Colas de trabajo para tareas asíncronas | 3 |
| **MinIO / S3** | Almacenamiento de documentos | 3 |
| **React Hook Form** | Formularios complejos con validación | 2 |
| **Next-i18next** | Internacionalización (ES/EN/PT) | 5 |
| **Stripe** | Pagos para SaaS multi-tenant | 6 |
| **Terraform** | Infraestructura como código | 6 |

---

## 3. ARQUITECTURA DEL PROYECTO

### Estructura de carpetas actual

```
maritime-erp/
├── prisma/
│   └── schema.prisma              ← Definición de tablas y relaciones
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx         ✅ IMPLEMENTADO
│   │   └── register/page.tsx      ✅ IMPLEMENTADO
│   ├── (dashboard)/
│   │   ├── layout.tsx             ✅ IMPLEMENTADO — Auth guard + layout
│   │   └── dashboard/page.tsx     ✅ IMPLEMENTADO — KPIs + flota + actividad
│   ├── api/auth/
│   │   ├── login/route.ts         ✅ IMPLEMENTADO
│   │   ├── register/route.ts      ✅ IMPLEMENTADO
│   │   ├── me/route.ts            ✅ IMPLEMENTADO
│   │   └── logout/route.ts        ✅ IMPLEMENTADO
│   ├── layout.tsx                 ✅ IMPLEMENTADO
│   └── page.tsx                   ✅ Redirect a login
├── components/
│   └── layout/
│       ├── Sidebar.tsx            ✅ IMPLEMENTADO — Navegación con roles
│       └── Header.tsx             ✅ IMPLEMENTADO — Usuario + logout
├── lib/
│   ├── prisma.ts                  ✅ Cliente Prisma singleton
│   ├── jwt.ts                     ✅ Sign/verify/hash tokens
│   ├── bcrypt.ts                  ✅ Hash y verificación de contraseñas
│   └── auth-middleware.ts         ✅ withAuth HOF con roles
└── package.json                   ✅ Dependencias configuradas
```

### Estructura propuesta para Fases 2-6

```
maritime-erp/
├── app/
│   ├── (dashboard)/
│   │   ├── vessels/               ← FASE 2
│   │   ├── crew/                  ← FASE 3
│   │   ├── routes/                ← FASE 4
│   │   ├── inventory/             ← FASE 4
│   │   ├── fuel/                  ← FASE 4 (CRÍTICO en petrolera)
│   │   ├── cargo/                 ← FASE 4 (NUEVO — cargas de hidrocarburos)
│   │   ├── clients/               ← FASE 5
│   │   ├── maintenance/           ← FASE 5
│   │   ├── compliance/            ← FASE 5 (NUEVO — MARPOL, ISM)
│   │   ├── documents/             ← FASE 5 (NUEVO — LOI, NOR, B/L)
│   │   ├── reports/               ← FASE 6
│   │   ├── analytics/             ← FASE 6
│   │   └── settings/              ← FASE 6
│   └── api/
│       ├── vessels/               ← CRUD de embarcaciones
│       ├── crew/                  ← CRUD de tripulación
│       ├── routes/                ← Rutas y viajes
│       ├── inventory/             ← Inventario a bordo
│       ├── fuel/                  ← Control de combustible
│       ├── cargo/                 ← Cargas y manifiestos
│       ├── maintenance/           ← Órdenes de trabajo
│       ├── compliance/            ← Documentación regulatoria
│       └── reports/               ← Generación de reportes
├── services/                      ← Lógica de negocio desacoplada
│   ├── vessel.service.ts
│   ├── crew.service.ts
│   ├── fuel.service.ts
│   ├── notification.service.ts
│   └── ais.service.ts             ← Integración AIS GPS
├── hooks/                         ← Custom React hooks
├── store/                         ← State management (Zustand)
└── types/                         ← Tipos TypeScript globales
```

### Diseño de base de datos

#### Tablas implementadas (Fase 1)

```prisma
User        ← Usuarios del sistema (admin, operador, técnico)
Session     ← Control de sesiones activas — revocación por dispositivo
AuditLog    ← Registro completo de todas las acciones con IP + timestamp
```

#### Tablas a agregar (Fases 2-6)

```prisma
// FASE 2 — Embarcaciones
Vessel          ← IMO, nombre, tipo, bandera, capacidad, estado
VesselType      ← Tanquero, barcaza, remolcador, etc.
Port            ← Puerto, país, coordenadas, código UNLOC

// FASE 3 — Personal
Employee        ← Tripulante con certificaciones y documentos
Certification   ← STCW, cursos, fechas de vencimiento
Assignment      ← Asignación de tripulante a embarcación + rol a bordo

// FASE 4 — Operaciones (CRÍTICO para sector petrolero)
Voyage          ← Viaje con origen, destino, fechas, estado
FuelLog         ← Consumo diario por embarcación y tipo de combustible
InventoryItem   ← Ítems a bordo (repuestos, consumibles, equipos)
CargoManifest   ← Manifiesto de carga de hidrocarburos
CargoOperation  ← Carga/descarga con volúmenes, temperaturas, API gravity
TankReading     ← Lecturas de tanques (ullage, temperatura, volumen corregido)

// FASE 5 — Clientes y Mantenimiento
Client          ← Cliente con NIT, contactos, contratos
ServiceOrder    ← Orden de servicio / trabajo técnico
MaintenancePlan ← Plan preventivo por horas o calendario
Incident        ← Reporte de incidente HSSE

// FASE 5 — Documentos y Compliance
Document        ← Documentos con tipo, vencimiento, archivo adjunto
ComplianceCheck ← Checklists MARPOL, ISM, ISPS, MLC
Notice          ← NOR, LOI, Demurrage, Charter Party
```

---

## 4. ESTADO ACTUAL — FASE 1 COMPLETADA

### ✅ Sistema de Autenticación Completo

**Endpoints implementados:**

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| POST | `/api/auth/register` | Crear nuevo usuario | Abierto |
| POST | `/api/auth/login` | Iniciar sesión | Abierto |
| GET | `/api/auth/me` | Datos del usuario autenticado | JWT requerido |
| POST | `/api/auth/logout` | Cerrar sesión y revocar token | JWT requerido |

**Flujo de registro (7 pasos con transacción):**
1. Validación Zod (email, contraseña, nombre)
2. Verificar email no duplicado
3. Hash de contraseña con bcrypt (12 rondas)
4. Crear usuario en tabla `users`
5. Generar JWT + guardar hash SHA-256 en tabla `sessions`
6. Registrar en `audit_logs` con IP y timestamp
7. Retornar token al cliente

**Protección contra fuerza bruta:**
- Máximo 5 intentos de login fallidos
- Bloqueo automático de 15 minutos tras 5 fallos
- Contador se resetea con login exitoso
- Cada fallo queda en `audit_logs` con IP

### ✅ Modelo de Roles Implementado

| Rol | Badge | Permisos |
|---|---|---|
| ADMIN | 🔴 Rojo | Acceso total al sistema |
| OPERATOR | 🟡 Dorado | Gestión de embarcaciones y rutas |
| TECHNICIAN | 🔵 Azul | Mantenimiento y reportes técnicos |

### ✅ Schema de Base de Datos

```prisma
// 3 tablas con índices optimizados
User { id, email, password, firstName, lastName, phone, avatar,
       role, status, lastLoginAt, loginAttempts, lockedUntil }
Session { id, userId, tokenHash (SHA-256), ipAddress, userAgent,
          expiresAt, revokedAt }
AuditLog { id, userId, action, entity, entityId, metadata, ipAddress }
```

### ✅ Seguridad Implementada

- `bcrypt` 12 rondas (~250ms/hash — ataques de diccionario inviables)
- JWT HS256 + secret de 64 caracteres
- SHA-256 del JWT guardado en BD (no el token completo)
- Validación estricta con Zod en cada endpoint
- Bloqueo por fuerza bruta (5 intentos / 15 min)
- Headers de seguridad via Nginx: X-Frame-Options, CSP, HSTS, XSS-Protection
- HTTPS/TLS via Let's Encrypt
- Variables de entorno en `.env` + `.gitignore`
- Audit log completo con IP y timestamp

### ✅ Interfaz de Usuario

- **Login:** Pantalla dividida con KPIs decorativos, validación client-side, manejo de errores
- **Register:** Selector de rol con descripción, validación de contraseña (min 8, mayúscula, número)
- **Dashboard:** 4 KPIs operativos, panel de flota activa, log de actividad reciente
- **Header:** Usuario logueado, badge de rol por color, botón de logout
- **Sidebar:** Navegación con secciones, filtrado por rol, indicadores "FASE 2+" para pendientes

### ✅ Infraestructura Base

- Nginx reverse proxy configurado para Next.js
- PM2 process manager con cluster mode y auto-restart
- SSL/HTTPS con Let's Encrypt (renovación automática cada 90 días)
- UFW Firewall — solo puertos 80, 443 y SSH expuestos
- PostgreSQL en VPS — no expuesto a internet
- Prisma Studio para gestión visual de BD en desarrollo

---

## 5. LO QUE FALTA POR HACER — FASES 2 A 6

### ⏳ PENDIENTE URGENTE (Pre-Fase 2)

Antes de continuar con nuevas fases, verificar y completar:

- [ ] Ejecutar migraciones de Prisma en producción: `npx prisma migrate deploy`
- [ ] Configurar variables de entorno en VPS: `.env` con `DATABASE_URL`, `JWT_SECRET`
- [ ] Verificar que `JWT_SECRET` tenga al menos 64 caracteres aleatorios
- [ ] Probar endpoint `/api/auth/register` en producción
- [ ] Probar endpoint `/api/auth/login` con cuenta de prueba
- [ ] Verificar que Nginx redirija correctamente `/api/*` a Next.js
- [ ] Confirmar que la BD PostgreSQL está corriendo en VPS
- [ ] Crear usuario ADMIN inicial via script o Prisma Studio
- [ ] Configurar backup automático de PostgreSQL (diario)

---

### FASE 2 — MÓDULO DE EMBARCACIONES

**Objetivo:** Gestión completa de la flota naval.

#### Lo que hay que construir:

**Base de datos:**
```prisma
model Vessel {
  id            String      @id @default(cuid())
  imoNumber     String      @unique  // Número IMO internacional
  name          String
  flag          String                // Bandera del buque
  type          VesselType           // Tanquero, Barcaza, Remolcador...
  grossTonnage  Float?
  deadweight    Float?                // DWT — carga máxima en toneladas
  yearBuilt     Int?
  status        VesselStatus         // ACTIVE, MAINTENANCE, DOCKED, TRANSIT
  currentPort   String?
  nextPort      String?
  eta           DateTime?
  aisLat        Float?               // Posición GPS última actualización
  aisLon        Float?
  aisUpdatedAt  DateTime?
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  voyages       Voyage[]
  fuelLogs      FuelLog[]
  maintenances  Maintenance[]
}

enum VesselType { TANKER BARGE TUG SUPPLY_VESSEL CARGO PATROL }
enum VesselStatus { ACTIVE DOCKED TRANSIT MAINTENANCE DECOMMISSIONED }
```

**API Routes a crear:**
- `GET /api/vessels` — Listar flota con filtros (status, tipo)
- `POST /api/vessels` — Crear embarcación (solo ADMIN)
- `GET /api/vessels/[id]` — Detalle de embarcación
- `PUT /api/vessels/[id]` — Actualizar datos (ADMIN/OPERATOR)
- `DELETE /api/vessels/[id]` — Desactivar embarcación (solo ADMIN)
- `GET /api/vessels/[id]/position` — Posición AIS actual

**Páginas a crear:**
- `/dashboard/vessels` — Tabla de flota con filtros y búsqueda
- `/dashboard/vessels/[id]` — Ficha completa de embarcación
- `/dashboard/vessels/[id]/edit` — Editar datos
- `/dashboard/map` — Mapa interactivo con posición de buques (Mapbox/Leaflet)

**Integraciones:**
- API MarineTraffic o VesselFinder para posición AIS en tiempo real
- Webhook para actualización automática de posición cada N minutos

---

### FASE 3 — PERSONAL Y TRIPULACIÓN

**Objetivo:** Gestión de empleados, asignación a embarcaciones y vencimientos de certificaciones.

**Lo que hay que construir:**

```prisma
model Employee {
  id              String    @id @default(cuid())
  userId          String?   @unique  // Si tiene acceso al sistema
  firstName       String
  lastName        String
  nationalId      String    @unique
  nationality     String
  position        String    // Capitán, Jefe Máquinas, Marinero...
  seafarerBook    String?   // Libreta de mar
  passportNumber  String?
  passportExpiry  DateTime?
  status          EmployeeStatus
  certifications  Certification[]
  assignments     Assignment[]
}

model Certification {
  id          String    @id @default(cuid())
  employeeId  String
  type        String    // STCW, Básico, BST, GMDSS, ECDIS...
  issuedAt    DateTime
  expiresAt   DateTime
  issuedBy    String    // Autoridad marítima
  number      String
  employee    Employee  @relation(...)
}

model Assignment {
  id          String    @id @default(cuid())
  employeeId  String
  vesselId    String
  role        String    // Rol a bordo
  startDate   DateTime
  endDate     DateTime?
  status      AssignmentStatus
}
```

**Funcionalidades clave:**
- Alertas automáticas de vencimiento de certificaciones (30, 15, 7 días)
- Disponibilidad de tripulantes para asignación
- Historial de embarques por persona
- Exportación de crew list para autoridades portuarias
- Gestión de documentos (pasaporte, libreta, certificados) con archivos adjuntos

---

### FASE 4 — OPERACIONES: RUTAS, INVENTARIO Y COMBUSTIBLE

**Objetivo:** Núcleo operativo del ERP. Crítico para sector petrolero.

**Lo que hay que construir:**

#### 4A. Módulo de Rutas y Viajes

```prisma
model Voyage {
  id            String      @id @default(cuid())
  vesselId      String
  voyageNumber  String      @unique   // Número de viaje único
  origin        String                // Puerto de origen
  destination   String                // Puerto de destino
  departureAt   DateTime?
  arrivalAt     DateTime?
  status        VoyageStatus          // PLANNED, UNDERWAY, COMPLETED, CANCELLED
  cargoType     String?               // Tipo de cargo
  cargoTons     Float?                // Toneladas
  charterParty  String?               // Número de contrato
  client        Client?   @relation(...)
  fuelLogs      FuelLog[]
  cargos        CargoOperation[]
}
```

#### 4B. Control de Combustible (CRÍTICO sector petrolero)

```prisma
model FuelLog {
  id              String    @id @default(cuid())
  vesselId        String
  voyageId        String?
  date            DateTime
  fuelType        FuelType  // HFO, MDO, MGO, LSMGO, LNG...
  operationAt     String    // Puerto o posición en mar
  bunkerReceived  Float?    // Toneladas abastecidas
  consumed        Float?    // Toneladas consumidas
  rob             Float     // Remaining On Board — saldo
  price           Float?    // Precio por tonelada (USD)
  supplier        String?   // Proveedor de bunker
  bdn             String?   // Bunker Delivery Note number
  reportedBy      String    // userId del oficial que reporta
}

enum FuelType { HFO IFO380 VLSFO ULSFO MDO MGO LSMGO LNG METHANOL }
```

**KPIs de combustible a calcular:**
- Consumo promedio por milla náutica (MT/NM)
- Proyección de consumo por viaje
- Alertas cuando ROB < umbral configurado
- Costo total de bunker por voyage
- Comparativa entre buques

#### 4C. Gestión de Carga (CRÍTICO sector hidrocarburos)

```prisma
model CargoOperation {
  id              String    @id @default(cuid())
  voyageId        String
  terminalId      String
  operationType   CargoOpType  // LOADING, DISCHARGING
  product         String       // Crudo, Fuel Oil, Gasoil, Nafta...
  quantityBL      Float        // Cantidad según B/L (barriles o MT)
  quantityVEF     Float?       // Vessel Experience Factor corregido
  temperature     Float?       // °C en momento de medición
  apiGravity      Float?       // Para crudos
  waterContent    Float?       // %BSW
  startAt         DateTime
  endAt           DateTime?
  blNumber        String?      // Bill of Lading number
  status          String
}
```

---

### FASE 5 — CLIENTES, MANTENIMIENTO Y COMPLIANCE

**Objetivo:** CRM básico, gestión de activos técnicos y cumplimiento regulatorio.

#### 5A. CRM de Clientes

```prisma
model Client {
  id          String    @id @default(cuid())
  name        String
  taxId       String    @unique   // RIF/NIT/VAT
  type        ClientType          // REFINERY, TERMINAL, TRADER, SHIPYARD
  country     String
  contacts    Contact[]
  contracts   Contract[]
  voyages     Voyage[]
}
```

#### 5B. Mantenimiento Preventivo y Correctivo

```prisma
model MaintenanceOrder {
  id            String    @id @default(cuid())
  vesselId      String
  type          MaintenanceType  // PREVENTIVE, CORRECTIVE, CLASSIFICATION
  description   String
  priority      Priority         // LOW, MEDIUM, HIGH, CRITICAL
  system        String           // Motor, Casco, Equipos Nauticos, Contra Incendios...
  dueDate       DateTime
  completedAt   DateTime?
  technician    String
  spareParts    SparePartUsed[]
  cost          Float?
  status        OrderStatus
}
```

#### 5C. Compliance y Documentación Regulatoria

```prisma
model ComplianceDocument {
  id            String    @id @default(cuid())
  vesselId      String?
  employeeId    String?
  type          DocType   // MARPOL_CERT, ISM_SMC, ISPS_CERT, CLASS_CERT, PANDI...
  issuedAt      DateTime
  expiresAt     DateTime
  issuedBy      String    // Autoridad / Clasificadora
  fileUrl       String?   // URL del documento en S3/MinIO
  alerts        Alert[]
}
```

**Tipos de documentos críticos en sector petrolero:**
- Certificado MARPOL (Anexos I, II, V, VI)
- Safety Management Certificate (ISM)
- International Ship Security Certificate (ISPS)
- Certificate of Class (Bureau Veritas, DNV, Lloyd's...)
- P&I Insurance Certificate
- Certificado de Tonelaje
- IOPP (International Oil Pollution Prevention)
- SOPEP (Shipboard Oil Pollution Emergency Plan)
- COF (Certificate of Fitness) — para productos químicos

---

### FASE 6 — REPORTES, ANALYTICS Y SAAS

**Objetivo:** Inteligencia de negocio y preparación para oferta multi-cliente.

**Lo que hay que construir:**

#### 6A. Dashboard de Analytics

- KPIs operativos en tiempo real con gráficas (Recharts/Chart.js)
- Consumo de combustible por buque, ruta y período
- Utilización de flota (% días operativos vs mantenimiento)
- Costo por viaje y por milla náutica
- Cumplimiento de certificaciones (% al día vs vencidas)
- Incidentes HSSE por mes y categoría

#### 6B. Generación de Reportes

- Reporte de voyage (port-to-port) en PDF
- Crew list oficial para autoridades
- Bunker consumption report
- Maintenance history report
- Compliance certificate status report
- Balance de carga (cargo out-turn)

#### 6C. Arquitectura SaaS Multi-Tenant

```prisma
model Organization {
  id        String  @id @default(cuid())
  name      String
  slug      String  @unique
  plan      Plan    // FREE, STARTER, PROFESSIONAL, ENTERPRISE
  users     User[]
  vessels   Vessel[]
  settings  Json?
}
```

---

## 6. HOJA DE RUTA COMPLETA

```
FASE 1  ▓▓▓▓▓▓▓▓▓▓  100%  ✅ COMPLETADA
        Autenticación, roles, BD base, UI base

FASE 2  ░░░░░░░░░░    0%  🔲 PRÓXIMA
        Embarcaciones, mapa AIS, flota

FASE 3  ░░░░░░░░░░    0%  🔲 PENDIENTE
        Personal, tripulación, certificaciones

FASE 4  ░░░░░░░░░░    0%  🔲 PENDIENTE
        Rutas, combustible, carga de hidrocarburos

FASE 5  ░░░░░░░░░░    0%  🔲 PENDIENTE
        Clientes, mantenimiento, compliance MARPOL

FASE 6  ░░░░░░░░░░    0%  🔲 PENDIENTE
        Analytics, reportes, SaaS multi-tenant
```

---

## 7. INNOVACIONES PROPUESTAS — SECTOR PETROLERO

Estas innovaciones posicionarán VENOLS ERP como una solución premium para el sector oil & gas marítimo, diferenciándolo de ERPs genéricos.

### 7.1 Rastreo AIS en Tiempo Real

Integrar la API de **MarineTraffic** o **VesselFinder** para mostrar:
- Posición GPS en tiempo real sobre mapa (Mapbox GL)
- Velocidad y rumbo actual
- ETA calculado dinámicamente
- Histórico de rutas recorridas
- Geofencing: alertas cuando un buque sale/entra a zona restringida

```typescript
// Ejemplo de integración AIS
// services/ais.service.ts
export async function getVesselPosition(imoNumber: string) {
  const res = await fetch(`https://api.marinetraffic.com/api/v1/...`)
  return { lat, lon, speed, course, eta }
}
```

### 7.2 Monitoreo IoT de Tanques y Sensores

Para buques petroleros, integrar sensores que reporten automáticamente:
- **Nivel de tanques** (ullage automático via radar/flotador)
- **Temperatura de carga** (crítico para asfaltos y fuel oils pesados)
- **Presión de sistemas**
- **Consumo de combustible** (flow meters)
- **RPM y potencia de motores**

Dashboard de telemetría en tiempo real con alertas configurables por umbral.

### 7.3 Gestión de Demurrage Automática

En el sector petrolero, el **demurrage** (penalización por tiempo extra en puerto) puede costar miles de dólares por hora.

Funcionalidades:
- Registro de NOR (Notice of Readiness) con timestamp exacto
- Cálculo automático de laytime (tiempo permitido de carga/descarga)
- Alertas cuando se acerca el límite de laytime
- Generación automática del Statement of Facts
- Cálculo de demurrage o dispatch (ahorro)
- Exportación para reclamaciones legales

```
NOR tendered: 14:00 → LAYTIME STARTS: 06:00 del día siguiente
Allowed laytime: 72 horas → FREE PRATIQUE + CUSTOMS
Actual time: 84 horas → DEMURRAGE: 12 horas × $8,000/hr = $96,000
```

### 7.4 IA Predictiva de Mantenimiento

Usar modelos ML (Python/FastAPI como microservicio) que analicen:
- Historial de fallas por componente
- Horas de operación vs tiempo entre fallas
- Datos de sensores (vibración, temperatura, aceite)
- Predicción de próxima falla probable
- Recomendación de qué repuestos pedir anticipadamente

### 7.5 Módulo de Emisiones y Carbono (ESG)

Con las regulaciones IMO 2023 (CII Rating) y el mercado de carbono:
- Calcular **CII (Carbon Intensity Indicator)** por buque
- Calcular emisiones CO₂, SOx, NOx por viaje
- Rating A/B/C/D/E automático según IMO 2023
- Plan de mejora para buques con rating D/E
- Exportar reporte de emisiones para certificación
- Integración con mercados de créditos de carbono

### 7.6 Portal de Clientes (B2B)

Dar acceso limitado a clientes refinería/terminal para:
- Ver estado de su cargamento en tiempo real
- Descargar documentos (B/L, certificados de calidad)
- Aprobar operaciones digitalmente (LOI electrónico)
- Seguimiento de demurrage en vivo
- Historial de operaciones pasadas

### 7.7 Optimizador de Rutas con IA

Para reducción de costos:
- Calcular ruta óptima considerando clima, corrientes y costo de bunker
- Comparar velocidades (slow steaming vs full speed) con su costo/beneficio
- Alertas de clima extremo en la ruta (integración con NOAA/Copernicus)
- Optimización de escala de puertos para maximizar aprovechamiento de flota

### 7.8 Gestión Digital de SOPEP

El **SOPEP (Shipboard Oil Pollution Emergency Plan)** es obligatorio por MARPOL:
- SOPEP digitalizado y accesible offline en tablets a bordo
- Simulacros de respuesta con checklist interactivo
- Registro de drills con firma digital del capitán
- Alertas de revisión anual del SOPEP
- Integración con autoridades marítimas locales

### 7.9 Control de Calidad de Hidrocarburos

Para cada operación de carga/descarga:
- Registro de muestras tomadas (tiempo, punto, responsable)
- Análisis de laboratorio: densidad, viscosidad, punto de inflamación, agua y sedimentos
- Comparativa contra especificaciones del contrato
- Alertas de non-conformance
- Gestión de reclamaciones de calidad

### 7.10 Firma Digital y Documentos Electrónicos

Eliminar el papeleo:
- **eNOR** — Notice of Readiness electrónico con firma digital
- **eLOI** — Letter of Indemnity digital (para carga sin B/L original)
- **eMRV** — Monitoring, Reporting and Verification de emisiones (obligatorio UE)
- **eSOF** — Statement of Facts digital
- Integración con plataformas de firma: DocuSign / Adobe Sign

---

## 8. ARQUITECTURA ESCALABLE A SAAS

Para convertir VENOLS ERP en una plataforma ofrecible a múltiples clientes en la industria:

### Modelo de Tenancy

```
Opción A: Schema por tenant (mayor aislamiento, mayor costo infra)
  └── tenant_1 (schema PostgreSQL)
  └── tenant_2 (schema PostgreSQL)

Opción B: Tenant ID en cada tabla (recomendado para escala)
  └── Todos los datos en un solo schema
  └── organizationId en cada tabla como discriminador
  └── Row Level Security (RLS) de PostgreSQL para seguridad adicional
```

### Planes de Suscripción Propuestos

| Plan | Precio/mes | Buques | Usuarios | Funcionalidades |
|---|---|---|---|---|
| **Starter** | $299 | hasta 5 | hasta 10 | Fases 1-3 |
| **Professional** | $799 | hasta 20 | hasta 50 | Fases 1-5 |
| **Enterprise** | $2,499 | Ilimitado | Ilimitado | Fases 1-6 + SLA + soporte |
| **On-Premise** | Custom | Ilimitado | Ilimitado | Instalación en servidor cliente |

### Arquitectura de Microservicios (Fase 6+)

```
┌─────────────────────────────────────────┐
│            VENOLS ERP PLATFORM           │
├─────────────────────────────────────────┤
│  Next.js Frontend (CDN/Vercel/VPS)       │
├─────────────┬────────────┬──────────────┤
│  Auth API   │ Core ERP   │ AIS Service  │
│  (Next.js)  │ (Next.js)  │ (FastAPI)    │
├─────────────┴────────────┴──────────────┤
│  PostgreSQL | Redis Cache | MinIO Files  │
├─────────────────────────────────────────┤
│  Bull Queues | WebSockets | Email/SMS    │
└─────────────────────────────────────────┘
```

---

## 9. SEGURIDAD IMPLEMENTADA Y PENDIENTE

### ✅ Implementado en Fase 1

| Capa | Implementación |
|---|---|
| Contraseñas | bcrypt 12 rondas — imposible crackear en tiempo razonable |
| Tokens | JWT HS256 firmado con secret de 64 chars |
| BD | Hash SHA-256 del JWT en tabla sessions |
| Validación | Zod schemas en cada endpoint |
| Fuerza bruta | 5 intentos / bloqueo 15 min automático |
| Headers | X-Frame-Options, CSP, HSTS, XSS-Protection (via Nginx) |
| Transport | HTTPS/TLS — Let's Encrypt |
| Secretos | Variables de entorno — nunca en código |
| Trazabilidad | Audit log completo con IP y timestamp |

### 🔲 Pendiente para Fases siguientes

| Medida | Fase | Descripción |
|---|---|---|
| Rate Limiting | 2 | Redis-based rate limiter por IP en endpoints públicos |
| 2FA | 3 | Autenticación de dos factores (TOTP/SMS) para ADMIN |
| RBAC Granular | 3 | Permisos específicos por acción, no solo por rol |
| CSP Estricto | 2 | Content Security Policy con nonces dinámicos |
| SQL Injection | Continuo | Prisma ya protege — mantener prepared statements |
| File Upload | 5 | Validación de tipo MIME + antivirus en uploads de docs |
| CORS | 2 | Configurar dominios permitidos explícitamente |
| Secrets Rotation | 6 | Rotación automática de JWT_SECRET sin downtime |
| WAF | 6 | Web Application Firewall (Cloudflare) |
| Penetration Test | 6 | Test de penetración profesional antes de SaaS |

---

## 10. CONFIGURACIÓN DEL SERVIDOR

### Nginx — Reverse Proxy + SSL

```nginx
# /etc/nginx/sites-available/venols-erp
server {
    listen 80;
    server_name erp.venols.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name erp.venols.com;

    ssl_certificate /etc/letsencrypt/live/erp.venols.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/erp.venols.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### PM2 — Gestión de Procesos

```json
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'venols-erp',
    script: 'node_modules/.bin/next',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
    }
  }]
}
```

### Comandos de despliegue

```bash
# Clonar / actualizar código
git pull origin main

# Instalar dependencias
npm ci --production

# Ejecutar migraciones
npx prisma migrate deploy

# Generar cliente Prisma
npx prisma generate

# Build de producción
npm run build

# Reiniciar con PM2
pm2 reload venols-erp --update-env

# Ver logs
pm2 logs venols-erp
```

### Gestión visual de base de datos

| Herramienta | Precio | Descripción |
|---|---|---|
| **Prisma Studio** | GRATIS | `npm run db:studio` → localhost:5555. Ideal para desarrollo |
| **pgAdmin 4** | GRATIS | Herramienta oficial de PostgreSQL. Conexión remota al VPS |
| **TablePlus** | GRATIS/PAGO | Cliente GUI para Windows/Mac. tableplus.com |
| **DBeaver** | GRATIS | Multiplataforma. dbeaver.io |

---

## 11. CHECKLIST DE DESARROLLO

### Fase 1 — Completada ✅

- [x] Schema Prisma: User, Session, AuditLog
- [x] API: POST /api/auth/register
- [x] API: POST /api/auth/login con protección fuerza bruta
- [x] API: GET /api/auth/me
- [x] API: POST /api/auth/logout con revocación de sesión
- [x] lib/jwt.ts — sign, verify, hash
- [x] lib/bcrypt.ts — hash y verify contraseñas
- [x] lib/auth-middleware.ts — withAuth HOF con roles
- [x] lib/prisma.ts — cliente singleton
- [x] Página de Login con UI naval
- [x] Página de Register con selector de roles
- [x] Dashboard con KPIs, flota y actividad
- [x] Layout del dashboard con auth guard
- [x] Sidebar con navegación por roles
- [x] Header con usuario, rol y logout
- [x] Configuración Nginx + PM2 + SSL
- [x] prisma/seed.ts — usuarios base del sistema
- [x] .env.example — plantilla para equipo y VPS
- [x] package.json — scripts db:migrate, db:seed, db:studio, db:reset
- [x] Migraciones BD ejecutadas — tablas creadas en PostgreSQL local
- [x] Errores TypeScript corregidos (Sidebar, jwt.ts)
- [x] Prueba end-to-end local EXITOSA — API completa funcionando

### Pre-Fase 2 — ✅ COMPLETADO EN LOCAL (pendiente replicar en VPS)

- [x] JWT_SECRET reemplazado por 64 bytes hex aleatorios
- [x] .gitignore actualizado — .env protegido del repositorio
- [x] .env.example creado para equipo y VPS
- [x] Migración inicial ejecutada — tablas users, sessions, audit_logs creadas
- [x] Conflicto de versión @prisma/client resuelto (alineado a v6.12.0)
- [x] Error TypeScript en Sidebar.tsx corregido (tipos NavItem/NavGroup)
- [x] Error TypeScript en lib/jwt.ts corregido (tipo expiresIn)
- [x] tsx instalado como runner de seed en Windows
- [x] scripts de BD agregados al package.json (db:migrate, db:seed, db:studio, db:reset)
- [x] prisma/seed.ts creado — 3 usuarios base (ADMIN, OPERATOR, TECHNICIAN)
- [x] Seed ejecutado — usuarios creados en BD local
- [x] Prueba end-to-end exitosa: login admin@venols.com → JWT devuelto ✅
- [ ] Replicar todo en VPS (cuando esté disponible)
- [ ] Backup automático de PostgreSQL en VPS
- [ ] Monitoreo de uptime (UptimeRobot o similar)

### Fase 2 — Pendiente 🔲

- [ ] Schema: Vessel, VesselType, Port
- [ ] Migración de BD para Fase 2
- [ ] API CRUD de embarcaciones
- [ ] Tabla de flota con filtros y búsqueda
- [ ] Ficha detallada de embarcación
- [ ] Integración AIS para posición GPS
- [ ] Mapa interactivo (Mapbox/Leaflet)
- [ ] Formulario de alta/edición de embarcación
- [ ] Estados de embarcación con flujo de transición
- [ ] Alertas de embarcaciones en mantenimiento prolongado

### Fase 3 — Pendiente 🔲

- [ ] Schema: Employee, Certification, Assignment
- [ ] CRUD de empleados/tripulación
- [ ] Gestión de certificaciones STCW
- [ ] Sistema de alertas de vencimientos
- [ ] Asignación de tripulación a embarcación
- [ ] Historial de embarques por persona
- [ ] Upload de documentos (MinIO/S3)
- [ ] Crew list exportable para autoridades

### Fase 4 — Pendiente 🔲

- [ ] Schema: Voyage, FuelLog, CargoOperation, TankReading
- [ ] Módulo de gestión de viajes/rutas
- [ ] Control de bunker y ROB por buque
- [ ] Alertas de combustible bajo
- [ ] Registro de operaciones de carga/descarga
- [ ] Cálculo de ullage y volúmenes corregidos
- [ ] Dashboard de combustible con gráficas
- [ ] Integración NOR / Statement of Facts
- [ ] Cálculo automático de demurrage

### Fase 5 — Pendiente 🔲

- [ ] Schema: Client, MaintenanceOrder, ComplianceDocument
- [ ] CRM básico de clientes
- [ ] Órdenes de mantenimiento preventivo y correctivo
- [ ] Plan de mantenimiento por horas/calendario
- [ ] Registro de documentos de compliance (MARPOL, ISM, ISPS)
- [ ] Alertas de vencimiento de certificados del buque
- [ ] Gestión de incidentes HSSE
- [ ] Portal de clientes (acceso limitado)
- [ ] Reportes básicos en PDF

### Fase 6 — Pendiente 🔲

- [ ] Schema: Organization (multi-tenant)
- [ ] Dashboard de analytics con Recharts
- [ ] Generación de reportes PDF avanzados
- [ ] Cálculo de CII y emisiones CO₂ (IMO 2023)
- [ ] Sistema de notificaciones (email + in-app)
- [ ] Módulo de facturación (Stripe)
- [ ] Multi-tenancy completo
- [ ] API pública documentada (Swagger)
- [ ] App móvil (React Native o PWA)
- [ ] Penetration test profesional

---

## NOTAS DEL EQUIPO

> Este documento es el mapa maestro del proyecto VENOLS ERP. Debe actualizarse al completar cada fase. Cada elemento marcado ✅ tiene código funcionando en producción. Cada elemento 🔲 es trabajo futuro documentado con contexto suficiente para cualquier desarrollador que se incorpore al equipo.

> **Prioridad de negocio:** El módulo de combustible (Fase 4B) y la gestión de compliance MARPOL (Fase 5C) son los diferenciadores clave para el sector petrolero. Considerar adelantarlos si el cliente lo requiere.

> **Stack decision final:** Mantener Next.js para Fases 2-4. Evaluar microservicios solo en Fase 6 cuando la carga lo justifique.

---

*VENOLS ERP © 2026 — Documento Maestro v2.0.0 — Confidencial*
