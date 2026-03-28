import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const updates = [
  { name: 'El Masco VIII',   waterTankCapacityLiters: 120000 },
  { name: 'El Porteño I',    waterTankCapacityLiters: 16000  },
  { name: 'Molleja Lake',    waterTankCapacityLiters: 200000 },
  { name: 'Zapara Island',   waterTankCapacityLiters: 120000 },
]

async function main() {
  for (const u of updates) {
    const vessel = await prisma.vessel.findFirst({ where: { name: u.name } })
    if (!vessel) {
      console.log(`⚠️  No encontrado: ${u.name}`)
      continue
    }
    await prisma.vessel.update({
      where: { id: vessel.id },
      data: { waterTankCapacityLiters: u.waterTankCapacityLiters },
    })
    console.log(`✅ ${u.name} → ${u.waterTankCapacityLiters.toLocaleString()} L`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
