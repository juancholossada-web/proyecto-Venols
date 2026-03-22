import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Update tank capacities for all vessels
  const vessels = await prisma.vessel.findMany()

  const tankCapacities: Record<string, number> = {
    'Molleja Lake': 15000,      // Supply Vessel - large tank
    'El Porteño I': 8000,       // Remolcador
    'El Masco VIII': 12000,     // Supply Vessel
    'Zapara Island': 10000,     // Vessel multipurpose
    'Anabella': 1500,           // Lancha
    'Blohm': 1800,              // Lancha
    'Jackie': 1200,             // Lancha
    'La Magdalena I': 1600,     // Lancha
  }

  for (const vessel of vessels) {
    const capacity = tankCapacities[vessel.name]
    if (capacity) {
      await prisma.vessel.update({
        where: { id: vessel.id },
        data: { tankCapacityLiters: capacity },
      })
      console.log(`✅ ${vessel.name}: ${capacity} litros`)
    }
  }

  // Seed equipment for each vessel
  const equipmentTemplates: Record<string, Array<{ name: string; type: string; brand?: string; model?: string; serviceInterval?: number; currentHours?: number }>> = {
    PESADA: [
      { name: 'Motor Principal', type: 'MOTOR_PRINCIPAL', brand: 'Caterpillar', model: 'C32', serviceInterval: 250, currentHours: 1250 },
      { name: 'Motor Auxiliar', type: 'MOTOR_AUXILIAR', brand: 'Cummins', model: 'QSB6.7', serviceInterval: 500, currentHours: 980 },
      { name: 'Generador 1', type: 'GENERADOR', brand: 'Caterpillar', model: 'C4.4', serviceInterval: 500, currentHours: 2100 },
      { name: 'Generador 2', type: 'GENERADOR', brand: 'Caterpillar', model: 'C4.4', serviceInterval: 500, currentHours: 1850 },
      { name: 'Bomba de Achique', type: 'BOMBA', brand: 'Grundfos', serviceInterval: 1000, currentHours: 650 },
      { name: 'Compresor de Aire', type: 'COMPRESOR', brand: 'Atlas Copco', serviceInterval: 1000, currentHours: 420 },
      { name: 'Winche Principal', type: 'WINCHE', brand: 'Rolls-Royce', serviceInterval: 2000, currentHours: 380 },
    ],
    LIVIANA: [
      { name: 'Motor Fuera de Borda', type: 'MOTOR_PRINCIPAL', brand: 'Yamaha', model: '250HP', serviceInterval: 100, currentHours: 520 },
      { name: 'Generador', type: 'GENERADOR', brand: 'Honda', model: 'EU3000is', serviceInterval: 500, currentHours: 310 },
      { name: 'Bomba de Achique', type: 'BOMBA', brand: 'Rule', serviceInterval: 1000, currentHours: 200 },
    ],
  }

  for (const vessel of vessels) {
    const templates = equipmentTemplates[vessel.fleetType] || []
    for (const eq of templates) {
      try {
        await prisma.equipment.create({
          data: {
            vesselId: vessel.id,
            name: eq.name,
            type: eq.type,
            brand: eq.brand || null,
            model: eq.model || null,
            currentHours: eq.currentHours || 0,
            lastServiceAt: (eq.currentHours || 0) - Math.floor(Math.random() * (eq.serviceInterval || 500)),
            serviceInterval: eq.serviceInterval || null,
            status: 'OPERATIVO',
          },
        })
        console.log(`  ⚙️ ${vessel.name} → ${eq.name}`)
      } catch (e: any) {
        if (e.code === 'P2002') {
          console.log(`  ⏭️ ${vessel.name} → ${eq.name} (ya existe)`)
        } else throw e
      }
    }
  }

  // Seed some maintenance programs
  const programs = [
    { system: 'Motor Principal', name: 'Cambio de Aceite Motor Principal', description: 'Drenar aceite usado, reemplazar filtro de aceite, rellenar con aceite nuevo según especificaciones del fabricante', frequency: 'POR_HORAS', frequencyHours: 250, tasks: 'Drenar aceite usado\nRetirar filtro de aceite\nInstalar filtro nuevo\nRellenar con aceite SAE 15W-40\nVerificar nivel\nRegistrar horómetro' },
    { system: 'Motor Principal', name: 'Inspección de Filtros y Lubricantes', description: 'Revisión completa de todos los filtros del motor principal y niveles de lubricantes', frequency: 'MENSUAL', tasks: 'Revisar filtro de aire\nRevisar filtro de combustible\nRevisar filtro de aceite\nVerificar nivel de aceite\nVerificar nivel de refrigerante\nInspeccionar mangueras' },
    { system: 'Motor Principal', name: 'Cambio de Refrigerante', description: 'Drenaje y reemplazo completo del refrigerante del motor', frequency: 'SEMESTRAL', tasks: 'Drenar refrigerante usado\nLimpiar circuito de refrigeración\nVerificar mangueras y abrazaderas\nRellenar con refrigerante nuevo\nPurgar sistema\nVerificar temperatura de operación' },
    { system: 'Generador', name: 'Mantenimiento Preventivo Generador', description: 'Servicio periódico del generador: aceite, filtros, inspección eléctrica', frequency: 'TRIMESTRAL', tasks: 'Cambio de aceite\nCambio de filtro de aceite\nCambio de filtro de combustible\nInspección de conexiones eléctricas\nVerificar voltaje de salida\nLimpiar terminales de batería' },
    { system: 'Sistema de Bombeo', name: 'Inspección Sistema de Bombeo', description: 'Revisión de bombas de achique, lastrado y contraincendios', frequency: 'MENSUAL', tasks: 'Verificar bomba de achique\nProbar bomba contraincendios\nRevisar sellos y empaques\nVerificar presión de operación\nInspeccionar tuberías' },
  ]

  for (const vessel of vessels) {
    for (const prog of programs) {
      if (vessel.fleetType === 'LIVIANA' && prog.system === 'Generador') continue
      try {
        const nextDue = new Date()
        nextDue.setDate(nextDue.getDate() + Math.floor(Math.random() * 60) - 10)
        await prisma.maintenanceProgram.create({
          data: {
            vesselId: vessel.id,
            name: prog.name,
            description: prog.description,
            system: prog.system,
            frequency: prog.frequency,
            frequencyHours: prog.frequencyHours || null,
            tasks: prog.tasks,
            materials: 'Según manual del fabricante',
            status: 'ACTIVO',
            nextDue,
            lastExecuted: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000),
          },
        })
        console.log(`  📋 ${vessel.name} → ${prog.name}`)
      } catch (e: any) {
        if (e.code !== 'P2002') throw e
      }
    }
  }

  console.log('\n✅ Seed completado: tank capacities, equipment, maintenance programs')
}

main().catch(console.error).finally(() => prisma.$disconnect())
