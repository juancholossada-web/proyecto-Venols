import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Borrar todos los clientes existentes
  const deleted = await prisma.client.deleteMany()
  console.log(`🗑️  ${deleted.count} clientes eliminados`)

  // Insertar nuevos clientes
  const clients = [
    { name: 'Maurel & Prom', taxId: null, type: 'PETROLERA', country: 'Francia',    notes: 'M&P' },
    { name: 'Cardon IV',     taxId: null, type: 'PETROLERA', country: 'Venezuela',   notes: 'C4' },
    { name: 'Aliva Stump',   taxId: null, type: 'CONSTRUCTORA', country: 'Venezuela', notes: null },
    { name: 'Accumes',       taxId: null, type: 'PETROLERA', country: 'Venezuela',   notes: null },
    { name: 'Nabep',         taxId: null, type: 'PETROLERA', country: 'Venezuela',   notes: null },
  ]

  for (const c of clients) {
    await prisma.client.create({ data: c })
    console.log(`✅ ${c.name} (${c.type} — ${c.country})`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
