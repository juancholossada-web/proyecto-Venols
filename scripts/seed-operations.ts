import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const vessels = await prisma.vessel.findMany()
  if (!vessels.length) { console.log('No vessels found. Run seed-vessels first.'); return }

  // ── Clients ──
  console.log('Seeding clients...')
  const clientsData = [
    { name: 'PDVSA', taxId: 'G-20000042-3', type: 'REFINERIA', country: 'Venezuela', contact: 'Gerencia Operaciones', phone: '+58 261-7001000' },
    { name: 'Chevron Venezuela', taxId: 'J-00012345-6', type: 'OPERADORA', country: 'Venezuela', contact: 'Dept. Logistica', phone: '+58 261-7002000' },
    { name: 'Terminal Maracaibo', taxId: 'J-30456789-0', type: 'TERMINAL', country: 'Venezuela', contact: 'Jefe de Muelle', phone: '+58 261-7003000' },
    { name: 'Petrobras Int.', taxId: 'J-50123456-7', type: 'TRADER', country: 'Brasil', contact: 'Trading Desk', email: 'trading@petrobras.com' },
  ]
  const clients: { id: string; name: string }[] = []
  for (const c of clientsData) {
    const existing = await prisma.client.findUnique({ where: { taxId: c.taxId } })
    if (!existing) {
      const created = await prisma.client.create({ data: c })
      clients.push({ id: created.id, name: c.name })
      console.log(`  + ${c.name}`)
    } else {
      clients.push({ id: existing.id, name: c.name })
      console.log(`  ~ ${c.name} (exists)`)
    }
  }

  // ── Voyages ──
  console.log('Seeding voyages...')
  const voyagesData = [
    { vesselIdx: 0, voyageNumber: 'VYG-2026-001', origin: 'Puerto Cabello', destination: 'Maracaibo', status: 'COMPLETADO' as const, clientIdx: 0, cargoType: 'Crudo', cargoTons: 850, departureAt: new Date('2026-02-10'), arrivalAt: new Date('2026-02-12') },
    { vesselIdx: 1, voyageNumber: 'VYG-2026-002', origin: 'Maracaibo', destination: 'Punto Fijo', status: 'EN_CURSO' as const, clientIdx: 1, cargoType: 'Gasoil', cargoTons: 620, departureAt: new Date('2026-03-18') },
    { vesselIdx: 2, voyageNumber: 'VYG-2026-003', origin: 'Puerto La Cruz', destination: 'Jose', status: 'PLANIFICADO' as const, clientIdx: 2, cargoType: 'Nafta', cargoTons: 1200 },
    { vesselIdx: 3, voyageNumber: 'VYG-2026-004', origin: 'Bajo Grande', destination: 'Amuay', status: 'COMPLETADO' as const, clientIdx: 3, cargoType: 'Fuel Oil', cargoTons: 430, departureAt: new Date('2026-01-20'), arrivalAt: new Date('2026-01-22') },
  ]
  for (const v of voyagesData) {
    const existing = await prisma.voyage.findUnique({ where: { voyageNumber: v.voyageNumber } })
    if (!existing) {
      await prisma.voyage.create({
        data: {
          vesselId: vessels[v.vesselIdx].id, voyageNumber: v.voyageNumber,
          origin: v.origin, destination: v.destination, status: v.status,
          clientId: clients[v.clientIdx]?.id, cargoType: v.cargoType, cargoTons: v.cargoTons,
          departureAt: v.departureAt, arrivalAt: v.arrivalAt,
        },
      })
      console.log(`  + ${v.voyageNumber}`)
    } else { console.log(`  ~ ${v.voyageNumber} (exists)`) }
  }

  // ── Fuel Logs ──
  console.log('Seeding fuel logs...')
  for (let i = 0; i < 4; i++) {
    const existing = await prisma.fuelLog.findFirst({ where: { vesselId: vessels[i].id } })
    if (!existing) {
      await prisma.fuelLog.create({
        data: {
          vesselId: vessels[i].id, date: new Date('2026-03-15'),
          fuelType: i < 2 ? 'MGO' : 'HFO', operationAt: vessels[i].homePort || 'Puerto Cabello',
          rob: 1200 - i * 200, consumed: 80 + i * 15, bunkerReceived: i === 0 ? 500 : null,
          supplier: i === 0 ? 'Bunker Venezuela C.A.' : null, reportedBy: 'Sistema',
        },
      })
      console.log(`  + FuelLog → ${vessels[i].name}`)
    }
  }

  // ── Inventory ──
  console.log('Seeding inventory...')
  const items = [
    { name: 'Aceite motor 15W-40', category: 'Lubricantes', quantity: 24, unit: 'litros', minStock: 10 },
    { name: 'Filtro de aceite', category: 'Repuestos', quantity: 8, unit: 'unidad', minStock: 4 },
    { name: 'Cabo de amarre 20mm', category: 'Aparejos', quantity: 4, unit: 'rollos', minStock: 2 },
    { name: 'Chaleco salvavidas', category: 'Seguridad', quantity: 12, unit: 'unidad', minStock: 8 },
    { name: 'Extintor PQS 10lb', category: 'Seguridad', quantity: 6, unit: 'unidad', minStock: 4 },
    { name: 'Pintura antifouling', category: 'Mantenimiento', quantity: 10, unit: 'galones', minStock: 5 },
  ]
  for (const v of vessels.slice(0, 4)) {
    for (const item of items) {
      const existing = await prisma.inventoryItem.findFirst({ where: { vesselId: v.id, name: item.name } })
      if (!existing) {
        await prisma.inventoryItem.create({ data: { vesselId: v.id, ...item } })
      }
    }
    console.log(`  + Inventario → ${v.name} (${items.length} items)`)
  }

  // ── Maintenance Orders ──
  console.log('Seeding maintenance orders...')
  const orders = [
    { vesselIdx: 0, type: 'PREVENTIVO', description: 'Cambio de aceite motor principal', priority: 'MEDIA', system: 'Motor Principal', dueDate: new Date('2026-04-01'), status: 'PENDIENTE' },
    { vesselIdx: 1, type: 'CORRECTIVO', description: 'Reparacion bomba de achique', priority: 'ALTA', system: 'Sistema de Bombeo', dueDate: new Date('2026-03-25'), status: 'EN_PROCESO', technician: 'Francisco Reyes' },
    { vesselIdx: 2, type: 'PREVENTIVO', description: 'Inspeccion anual de casco', priority: 'ALTA', system: 'Casco', dueDate: new Date('2026-05-15'), status: 'PLANIFICADO' },
    { vesselIdx: 3, type: 'CORRECTIVO', description: 'Reparacion sistema electrico tablero principal', priority: 'CRITICA', system: 'Sistema Electrico', dueDate: new Date('2026-03-22'), status: 'EN_PROCESO', technician: 'Gabriel Vargas' },
  ]
  for (const o of orders) {
    const existing = await prisma.maintenanceOrder.findFirst({ where: { vesselId: vessels[o.vesselIdx].id, description: o.description } })
    if (!existing) {
      await prisma.maintenanceOrder.create({
        data: { vesselId: vessels[o.vesselIdx].id, type: o.type, description: o.description, priority: o.priority, system: o.system, dueDate: o.dueDate, status: o.status, technician: o.technician },
      })
      console.log(`  + Orden → ${vessels[o.vesselIdx].name}: ${o.description}`)
    }
  }

  // ── Compliance Documents ──
  console.log('Seeding compliance documents...')
  const docs = [
    { type: 'MARPOL', name: 'Certificado MARPOL Anexo I', issuedBy: 'INEA', daysOffset: -365, daysExpiry: 365 * 4 },
    { type: 'ISM_SMC', name: 'Safety Management Certificate', issuedBy: 'Bureau Veritas', daysOffset: -180, daysExpiry: 365 * 5 },
    { type: 'ISPS', name: 'International Ship Security Certificate', issuedBy: 'INEA', daysOffset: -90, daysExpiry: 365 * 5 },
    { type: 'CLASS', name: 'Certificate of Class', issuedBy: 'Bureau Veritas', daysOffset: -400, daysExpiry: 365 * 5 },
    { type: 'PANDI', name: 'P&I Insurance Certificate', issuedBy: 'West of England P&I', daysOffset: -60, daysExpiry: 300 },
    { type: 'IOPP', name: 'International Oil Pollution Prevention', issuedBy: 'INEA', daysOffset: -200, daysExpiry: 365 * 5 },
  ]
  for (const v of vessels.slice(0, 4)) {
    for (const doc of docs) {
      const existing = await prisma.complianceDocument.findFirst({ where: { vesselId: v.id, type: doc.type } })
      if (!existing) {
        const now = Date.now()
        await prisma.complianceDocument.create({
          data: {
            vesselId: v.id, type: doc.type, name: doc.name, issuedBy: doc.issuedBy,
            issuedAt: new Date(now + doc.daysOffset * 86400000),
            expiresAt: new Date(now + doc.daysExpiry * 86400000),
            documentNumber: `${doc.type}-${v.name.replace(/\s/g, '').slice(0, 4).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          },
        })
      }
    }
    console.log(`  + Compliance → ${v.name} (${docs.length} docs)`)
  }

  console.log('Done.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
