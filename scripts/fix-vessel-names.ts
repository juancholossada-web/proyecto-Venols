import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Rename Magdalena to La Magdalena I
  const magdalena = await prisma.vessel.findFirst({ where: { name: 'Magdalena' } })
  if (magdalena) {
    await prisma.vessel.update({ where: { id: magdalena.id }, data: { name: 'La Magdalena I' } })
    console.log('✅ Magdalena → La Magdalena I')
  }

  // Update vessel types to match user specification
  const updates: Record<string, string> = {
    'Molleja Lake': 'Supply Vessel',
    'El Porteño I': 'Remolcador',
    'El Masco VIII': 'Supply Vessel',
    'Zapara Island': 'Vessel Multipropósito',
  }

  for (const [name, vesselType] of Object.entries(updates)) {
    const v = await prisma.vessel.findFirst({ where: { name } })
    if (v) {
      await prisma.vessel.update({ where: { id: v.id }, data: { vesselType } })
      console.log(`✅ ${name} → ${vesselType}`)
    }
  }

  console.log('Done.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
