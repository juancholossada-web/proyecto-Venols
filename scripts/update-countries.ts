import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
async function main() {
  await p.client.updateMany({ where: { name: 'Nabep' },   data: { country: 'Estados Unidos' } })
  await p.client.updateMany({ where: { name: 'Accumes' }, data: { country: 'Suiza' } })
  console.log('✅ Países actualizados')
}
main().catch(console.error).finally(() => p.$disconnect())
