import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const VESSELS = {
  MOLLEJA_LAKE:  'cmn0kav0a0000o6u0hz45jkq8',
  EL_MASCO_VIII: 'cmn0kav0i0002o6u0c7pdtgvs',
  EL_PORTENO_I:  'cmn0kav0h0001o6u078oky6am',
  ZAPARA_ISLAND: 'cmn0kav0k0003o6u002v5los9',
  ANABELLA:      'cmn0kav0l0004o6u0r5gd3das',
  BLOHM:         'cmn0kav0m0005o6u0i4nqsaah',
  JACKIE:        'cmn0kav0n0006o6u09hvq110c',
}

function cleanCI(ci: string | number): string {
  return String(ci).replace(/\./g, '').replace(/\s/g, '').trim()
}

function parseName(raw: string): { firstName: string; lastName: string } {
  const name = raw.trim().replace(/\s+/g, ' ')
  if (name.includes(',')) {
    const [last, first] = name.split(',').map(s => s.trim())
    return { firstName: toTitle(first), lastName: toTitle(last) }
  }
  const words = name.split(' ')
  if (words.length <= 2) {
    return { firstName: toTitle(words[0]), lastName: toTitle(words.slice(1).join(' ')) }
  }
  if (words.length === 3) {
    return { firstName: toTitle(words.slice(0, 2).join(' ')), lastName: toTitle(words[2]) }
  }
  // 4 palabras: primeras 2 = nombre, últimas 2 = apellido
  return { firstName: toTitle(words.slice(0, 2).join(' ')), lastName: toTitle(words.slice(2).join(' ')) }
}

