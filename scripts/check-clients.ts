import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
p.client.findMany().then(r => console.log(JSON.stringify(r, null, 2))).finally(() => p.$disconnect())
