/**
 * VENOLS ERP — Seed inicial de base de datos
 * Uso: npm run db:seed
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const ROUNDS = 12

const users = [
  {
    email:     'admin@venols.com',
    password:  'Admin123!',
    firstName: 'Admin',
    lastName:  'VENOLS',
    role:      'ADMIN' as const,
  },
  {
    email:     'pesada@venols.com',
    password:  'Pesada123!',
    firstName: 'Carlos',
    lastName:  'Operador',
    role:      'OPERATOR_HEAVY' as const,
  },
  {
    email:     'liviana@venols.com',
    password:  'Liviana123!',
    firstName: 'María',
    lastName:  'Operadora',
    role:      'OPERATOR_LIGHT' as const,
  },
  {
    email:     'estandar@venols.com',
    password:  'Estandar123!',
    firstName: 'Pedro',
    lastName:  'Estándar',
    role:      'STANDARD' as const,
  },
]

async function main() {
  console.log('Iniciando seed de VENOLS ERP...\n')

  for (const user of users) {
    const existing = await prisma.user.findUnique({ where: { email: user.email } })
    if (existing) {
      console.log(`Ya existe: ${user.email} — omitido`)
      continue
    }
    const hashedPassword = await bcrypt.hash(user.password, ROUNDS)
    const created = await prisma.user.create({
      data: {
        email: user.email, password: hashedPassword,
        firstName: user.firstName, lastName: user.lastName,
        role: user.role, status: 'ACTIVE',
      },
    })
    await prisma.auditLog.create({
      data: { userId: created.id, action: 'USER_SEEDED', entity: 'User', entityId: created.id, ipAddress: '127.0.0.1' },
    })
    console.log(`Creado: [${created.role}] ${created.email}`)
  }

  console.log('\nCredenciales:')
  console.log('─────────────────────────────────────────────────────────')
  for (const u of users) {
    console.log(`  ${u.role.padEnd(16)} │ ${u.email.padEnd(24)} │ ${u.password}`)
  }
  console.log('─────────────────────────────────────────────────────────')
  console.log('\nIMPORTANTE: Cambia estas contraseñas en producción.\n')
}

main()
  .catch(e => { console.error('Error en seed:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