function toTitle(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

function mapPos(raw: string): string {
  const p = raw.trim().toUpperCase()
  if (p.startsWith('CAPITAN'))               return 'Capitan'
  if (p === 'PRIMER OFICIAL')                return 'Primer Oficial'
  if (p === 'TERCER OFICIAL')                return 'Tercer Oficial'
  if (p.startsWith('JEFE DE MAQUINA'))       return 'Jefe de Maquinas'
  if (p === 'PRIMER OFICIAL MAQUINAS')       return 'Primer Oficial Maquinas'
  if (p === 'ACEITERO')                      return 'Aceitero'
  if (p === 'CONTRAMAESTRE')                 return 'Contramaestre'
  if (p === 'TIMONEL')                       return 'Timonel'
  if (p === 'MOTORISTA')                     return 'Motorista'
  if (p === 'GRUERO')                        return 'Gruero'
  if (p.includes('COCINERO'))                return 'Cocinero'
  return 'Marinero'
}

type Entry = { rawName: string; ci: string | number; rawPos: string; dept: 'FP' | 'FL'; vesselId: string }

const CREW: Entry[] = [
  // ─── MOLLEJA LAKE (FP) ───────────────────────────────────────────────────
  { rawName: 'GONZALEZ GOMEZ , HENRY RAFAEL',     ci: 7524582,      rawPos: 'CAPITAN',                 dept: 'FP', vesselId: VESSELS.MOLLEJA_LAKE },
  { rawName: 'BRACHO CHIRINOS , JIOXIS ENI',       ci: 5585408,      rawPos: 'PRIMER OFICIAL',          dept: 'FP', vesselId: VESSELS.MOLLEJA_LAKE },
  { rawName: 'PEROZO, DOUGLAS',                    ci: 5048288,      rawPos: 'JEFE DE MAQUINA',         dept: 'FP', vesselId: VESSELS.MOLLEJA_LAKE },
  { rawName: 'PEROZO MOLERO ENDER HEBERTO',        ci: 9738085,      rawPos: 'PRIMER OFICIAL MAQUINAS', dept: 'FP', vesselId: VESSELS.MOLLEJA_LAKE },
  { rawName: 'RINCON DUGARTE, ENDER ENRIQUE',      ci: 17415425,     rawPos: 'ACEITERO',                dept: 'FP', vesselId: VESSELS.MOLLEJA_LAKE },
  { rawName: 'LOPEZ ALVARADO, ISMAEL ALEXANDER',   ci: 13130750,     rawPos: 'CONTRAMAESTRE',           dept: 'FP', vesselId: VESSELS.MOLLEJA_LAKE },
  { rawName: 'CHOURIO LUGO, NEYCOL JOSE',          ci: 18318546,     rawPos: 'COCINERO',                dept: 'FP', vesselId: VESSELS.MOLLEJA_LAKE },
  { rawName: 'REYES MOSQUERA, EDGAR JOSE',         ci: 7615164,      rawPos: 'MARINO',                  dept: 'FP', vesselId: VESSELS.MOLLEJA_LAKE },
  { rawName: 'LLAMARTE TEJEDA, JORGE LUIS',        ci: 14305390,     rawPos: 'MARINO',                  dept: 'FP', vesselId: VESSELS.MOLLEJA_LAKE },
  { rawName: 'JOSE GREGORIO MARIN',                ci: 11142000,     rawPos: 'CAPITAN',                 dept: 'FP', vesselId: VESSELS.MOLLEJA_LAKE },
  { rawName: 'COLINA SALAZAR, MOISES DAVID',       ci: 25402411,     rawPos: 'PRIMER OFICIAL',          dept: 'FP', vesselId: VESSELS.MOLLEJA_LAKE },
  { rawName: 'CRISTOPHER JOSE, SALAZAR MORALES',   ci: 23770889,     rawPos: 'TERCER OFICIAL',          dept: 'FP', vesselId: VESSELS.MOLLEJA_LAKE },
  { rawName: 'VILLASMIL MARTINEZ, RENNY MAURICIO', ci: 14135749,     rawPos: 'JEFE DE MAQUINAS',        dept: 'FP', vesselId: VESSELS.MOLLEJA_LAKE },
  { rawName: 'VASQUEZ SIXTO',                      ci: 9807092,      rawPos: 'PRIMER OFICIAL MAQUINAS', dept: 'FP', vesselId: VESSELS.MOLLEJA_LAKE },
  { rawName: 'MARIN BOSCAN, JESUS GUILLERMO',      ci: 19215856,     rawPos: 'ACEITERO',                dept: 'FP', vesselId: VESSELS.MOLLEJA_LAKE },
  { rawName: 'GONZALES LUZARDO, JOHANY JOSE',      ci: 13460890,     rawPos: 'MARINO',                  dept: 'FP', vesselId: VESSELS.MOLLEJA_LAKE },
  { rawName: 'DIAZ EUGENIO SEGUNDO',               ci: 7975410,      rawPos: 'COCINERO',                dept: 'FP', vesselId: VESSELS.MOLLEJA_LAKE },
  { rawName: 'QUINTERO MORAN, DIEGO FERNAN',       ci: 18650705,     rawPos: 'CONTRAMAESTRE',           dept: 'FP', vesselId: VESSELS.MOLLEJA_LAKE },
  { rawName: 'MARRUFO CHIRINOS JORGE LUIS',        ci: 9415798,      rawPos: 'MARINO',                  dept: 'FP', vesselId: VESSELS.MOLLEJA_LAKE },

  // ─── EL MASCO VIII (FP) ──────────────────────────────────────────────────
  { rawName: 'DOUGLAS MUÑOZ',                      ci: 7716172,      rawPos: 'CAPITAN',        dept: 'FP', vesselId: VESSELS.EL_MASCO_VIII },
  { rawName: 'HERNAN PEREZ',                        ci: 12802509,     rawPos: 'TIMONEL',        dept: 'FP', vesselId: VESSELS.EL_MASCO_VIII },
  { rawName: 'JORGE MOSQUERA',                      ci: 14448951,     rawPos: 'JEFE DE MAQUINA',dept: 'FP', vesselId: VESSELS.EL_MASCO_VIII },
  { rawName: 'EDUARDO CARBONELL',                   ci: 17326602,     rawPos: 'ACEITERO',       dept: 'FP', vesselId: VESSELS.EL_MASCO_VIII },
  { rawName: 'LEANDRO RINCON',                      ci: 19016499,     rawPos: 'COCINERO',       dept: 'FP', vesselId: VESSELS.EL_MASCO_VIII },
  { rawName: 'JONATHAN CABRERA',                    ci: 19936170,     rawPos: 'MARINO',         dept: 'FP', vesselId: VESSELS.EL_MASCO_VIII },
  { rawName: 'CARLOS VISLIQUEZ',                    ci: 10604405,     rawPos: 'MARINO',         dept: 'FP', vesselId: VESSELS.EL_MASCO_VIII },
  { rawName: 'ALFREDO MIGUEL RIVERO ZAVALA',        ci: 8604988,      rawPos: 'CAPITAN',        dept: 'FP', vesselId: VESSELS.EL_MASCO_VIII },
  { rawName: 'MAY ANTHONY ROJAS',                   ci: 20084632,     rawPos: 'TIMONEL',        dept: 'FP', vesselId: VESSELS.EL_MASCO_VIII },
  { rawName: 'WUILY BASABE',                        ci: '10.914.964', rawPos: 'JEFE DE MAQUINA',dept: 'FP', vesselId: VESSELS.EL_MASCO_VIII },
  { rawName: 'CESAR AUGUSTO TORO JIMENEZ',          ci: 16534779,     rawPos: 'ACEITERO',       dept: 'FP', vesselId: VESSELS.EL_MASCO_VIII },
  { rawName: 'ISMAEL BASALO',                       ci: '22.606.962', rawPos: 'COCINERO',       dept: 'FP', vesselId: VESSELS.EL_MASCO_VIII },
  { rawName: 'OSCAR MENDEZ',                        ci: '9.731.979',  rawPos: 'COCINERO',       dept: 'FP', vesselId: VESSELS.EL_MASCO_VIII },
  { rawName: 'PEDRO JOSE PERNIA LUNA',              ci: '15.524.654', rawPos: 'MARINO',         dept: 'FP', vesselId: VESSELS.EL_MASCO_VIII },

  // ─── EL PORTEÑO I (FP) ───────────────────────────────────────────────────
  { rawName: 'JOSE OJEDA',                          ci: 12327162,     rawPos: 'CAPITAN',   dept: 'FP', vesselId: VESSELS.EL_PORTENO_I },
  { rawName: 'OMER PARRA',                          ci: 7629801,      rawPos: 'MOTORISTA', dept: 'FP', vesselId: VESSELS.EL_PORTENO_I },
  { rawName: 'RAMON GOMEZ',                         ci: 9761303,      rawPos: 'COCINERO',  dept: 'FP', vesselId: VESSELS.EL_PORTENO_I },
  { rawName: 'NOEL PINTO',                          ci: 14682807,     rawPos: 'MARINO',    dept: 'FP', vesselId: VESSELS.EL_PORTENO_I },
  { rawName: 'OSCAR GONZALEZ',                      ci: 14116676,     rawPos: 'MARINO',    dept: 'FP', vesselId: VESSELS.EL_PORTENO_I },
  { rawName: 'SANDRO JIMENEZ',                      ci: 10604661,     rawPos: 'CAPITAN',   dept: 'FP', vesselId: VESSELS.EL_PORTENO_I },
  { rawName: 'NERBIS SANTOS',                       ci: 14525231,     rawPos: 'MOTORISTA', dept: 'FP', vesselId: VESSELS.EL_PORTENO_I },
  { rawName: 'RANDY CAMARGO',                       ci: 14085188,     rawPos: 'COCINERO',  dept: 'FP', vesselId: VESSELS.EL_PORTENO_I },
  { rawName: 'RUBENNY FERRER',                      ci: 18183761,     rawPos: 'MARINO',    dept: 'FP', vesselId: VESSELS.EL_PORTENO_I },
  { rawName: 'JUAN LUGO',                           ci: 23446592,     rawPos: 'MARINO',    dept: 'FP', vesselId: VESSELS.EL_PORTENO_I },

  // ─── ZAPARA ISLAND (FP) ──────────────────────────────────────────────────
  // JORGE MOSQUERA (14448951) ya existe desde Masco VIII — solo se agrega assignment abajo
  { rawName: 'CAMPOS HERNANDEZ, JAVIER JOSE',       ci: 10213177,     rawPos: 'CAPITAN',   dept: 'FP', vesselId: VESSELS.ZAPARA_ISLAND },
  { rawName: 'SOTO CENTENO, RUBEN DARIO',           ci: 17071853,     rawPos: 'GRUERO',    dept: 'FP', vesselId: VESSELS.ZAPARA_ISLAND },
  { rawName: 'CARDOZO MORALES, JESUS ANGEL',        ci: 10451152,     rawPos: 'COCINERO',  dept: 'FP', vesselId: VESSELS.ZAPARA_ISLAND },
  { rawName: 'FUENMAYOR BLANCO, GERARDO',           ci: 17071587,     rawPos: 'MARINO',    dept: 'FP', vesselId: VESSELS.ZAPARA_ISLAND },
  { rawName: 'CARDIVILLO OTERO, JOSE RAMON',        ci: 30633628,     rawPos: 'MARINO',    dept: 'FP', vesselId: VESSELS.ZAPARA_ISLAND },

  // ─── ANABELLA (FL) ───────────────────────────────────────────────────────
  { rawName: 'EDGAR CORDERO',                       ci: 8449989,      rawPos: 'CAPITAN',   dept: 'FL', vesselId: VESSELS.ANABELLA },
  { rawName: 'WILLIAM HERNANDEZ',                   ci: 5718493,      rawPos: 'MARINO',    dept: 'FL', vesselId: VESSELS.ANABELLA },
  { rawName: 'WILMER ESPINOZA',                     ci: 11246551,     rawPos: 'CAPITAN',   dept: 'FL', vesselId: VESSELS.ANABELLA },
  { rawName: 'ANTONIO ESCALONA',                    ci: 18793249,     rawPos: 'MARINO',    dept: 'FL', vesselId: VESSELS.ANABELLA },

  // ─── BLOHM (FL) ──────────────────────────────────────────────────────────
  { rawName: 'LUILLY CHIRINOS',                     ci: 12845910,     rawPos: 'CAPITAN',   dept: 'FL', vesselId: VESSELS.BLOHM },
  { rawName: 'JEAN VANNI',                          ci: 17333856,     rawPos: 'MARINO',    dept: 'FL', vesselId: VESSELS.BLOHM },
  { rawName: 'JESUS PACHECO',                       ci: 11247127,     rawPos: 'CAPITAN',   dept: 'FL', vesselId: VESSELS.BLOHM },
  { rawName: 'GERWIN GARCIA',                       ci: 18795770,     rawPos: 'MARINO',    dept: 'FL', vesselId: VESSELS.BLOHM },

  // ─── JACKIE (FL) ─────────────────────────────────────────────────────────
  { rawName: 'LUIS ALBORNOZ',                       ci: 10213559,     rawPos: 'CAPITAN',   dept: 'FL', vesselId: VESSELS.JACKIE },
  { rawName: 'FERNANDO CAMACARO',                   ci: 16833222,     rawPos: 'MARINO',    dept: 'FL', vesselId: VESSELS.JACKIE },
  { rawName: 'CARLOS PAZ',                          ci: 13863894,     rawPos: 'CAPITAN',   dept: 'FL', vesselId: VESSELS.JACKIE },
  { rawName: 'JHONNY MILLAN',                       ci: 7862683,      rawPos: 'MARINO',    dept: 'FL', vesselId: VESSELS.JACKIE },
]

// Jorge Mosquera (14448951) tiene dos embarcaciones: Masco VIII y Zapara Island
const EXTRA_ASSIGNMENTS = [
  { ci: '14448951', vesselId: VESSELS.ZAPARA_ISLAND, role: 'Motorista' },
]

async function main() {
  let created = 0
  let skipped = 0

  for (const entry of CREW) {
    const nationalId = cleanCI(entry.ci)
    const { firstName, lastName } = parseName(entry.rawName)
    const position = mapPos(entry.rawPos)

    const existing = await prisma.employee.findUnique({ where: { nationalId } })
    let employeeId: string

    if (existing) {
      employeeId = existing.id
      skipped++
      console.log(`  SKIP  ${nationalId} — ${firstName} ${lastName}`)
    } else {
      const emp = await prisma.employee.create({
        data: { firstName, lastName, nationalId, nationality: 'Venezolana', position, department: entry.dept, status: 'ACTIVO' },
      })
      employeeId = emp.id
      created++
      console.log(`  OK    ${nationalId} — ${firstName} ${lastName} (${position}, ${entry.dept})`)
    }

    // Crear assignment al buque si no existe
    const assignExists = await prisma.assignment.findFirst({ where: { employeeId, vesselId: entry.vesselId } })
    if (!assignExists) {
      await prisma.assignment.create({
        data: { employeeId, vesselId: entry.vesselId, role: position, startDate: new Date('2025-01-01'), status: 'ACTIVO' },
      })
    }
  }

  // Assignments extra (Jorge Mosquera — dos buques)
  for (const extra of EXTRA_ASSIGNMENTS) {
    const emp = await prisma.employee.findUnique({ where: { nationalId: extra.ci } })
    if (!emp) { console.log(`  WARN  CI ${extra.ci} no encontrado`); continue }
    const assignExists = await prisma.assignment.findFirst({ where: { employeeId: emp.id, vesselId: extra.vesselId } })
    if (!assignExists) {
      await prisma.assignment.create({
        data: { employeeId: emp.id, vesselId: extra.vesselId, role: extra.role, startDate: new Date('2025-01-01'), status: 'ACTIVO' },
      })
      console.log(`  ASSIGN extra — ${extra.ci} → Zapara Island`)
    }
  }

  console.log(`\n✓ Completado: ${created} creados, ${skipped} ya existían`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
