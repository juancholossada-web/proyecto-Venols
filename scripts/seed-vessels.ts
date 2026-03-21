import { PrismaClient, FleetType, VesselStatus } from '@prisma/client'

const prisma = new PrismaClient()

const vessels = [
  // Flota Pesada
  {
    name: 'Molleja Lake',
    fleetType: 'PESADA' as FleetType,
    vesselType: 'Buque de carga',
    status: 'OPERATIVO' as VesselStatus,
    matricula: 'BL-0478',
    homePort: 'Puerto Cabello',
    flag: 'Venezuela',
  },
  {
    name: 'El Porteño I',
    fleetType: 'PESADA' as FleetType,
    vesselType: 'Buque multipropósito',
    status: 'ATRACADO' as VesselStatus,
    matricula: 'BP-0131',
    homePort: 'Puerto Cabello',
    flag: 'Venezuela',
  },
  {
    name: 'El Masco VIII',
    fleetType: 'PESADA' as FleetType,
    vesselType: 'Buque tanquero',
    status: 'EN_TRANSITO' as VesselStatus,
    matricula: 'BT-0082',
    homePort: 'Maracaibo',
    flag: 'Venezuela',
  },
  {
    name: 'Zapara Island',
    fleetType: 'PESADA' as FleetType,
    vesselType: 'Buque de apoyo offshore',
    status: 'MANTENIMIENTO' as VesselStatus,
    matricula: 'BA-0219',
    homePort: 'Maracaibo',
    flag: 'Venezuela',
  },
  // Flota Liviana
  {
    name: 'Anabella',
    fleetType: 'LIVIANA' as FleetType,
    vesselType: 'Lancha de personal',
    status: 'OPERATIVO' as VesselStatus,
    matricula: 'LP-0011',
    homePort: 'Puerto Cabello',
    flag: 'Venezuela',
  },
  {
    name: 'Blohm',
    fleetType: 'LIVIANA' as FleetType,
    vesselType: 'Lancha utilitaria',
    status: 'OPERATIVO' as VesselStatus,
    matricula: 'LU-0034',
    homePort: 'Maracaibo',
    flag: 'Venezuela',
  },
  {
    name: 'Jackie',
    fleetType: 'LIVIANA' as FleetType,
    vesselType: 'Lancha de personal',
    status: 'EN_TRANSITO' as VesselStatus,
    matricula: 'LP-0027',
    homePort: 'Puerto Cabello',
    flag: 'Venezuela',
  },
  {
    name: 'Magdalena',
    fleetType: 'LIVIANA' as FleetType,
    vesselType: 'Lancha de suministro',
    status: 'ATRACADO' as VesselStatus,
    matricula: 'LS-0053',
    homePort: 'Maracaibo',
    flag: 'Venezuela',
  },
]

async function main() {
  console.log('Seeding vessels...')
  for (const vessel of vessels) {
    const existing = await prisma.vessel.findFirst({ where: { name: vessel.name } })
    if (!existing) {
      await prisma.vessel.create({ data: vessel })
      console.log(`  ✓ ${vessel.name}`)
    } else {
      await prisma.vessel.update({ where: { id: existing.id }, data: vessel })
      console.log(`  ~ ${vessel.name} (updated)`)
    }
  }
  console.log('Done.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
