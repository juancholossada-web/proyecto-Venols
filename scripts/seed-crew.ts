import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const employees = [
  // Capitanes
  {
    firstName: 'Ricardo', lastName: 'Diaz', nationalId: 'V-12345678',
    position: 'Capitan', phone: '+58 414-1234567', nationality: 'Venezolana',
    seafarerBook: 'LM-2019-00145', status: 'ACTIVO' as const,
  },
  {
    firstName: 'Pedro', lastName: 'Romero', nationalId: 'V-9876543',
    position: 'Capitan', phone: '+58 424-7654321', nationality: 'Venezolana',
    seafarerBook: 'LM-2017-00089', status: 'ACTIVO' as const,
  },
  {
    firstName: 'Luis', lastName: 'Garcia', nationalId: 'V-11223344',
    position: 'Capitan', phone: '+58 412-3344556', nationality: 'Venezolana',
    seafarerBook: 'LM-2020-00201', status: 'ACTIVO' as const,
  },
  {
    firstName: 'Jose', lastName: 'Martinez', nationalId: 'V-55667788',
    position: 'Capitan', phone: '+58 416-8877665', nationality: 'Venezolana',
    seafarerBook: 'LM-2018-00112', status: 'ACTIVO' as const,
  },
  // Jefes de Maquinas
  {
    firstName: 'Carlos', lastName: 'Hernandez', nationalId: 'V-22334455',
    position: 'Jefe de Maquinas', phone: '+58 414-5566778', nationality: 'Venezolana',
    seafarerBook: 'LM-2016-00067', status: 'ACTIVO' as const,
  },
  {
    firstName: 'Miguel', lastName: 'Sanchez', nationalId: 'V-33445566',
    position: 'Jefe de Maquinas', phone: '+58 424-9988776', nationality: 'Venezolana',
    seafarerBook: 'LM-2019-00178', status: 'ACTIVO' as const,
  },
  // Marineros
  {
    firstName: 'Juan', lastName: 'Lopez', nationalId: 'V-44556677',
    position: 'Marinero', phone: '+58 412-1122334', nationality: 'Venezolana',
    seafarerBook: 'LM-2021-00234', status: 'ACTIVO' as const,
  },
  {
    firstName: 'Andres', lastName: 'Torres', nationalId: 'V-66778899',
    position: 'Marinero', phone: '+58 416-4433221', nationality: 'Venezolana',
    seafarerBook: 'LM-2022-00289', status: 'ACTIVO' as const,
  },
  {
    firstName: 'Rafael', lastName: 'Morales', nationalId: 'V-77889900',
    position: 'Marinero', phone: '+58 414-6655443', nationality: 'Venezolana',
    seafarerBook: 'LM-2020-00156', status: 'ACTIVO' as const,
  },
  {
    firstName: 'Daniel', lastName: 'Paredes', nationalId: 'V-88990011',
    position: 'Marinero', phone: '+58 424-2211009', nationality: 'Venezolana',
    seafarerBook: 'LM-2021-00267', status: 'ACTIVO' as const,
  },
  // Tecnicos
  {
    firstName: 'Francisco', lastName: 'Reyes', nationalId: 'V-99001122',
    position: 'Tecnico Mecanico', phone: '+58 412-8899001', nationality: 'Venezolana',
    seafarerBook: 'LM-2018-00134', status: 'ACTIVO' as const,
  },
  {
    firstName: 'Gabriel', lastName: 'Vargas', nationalId: 'V-10111213',
    position: 'Tecnico Electricista', phone: '+58 416-0011223', nationality: 'Venezolana',
    seafarerBook: 'LM-2019-00190', status: 'ACTIVO' as const,
  },
]

async function main() {
  console.log('Seeding crew...')
  const created: { id: string; name: string; position: string }[] = []
  for (const emp of employees) {
    const existing = await prisma.employee.findUnique({ where: { nationalId: emp.nationalId } })
    if (!existing) {
      const e = await prisma.employee.create({ data: emp })
      console.log(`  + ${emp.firstName} ${emp.lastName} (${emp.position})`)
      created.push({ id: e.id, name: `${emp.firstName} ${emp.lastName}`, position: emp.position })
    } else {
      console.log(`  ~ ${emp.firstName} ${emp.lastName} (ya existe)`)
      created.push({ id: existing.id, name: `${emp.firstName} ${emp.lastName}`, position: existing.position })
    }
  }

  // Create certifications for captains
  const captains = created.filter(e => e.position === 'Capitan')
  for (const cap of captains) {
    const existing = await prisma.certification.findFirst({ where: { employeeId: cap.id, type: 'STCW' } })
    if (!existing) {
      await prisma.certification.create({
        data: {
          employeeId: cap.id, type: 'STCW', name: 'STCW II/2 - Capitan',
          issuedBy: 'INEA', issuedAt: new Date('2023-01-15'), expiresAt: new Date('2028-01-15'),
          number: `STCW-${Date.now().toString(36).toUpperCase()}`,
        },
      })
      await prisma.certification.create({
        data: {
          employeeId: cap.id, type: 'BST', name: 'Basic Safety Training',
          issuedBy: 'INEA', issuedAt: new Date('2023-03-10'), expiresAt: new Date('2028-03-10'),
          number: `BST-${Date.now().toString(36).toUpperCase()}`,
        },
      })
      console.log(`    Certificaciones creadas para ${cap.name}`)
    }
  }

  // Assign crew to vessels
  const vessels = await prisma.vessel.findMany()
  const captainList = created.filter(e => e.position === 'Capitan')
  const marineList = created.filter(e => e.position === 'Marinero')
  for (let i = 0; i < vessels.length && i < captainList.length; i++) {
    const existing = await prisma.assignment.findFirst({ where: { employeeId: captainList[i].id, vesselId: vessels[i].id, status: 'ACTIVO' } })
    if (!existing) {
      await prisma.assignment.create({
        data: {
          employeeId: captainList[i].id, vesselId: vessels[i].id,
          role: 'Capitan', startDate: new Date('2026-01-01'), status: 'ACTIVO',
        },
      })
      console.log(`    ${captainList[i].name} → ${vessels[i].name}`)
    }
  }
  for (let i = 0; i < vessels.length && i < marineList.length; i++) {
    const vi = i % vessels.length
    const existing = await prisma.assignment.findFirst({ where: { employeeId: marineList[i].id, vesselId: vessels[vi].id, status: 'ACTIVO' } })
    if (!existing) {
      await prisma.assignment.create({
        data: {
          employeeId: marineList[i].id, vesselId: vessels[vi].id,
          role: 'Marinero', startDate: new Date('2026-01-15'), status: 'ACTIVO',
        },
      })
      console.log(`    ${marineList[i].name} → ${vessels[vi].name}`)
    }
  }

  console.log('Done.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
