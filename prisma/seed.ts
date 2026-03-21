/**
 * VENOLS ERP — Seed inicial de base de datos
 * Crea los usuarios base del sistema para arrancar en desarrollo y producción.
 *
 * Uso: npm run db:seed
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const ROUNDS = 12

const users = [
  {
    email: 'admin@venols.com',
    password: 'Admin123!',
    firstName: 'Admin',
    lastName: 'VENOLS',
    role: 'ADMIN' as const,
  },
  {
    email: 'operador@venols.com',
    password: 'Operador123!',
    firstName: 'Carlos',
    lastName: 'Operador',
    role: 'OPERATOR' as const,
  },
  {
    email: 'tecnico@venols.com',
    password: 'Tecnico123!',
    firstName: 'Pedro',
    lastName: 'Técnico',
    role: 'TECHNICIAN' as const,
  },
]

async function main() {
  console.log('🌱 Iniciando seed de VENOLS ERP...\n')

  for (const user of users) {
    const existing = await prisma.user.findUnique({ where: { email: user.email } })

    if (existing) {
      console.log(`⚠️  Ya existe: ${user.email} — omitido`)
      continue
    }

    const hashedPassword = await bcrypt.hash(user.password, ROUNDS)

    const created = await prisma.user.create({
      data: {
        email: user.email,
        password: hashedPassword,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: 'ACTIVE',
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: created.id,
        action: 'USER_SEEDED',
        entity: 'User',
        entityId: created.id,
        ipAddress: '127.0.0.1',
      },
    })

    console.log(`✅ Creado: [${created.role}] ${created.email}`)
  }

  console.log('\n📋 Credenciales de acceso:')
  console.log('─────────────────────────────────────────')
  for (const u of users) {
    console.log(`  ${u.role.padEnd(12)} │ ${u.email.padEnd(25)} │ ${u.password}`)
  }
  console.log('─────────────────────────────────────────')
  console.log('\n⚠️  IMPORTANTE: Cambia estas contraseñas en producción.\n')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
