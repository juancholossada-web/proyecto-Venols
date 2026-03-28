import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const employees = [
  { firstName: 'Yasmary Irene',  lastName: 'Soto Gonzalez',       nationalId: '15525771' },
  { firstName: 'Dayana Karilen', lastName: 'Mavarez Fuenmayor',    nationalId: '27395423' },
  { firstName: 'Renato Andres',  lastName: 'Bozo Avila',           nationalId: '20778788' },
  { firstName: 'Piter Anthony',  lastName: 'Carrillo Guzman',      nationalId: '19610249' },
  { firstName: 'Duilio Jose',    lastName: 'Di Marco Sthormes',    nationalId: '18064031' },
  { firstName: 'Juan Carlos',    lastName: 'Pereira Salazar',      nationalId: '15785031' },
  { firstName: 'Jose Ramon',     lastName: 'Baez Galue',           nationalId: '15406751' },
  { firstName: 'Carlos Andres',  lastName: 'Granadillo Balzan',    nationalId: '11290196' },
]

async function main() {
  let created = 0
  let skipped = 0

  for (const emp of employees) {
    const exists = await prisma.employee.findUnique({ where: { nationalId: emp.nationalId } })
    if (exists) {
      console.log(`⚠  Ya existe: ${emp.firstName} ${emp.lastName} (${emp.nationalId})`)
      skipped++
      continue
    }
    await prisma.employee.create({
      data: {
        firstName:   emp.firstName,
        lastName:    emp.lastName,
        nationalId:  emp.nationalId,
        nationality: 'Venezolana',
        position:    'Operador',
        department:  'OPERACION',
        status:      'ACTIVO',
      },
    })
    console.log(`✓  Creado: ${emp.firstName} ${emp.lastName}`)
    created++
  }

  console.log(`\nResumen: ${created} creados, ${skipped} omitidos.`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
